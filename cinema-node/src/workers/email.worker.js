// src/workers/email.worker.js
// =============================================
// EMAIL QUEUE WORKER (BullMQ + Redis)
//
// Kiến trúc:
//   - emailQueue  : Hàng đợi nhận Job (push từ nhiều nơi)
//   - emailWorker : Worker chạy ngầm, pop Job và gọi hàm email tương ứng
//
// Job types:
//   - sendTicket          : Gửi E-Ticket sau thanh toán
//   - sendVerificationOTP : Gửi OTP xác thực email đăng ký
//   - sendResetOTP        : Gửi OTP quên mật khẩu (dùng cho prompt 2)
// =============================================
import { Queue, Worker } from 'bullmq';
import { sendTicketEmail, sendOTPEmail } from '../services/email.service.js';

// ── Cấu hình Redis connection ────────────────────────────────────────────
const isUpstash = (process.env.REDIS_HOST && process.env.REDIS_HOST.includes('upstash.io')) || process.env.REDIS_TLS === 'true';

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  ...(isUpstash ? { tls: {} } : {})
};

// ── Khởi tạo Queue ───────────────────────────────────────────────────────
export const emailQueue = new Queue('emailQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:  3,          // Tự retry tối đa 3 lần nếu thất bại
    backoff: {
      type:  'exponential',
      delay: 5000,         // Lần 1 chờ 5s, lần 2: 10s, lần 3: 20s
    },
    removeOnComplete: { count: 100 },  // Giữ 100 job hoàn thành gần nhất
    removeOnFail:     { count: 50  },  // Giữ 50 job lỗi gần nhất để debug
  },
});

// ── Khởi tạo Worker ──────────────────────────────────────────────────────
const emailWorker = new Worker('emailQueue', async (job) => {
  // ── Dispatch theo job.name ────────────────────────────────────────────
  if (job.name === 'sendTicket') {
    const { email, qrCode, ticketDetails, bookingId } = job.data;
    console.log(`[EmailWorker] ▶ Job #${job.id} [sendTicket] → E-Ticket #${bookingId} tới ${email}`);
    if (!email) throw new Error(`Job #${job.id}: Thiếu email.`);
    await sendTicketEmail(email, qrCode, { ...ticketDetails, bookingId });
    return;
  }

  if (job.name === 'sendVerificationOTP') {
    const { email, name, otp } = job.data;
    console.log(`[EmailWorker] ▶ Job #${job.id} [sendVerificationOTP] → OTP tới ${email}`);
    await sendOTPEmail({
      toEmail: email, name, otp,
      subject: '🔐 Mã OTP Xác Nhận Đăng Ký Tài Khoản',
      heading: 'Xác Nhận Đăng Ký',
      bodyText: 'Bạn đang đăng ký tài khoản Cinema. Hãy nhập mã OTP bên dưới để hoàn tất đăng ký. Mã có hiệu lực trong <strong>10 phút</strong>.',
    });
    return;
  }

  if (job.name === 'sendResetOTP') {
    const { email, name, otp } = job.data;
    console.log(`[EmailWorker] ▶ Job #${job.id} [sendResetOTP] → OTP tới ${email}`);
    await sendOTPEmail({
      toEmail: email, name, otp,
      subject: '🔑 Mã OTP Khôi Phục Mật Khẩu',
      heading: 'Đặt Lại Mật Khẩu',
      bodyText: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu. Nhập mã OTP bên dưới trong <strong>10 phút</strong> để tiếp tục.',
    });
    return;
  }

  // Fallback: job cũ không có name (backward compat với sendTicket cũ)
  const { email, qrCode, ticketDetails, bookingId } = job.data;
  console.log(`[EmailWorker] ▶ Job #${job.id} [legacy] → E-Ticket #${bookingId} tới ${email}`);
  if (!email) throw new Error(`Job #${job.id}: Thiếu email.`);
  await sendTicketEmail(email, qrCode, { ...ticketDetails, bookingId });

}, { connection: redisConnection, concurrency: 5 });  // Xử lý tối đa 5 job đồng thời


// ── Event Listeners ──────────────────────────────────────────────────────
emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] ✅ Job #${job.id} hoàn tất — E-Ticket #${job.data.bookingId} đã gửi.`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] ❌ Job #${job?.id} thất bại (lần ${job?.attemptsMade}/${job?.opts?.attempts}): ${err.message}`);
});

emailWorker.on('error', (err) => {
  console.error('[EmailWorker] ❌ Worker gặp lỗi không xác định:', err.message);
});

// ── Log khi Queue sẵn sàng ───────────────────────────────────────────────
emailQueue.on('waiting', (jobId) => {
  console.log(`[EmailQueue] 📬 Job #${jobId} đang chờ xử lý.`);
});

console.log('[EmailWorker] ✅ Email Queue Worker đã khởi động, lắng nghe Redis...');
