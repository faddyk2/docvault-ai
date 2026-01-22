const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');

const {
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  getDocument,
  queryKB
} = require('../controllers/documentController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760   },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['pdf', 'docx', 'txt', 'html'];
    const fileType = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileType)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${fileType}. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

router.get('/documents', authenticate, getDocuments);
router.get('/documents/:id', authenticate, getDocument);
router.post('/documents', authenticate, requireRole('admin'), upload.single('file'), uploadDocument);
router.put('/documents/:id', authenticate, requireRole('admin'), upload.single('file'), updateDocument);
router.delete('/documents/:id', authenticate, requireRole('admin'), deleteDocument);

router.post('/query', authenticate, queryKB);

module.exports = router;