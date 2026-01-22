const { IndexFlatIP } = require('faiss-node');
const fs = require('fs').promises;
const path = require('path');

class FAISSService {
  constructor() {
    this.index = null;
    this.idToFAISSMap = new Map(); 
    this.FAISSToIdMap = new Map(); 
    this.indexPath = process.env.FAISS_INDEX_PATH || path.join(__dirname, '../../data/index.bin');
    this.metadataPath = path.join(__dirname, '../../data/faiss_metadata.json');
    this.dimension = parseInt(process.env.VECTOR_DIMENSION) || 384; 
    this.nextPosition = 0;
    this.vectors = []; 
  }

  async initialize() {
    try {
      
      await this.loadIndex();
      console.log(`FAISS index loaded with ${this.index ? this.index.ntotal() : 0} vectors`);
    } catch (error) {
      
      console.log('Creating new FAISS index...');
      this.index = new IndexFlatIP(this.dimension);
      this.idToFAISSMap.clear();
      this.FAISSToIdMap.clear();
      this.vectors = [];
      this.nextPosition = 0;
      await this.saveIndex();
    }
  }

  async loadIndex() {
    try {
      
      const metadataData = await fs.readFile(this.metadataPath, 'utf8');
      const metadata = JSON.parse(metadataData);
      
      this.idToFAISSMap = new Map(metadata.idToFAISSMap || []);
      this.FAISSToIdMap = new Map(metadata.FAISSToIdMap || []);
      this.nextPosition = metadata.nextPosition || 0;
      this.vectors = metadata.vectors || [];
      
      
      this.index = new IndexFlatIP(this.dimension);
      
      if (this.vectors.length > 0) {
        console.log(`Rebuilding FAISS index with ${this.vectors.length} vectors...`);
        
        
        const batchSize = 1000;
        for (let i = 0; i < this.vectors.length; i += batchSize) {
          const batch = this.vectors.slice(i, i + batchSize);
          const vectorData = new Float32Array(batch.flat());
          this.index.add(vectorData);
        }
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Index file not found');
      }
      throw error;
    }
  }

  async saveIndex() {
    try {
      const dataDir = path.dirname(this.metadataPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      const metadata = {
        idToFAISSMap: Array.from(this.idToFAISSMap.entries()),
        FAISSToIdMap: Array.from(this.FAISSToIdMap.entries()),
        nextPosition: this.nextPosition,
        vectors: this.vectors
      };
      
      const tempPath = this.metadataPath + '.tmp';
      await fs.writeFile(tempPath, JSON.stringify(metadata, null, 2));
      await fs.rename(tempPath, this.metadataPath);
    } catch (error) {
      console.error('Error saving FAISS index:', error);
      throw error;
    }
  }

  async addVector(faissId, vector) {
    if (!Array.isArray(vector) || vector.length !== this.dimension) {
      throw new Error(`Vector must be an array of ${this.dimension} numbers`);
    }

    
    if (this.idToFAISSMap.has(faissId)) {
      throw new Error(`Vector with ID ${faissId} already exists`);
    }

    
    const vectorArray = new Float32Array(vector);
    
    
    this.index.add(vectorArray);
    
    
    this.vectors.push(vector);
    
    
    this.idToFAISSMap.set(faissId, this.nextPosition);
    this.FAISSToIdMap.set(this.nextPosition, faissId);
    this.nextPosition++;

    await this.saveIndex();
    return this.nextPosition - 1;
  }

  async addVectors(vectors) {
    
    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new Error('Vectors must be a non-empty array');
    }

    const vectorsToAdd = [];
    const idsToAdd = [];
    const vectorsForStorage = [];

    for (const { faissId, vector } of vectors) {
      if (this.idToFAISSMap.has(faissId)) {
        console.warn(`Vector with ID ${faissId} already exists, skipping`);
        continue;
      }

      if (!Array.isArray(vector) || vector.length !== this.dimension) {
        throw new Error(`Vector must be an array of ${this.dimension} numbers`);
      }

      vectorsToAdd.push(vector); 
      vectorsForStorage.push(vector);
      idsToAdd.push(faissId);
    }

    if (vectorsToAdd.length === 0) {
      return [];
    }

    
    if (vectorsToAdd.length === 1) {
      
      this.index.add(Array.from(vectorsToAdd[0]));
    } else {
      
      const flattenedVectors = [];
      for (let i = 0; i < vectorsToAdd.length; i++) {
        flattenedVectors.push(...Array.from(vectorsToAdd[i]));
      }
      this.index.add(flattenedVectors);
    }
    
    
    this.vectors.push(...vectorsForStorage);

    
    const positions = [];
    for (const faissId of idsToAdd) {
      this.idToFAISSMap.set(faissId, this.nextPosition);
      this.FAISSToIdMap.set(this.nextPosition, faissId);
      positions.push(this.nextPosition);
      this.nextPosition++;
    }

    await this.saveIndex();
    return positions;
  }

  async removeVector(faissId) {
    if (!this.idToFAISSMap.has(faissId)) {
      return false;
    }

    
    
    
    const position = this.idToFAISSMap.get(faissId);
    this.idToFAISSMap.delete(faissId);
    this.FAISSToIdMap.delete(position);
    
    
    if (position < this.vectors.length) {
      this.vectors.splice(position, 1);
      
      
      await this.rebuildIndex();
    }

    await this.saveIndex();
    return true;
  }

  async removeVectors(faissIds) {
    let removed = 0;
    let needsRebuild = false;

    for (const faissId of faissIds) {
      if (this.idToFAISSMap.has(faissId)) {
        const position = this.idToFAISSMap.get(faissId);
        this.idToFAISSMap.delete(faissId);
        this.FAISSToIdMap.delete(position);
        
        
        if (position < this.vectors.length) {
          this.vectors[position] = null; 
          needsRebuild = true;
        }
        
        removed++;
      }
    }

    if (needsRebuild) {
      await this.rebuildIndex();
    }

    await this.saveIndex();
    return removed;
  }

  async rebuildIndex() {
    console.log('🔄 Rebuilding FAISS index...');
    
    
    const validVectors = [];
    const validMappings = [];
    
    for (let i = 0; i < this.vectors.length; i++) {
      const vector = this.vectors[i];
      if (vector !== null && Array.isArray(vector)) {
        validVectors.push(vector);
        const faissId = this.FAISSToIdMap.get(i);
        if (faissId) {
          validMappings.push({ oldPosition: i, faissId: faissId });
        }
      }
    }
    
    
    this.vectors = validVectors;
    this.idToFAISSMap.clear();
    this.FAISSToIdMap.clear();
    this.nextPosition = 0;
    
    
    this.index = new IndexFlatIP(this.dimension);
    
    if (this.vectors.length > 0) {
      
      const vectorData = new Float32Array(this.vectors.flat());
      this.index.add(vectorData);
      
      
      
      for (let i = 0; i < validMappings.length; i++) {
        const { faissId } = validMappings[i];
        this.idToFAISSMap.set(faissId, i);
        this.FAISSToIdMap.set(i, faissId);
      }
      this.nextPosition = validMappings.length;
    }
    
    console.log(`✅ Index rebuilt with ${this.vectors.length} vectors and mappings restored`);
  }

  async search(queryVector, k = 5) {
    if (!Array.isArray(queryVector) || queryVector.length !== this.dimension) {
      throw new Error(`Query vector must be an array of ${this.dimension} numbers`);
    }

    if (this.index.ntotal() === 0) {
      return [];
    }

    
    const queryArray = Array.from(queryVector);
    
    
    const searchK = Math.min(k, this.index.ntotal());
    const results = this.index.search(queryArray, searchK);
    
    
    const searchResults = [];
    for (let i = 0; i < results.labels.length; i++) {
      const position = results.labels[i];
      const faissId = this.FAISSToIdMap.get(position);
      
      if (faissId) {
        searchResults.push({
          faissId: faissId,
          score: results.distances[i],
          position: position
        });
      }
    }

    return searchResults;
  }

  async rebuild() {
    
    await this.rebuildIndex();
    await this.saveIndex();
  }

  getSize() {
    return this.index ? this.index.ntotal() : 0;
  }

  getDimension() {
    return this.dimension;
  }

  hasVector(faissId) {
    return this.idToFAISSMap.has(faissId);
  }

  
  async rebuildFromChunks(chunks) {
    console.log(`🔧 Rebuilding FAISS index from ${chunks.length} existing chunks...`);
    
    if (chunks.length === 0) {
      console.log('No chunks to rebuild from');
      return;
    }

    
    this.idToFAISSMap.clear();
    this.FAISSToIdMap.clear();
    this.vectors = [];
    this.nextPosition = 0;

    
    this.index = new IndexFlatIP(this.dimension);

    
    const vectorsToAdd = [];
    const idsToAdd = [];

    for (const chunk of chunks) {
      if (chunk.embedding && Array.isArray(chunk.embedding) && chunk.embedding.length === this.dimension) {
        vectorsToAdd.push(chunk.embedding);
        const faissId = chunk.getFAISSId ? chunk.getFAISSId() : `${chunk.documentId}:${chunk.chunkId}`;
        idsToAdd.push(faissId);
        this.vectors.push(chunk.embedding);
      } else {
        console.warn(`Skipping chunk ${chunk._id}: invalid or missing embedding`);
      }
    }

    if (vectorsToAdd.length === 0) {
      console.log('No valid embeddings found to rebuild from');
      return;
    }

    
    if (vectorsToAdd.length === 1) {
      this.index.add(Array.from(vectorsToAdd[0]));
    } else {
      const flattenedVectors = [];
      for (const vector of vectorsToAdd) {
        flattenedVectors.push(...Array.from(vector));
      }
      this.index.add(flattenedVectors);
    }

    
    for (let i = 0; i < idsToAdd.length; i++) {
      const faissId = idsToAdd[i];
      this.idToFAISSMap.set(faissId, this.nextPosition);
      this.FAISSToIdMap.set(this.nextPosition, faissId);
      this.nextPosition++;
    }

    console.log(`✅ FAISS index rebuilt with ${vectorsToAdd.length} vectors`);
    await this.saveIndex();
  }
}

module.exports = new FAISSService();