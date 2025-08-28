import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/auth.js';
import { validate } from '../utils/validate.js';

export const validateRegister = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['client']), // Only allow 'client' for public registration
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
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, role: role || 'client' });
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