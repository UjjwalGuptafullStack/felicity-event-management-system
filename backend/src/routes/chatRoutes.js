const express   = require('express');
const multer    = require('multer');
const path      = require('path');
const router    = express.Router();
const { authenticate, requireParticipant } = require('../middleware/authContracts');
const { getMessages, uploadFile }          = require('../controllers/chatController');

// Multer: disk storage into uploads/chat/
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '../../uploads/chat')),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Load message history (paginated, newest-first by default then reversed on client)
router.get(
  '/chat/team/:teamId/messages',
  authenticate,
  requireParticipant(),
  getMessages
);

// Upload a file attachment; returns { fileUrl, fileName, fileType }
router.post(
  '/chat/team/:teamId/upload',
  authenticate,
  requireParticipant(),
  upload.single('file'),
  uploadFile
);

module.exports = router;
