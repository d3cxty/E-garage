import { Router } from 'express';
import authRoutes from './authRoutes.js';
import clientRoutes from './clientRoutes.js';
import emailRoutes from './emailRoutes.js';
import accountRoutes from './accountRoutes.js';
import chatRoutes from './chatRoutes.js';
import paymentRoutes from "./paymentRoutes.js";

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/emails', emailRoutes);
router.use('/account', accountRoutes);
router.use('/chat', chatRoutes);

// ...
router.use("/payments", paymentRoutes);


router.get('/health', (_req, res) => res.json({ ok: true }));

export default router;
