const { OpenAI } = require('openai');

class OpenAIService {
  constructor() {
    const config = {
      apiKey: process.env['OPENAI_API_KEY']
    };
    
    if (process.env['OPENAI_BASE_URL']) {
      config.baseURL = process.env['OPENAI_BASE_URL'];
    }
    
    this.client = new OpenAI(config);
  }

  async generateResponse(userQuery, chunks, options = {}) {
    try {
      if (!this.client) {
        throw new Error('OpenAI API key not configured');
      }

      const {
        temperature = 0.7,
        maxTokens = 1000,
        model = process.env['Model_Name']
      } = options;

      const currentDate = new Date().toISOString().split('T')[0];
      
            const context = this.prepareContext(chunks);
      
      const systemPrompt = `You are a helpful AI assistant that answers questions using the provided context. 

Instructions:
- Answer directly and naturally without formal introductions like "Based on the provided context"
- Use the information from the context to provide accurate answers
- If the context doesn't contain enough information and is irrelevant to the query/question , simply say you don't have that information , do not make up answers
- Keep answers concise and to the point
- Maintain a professional and friendly tone
- Write in a conversational, professional tone
- Use proper formatting with headings, lists, and emphasis where helpful
- Keep responses focused and well-structured`;

      const userPrompt = `Context:
${context}

Question: ${userQuery}

Answer:`;

      const completion = await this.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false
      });

      console.log('OpenAI completion response:', completion);

      return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    } catch (error) {
      console.error('Error generating OpenAI response:', error);
      
            if (error.message.includes('API key')) {
        throw new Error('OpenAI API configuration error');
      }
      
      return this.generateFallbackResponse(userQuery, chunks);
    }
  }

  prepareContext(chunks) {
    if (!chunks || chunks.length === 0) {
      return 'No relevant information found.';
    }

    return chunks
      .slice(0, 5)       .map((chunk, index) => {
        const docInfo = chunk.document ? `[${chunk.document.title}]` : '[Unknown Document]';
        return `${docInfo} (Relevance: ${chunk.score?.toFixed(3) || 'N/A'}):
${chunk.text}`;
      })
      .join('\n\n---\n\n');
  }

  generateFallbackResponse(query, chunks) {
    if (!chunks || chunks.length === 0) {
      return "I don't have any relevant information about that topic in the current knowledge base.";
    }

    const topChunk = chunks[0];
    const response = topChunk.text.trim();
    
    if (response.length > 500) {
      return response.substring(0, 500) + "...";
    }
    
    return response;
  }



  isConfigured() {
    return !!process.env.OPENAI_API_KEY;
  }
}

module.exports = new OpenAIService();