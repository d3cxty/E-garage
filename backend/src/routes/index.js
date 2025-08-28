import { Router } from 'express';
import authRoutes from './authRoutes.js';
import clientRoutes from './clientRoutes.js';
import emailRoutes from './emailRoutes.js';
import accountRoutes from './accountRoutes.js';
import chatRoutes from './chatRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/emails', emailRoutes);
router.use('/account', accountRoutes);
router.use('/chat', chatRoutes);

router.get('/health', (_req, res) => res.json({ ok: true }));

export default router;
