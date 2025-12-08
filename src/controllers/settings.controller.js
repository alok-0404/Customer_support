/**
 * Settings Controller
 * Handles application settings (Universal WhatsApp Link & Banner)
 */

import AppSettings from '../models/AppSettings.js';
import { uploadBannerToS3, deleteBannerFromS3, validateBannerFile } from '../services/s3.service.js';

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

/**
 * Get current banner (Public - for frontend)
 * GET /settings/banner
 */
export const getCurrentBanner = async (req, res, next) => {
  try {
    let settings = await AppSettings.findOne({ settingKey: 'app_settings' });

    // If settings don't exist, return null
    if (!settings || !settings.currentBanner) {
      return res.status(200).json({
        success: true,
        message: 'Banner fetched successfully',
        data: {
          bannerUrl: null,
          bannerType: null,
          title: null,
          description: null,
          updatedAt: null
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Banner fetched successfully',
      data: {
        bannerUrl: settings.currentBanner,
        bannerType: settings.bannerType || 'custom',
        title: settings.bannerTitle || null,
        description: settings.bannerDescription || null,
        updatedAt: settings.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload/Update banner (Root only)
 * POST /admins/settings/banner
 */
export const uploadBanner = async (req, res, next) => {
  try {
    const { bannerType = 'custom', title, description } = req.body;
    const file = req.file;

    // Validate file
    const fileValidation = validateBannerFile(file);
    if (!fileValidation.valid) {
      return res.status(400).json({
        success: false,
        message: fileValidation.error
      });
    }

    // Validate banner type
    const allowedTypes = ['festival', 'discount', 'custom', 'event'];
    if (!allowedTypes.includes(bannerType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid banner type. Allowed: ${allowedTypes.join(', ')}`
      });
    }

    // Upload to S3
    const uploadResult = await uploadBannerToS3(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    let settings = await AppSettings.findOne({ settingKey: 'app_settings' });

    // If settings don't exist, create new
    if (!settings) {
      settings = await AppSettings.create({
        settingKey: 'app_settings',
        universalWaLink: 'https://wa.me/919999999999?text=Hello',
        waLinkHistory: [],
        currentBanner: uploadResult.url,
        bannerType: bannerType,
        bannerTitle: title || null,
        bannerDescription: description || null,
        bannerHistory: []
      });
    } else {
      // Save old banner to history before updating
      if (settings.currentBanner && settings.currentBanner !== uploadResult.url) {
        settings.bannerHistory.push({
          bannerUrl: settings.currentBanner,
          bannerType: settings.bannerType || 'custom',
          title: settings.bannerTitle || null,
          description: settings.bannerDescription || null,
          changedBy: req.user.id,
          changedAt: new Date()
        });
      }

      // Update current banner
      settings.currentBanner = uploadResult.url;
      settings.bannerType = bannerType;
      settings.bannerTitle = title || null;
      settings.bannerDescription = description || null;
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        bannerUrl: uploadResult.url,
        bannerType: bannerType,
        title: title || null,
        description: description || null,
        updatedAt: settings.updatedAt,
        updatedBy: req.user.id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get banner history (Root only)
 * GET /admins/settings/banner/history
 */
export const getBannerHistory = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50'), 100) || 50;
    const page = Math.max(parseInt(req.query.page || '1'), 1) || 1;
    const skip = (page - 1) * limit;

    const settings = await AppSettings.findOne({ settingKey: 'app_settings' })
      .select('currentBanner bannerType bannerTitle bannerDescription bannerHistory updatedAt')
      .populate('bannerHistory.changedBy', 'email userId role');

    if (!settings || !settings.bannerHistory || settings.bannerHistory.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No banner history found',
        data: {
          currentBanner: settings?.currentBanner || null,
          currentBannerType: settings?.bannerType || null,
          currentTitle: settings?.bannerTitle || null,
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
    const sortedHistory = [...settings.bannerHistory].sort(
      (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
    );

    // Paginate
    const total = sortedHistory.length;
    const paginatedHistory = sortedHistory.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      message: 'Banner history fetched successfully',
      data: {
        currentBanner: settings.currentBanner,
        currentBannerType: settings.bannerType || 'custom',
        currentTitle: settings.bannerTitle || null,
        history: paginatedHistory.map(item => ({
          bannerUrl: item.bannerUrl,
          bannerType: item.bannerType,
          title: item.title,
          description: item.description,
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

/**
 * Delete/Remove current banner (Root only)
 * DELETE /admins/settings/banner
 */
export const deleteCurrentBanner = async (req, res, next) => {
  try {
    const settings = await AppSettings.findOne({ settingKey: 'app_settings' });

    if (!settings || !settings.currentBanner) {
      return res.status(404).json({
        success: false,
        message: 'No banner found to delete'
      });
    }

    // Save to history before deleting
    settings.bannerHistory.push({
      bannerUrl: settings.currentBanner,
      bannerType: settings.bannerType || 'custom',
      title: settings.bannerTitle || null,
      description: settings.bannerDescription || null,
      changedBy: req.user.id,
      changedAt: new Date()
    });

    // Optionally delete from S3 (optional - keep for history)
    // await deleteBannerFromS3(settings.currentBanner);

    // Clear current banner
    settings.currentBanner = null;
    settings.bannerType = 'custom';
    settings.bannerTitle = null;
    settings.bannerDescription = null;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Banner removed successfully',
      data: {
        removedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};
