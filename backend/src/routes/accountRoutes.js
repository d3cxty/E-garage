import { Router } from 'express';
import { auth } from '../utils/auth.js';
import { upload } from '../config/multer.js';
import { getAccount, updateAccount } from '../controllers/accountController.js';

const router = Router();
router.get('/', auth(), getAccount);
router.put('/', auth(), upload.single('logo'), updateAccount);
export default router;
