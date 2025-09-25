/**
 * WhatsApp Intents Admin Controller
 */

import WhatsAppIntent from '../models/WhatsAppIntent.js';

export const listIntents = async (req, res, next) => {
  try {
    const { userId, limit = '50', page = '1' } = req.query;
    const query = {};
    if (userId) query.userId = userId;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      WhatsAppIntent.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      WhatsAppIntent.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIntents = async (req, res, next) => {
  try {
    const { userId, all } = req.query;

    if (all === 'true') {
      const result = await WhatsAppIntent.deleteMany({});
      return res.status(200).json({ success: true, deletedCount: result.deletedCount });
    }

    if (userId) {
      const result = await WhatsAppIntent.deleteMany({ userId });
      return res.status(200).json({ success: true, deletedCount: result.deletedCount });
    }

    return res.status(400).json({ success: false, error: 'Provide userId or all=true' });
  } catch (error) {
    next(error);
  }
};


