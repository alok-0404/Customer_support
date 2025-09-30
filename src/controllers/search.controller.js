/**
 * Search Controller
 */

import { findUserWithBranch, getRedirectWaLink } from '../services/search.service.js';

export const searchByUserId = async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      res.status(400);
      return res.json({ success: false, message: 'userId is required', data: null });
    }
    const result = await findUserWithBranch(userId);
    if (!result) {
      res.status(404);
      return res.json({ success: false, message: 'User not found', data: null });
    }
    return res.status(200).json({ success: true, message: 'User found', data: result });
  } catch (error) {
    next(error);
  }
};

export const redirectByUserId = async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      res.status(400);
      return res.json({ success: false, message: 'userId is required', data: null });
    }
    const waLink = await getRedirectWaLink(userId);
    if (!waLink) {
      res.status(404);
      return res.json({ success: false, message: 'User not found', data: null });
    }
    return res.redirect(302, waLink);
  } catch (error) {
    next(error);
  }
};


