import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getNotifications, readNotification } from '../../controllers/user/notification.controller.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, readNotification);

export default router;
