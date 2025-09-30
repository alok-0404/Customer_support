/**
 * Branches Routes
 */

import express from 'express';
import { listBranches } from '../controllers/branch.controller.js';

const router = express.Router();

// GET /branches?page=1&limit=10
router.get('/', listBranches);

export default router;


