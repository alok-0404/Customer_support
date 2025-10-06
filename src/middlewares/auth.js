import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'JWT secret not configured' });
    }

    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select('_id email role isActive tokenVersion');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token user' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account disabled' });
    }

    // Optional tokenVersion check if included in token
    if (payload.tv != null && payload.tv !== user.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Token invalidated' });
    }

    req.user = { id: String(user._id), email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export const requireRoot = (req, res, next) => {
  if (!req.user || req.user.role !== 'root') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};


