/**
 * WhatsApp Redirect Routes
 */

import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { redirectToWhatsApp, smartRedirectPage } from '../controllers/whatsapp.controller.js';

const router = express.Router();

// Validation schema: require number; optional text and source
const redirectQuerySchema = z.object({
  query: z.object({
    number: z.string().min(7, 'Valid phone is required'),
    text: z.string().max(1000).optional(),
    source: z.string().max(100).optional()
  })
});

// GET /go/whatsapp?number=...&text=...&source=...
router.get('/', validate(redirectQuerySchema), redirectToWhatsApp);

// Smart page: supports optional backup and timeoutMs
const smartQuerySchema = z.object({
  query: z.object({
    number: z.string().min(7, 'Valid phone is required'),
    backup: z.union([z.string().min(7), z.array(z.string().min(7))]).optional(),
    text: z.string().max(1000).optional(),
    source: z.string().max(100).optional(),
    timeoutMs: z.string().regex(/^\d+$/).optional()
  })
});

// GET /go/whatsapp/smart?number=...&backup=...&text=...&timeoutMs=3000
router.get('/smart', validate(smartQuerySchema), smartRedirectPage);

export default router;


