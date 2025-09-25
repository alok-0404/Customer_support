/**
 * Updates Controller
 */

import Update from '../models/Update.js';

export const getUpdates = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const updates = await Update.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Transform the data to include publishedAt
    const transformedUpdates = updates.map(update => ({
      ...update,
      publishedAt: update.createdAt
    }));

    res.status(200).json({
      success: true,
      data: transformedUpdates
    });
  } catch (error) {
    next(error);
  }
};
