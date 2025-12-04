/**
 * Client Routes
 * All routes require authentication and SubAdmin role
 */

import express from 'express';
import { requireAuth, requireSubAdmin, requireSubAdminOrRoot, verifyClientOwnership } from '../middlewares/auth.js';
import * as clientController from '../controllers/client.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Client statistics (must come before /:clientId routes)
router.get('/stats', requireSubAdmin, clientController.getClientStats);

// Create new client (SubAdmin only)
router.post('/create', requireSubAdmin, clientController.createClient);

// List clients (SubAdmin: own clients, Root: all clients)
router.get('/', requireSubAdminOrRoot, clientController.listMyClients);

// Get specific client (SubAdmin: own clients, Root: all clients)
router.get('/:clientId', requireSubAdminOrRoot, verifyClientOwnership, clientController.getClient);

// Update client (SubAdmin: own clients, Root: all clients)
router.put('/:clientId', requireSubAdminOrRoot, verifyClientOwnership, clientController.updateClient);

// Delete/deactivate client (SubAdmin: own clients, Root: all clients)
router.delete('/:clientId', requireSubAdminOrRoot, verifyClientOwnership, clientController.deleteClient);

// Reset client password (only if belongs to current SubAdmin)
router.post('/:clientId/reset-password', requireSubAdmin, verifyClientOwnership, clientController.resetClientPassword);

export default router;

