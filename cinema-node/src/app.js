// src/app.js
// =============================================
// EXPRESS APPLICATION FACTORY
// Khởi tạo Express app, gắn tất cả middleware
// toàn cục, và mount tất cả route modules.
// Socket.io được inject sau từ server.js.
// =============================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import priceRuleRoutes  from './modules/price-rule/price-rule.routes.js';
import voucherRoutes    from './modules/voucher/voucher.routes.js';
import loyaltyRoutes    from './modules/loyalty/loyalty.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import voiceBookingRoutes from './modules/voice-booking/voice-booking.routes.js';
import securityRoutes    from './modules/security/security.routes.js';
import auditRoutes       from './modules/audit/audit.routes.js';
import branchRoutes      from './modules/branch/branch.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ── SECURITY MIDDLEWARE ───────────────────────────────────────────
// Helmet: bảo vệ HTTP headers (XSS, clickjacking, MIME sniffing, ...)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate Limiting: Chống brute-force cho auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 phút
  max: 100,                   // Tối đa 100 request/IP để dev thoải mái test
  message: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  standardHeaders: true,
});

// Rate Limiting: Chống spam AI Voice/Chat (bảo vệ hạn mức Gemini API)
const voiceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 phút
  max: 10,                    // Tối đa 10 câu chat/phút/user
  message: { message: 'Bạn chat quá nhanh. Vui lòng đợi 1 phút.' },
  standardHeaders: true,
  keyGenerator: (req) => `voice_${req.user?.id || req.ip}`,
});

// Rate Limiting: Chống spam đặt vé
const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { message: 'Tối đa 5 lần đặt vé mỗi phút.' },
  standardHeaders: true,
});

// ── GLOBAL MIDDLEWARE ──────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);

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

// Auth (rate limited: chống brute-force)
app.use(`${API}/auth`, authLimiter, authRoutes);

// Movie routes (public + admin đều nằm trong movie.routes.js)
app.use(API, movieRoutes);

// Dynamic Pricing Engine (PHẢI mount TRƯỚC showtimeRoutes vì /public/showtimes/:id sẽ catch-all)
app.use(API, priceRuleRoutes);

// Admin resource routes
app.use(`${API}/admin/rooms`,      roomRoutes);
app.use(`${API}/admin/seats`,      seatRoutes);
app.use(API,                       showtimeRoutes);
app.use(`${API}/admin/statistics`, statisticRoutes);
app.use(`${API}/admin/dashboard`,  dashboardRoutes);
app.use(`${API}/admin/users`,      userAdminRoutes);
app.use(`${API}/admin/audit`,      auditRoutes);

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

// Branches (public list + admin CRUD)
app.use(API, branchRoutes);

// Voucher Engine (customer validate + admin CRUD)
app.use(API, voucherRoutes);

// Loyalty / Membership (customer dashboard + admin tier config)
app.use(API, loyaltyRoutes);

// Notification Center (customer bell + realtime)
app.use(API, notificationRoutes);

// Voice Booking (Gemini AI) — rate limited
app.use(`${API}/customer/voice-booking`, voiceLimiter);
app.use(API, voiceBookingRoutes);

// Security / Passcode (customer)
app.use(`${API}/customer/security`, securityRoutes);

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
