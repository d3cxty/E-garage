import { Router } from 'express';
import { getRoomMessages, uploadChatImage } from '../controllers/chatController.js';
import { upload } from '../config/multer.js';
// import { auth } from '../utils/auth.js'; // enable if you want to protect

const router = Router();

// Chat history (persisted)
router.get('/:room/messages', /* auth(), */ getRoomMessages);

// Image upload to a room (multipart/form-data, field: "file")
router.post('/:room/upload', /* auth(), */ upload.single('file'), uploadChatImage);

// Liveness
router.get('/', (_req, res) => res.json({ ok: true, realtime: true, persisted: true }));

export default router;
