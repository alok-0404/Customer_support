import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Branch from '../models/Branch.js';

const findBranchByAnyId = async (idOrCode) => {
  if (!idOrCode) return null;
  // Try as Mongo ObjectId first
  if (mongoose.isValidObjectId(idOrCode)) {
    const byId = await Branch.findById(idOrCode);
    if (byId) return byId;
  }
  // Fallback: treat as business branchId code (e.g., "ROOT-BRANCH")
  return await Branch.findOne({ branchId: idOrCode });
};

export const createSubAdmin = async (req, res) => {
  const { email, password, userId, branchId, isActive = true, permissions = [] } = req.body || {};
  if (!email || !password || !userId || !branchId) {
    return res.status(400).json({ success: false, message: 'email, password, userId, branchId are required' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });

  const branch = await findBranchByAnyId(branchId);
  if (!branch) return res.status(400).json({ success: false, message: 'Invalid branchId' });

  const passwordHash = await bcrypt.hash(password, 12);

  const sub = await User.create({
    userId,
    branchId: branch._id,
    branchName: branch.branchName,
    branchWaLink: branch.waLink,
    email: normalizedEmail,
    passwordHash,
    role: 'sub',
    isActive: !!isActive,
    createdBy: req.user.id,
    tokenVersion: 0,
    // Store permissions if provided
    ...(Array.isArray(permissions) ? { permissions } : {})
  });

  return res.status(201).json({
    success: true,
    message: 'Sub admin created',
    data: {
      id: String(sub._id),
      email: sub.email,
      role: sub.role,
      isActive: sub.isActive,
      userId: sub.userId,
      branchId: String(sub.branchId),
      branchName: sub.branchName,
      branchWaLink: sub.branchWaLink,
      createdBy: sub.createdBy,
      permissions: sub.permissions || [],
      createdAt: sub.createdAt
    }
  });
};

export const listSubAdmins = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '10'), 100) || 10;
  const page = Math.max(parseInt(req.query.page || '1'), 1) || 1;
  const skip = (page - 1) * limit;

  const filter = { role: 'sub', createdBy: req.user.id };

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id email role isActive userId createdBy permissions createdAt updatedAt branchId branchName branchWaLink')
      .populate('branchId'),
    User.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    message: 'Sub admins fetched',
    data: {
      items: items.map(u => ({
        id: String(u._id),
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        userId: u.userId,
        createdBy: u.createdBy,
        permissions: u.permissions || [],
        branch: u.branchId
          ? { id: String(u.branchId._id || u.branchId), branchId: u.branchId.branchId, branchName: u.branchId.branchName }
          : null,
        branchSnapshot: { name: u.branchName || null, waLink: u.branchWaLink || null },
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  });
};

export const updateSubAdmin = async (req, res) => {
  const { id } = req.params;
  const { isActive, permissions, branchId } = req.body || {};

  const sub = await User.findOne({ _id: id, role: 'sub', createdBy: req.user.id });
  if (!sub) return res.status(404).json({ success: false, message: 'Sub admin not found' });

  if (typeof isActive === 'boolean') sub.isActive = isActive;
  if (Array.isArray(permissions)) sub.permissions = permissions;
  if (branchId) {
    const branch = await findBranchByAnyId(branchId);
    if (!branch) return res.status(400).json({ success: false, message: 'Invalid branchId' });
    sub.branchId = branch._id;
    sub.branchName = branch.branchName;
    sub.branchWaLink = branch.waLink;
  }

  await sub.save();

  return res.status(200).json({
    success: true,
    message: 'Sub admin updated',
    data: {
      id: String(sub._id),
      email: sub.email,
      role: sub.role,
      isActive: sub.isActive,
      userId: sub.userId,
      createdBy: sub.createdBy,
      branchId: String(sub.branchId),
      branchName: sub.branchName,
      branchWaLink: sub.branchWaLink,
      permissions: sub.permissions || []
    }
  });
};

export const resetSubAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body || {};
  if (!newPassword) return res.status(400).json({ success: false, message: 'newPassword is required' });

  const sub = await User.findOne({ _id: id, role: 'sub', createdBy: req.user.id });
  if (!sub) return res.status(404).json({ success: false, message: 'Sub admin not found' });

  sub.passwordHash = await bcrypt.hash(newPassword, 12);
  sub.tokenVersion += 1; // logout everywhere
  await sub.save();

  return res.status(200).json({ success: true, message: 'Password reset; user must login again.' });
};

export const deactivateSubAdmin = async (req, res) => {
  const { id } = req.params;
  const sub = await User.findOne({ _id: id, role: 'sub', createdBy: req.user.id });
  if (!sub) return res.status(404).json({ success: false, message: 'Sub admin not found' });

  sub.isActive = false;
  sub.tokenVersion += 1; // ensure current sessions are invalidated
  await sub.save();

  return res.status(200).json({ success: true, message: 'Sub admin deactivated' });
};


