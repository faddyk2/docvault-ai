const dataStore = require('../models/DataStore');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const documentProcessor = require('../services/DocumentProcessor');
const embeddingService = require('../services/HuggingFaceEmbeddingService');
const faissService = require('../services/FAISSService');
const openaiService = require('../services/OpenAIService');
const path = require('path');
const fs = require('fs')

let availableVideos = [];
( async () =>{
  const files = await fs.promises.readdir(path.join(__dirname, '../../videos'));
  availableVideos = files.filter(file => ['.mp4', '.webm', '.ogg'].includes(path.extname(file).toLowerCase()));
})();

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x*x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x*x, 0));
  return dot / (magA * magB);
}

async function similarity(query, title) {
  const qVec = (await embeddingService.generateEmbeddings([query]))[0];
  const tVec = (await embeddingService.generateEmbeddings([title]))[0];
  return cosineSimilarity(qVec, tVec);
}

async function getHighestSimilarityVideo(query) {
  let maxSim = -1;
  let bestVideo = null;
  for (const videoFile of availableVideos) {
    const title = path.basename(videoFile, path.extname(videoFile)).replace(/[_-]/g, ' ');
    const sim = await similarity(query, title);
    if (sim > maxSim) {
      maxSim = sim;
      bestVideo = videoFile;
    }
  }
  if (maxSim < 0.5) {
    return null;
  }
  return bestVideo;
}


const uploadDocument = async (req, res) => {
  try {
    const { title, tags } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    
    const allowedTypes = ['pdf', 'docx', 'txt', 'html'];
    const fileType = file.originalname.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ 
        error: `Unsupported file type: ${fileType}. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    console.log(`Processing document upload: ${title} (${fileType})`);

    
    const { text, metadata } = await documentProcessor.extractTextFromBuffer(
      file.buffer, 
      fileType, 
      file.originalname
    );

    
    const document = new Document(title, fileType, text, tags ? tags.split(',').map(tag => tag.trim()) : []);
    await dataStore.createDocument(document);

    
    const chunks = documentProcessor.chunkText(text, {
      title: title,
      fileType: fileType,
      ...metadata
    });

    console.log(`Created ${chunks.length} chunks for document ${document._id}`);

    
    const chunkTexts = chunks.map(chunk => chunk.text);
    const embeddings = await embeddingService.generateEmbeddings(chunkTexts);

    const vectorsToAdd = [];
    const chunksToCreate = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = new Chunk(
        document._id,
        chunks[i].chunkId,
        chunks[i].text,
        embeddings[i],
        chunks[i].metadata
      );

      chunksToCreate.push(chunk);
      vectorsToAdd.push({
        faissId: chunk.getFAISSId(),
        vector: embeddings[i]
      });
    }

    await dataStore.createChunksBulk(chunksToCreate);

    await faissService.addVectors(vectorsToAdd);

    console.log(`Document ${document._id} processed successfully`);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: document.toJSON(),
      chunksCount: chunks.length
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ 
      error: 'Failed to upload document',
      details: error.message 
    });
  }
};


const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tags } = req.body;
    const file = req.file;

    const document = await dataStore.getDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log(`Updating document: ${id}`);

    let newText = document.content;
    let newMetadata = {};

    
    if (file) {
      const fileType = file.originalname.split('.').pop().toLowerCase();
      const extracted = await documentProcessor.extractTextFromBuffer(
        file.buffer,
        fileType,
        file.originalname
      );
      newText = extracted.text;
      newMetadata = extracted.metadata;
    }

    
    const existingChunks = await dataStore.getChunksByDocumentId(id);
    
    
    const faissIdsToRemove = existingChunks.map(chunk => chunk.getFAISSId());
    await faissService.removeVectors(faissIdsToRemove);

    
    await dataStore.deleteChunksByDocumentId(id);

    
    await dataStore.updateDocument(id, {
      title: title || document.title,
      content: newText,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : document.tags
    });

    const updatedDocument = await dataStore.getDocument(id);

    
    const chunks = documentProcessor.chunkText(newText, {
      title: updatedDocument.title,
      fileType: updatedDocument.type,
      ...newMetadata
    });

    
    const chunkTexts = chunks.map(chunk => chunk.text);
    const embeddings = await embeddingService.generateEmbeddings(chunkTexts);

    const vectorsToAdd = [];
    const chunksToCreate = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = new Chunk(
        id,
        chunks[i].chunkId,
        chunks[i].text,
        embeddings[i],
        chunks[i].metadata
      );

      chunksToCreate.push(chunk);
      vectorsToAdd.push({
        faissId: chunk.getFAISSId(),
        vector: embeddings[i]
      });
    }

    await dataStore.createChunksBulk(chunksToCreate);

    await faissService.addVectors(vectorsToAdd);

    console.log(`Document ${id} updated with ${chunks.length} chunks`);

    res.json({
      message: 'Document updated successfully',
      document: updatedDocument.toJSON(),
      chunksCount: chunks.length
    });

  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      error: 'Failed to update document',
      details: error.message
    });
  }
};


const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await dataStore.getDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log(`Deleting document: ${id}`);

    
    const chunks = await dataStore.getChunksByDocumentId(id);
    
    
    const faissIdsToRemove = chunks.map(chunk => chunk.getFAISSId());
    await faissService.removeVectors(faissIdsToRemove);

    
    const deleted = await dataStore.deleteDocument(id);

    if (deleted) {
      console.log(`Document ${id} and ${chunks.length} chunks deleted`);
      res.json({
        message: 'Document deleted successfully',
        deletedChunks: chunks.length
      });
    } else {
      res.status(404).json({ error: 'Document not found' });
    }

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      details: error.message
    });
  }
};


const getDocuments = async (req, res) => {
  try {
    const documents = await dataStore.getAllDocuments();
    
    
    const documentsWithStats = await Promise.all(
      documents.map(async (doc) => {
        const chunks = await dataStore.getChunksByDocumentId(doc._id);
        return {
          ...doc.toJSON(),
          chunksCount: chunks.length
        };
      })
    );

    res.json({
      documents: documentsWithStats,
      totalDocuments: documents.length
    });

  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({
      error: 'Failed to get documents',
      details: error.message
    });
  }
};


const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await dataStore.getDocument(id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const chunks = await dataStore.getChunksByDocumentId(id);

    res.json({
      document: document.toJSON(),
      chunks: chunks.map(chunk => chunk.toJSON()),
      chunksCount: chunks.length
    });

  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({
      error: 'Failed to get document',
      details: error.message
    });
  }
};


const queryKB = async (req, res) => {
  try {
    const { query, k = 5 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }

    const searchK = Math.min(Math.max(parseInt(k), 1), 20); 

    console.log(`Query received: "${query}" (k=${searchK})`);

        const queryEmbedding = await embeddingService.generateEmbedding(query);

    let videoUrl = null;
    const relatedVideo = await getHighestSimilarityVideo(query);
    if (relatedVideo) {
      videoUrl = `/videos/${encodeURIComponent(relatedVideo)}`;
    }

    const searchResults = await faissService.search(queryEmbedding, searchK);

    if (searchResults.length === 0) {
      return res.json({
        query: query,
        answer: "I couldn't find any relevant information to answer your question. Please try rephrasing or ask about topics covered in the uploaded documents.",
        results: [],
        chunks: [],
        message: 'No relevant documents found'
      });
    }

        const chunks = await Promise.all(
      searchResults.map(async (result) => {
        const chunk = await dataStore.getChunkByFAISSId(result.faissId);
        if (chunk) {
          const document = await dataStore.getDocument(chunk.documentId);
          return {
            ...chunk.toJSON(),
            score: result.score,
            document: document ? {
              _id: document._id,
              title: document.title,
              type: document.type,
              tags: document.tags
            } : null
          };
        }
        return null;
      })
    );

        const validChunks = chunks.filter(chunk => chunk !== null);

        let answer;
    try {
      if (openaiService.isConfigured()) {
        answer = await openaiService.generateResponse(query, validChunks, {
          temperature: 0.7,
          maxTokens: 1000
        });
      } else {
        answer = openaiService.generateFallbackResponse(query, validChunks);
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      answer = openaiService.generateFallbackResponse(query, validChunks);
    }

    res.json({
      query: query,
      answer: answer,
      chunks: validChunks,
      totalResults: validChunks.length,
      aiGenerated: openaiService.isConfigured(),
      videoUrl: videoUrl
    });

  } catch (error) {
    console.error('Error querying KB:', error);
    res.status(500).json({
      error: 'Failed to query knowledge base',
      details: error.message
    });
  }
};

module.exports = {
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  getDocument,
  queryKB,
  availableVideos
};