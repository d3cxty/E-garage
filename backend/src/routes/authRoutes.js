import { Router } from 'express';
import { register, login, validateLogin,createStuffUser,getUsers ,deleteUser} from '../controllers/authController.js';
import { auth } from '../utils/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', validateLogin, login);
router.post('/create-staff', auth('admin'), createStuffUser);
router.get('/users', auth(['admin', 'staff']), getUsers);
router.delete('/users/:id', auth('admin'), deleteUser);

export default router;
