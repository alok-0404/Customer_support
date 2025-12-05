/**
 * Settings Routes
 * Public routes for fetching settings
 */

import express from 'express';
import { getUniversalWaLink } from '../controllers/settings.controller.js';

const router = express.Router();

// Public route - no auth required (for frontend)
router.get('/universal-wa-link', getUniversalWaLink);

export default router;

