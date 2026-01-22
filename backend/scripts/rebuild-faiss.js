const dataStore = require('../src/models/DataStore');
const faissService = require('../src/services/FAISSService');

async function rebuildFAISS() {
  try {
    console.log('🔧 Rebuilding FAISS index from stored chunks...\n');
    
    
    await dataStore.initialize();
    console.log('✅ Data store initialized\n');
    
    
    await faissService.initialize();
    console.log('✅ FAISS service initialized\n');
    
    
    const chunks = await dataStore.getAllChunks();
    console.log(`📦 Loaded ${chunks.length} chunks from storage\n`);
    
    if (chunks.length === 0) {
      console.log('❌ No chunks found to rebuild from');
      process.exit(1);
    }
    
    
    const chunksWithEmbeddings = chunks.filter(chunk => 
      chunk.embedding && 
      Array.isArray(chunk.embedding) && 
      chunk.embedding.length > 0
    );
    
    console.log(`📊 Found ${chunksWithEmbeddings.length} chunks with valid embeddings\n`);
    
    if (chunksWithEmbeddings.length === 0) {
      console.log('❌ No chunks with valid embeddings found');
      process.exit(1);
    }
    
    
    await faissService.rebuildFromChunks(chunksWithEmbeddings);
    
    console.log(`\n✅ FAISS index successfully rebuilt!`);
    console.log(`📊 Index now contains ${faissService.getSize()} vectors`);
    console.log(`🎯 Ready for querying!\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error rebuilding FAISS:', error);
    process.exit(1);
  }
}

rebuildFAISS();
