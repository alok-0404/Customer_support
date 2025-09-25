/**
 * WhatsApp Redirect Routes
 */

import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { redirectToWhatsApp, smartRedirectPage, redirectToWaShortLink } from '../controllers/whatsapp.controller.js';

const router = express.Router();

// Validation schema: require number; optional text, source, userId
const redirectQuerySchema = z.object({
  query: z.object({
    number: z.string().min(7, 'Valid phone is required'),
    text: z.string().max(1000).optional(),
    source: z.string().max(100).optional(),
    userId: z.string().max(200).optional()
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
    userId: z.string().max(200).optional(),
    timeoutMs: z.string().regex(/^\d+$/).optional()
  })
});

// GET /go/whatsapp/smart?number=...&backup=...&text=...&timeoutMs=3000
router.get('/smart', validate(smartQuerySchema), smartRedirectPage);

// Accept a WhatsApp link and redirect
const linkQuerySchema = z.object({
  query: z.object({
    url: z.string().url('Valid URL is required').refine(u => /^(https?:\/\/)?(wa\.link|wa\.me|api\.whatsapp\.com)\//.test(u), 'URL must be a WhatsApp link'),
    source: z.string().max(100).optional(),
    userId: z.string().max(200).optional()
  })
});

// GET /go/whatsapp/link?url=...&source=...
router.get('/link', validate(linkQuerySchema), redirectToWaShortLink);

export default router;


