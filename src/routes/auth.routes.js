import express from 'express';
import { login, me, logout, changePassword, changeEmail } from '../controllers/auth.controller.js';
import { apiRateLimit } from '../middlewares/rateLimit.js';
import { requireAuth, requireRoot } from '../middlewares/auth.js';

const router = express.Router();

// Rate limit auth endpoints
router.post('/login', apiRateLimit, login);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);
router.post('/change-password', requireAuth, requireRoot, changePassword);
router.post('/change-email', requireAuth, requireRoot, changeEmail);

export default router;


