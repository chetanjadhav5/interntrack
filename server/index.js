import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { loadDB } from './db.js';
import { seedDatabase } from './seed.js';
import { verifySmtpConnection } from './services/emailService.js';

dotenv.config();

import authRouter from './routes/auth.js';
import studentRouter from './routes/student.js';
import facultyRouter from './routes/faculty.js';
import tnpRouter from './routes/tnp.js';
import companyRouter from './routes/company.js';
import adminRouter from './routes/admin.js';
import notificationsRouter from './routes/notifications.js';
import supportRouter from './routes/support.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  process.env.INSTANCE_IP ? `http://${process.env.INSTANCE_IP}:5173` : null,
  process.env.INSTANCE_IP ? `http://${process.env.INSTANCE_IP}` : null
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
      if (!origin || allowedOrigins.includes(origin) || origin.includes(process.env.INSTANCE_IP || '15.206.74.169')) {
        callback(null, true);
      } else {
        // In development/self-hosted mode, permit flexible origin access
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Database & Seed data if empty
const currentDB = loadDB();
if (!currentDB.users || currentDB.users.length === 0) {
  await seedDatabase();
}

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/tnp', tnpRouter);
app.use('/api/company', companyRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/support', supportRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Internship Connect Pro Backend API',
    instance_ip: process.env.INSTANCE_IP || '15.206.74.169',
    timestamp: new Date().toISOString()
  });
});

// Start Server listening on 0.0.0.0 (all interfaces)
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Internship Connect Pro API Server running on port ${PORT}`);
  console.log(`🌐 Public Instance IP: ${process.env.INSTANCE_IP || '15.206.74.169'}`);
  console.log(`🌐 Health check: http://${process.env.INSTANCE_IP || 'localhost'}:${PORT}/api/health`);
  console.log(`=======================================================`);
  await verifySmtpConnection();
});
