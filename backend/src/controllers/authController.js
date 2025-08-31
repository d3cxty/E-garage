import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/auth.js';
import { validate } from '../utils/validate.js';

// Public: only 'client' allowed.
// With header x-admin-key == ADMIN_SIGNUP_KEY: allow 'client' | 'staff' | 'admin'


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
  const roleToSet = 'client'; 

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

export async function createStuffUser(req, res) {
  const { email, password, role } = req.body;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, role });

  return res.json({ token: signToken(user), email: user.email, password: req.body.password,role: user.role });
}

export async function getUsers(req, res) {
  const Users = await User.find();
   if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(Users);
}
export async function deleteUser(req, res) {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ message: 'User deleted' });
}