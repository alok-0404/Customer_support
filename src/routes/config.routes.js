/**
 * Config Routes
 */

import express from 'express';
import { getSupportConfig } from '../controllers/config.controller.js';

const router = express.Router();

// GET /api/config/support
router.get('/support', getSupportConfig);

export default router;
