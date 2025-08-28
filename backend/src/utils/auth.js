import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });

export const auth = () => (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
