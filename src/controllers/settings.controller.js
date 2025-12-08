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
 * Get current banners (Public - for frontend carousel)
 * GET /settings/banner
 * Returns array of active banners sorted by order
 */
export const getCurrentBanner = async (req, res, next) => {
  try {
    let settings = await AppSettings.findOne({ settingKey: 'app_settings' });

    // If settings don't exist or no active banners, return empty array
    if (!settings || !settings.activeBanners || settings.activeBanners.length === 0) {
      // Backward compatibility: check old currentBanner field
      if (settings && settings.currentBanner) {
        return res.status(200).json({
          success: true,
          message: 'Banners fetched successfully',
          data: {
            banners: [{
              id: 'legacy',
              bannerUrl: settings.currentBanner,
              bannerType: settings.bannerType || 'custom',
              title: settings.bannerTitle || null,
              description: settings.bannerDescription || null,
              order: 0
            }]
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Banners fetched successfully',
        data: {
          banners: []
        }
      });
    }

    // Sort banners by order and limit to 3 for carousel
    const banners = settings.activeBanners
      .sort((a, b) => a.order - b.order)
      .slice(0, 3) // Max 3 banners for carousel
      .map(banner => ({
        id: String(banner._id),
        bannerUrl: banner.bannerUrl,
        bannerType: banner.bannerType || 'custom',
        title: banner.title || null,
        description: banner.description || null,
        order: banner.order
      }));

    return res.status(200).json({
      success: true,
      message: 'Banners fetched successfully',
      data: {
        banners: banners
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload banner (Root only)
 * POST /admins/settings/banner
 * Adds a new banner to activeBanners array
 */
export const uploadBanner = async (req, res, next) => {
  try {
    const { bannerType = 'custom', title, description, order } = req.body;
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
        activeBanners: [],
        bannerHistory: []
      });
    }

    // Determine order (if not provided, add at the end)
    let bannerOrder = order !== undefined ? parseInt(order) : 0;
    if (order === undefined && settings.activeBanners && settings.activeBanners.length > 0) {
      const maxOrder = Math.max(...settings.activeBanners.map(b => b.order || 0));
      bannerOrder = maxOrder + 1;
    }

    // Limit to max 3 banners - if already 3, remove oldest one
    if (settings.activeBanners && settings.activeBanners.length >= 3) {
      // Remove banner with highest order (oldest)
      settings.activeBanners.sort((a, b) => b.order - a.order);
      settings.activeBanners.pop(); // Remove last one
    }

    // Add new banner to activeBanners array
    const newBanner = {
      bannerUrl: uploadResult.url,
      bannerType: bannerType,
      title: title || null,
      description: description || null,
      order: bannerOrder,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    settings.activeBanners.push(newBanner);

    // Save to history
    settings.bannerHistory.push({
      bannerUrl: uploadResult.url,
      bannerType: bannerType,
      title: title || null,
      description: description || null,
      changedBy: req.user.id,
      changedAt: new Date()
    });

    await settings.save();

    // Get the saved banner with ID
    const savedBanner = settings.activeBanners[settings.activeBanners.length - 1];

    return res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        id: String(savedBanner._id),
        bannerUrl: uploadResult.url,
        bannerType: bannerType,
        title: title || null,
        description: description || null,
        order: bannerOrder,
        uploadedAt: savedBanner.uploadedAt
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
 * Delete specific banner (Root only)
 * DELETE /admins/settings/banner/:bannerId
 */
export const deleteCurrentBanner = async (req, res, next) => {
  try {
    const { bannerId } = req.params;

    if (!bannerId) {
      return res.status(400).json({
        success: false,
        message: 'Banner ID is required'
      });
    }

    const settings = await AppSettings.findOne({ settingKey: 'app_settings' });

    if (!settings || !settings.activeBanners || settings.activeBanners.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No banners found'
      });
    }

    // Find banner to delete
    const bannerIndex = settings.activeBanners.findIndex(
      banner => String(banner._id) === bannerId
    );

    if (bannerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const bannerToDelete = settings.activeBanners[bannerIndex];

    // Optionally delete from S3 (optional - keep for history)
    // await deleteBannerFromS3(bannerToDelete.bannerUrl);

    // Remove from activeBanners array
    settings.activeBanners.splice(bannerIndex, 1);

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
      data: {
        deletedBannerId: bannerId,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder banners (Root only)
 * PUT /admins/settings/banner/reorder
 * Body: { bannerOrders: [{ bannerId: "...", order: 0 }, ...] }
 */
export const reorderBanners = async (req, res, next) => {
  try {
    const { bannerOrders } = req.body;

    if (!Array.isArray(bannerOrders) || bannerOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'bannerOrders array is required with bannerId and order'
      });
    }

    const settings = await AppSettings.findOne({ settingKey: 'app_settings' });

    if (!settings || !settings.activeBanners || settings.activeBanners.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No banners found'
      });
    }

    // Update order for each banner
    bannerOrders.forEach(({ bannerId, order }) => {
      if (bannerId === undefined || order === undefined) {
        return;
      }

      const banner = settings.activeBanners.find(
        b => String(b._id) === bannerId
      );

      if (banner) {
        banner.order = parseInt(order);
      }
    });

    await settings.save();

    // Return updated banners sorted by order
    const sortedBanners = settings.activeBanners
      .sort((a, b) => a.order - b.order)
      .map(banner => ({
        id: String(banner._id),
        bannerUrl: banner.bannerUrl,
        bannerType: banner.bannerType || 'custom',
        title: banner.title || null,
        description: banner.description || null,
        order: banner.order
      }));

    return res.status(200).json({
      success: true,
      message: 'Banners reordered successfully',
      data: {
        banners: sortedBanners
      }
    });
  } catch (error) {
    next(error);
  }
};

