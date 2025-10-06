import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signAccessToken = (user) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  return jwt.sign({ sub: String(user._id), role: user.role, tv: user.tokenVersion }, secret, { expiresIn });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  if (!user.isActive) return res.status(403).json({ success: false, message: 'Account disabled' });

  const ok = user.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        ...(user.role === 'sub' ? {
          branchId: user.branchId ? String(user.branchId) : null,
          branchName: user.branchName || null,
          branchWaLink: user.branchWaLink || null
        } : {})
      },
      accessToken,
      sessionActive: true,
      isActiveEffective: !!user.isActive
    }
  });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select('_id email role isActive lastLoginAt branchId branchName branchWaLink');
  return res.status(200).json({
    success: true,
    message: 'Profile',
    data: {
      id: String(user._id),
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      sessionActive: true,
      isActiveEffective: !!user.isActive,
      lastLoginAt: user.lastLoginAt || null,
      ...(user.role === 'sub' ? {
        branchId: user.branchId ? String(user.branchId) : null,
        branchName: user.branchName || null,
        branchWaLink: user.branchWaLink || null
      } : {})
    }
  });
};

export const logout = async (req, res) => {
  const user = await User.findById(req.user.id).select('_id tokenVersion');
  if (user) {
    user.tokenVersion += 1; // invalidate previously issued tokens
    user.lastLogoutAt = new Date();
    await user.save();
  }
  return res.status(200).json({ success: true, message: 'Logged out', data: { sessionActive: false } });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }

  const user = await User.findById(req.user.id).select('_id passwordHash tokenVersion role');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role !== 'root') return res.status(403).json({ success: false, message: 'Root access required' });

  const ok = user.passwordHash && (await bcrypt.compare(currentPassword, user.passwordHash));
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid current password' });

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1; // logout everywhere
  await user.save();

  return res.status(200).json({ success: true, message: 'Password updated. Please login again.' });
};

export const changeEmail = async (req, res) => {
  const { newEmail, password } = req.body;
  if (!newEmail || !password) {
    return res.status(400).json({ success: false, message: 'New email and password are required' });
  }

  const user = await User.findById(req.user.id).select('_id email passwordHash role');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role !== 'root') return res.status(403).json({ success: false, message: 'Root access required' });

  const ok = user.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid password' });

  const normalized = newEmail.toLowerCase().trim();
  const exists = await User.findOne({ email: normalized, _id: { $ne: user._id } });
  if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });

  user.email = normalized;
  await user.save();

  return res.status(200).json({ success: true, message: 'Email updated', data: { email: user.email } });
};


