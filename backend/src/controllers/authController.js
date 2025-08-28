import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/auth.js';
import { validate } from '../utils/validate.js';

// Public: only 'client' allowed.
// With header x-admin-key == ADMIN_SIGNUP_KEY: allow 'client' | 'staff' | 'admin'
export const validateRegister = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().custom((v, { req }) => {
    const isAdminKey = req.get('x-admin-key') === process.env.ADMIN_SIGNUP_KEY;
    if (!isAdminKey) {
      if (v && v !== 'client') throw new Error('Only client signups allowed');
    } else {
      if (v && !['client', 'staff', 'admin'].includes(v)) throw new Error('Invalid role');
    }
    return true;
  }),
  validate,
];

export const validateLogin = [
  body('email').isEmail(),
  body('password').notEmpty(),
  validate,
];

export async function register(req, res) {
  const { email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const isAdminKey = req.get('x-admin-key') === process.env.ADMIN_SIGNUP_KEY;
  const roleToSet = isAdminKey ? (role || 'staff') : 'client'; // default to 'staff' when admin header present

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, role: roleToSet });

  return res.json({ token: signToken(user), role: user.role });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const validRoles = ['admin', 'staff', 'client'];
  if (!validRoles.includes(user.role)) {
    return res.status(400).json({ message: 'Invalid user role' });
  }
  return res.json({ token: signToken(user), role: user.role });
}
