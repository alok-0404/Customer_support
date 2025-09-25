/**
 * WhatsApp Intents Routes (admin)
 */

import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { listIntents, deleteIntents } from '../controllers/whatsappIntents.controller.js';

const router = express.Router();

// GET /api/whatsapp-intents?userId=...&page=1&limit=50
const listSchema = z.object({
  query: z.object({
    userId: z.string().max(200).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional()
  })
});
router.get('/', validate(listSchema), listIntents);

// DELETE /api/whatsapp-intents?userId=... OR /api/whatsapp-intents?all=true
const deleteSchema = z.object({
  query: z.object({
    userId: z.string().max(200).optional(),
    all: z.enum(['true']).optional()
  })
});
router.delete('/', validate(deleteSchema), deleteIntents);

export default router;


