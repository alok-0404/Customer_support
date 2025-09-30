/**
 * Search Service
 */

import User from '../models/User.js';
import UserHitLog from '../models/UserHitLog.js';

// ----------------------
// In-memory fallback data (temporary)
// ----------------------
const memoryUsers = [
  { userId: 'AB123', name: 'John Doe', branchId: 'B001' },
  { userId: 'AB124', name: 'Alice', branchId: 'B001' },
  { userId: 'AB125', name: 'Mark', branchId: 'B001' },
  { userId: 'AB126', name: 'Sara', branchId: 'B001' },
  { userId: 'AB127', name: 'David', branchId: 'B001' },

  { userId: 'BB123', name: 'Ravi', branchId: 'B002' },
  { userId: 'BB124', name: 'Priya', branchId: 'B002' },
  { userId: 'BB125', name: 'Karan', branchId: 'B002' },
  { userId: 'BB126', name: 'Neha', branchId: 'B002' },
  { userId: 'BB127', name: 'Sahil', branchId: 'B002' },

  { userId: 'CC123', name: 'Amit', branchId: 'B003' },
  { userId: 'CC124', name: 'Pooja', branchId: 'B003' },
  { userId: 'CC125', name: 'Vikas', branchId: 'B003' },
  { userId: 'CC126', name: 'Simran', branchId: 'B003' },
  { userId: 'CC127', name: 'Rohan', branchId: 'B003' },

  { userId: 'DD123', name: 'Amitabh', branchId: 'B004' },
  { userId: 'DD124', name: 'Poojara', branchId: 'B004' },
  { userId: 'DD125', name: 'Vikku', branchId: 'B004' },
  { userId: 'DD126', name: 'Sim', branchId: 'B004' },
  { userId: 'DD127', name: 'Rohani', branchId: 'B004' }
];

const memoryBranches = [
  { branchId: 'B001', branchName: 'Branch A', waLink: 'https://wa.link/mydiatest1' },
  { branchId: 'B002', branchName: 'Branch B', waLink: 'https://wa.link/mydiatest2' },
  { branchId: 'B003', branchName: 'Branch C', waLink: 'https://wa.link/mydiatest3' },
  { branchId: 'B004', branchName: 'Branch D', waLink: 'https://wa.link/mydiatest4' }
];

const FORCE_WA_LINK_URL = process.env.FORCE_WA_LINK_URL || 'https://wa.link/mydia99supportsite';
const FORCE_WA_LINK_FOR_USER_IDS = (process.env.FORCE_WA_LINK_FOR_USER_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const shouldForceSpecialLink = (userId) => {
  return FORCE_WA_LINK_FOR_USER_IDS.includes(userId);
};

export const findUserWithBranch = async (userId) => {
  // 1) Try DB first
  const dbUser = await User.findOne({ userId }).populate('branchId');
  if (dbUser) {
    const branch = dbUser.branchId;
    let waLink = branch?.waLink || '';
    if (shouldForceSpecialLink(userId)) {
      waLink = FORCE_WA_LINK_URL;
    }
    try {
      await UserHitLog.create({ userId, waLink });
    } catch (e) {}
    return {
      userId: dbUser.userId,
      branchName: branch?.branchName || '',
      waLink
    };
  }

  // 2) Fallback to in-memory data
  const memUser = memoryUsers.find(u => u.userId === userId);
  if (!memUser) return null;
  const memBranch = memoryBranches.find(b => b.branchId === memUser.branchId);
  if (!memBranch) return null;
  let waLink = memBranch.waLink || '';
  if (shouldForceSpecialLink(userId)) {
    waLink = FORCE_WA_LINK_URL;
  }
  try {
    await UserHitLog.create({ userId, waLink });
  } catch (e) {}
  return {
    userId: memUser.userId,
    branchName: memBranch.branchName,
    waLink
  };
};

export const getRedirectWaLink = async (userId) => {
  const found = await findUserWithBranch(userId);
  if (!found) return null;
  return found.waLink;
};


