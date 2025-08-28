import { Router } from 'express';
import { register, login, validateRegister, validateLogin } from '../controllers/authController.js';

const router = Router();
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
export default router;
