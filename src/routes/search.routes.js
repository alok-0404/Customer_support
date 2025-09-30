/**
 * Search Routes
 */

import express from 'express';
import { searchByUserId, redirectByUserId } from '../controllers/search.controller.js';

const router = express.Router();

// GET /search?userId=AB123
router.get('/', searchByUserId);

// GET /search/redirect?userId=AB123
router.get('/redirect', redirectByUserId);

export default router;


