import express from 'express';
import { find, findById, update, getDB } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 1. Get User Notifications & Unread Counts per Module
router.get('/', authenticate, (req, res) => {
  const notifications = find('notifications', { user_id: req.user.id }) || [];
  
  const unread = notifications.filter(n => !n.is_read);
  
  // Group unread count by moduleKey (e.g. { PROFILE: 1, REPORT: 2, OFFER: 1 })
  const moduleUnreadMap = {};
  unread.forEach(n => {
    moduleUnreadMap[n.module_key] = (moduleUnreadMap[n.module_key] || 0) + 1;
  });

  res.json({
    total_unread: unread.length,
    module_unread_map: moduleUnreadMap,
    notifications: notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  });
});

// 2. Mark Notification as Read
router.post('/:id/read', authenticate, (req, res) => {
  const notif = findById('notifications', req.params.id);
  if (!notif || notif.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  const updated = update('notifications', notif.id, { is_read: true });
  res.json({ message: 'Notification marked as read', notification: updated });
});

// 3. Mark All for a Module as Read (e.g., when visiting that page)
router.post('/mark-module-read', authenticate, (req, res) => {
  const { module_key } = req.body;
  if (!module_key) return res.status(400).json({ error: 'Module key required' });

  const notifications = find('notifications', { user_id: req.user.id, module_key, is_read: false }) || [];
  notifications.forEach(n => {
    update('notifications', n.id, { is_read: true });
  });

  res.json({ message: `All notifications for ${module_key} marked as read.` });
});

export default router;
