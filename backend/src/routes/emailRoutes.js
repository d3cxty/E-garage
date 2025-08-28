import { Router } from 'express';
import { auth } from '../utils/auth.js';
import { getEmails, sendEmail, validateSendEmail } from '../controllers/emailController.js';

const router = Router();
router.get('/', auth(), getEmails);
router.post('/send', auth(), validateSendEmail, sendEmail);
export default router;
