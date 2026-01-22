require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { authenticate, requireRole } = require('./middleware/auth');

const dataStore = require('./models/DataStore');
const faissService = require('./services/FAISSService');
const embeddingService = require('./services/HuggingFaceEmbeddingService');
const multer = require('multer');
const {availableVideos} = require('./controllers/documentController');

const kbRoutes = require('./routes/kb');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5001;


app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://192.125.4.12:3000', 
    'http://192.125.4.12',       
    /^http:\/\/192\.125\.4\.12(:\d+)?$/  
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use('/videos', express.static(path.join(__dirname, '../videos')));


const videosDir = path.join(__dirname, '../videos');
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videosDir);
  },
  filename: function (req, file, cb) {
    const userProvidedName = req.body.filename && req.body.filename.trim();
    const ext = path.extname(file.originalname);
    const safeName = (userProvidedName || file.originalname).replace(/[^a-zA-Z0-9._-]+/g, '_');
    cb(null, safeName.endsWith(ext) ? safeName : `${safeName}${ext}`);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.avi', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Unsupported file type'), false);
  }
});


app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      dataStore: dataStore ? 'connected' : 'disconnected',
      faiss: faissService ? 'connected' : 'disconnected',
      embedding: embeddingService && embeddingService.isModelInitialized() ? 'ready' : 'not ready'
    }
  });
});


app.use('/kb', kbRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.get('/apiVideos', authenticate, (req, res) => {
  const videoDirectory = path.join(__dirname, '../videos');
  const fs = require('fs');
  fs.readdir(videoDirectory, (err, files) => {
    if (err) {
      console.error('Error reading video directory:', err);
      return res.status(500).json({ error: 'Failed to read video directory' });
    }
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.mov', '.avi', '.mkv'].includes(ext);
    }
    ).map(file => ({
      filename: file,
      url: `/videos/${file}`
    }));
    res.json(Array.from(videoFiles));
  }
);
});

app.post('/apiVideos', authenticate, requireRole('admin'), uploadVideo.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  availableVideos.push(req.file.filename);
  res.json({ filename: req.file.filename, url: `/videos/${req.file.filename}` });
});


app.delete('/apiVideos/:filename', authenticate, requireRole('admin'), (req, res) => {
  const fileToDelete = req.params.filename;
  const filePath = path.join(videosDir, fileToDelete);
  const fs = require('fs');
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete file' });
    res.json({ success: true });
  });
});





app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: 'File size exceeds the maximum allowed limit'
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      details: error.message
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});


app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});


async function startServer() {
  try {
    console.log('🚀 Starting Knowledge Base Management System...');
    
    
    console.log('📄 Initializing data store...');
    await dataStore.initialize();
    
    
    console.log('🔍 Initializing FAISS vector database...');
    await faissService.initialize();
    
    
    if (faissService.getSize() === 0) {
      const chunks = await dataStore.getAllChunks();
      const chunksWithEmbeddings = chunks.filter(chunk => chunk.embedding && chunk.embedding.length > 0);
      
      if (chunksWithEmbeddings.length > 0) {
        console.log(`🔧 Found ${chunksWithEmbeddings.length} chunks with embeddings but 0 vectors in FAISS. Rebuilding index...`);
        await faissService.rebuildFromChunks(chunksWithEmbeddings);
      }
    }
    
    
    console.log('🤗 Initializing Hugging Face embedding service...');
    await embeddingService.initialize();
    await embeddingService.warmup();
    
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log('\n📚 Available endpoints:');
      console.log(`   GET    /kb/documents     - List all documents`);
      console.log(`   GET    /kb/documents/:id - Get specific document`);
      console.log(`   POST   /kb/documents     - Upload new document`);
      console.log(`   PUT    /kb/documents/:id - Update document`);
      console.log(`   DELETE /kb/documents/:id - Delete document`);
      console.log(`   POST   /kb/query         - Query knowledge base`);
      
      console.log('\n🤗 Hugging Face Model: sentence-transformers/all-MiniLM-L6-v2');
      console.log('📏 Embedding Dimension: 384');
      console.log('🚀 Local embeddings - no API key required!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}


process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  
  try {
    
    await faissService.saveIndex();
    console.log('💾 Data saved successfully');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
  
  process.exit(0);
});


process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});


startServer();