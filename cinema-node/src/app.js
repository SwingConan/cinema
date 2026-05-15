// src/app.js
// =============================================
// EXPRESS APPLICATION FACTORY
// Khởi tạo Express app, gắn tất cả middleware
// toàn cục, và mount tất cả route modules.
// Socket.io được inject sau từ server.js.
// =============================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Route imports
import authRoutes       from './modules/auth/auth.routes.js';
import movieRoutes      from './modules/movie/movie.routes.js';
import roomRoutes       from './modules/room/room.routes.js';
import seatRoutes       from './modules/seat/seat.routes.js';
import showtimeRoutes   from './modules/showtime/showtime.routes.js';
import bookingRoutes    from './modules/booking/booking.routes.js';
import seatLockRoutes   from './modules/seat-lock/seat-lock.routes.js';
import paymentRoutes    from './modules/payment/payment.routes.js';
import reviewRoutes     from './modules/review/review.routes.js';
import profileRoutes    from './modules/profile/profile.routes.js';
import checkinRoutes    from './modules/checkin/checkin.routes.js';
import statisticRoutes  from './modules/statistic/statistic.routes.js';
import webhookRoutes    from './modules/webhook/webhook.routes.js';
import concessionRoutes from './modules/concession/concession.routes.js';
import dashboardRoutes  from './modules/admin/dashboard.routes.js';
import userAdminRoutes  from './modules/admin/user.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ── GLOBAL MIDDLEWARE ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files: poster images
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// ── HEALTH CHECK ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API ROUTES ────────────────────────────────────────────────────
const API = '/api';

// Auth
app.use(`${API}/auth`, authRoutes);

// Movie routes (public + admin đều nằm trong movie.routes.js)
app.use(API, movieRoutes);

// Admin resource routes
app.use(`${API}/admin/rooms`,      roomRoutes);
app.use(`${API}/admin/seats`,      seatRoutes);
app.use(API,                       showtimeRoutes);
app.use(`${API}/admin/statistics`, statisticRoutes);
app.use(`${API}/admin/dashboard`,  dashboardRoutes);
app.use(`${API}/admin/users`,      userAdminRoutes);

// Public showtime (đã được định nghĩa trong showtime.routes.js)

// Customer routes
app.use(`${API}/customer/bookings`,        bookingRoutes);
app.use(`${API}/customer/seats`,           seatLockRoutes);
app.use(`${API}/customer/payment`,         paymentRoutes);
app.use(`${API}/customer/profile`,         profileRoutes);

// Public payment return
app.use(`${API}/public/payment`,           paymentRoutes);

// Reviews (nested under movies)
app.use(`${API}/public/movies/:movieId/reviews`,   reviewRoutes);
app.use(`${API}/customer/movies/:movieId/reviews`, reviewRoutes);

// Staff
app.use(`${API}/staff/checkin`, checkinRoutes);

// Staff POS — Bán vé tại quầy
app.use(`${API}/staff/pos`, bookingRoutes);

// Concessions (public list + admin CRUD)
app.use(API, concessionRoutes);

// ── WEBHOOK (Không có auth — ngân hàng gọi trực tiếp) ────────────
// ⚠️ Mount TRƯỚC 404 handler
app.use(`${API}/webhooks`, webhookRoutes);

// ── 404 HANDLER ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại.` });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ message: err.message || 'Lỗi máy chủ nội bộ.' });
});

export default app;
