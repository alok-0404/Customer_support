/**
 * Settings Controller
 * Handles application settings (Universal WhatsApp Link)
 */

import AppSettings from '../models/AppSettings.js';

/**
 * Get current universal WhatsApp link (Public - for frontend)
 * GET /settings/universal-wa-link
 */
export const getUniversalWaLink = async (req, res, next) => {
  try {
    let settings = await AppSettings.findOne({ settingKey: 'app_settings' });
    
    // If settings don't exist, create default
    if (!settings) {
      settings = await AppSettings.create({
        settingKey: 'app_settings',
        universalWaLink: 'https://wa.me/919999999999?text=Hello',
        waLinkHistory: []
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Universal WhatsApp link fetched successfully',
      data: {
        link: settings.universalWaLink,
        updatedAt: settings.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update universal WhatsApp link (Root only)
 * PUT /admin/settings/universal-wa-link
 */
export const updateUniversalWaLink = async (req, res, next) => {
  try {
    const { link } = req.body;

    // Validation
    if (!link || typeof link !== 'string' || link.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp link is required and must be a valid string'
      });
    }

    // Basic URL validation
    const trimmedLink = link.trim();
    if (!trimmedLink.startsWith('http://') && !trimmedLink.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid WhatsApp link format. Must start with http:// or https://'
      });
    }

    let settings = await AppSettings.findOne({ settingKey: 'app_settings' });

    // If settings don't exist, create new
    if (!settings) {
      settings = await AppSettings.create({
        settingKey: 'app_settings',
        universalWaLink: trimmedLink,
        waLinkHistory: []
      });
    } else {
      // Save old link to history before updating
      if (settings.universalWaLink && settings.universalWaLink !== trimmedLink) {
        settings.waLinkHistory.push({
          link: settings.universalWaLink,
          changedBy: req.user.id,
          changedAt: new Date()
        });
      }

      // Update current link
      settings.universalWaLink = trimmedLink;
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Universal WhatsApp link updated successfully',
      data: {
        link: settings.universalWaLink,
        updatedAt: settings.updatedAt,
        updatedBy: req.user.id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get WhatsApp link history (Root only)
 * GET /admin/settings/universal-wa-link/history
 */
export const getUniversalWaLinkHistory = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50'), 100) || 50;
    const page = Math.max(parseInt(req.query.page || '1'), 1) || 1;
    const skip = (page - 1) * limit;

    const settings = await AppSettings.findOne({ settingKey: 'app_settings' })
      .select('universalWaLink waLinkHistory updatedAt')
      .populate('waLinkHistory.changedBy', 'email userId role');

    if (!settings || !settings.waLinkHistory || settings.waLinkHistory.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No history found',
        data: {
          currentLink: settings?.universalWaLink || null,
          history: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      });
    }

    // Sort history by date (newest first)
    const sortedHistory = [...settings.waLinkHistory].sort(
      (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
    );

    // Paginate
    const total = sortedHistory.length;
    const paginatedHistory = sortedHistory.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      message: 'WhatsApp link history fetched successfully',
      data: {
        currentLink: settings.universalWaLink,
        history: paginatedHistory.map(item => ({
          link: item.link,
          changedBy: item.changedBy ? {
            id: String(item.changedBy._id),
            email: item.changedBy.email,
            userId: item.changedBy.userId,
            role: item.changedBy.role
          } : null,
          changedAt: item.changedAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

