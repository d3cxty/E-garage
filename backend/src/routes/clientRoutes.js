// routes/clients.js
import { Router } from 'express';
import { auth } from '../utils/auth.js';
import { upload } from '../config/multer.js';

import {
  createClient,
  listClients,
  listMyClients,
  getClient,
  updateClient,
  patchClient,
  deleteClient,
  exportClientPDF,
  validateCreateClient
} from '../controllers/clientController.js';

const router = Router();

router.post(
  '/',
  auth(),
  upload.fields([{ name: 'photos', maxCount: 10 }, { name: 'proforma', maxCount: 1 }]),
  validateCreateClient,
  createClient
);

// MUST be before '/:id'
router.get('/me', auth(), listMyClients);

router.get('/', auth(), listClients);
router.get('/:id', auth(), getClient);
router.put('/:id', auth(), updateClient);
router.patch('/:id/status', auth(), patchClient);
router.delete('/:id', auth(), deleteClient);
router.get('/:id/pdf', auth(), exportClientPDF);

export default router;
