import express from 'express';
import { find, insert } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/tickets', authenticate, (req, res) => {
  const tickets = find('support_tickets', { user_id: req.user.id }) || [];
  res.json(tickets);
});

router.post('/tickets', authenticate, (req, res) => {
  const { subject, category, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const ticket = insert('support_tickets', {
    user_id: req.user.id,
    subject,
    category: category || 'GENERAL',
    message,
    status: 'OPEN',
    response: null
  });

  res.status(201).json({
    message: 'Support ticket submitted. A coordinator will respond shortly.',
    ticket
  });
});

export default router;
