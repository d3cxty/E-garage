import { Router } from 'express';
import { getRoomMessages } from '../controllers/chatController.js';
// import { auth } from '../utils/auth.js'; // Enable if you want to protect history

const router = Router();

// Chat history (persisted). Add auth() if needed.
router.get('/:room/messages', /* auth(), */ getRoomMessages);

// Liveness
router.get('/', (_req, res) => res.json({ ok: true, realtime: true, persisted: true }));

export default router;
