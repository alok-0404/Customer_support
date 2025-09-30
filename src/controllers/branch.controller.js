/**
 * Branch Controller
 */

import Branch from '../models/Branch.js';

export const listBranches = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10'), 100) || 10;
    const page = Math.max(parseInt(req.query.page || '1'), 1) || 1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Branch.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Branch.countDocuments({})
    ]);

    return res.status(200).json({
      success: true,
      message: 'Branches fetched',
      data: {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};


