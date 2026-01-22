const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const fs = require('fs').promises;

class DocumentProcessor {
  constructor() {
    this.chunkSize = parseInt(process.env.CHUNK_SIZE) || 1000;
    this.chunkOverlap = parseInt(process.env.CHUNK_OVERLAP) || 200;
    this.maxChunks = parseInt(process.env.MAX_CHUNKS_PER_DOCUMENT) || 1000;
  }

  async extractText(filePath, fileType) {
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractFromPDF(filePath);
        case 'docx':
          return await this.extractFromDOCX(filePath);
        case 'txt':
          return await this.extractFromTXT(filePath);
        case 'html':
          return await this.extractFromHTML(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${fileType}:`, error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  async extractFromPDF(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info
      }
    };
  }

  async extractFromDOCX(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return {
      text: result.value,
      metadata: {
        messages: result.messages
      }
    };
  }

  async extractFromTXT(filePath) {
    const text = await fs.readFile(filePath, 'utf8');
    return {
      text: text,
      metadata: {}
    };
  }

  async extractFromHTML(filePath) {
    const html = await fs.readFile(filePath, 'utf8');
    const $ = cheerio.load(html);
    
    
    $('script, style').remove();
    
    
    const text = $('body').text() || $.text();
    
    
    const title = $('title').text() || '';
    
    return {
      text: text.replace(/\s+/g, ' ').trim(),
      metadata: {
        title: title,
        headings: this.extractHeadings($)
      }
    };
  }

  extractHeadings($) {
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const level = parseInt(el.tagName.substring(1));
      const text = $(el).text().trim();
      if (text) {
        headings.push({ level, text });
      }
    });
    return headings;
  }

  chunkText(text, metadata = {}) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanedText.length <= this.chunkSize) {
      return [{
        chunkId: 0,
        text: cleanedText,
        metadata: { ...metadata, chunkIndex: 0, totalChunks: 1 }
      }];
    }

    const chunks = [];
    let chunkId = 0;
    let start = 0;

    while (start < cleanedText.length && chunks.length < this.maxChunks) {
      let end = start + this.chunkSize;
      
      
      if (end < cleanedText.length) {
        
        const sentenceEnd = this.findSentenceBreak(cleanedText, start, end);
        if (sentenceEnd > start + this.chunkSize * 0.5) {
          end = sentenceEnd;
        } else {
          
          const wordEnd = this.findWordBreak(cleanedText, start, end);
          if (wordEnd > start) {
            end = wordEnd;
          }
        }
      }

      const chunkText = cleanedText.substring(start, end).trim();
      
      if (chunkText.length > 0) {
        chunks.push({
          chunkId: chunkId,
          text: chunkText,
          metadata: {
            ...metadata,
            chunkIndex: chunkId,
            startPosition: start,
            endPosition: end
          }
        });
        chunkId++;
      }

      
      start = Math.max(start + this.chunkSize - this.chunkOverlap, end);
    }

    
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  findSentenceBreak(text, start, end) {
    
    const sentenceEnders = /[.!?]/g;
    let match;
    let lastMatch = -1;

    sentenceEnders.lastIndex = start;
    while ((match = sentenceEnders.exec(text)) !== null && match.index < end) {
      lastMatch = match.index + 1;
    }

    return lastMatch > start ? lastMatch : end;
  }

  findWordBreak(text, start, end) {
    
    for (let i = end - 1; i > start; i--) {
      if (/\s/.test(text[i])) {
        return i;
      }
    }
    return end;
  }

  
  async processDocument(filePath, fileType, documentTitle) {
    try {
      
      const { text, metadata: extractMetadata } = await this.extractText(filePath, fileType);
      
      
      const baseMetadata = {
        title: documentTitle,
        fileType: fileType,
        ...extractMetadata
      };

      
      const chunks = this.chunkText(text, baseMetadata);
      
      return {
        fullText: text,
        chunks: chunks,
        metadata: extractMetadata
      };
      
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  
  async extractTextFromBuffer(buffer, fileType, fileName = '') {
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          const pdfData = await pdfParse(buffer);
          return {
            text: pdfData.text,
            metadata: {
              pages: pdfData.numpages,
              info: pdfData.info,
              fileName: fileName
            }
          };
        case 'docx':
          const docxResult = await mammoth.extractRawText({ buffer: buffer });
          return {
            text: docxResult.value,
            metadata: {
              messages: docxResult.messages,
              fileName: fileName
            }
          };
        case 'txt':
          const text = buffer.toString('utf8');
          return {
            text: text,
            metadata: {
              fileName: fileName
            }
          };
        case 'html':
          const html = buffer.toString('utf8');
          const $ = cheerio.load(html);
          $('script, style').remove();
          const extractedText = $('body').text() || $.text();
          const title = $('title').text() || '';
          return {
            text: extractedText.replace(/\s+/g, ' ').trim(),
            metadata: {
              title: title,
              headings: this.extractHeadings($),
              fileName: fileName
            }
          };
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${fileType} buffer:`, error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  getChunkingConfig() {
    return {
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      maxChunks: this.maxChunks
    };
  }
}

module.exports = new DocumentProcessor();