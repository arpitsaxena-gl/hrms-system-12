const express = require('express');
const router = express.Router();
const { getDocuments, uploadDocument, verifyDocument, deleteDocument } = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument: uploadMiddleware } = require('../middleware/upload');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/', paginate, getDocuments);
router.post('/', uploadMiddleware, uploadDocument);
router.put('/:id/verify', authorize('admin', 'hr'), verifyDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
