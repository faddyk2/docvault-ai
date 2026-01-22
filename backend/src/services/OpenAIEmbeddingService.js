const axios = require('axios');

class OpenAIEmbeddingService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = 'text-embedding-3-large';
    this.dimension = 3072; 
    this.apiUrl = 'https://api.openai.com/v1/embeddings';

    if (!this.apiKey) {
      console.warn('Warning: OPENAI_API_KEY not found in environment variables');
    }
  }

  async generateEmbedding(text) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      
      const cleanedText = this.cleanText(text);
      
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          input: cleanedText,
          encoding_format: 'float'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 
        }
      );

      if (response.data && response.data.data && response.data.data[0]) {
        return response.data.data[0].embedding;
      } else {
        throw new Error('Invalid response format from OpenAI API');
      }
    } catch (error) {
      if (error.response) {
        console.error('OpenAI API Error:', error.response.status, error.response.data);
        throw new Error(`OpenAI API Error: ${error.response.data.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('Network error:', error.message);
        throw new Error('Network error communicating with OpenAI API');
      } else {
        console.error('Error generating embedding:', error.message);
        throw error;
      }
    }
  }

  async generateEmbeddings(texts) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const cleanedBatch = batch.map(text => this.cleanText(text));

      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            input: cleanedBatch,
            encoding_format: 'float'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000 
          }
        );

        if (response.data && response.data.data) {
          const embeddings = response.data.data.map(item => item.embedding);
          results.push(...embeddings);
        } else {
          throw new Error('Invalid response format from OpenAI API');
        }

        
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        if (error.response) {
          console.error('OpenAI API Error:', error.response.status, error.response.data);
          throw new Error(`OpenAI API Error: ${error.response.data.error?.message || 'Unknown error'}`);
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  cleanText(text) {
    if (typeof text !== 'string') {
      text = String(text);
    }

    
    text = text.replace(/\s+/g, ' ').trim();
    
    
    
    
    if (text.length > 30000) {
      text = text.substring(0, 30000) + '...';
    }

    return text;
  }

  getDimension() {
    return this.dimension;
  }

  getModel() {
    return this.model;
  }
}

module.exports = new OpenAIEmbeddingService();