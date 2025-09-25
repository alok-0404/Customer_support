/**
 * Updates Routes
 */

import express from 'express';
import { z } from 'zod';
import { getUpdates } from '../controllers/updates.controller.js';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Zod schema for updates query validation
const updatesQuerySchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});

// GET /api/updates
router.get('/', validate(updatesQuerySchema), getUpdates);

export default router;
