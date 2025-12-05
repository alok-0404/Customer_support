import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import UserHitLog from '../models/UserHitLog.js';

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
  const { email, password, userId, branchId, waLink, username, isActive = true, permissions = [] } = req.body || {};
  if (!password || !userId || !username) {
    return res.status(400).json({ success: false, message: 'password, userId, username are required' });
  }

  const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
  const normalizedUsername = String(username).toLowerCase().trim();

  if (normalizedEmail) {
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
  }

  const usernameExists = await User.findOne({ username: normalizedUsername });
  if (usernameExists) return res.status(409).json({ success: false, message: 'Username already in use' });

  let branch = null;
  if (!waLink && branchId) {
    branch = await findBranchByAnyId(branchId);
    if (!branch) return res.status(400).json({ success: false, message: 'Invalid branchId' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const subPayload = {
    userId,
    username: normalizedUsername,
    // If waLink provided directly, prefer that and do not require branchId
    ...(waLink
      ? { branchWaLink: waLink }
      : branch
        ? { branchId: branch._id, branchName: branch.branchName, branchWaLink: branch.waLink }
        : {}),
    passwordHash,
    role: 'sub',
    isActive: !!isActive,
    createdBy: req.user.id,
    tokenVersion: 0,
    // Store permissions if provided
    ...(Array.isArray(permissions) ? { permissions } : {})
  };

  if (normalizedEmail) {
    subPayload.email = normalizedEmail;
  }

  const sub = await User.create(subPayload);

  return res.status(201).json({
    success: true,
    message: 'Sub admin created',
    data: {
      id: String(sub._id),
      email: sub.email,
      username: sub.username || null,
      role: sub.role,
      isActive: sub.isActive,
      userId: sub.userId,
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
      .select('_id email username role isActive userId createdBy permissions createdAt updatedAt branchWaLink'),
    User.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    message: 'Sub admins fetched',
    data: {
      items: items.map(u => ({
        id: String(u._id),
        email: u.email,
        username: u.username || null,
        role: u.role,
        isActive: u.isActive,
        userId: u.userId,
        createdBy: u.createdBy,
        permissions: u.permissions || [],
        branchWaLink: u.branchWaLink || null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  });
};

export const updateSubAdmin = async (req, res) => {
  const { id } = req.params;
  const { isActive, permissions, branchId, waLink } = req.body || {};

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

  if (typeof waLink === 'string' && waLink.trim().length > 0) {
    // Allow directly overriding waLink; do not force-attach a branch
    sub.branchWaLink = waLink.trim();
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

/**
 * Bulk delete by role - Delete all users with specified role
 * Root users are ALWAYS protected and cannot be deleted
 * POST /api/admins/bulk-delete
 * Body: { "role": "sub" | "client", "deleteBranches": true/false, "deleteLogs": true/false }
 */
export const bulkDeleteByRole = async (req, res) => {
  try {
    const { role, deleteBranches = false, deleteLogs = false } = req.body || {};

    // Validate role
    if (!role || (role !== 'sub' && role !== 'client')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "sub" or "client". Root users cannot be deleted.'
      });
    }

    let deletedCount = 0;
    let deletedBranches = 0;
    let deletedLogs = 0;

    // Delete users with specified role
    // Root users are protected - only 'sub' or 'client' can be passed
    const deleteResult = await User.deleteMany({
      role: role
    });
    
    deletedCount = deleteResult.deletedCount;

    // If deleting sub-admins, optionally delete branches
    if (role === 'sub' && deleteBranches) {
      const branchResult = await Branch.deleteMany({});
      deletedBranches = branchResult.deletedCount;
    }

    // Optionally delete all user hit logs
    if (deleteLogs) {
      const logResult = await UserHitLog.deleteMany({});
      deletedLogs = logResult.deletedCount;
    }

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${deletedCount} ${role} user(s)`,
      data: {
        deletedUsers: deletedCount,
        deletedBranches: deleteBranches ? deletedBranches : 0,
        deletedLogs: deleteLogs ? deletedLogs : 0,
        role: role
      }
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete users',
      error: error.message
    });
  }
};


