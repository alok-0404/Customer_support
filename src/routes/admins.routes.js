import express from 'express';
import { requireAuth, requireRoot } from '../middlewares/auth.js';
import { apiRateLimit } from '../middlewares/rateLimit.js';
import { createSubAdmin, listSubAdmins, updateSubAdmin, resetSubAdminPassword, deactivateSubAdmin, bulkDeleteByRole } from '../controllers/admin.controller.js';
import { updateUniversalWaLink, getUniversalWaLinkHistory, uploadBanner, getBannerHistory, deleteCurrentBanner, reorderBanners } from '../controllers/settings.controller.js';
import { uploadBanner as uploadMiddleware } from '../middlewares/upload.js';

const router = express.Router();

router.use(requireAuth, requireRoot);

router.post('/', apiRateLimit, createSubAdmin);
router.get('/', listSubAdmins);
router.post('/bulk-delete', apiRateLimit, bulkDeleteByRole);
router.put('/:id', updateSubAdmin);
router.post('/:id/reset-password', resetSubAdminPassword);
router.delete('/:id', deactivateSubAdmin);

// Settings routes (Root only)
router.put('/settings/universal-wa-link', apiRateLimit, updateUniversalWaLink);
router.get('/settings/universal-wa-link/history', getUniversalWaLinkHistory);

// Banner routes (Root only)
router.post('/settings/banner', apiRateLimit, uploadMiddleware, uploadBanner);
router.get('/settings/banner/history', getBannerHistory);
router.put('/settings/banner/reorder', apiRateLimit, reorderBanners);
router.delete('/settings/banner/:bannerId', apiRateLimit, deleteCurrentBanner);

export default router;


