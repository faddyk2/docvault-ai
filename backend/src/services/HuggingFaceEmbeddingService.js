const { pipeline } = require('@xenova/transformers');

class HuggingFaceEmbeddingService {
  constructor() {
    this.model = 'sentence-transformers/all-MiniLM-L6-v2';
    this.dimension = 384; 
    this.pipe = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🤗 Initializing Hugging Face embedding model...');
      console.log(`📦 Loading model: ${this.model}`);
      console.log('💻 Running on CPU (no GPU required)');
      
      
      this.pipe = await pipeline('feature-extraction', this.model, {
        quantized: false,
        revision: 'main',
        device: 'cpu', 
        dtype: 'fp32'   
      });
      
      this.isInitialized = true;
      console.log(`✅ Hugging Face embedding model loaded successfully`);
      console.log(`📏 Embedding dimension: ${this.dimension}`);
    } catch (error) {
      console.error('❌ Failed to initialize Hugging Face embedding model:', error);
      throw new Error(`Failed to initialize embedding model: ${error.message}`);
    }
  }

  async generateEmbedding(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      
      const cleanedText = this.cleanText(text);
      
      if (!cleanedText || cleanedText.trim().length === 0) {
        throw new Error('Input text is empty after cleaning');
      }

      
      const result = await this.pipe(cleanedText, {
        pooling: 'mean',
        normalize: true
      });

      
      let embedding;
      
      
      if (result && result.data && Array.isArray(result.data)) {
        embedding = Array.from(result.data);
      } 
      
      else if (Array.isArray(result)) {
        if (result.length > 0 && Array.isArray(result[0])) {
          
          embedding = Array.from(result[0]);
        } else {
          embedding = Array.from(result);
        }
      }
      
      else if (result && result[0] && Array.isArray(result[0])) {
        embedding = Array.from(result[0]);
      }
      
      else if (result && typeof result.tolist === 'function') {
        const tensorData = result.tolist();
        embedding = Array.isArray(tensorData[0]) ? tensorData[0] : tensorData;
      }
      else {
        console.error('Unexpected result format:', typeof result, result);
        throw new Error('Unexpected response format from embedding model');
      }

      
      if (!Array.isArray(embedding) || embedding.length !== this.dimension) {
        console.error(`Expected embedding dimension: ${this.dimension}, got: ${embedding ? embedding.length : 'undefined'}`);
        console.error('Embedding sample:', embedding ? embedding.slice(0, 5) : 'null');
        throw new Error(`Expected embedding of dimension ${this.dimension}, got ${embedding ? embedding.length : 'undefined'}`);
      }

      
      const numericEmbedding = embedding.map((val, idx) => {
        const num = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(num)) {
          console.warn(`NaN value found at index ${idx}, replacing with 0`);
          return 0;
        }
        return num;
      });

      return numericEmbedding;
      
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async generateEmbeddings(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    const results = [];
    const batchSize = 8; 

    console.log(`🔄 Generating embeddings for ${texts.length} texts in batches of ${batchSize} (CPU mode)`);

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`📊 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} texts)`);

      try {
        
        const batchResults = [];
        for (const text of batch) {
          const embedding = await this.generateEmbedding(text);
          batchResults.push(embedding);
          
          
          await new Promise(resolve => setTimeout(resolve, 5));
        }

        results.push(...batchResults);

        
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw error;
      }
    }

    console.log(`✅ Generated ${results.length} embeddings successfully on CPU`);
    return results;
  }

  cleanText(text) {
    if (typeof text !== 'string') {
      text = String(text);
    }

    
    text = text.replace(/\s+/g, ' ').trim();
    
    
    if (text.length === 0) {
      return 'empty text';
    }
    
    if (text.length < 3) {
      return text.padEnd(3, ' ');
    }
    
    
    
    if (text.length > 1000) {
      text = text.substring(0, 1000) + '...';
    }

    return text;
  }

  getDimension() {
    return this.dimension;
  }

  getModel() {
    return this.model;
  }

  isModelInitialized() {
    return this.isInitialized;
  }

  async warmup() {
    
    console.log('🔥 Warming up embedding model...');
    try {
      await this.generateEmbedding('Hello world');
      console.log('✅ Model warmup completed');
    } catch (error) {
      console.error('❌ Model warmup failed:', error);
      throw error;
    }
  }
}

module.exports = new HuggingFaceEmbeddingService();