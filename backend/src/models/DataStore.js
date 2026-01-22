const fs = require('fs').promises;
const path = require('path');
const Document = require('./Document');
const Chunk = require('./Chunk');

class DataStore {
  constructor() {
    this.documents = new Map(); 
    this.chunks = new Map(); 
    this.documentsPath = path.join(__dirname, '../../data/documents.json');
    this.chunksPath = path.join(__dirname, '../../data/chunks.json');
  }

  async initialize() {
    await this.loadDocuments();
    await this.loadChunks();
  }

  
  async loadDocuments() {
    try {
      const data = await fs.readFile(this.documentsPath, 'utf8');
      const documentsData = JSON.parse(data);
      this.documents.clear();
      
      for (const docData of documentsData) {
        const doc = Document.fromJSON(docData);
        this.documents.set(doc._id, doc);
      }
      console.log(`Loaded ${this.documents.size} documents`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading documents:', error);
      }
      
      this.documents.clear();
    }
  }

  async saveDocuments() {
    try {
      const documentsArray = Array.from(this.documents.values()).map(doc => doc.toJSON());
      const tempPath = this.documentsPath + '.tmp';
      await fs.writeFile(tempPath, JSON.stringify(documentsArray, null, 2));
      await fs.rename(tempPath, this.documentsPath);
    } catch (error) {
      console.error('Error saving documents:', error);
      throw error;
    }
  }

  async createDocument(document) {
    this.documents.set(document._id, document);
    await this.saveDocuments();
    return document;
  }

  async getDocument(id) {
    return this.documents.get(id);
  }

  async getAllDocuments() {
    return Array.from(this.documents.values());
  }

  async updateDocument(id, updates) {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error('Document not found');
    }
    
    document.update(updates.title, updates.content, updates.tags);
    await this.saveDocuments();
    return document;
  }

  async deleteDocument(id) {
    const deleted = this.documents.delete(id);
    if (deleted) {
      
      const chunksToDelete = Array.from(this.chunks.values())
        .filter(chunk => chunk.documentId === id);
      
      for (const chunk of chunksToDelete) {
        this.chunks.delete(chunk._id);
      }
      
      await this.saveDocuments();
      await this.saveChunks();
    }
    return deleted;
  }

  
  async loadChunks() {
    try {
      const data = await fs.readFile(this.chunksPath, 'utf8');
      const chunksData = JSON.parse(data);
      this.chunks.clear();
      
      for (const chunkData of chunksData) {
        const chunk = Chunk.fromJSON(chunkData);
        this.chunks.set(chunk._id, chunk);
      }
      console.log(`Loaded ${this.chunks.size} chunks`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading chunks:', error);
      }
      
      this.chunks.clear();
    }
  }

  async saveChunks() {
    try {
      const chunksArray = Array.from(this.chunks.values()).map(chunk => chunk.toJSON());
      const tempPath = this.chunksPath + '.tmp';
      await fs.writeFile(tempPath, JSON.stringify(chunksArray, null, 2));
      await fs.rename(tempPath, this.chunksPath);
    } catch (error) {
      console.error('Error saving chunks:', error);
      throw error;
    }
  }

  async createChunk(chunk) {
    this.chunks.set(chunk._id, chunk);
    await this.saveChunks();
    return chunk;
  }

  async createChunksBulk(chunks) {
    for (const chunk of chunks) {
      this.chunks.set(chunk._id, chunk);
    }
    await this.saveChunks();
    return chunks;
  }

  async getChunksByDocumentId(documentId) {
    return Array.from(this.chunks.values())
      .filter(chunk => chunk.documentId === documentId)
      .sort((a, b) => a.chunkId - b.chunkId);
  }

  async deleteChunksByDocumentId(documentId) {
    const chunksToDelete = Array.from(this.chunks.values())
      .filter(chunk => chunk.documentId === documentId);
    
    for (const chunk of chunksToDelete) {
      this.chunks.delete(chunk._id);
    }
    
    await this.saveChunks();
    return chunksToDelete;
  }

  async getAllChunks() {
    return Array.from(this.chunks.values());
  }

  
  async getChunkByFAISSId(faissId) {
    const { documentId, chunkId } = Chunk.parseFAISSId(faissId);
    return Array.from(this.chunks.values())
      .find(chunk => chunk.documentId === documentId && chunk.chunkId === chunkId);
  }
}


const dataStore = new DataStore();

module.exports = dataStore;