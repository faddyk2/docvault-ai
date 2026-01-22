const { v4: uuidv4 } = require('uuid');

class Chunk {
  constructor(documentId, chunkId, text, embedding, metadata = {}) {
    this._id = uuidv4();
    this.documentId = documentId;
    this.chunkId = chunkId; 
    this.text = text;
    this.embedding = embedding; 
    this.metadata = {
      title: metadata.title || '',
      pageNumber: metadata.pageNumber || null,
      tags: metadata.tags || []
    };
  }

  
  getFAISSId() {
    return `${this.documentId}:${this.chunkId}`;
  }

  toJSON() {
    return {
      _id: this._id,
      documentId: this.documentId,
      chunkId: this.chunkId,
      text: this.text,
      embedding: this.embedding,
      metadata: this.metadata
    };
  }

  static fromJSON(data) {
    const chunk = new Chunk(
      data.documentId,
      data.chunkId,
      data.text,
      data.embedding,
      data.metadata
    );
    chunk._id = data._id;
    return chunk;
  }

  static parseFAISSId(faissId) {
    const [documentId, chunkId] = faissId.split(':');
    return { documentId, chunkId: parseInt(chunkId) };
  }
}

module.exports = Chunk;