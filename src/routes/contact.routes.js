/**
 * Contact Routes
 */

import express from 'express';
import { z } from 'zod';
import { createContact } from '../controllers/contact.controller.js';
import { validate } from '../middlewares/validate.js';
import { contactRateLimit } from '../middlewares/rateLimit.js';

const router = express.Router();

// Zod schema for contact form validation
const contactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    message: z.string().min(5, 'Message must be at least 5 characters long')
  })
});

// POST /api/contact
router.post('/', contactRateLimit, validate(contactSchema), createContact);

export default router;
