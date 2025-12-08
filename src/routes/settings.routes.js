/**
 * Settings Routes
 * Public routes for fetching settings
 */

import express from 'express';
import { getUniversalWaLink, getCurrentBanner } from '../controllers/settings.controller.js';

const router = express.Router();

// Public routes - no auth required (for frontend)
router.get('/universal-wa-link', getUniversalWaLink);
router.get('/banner', getCurrentBanner);

export default router;

