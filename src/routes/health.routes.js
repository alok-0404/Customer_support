/**
 * Health Routes
 */

import express from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = express.Router();

// GET /healthz
router.get('/', getHealth);

export default router;
