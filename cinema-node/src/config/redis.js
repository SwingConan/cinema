// src/config/redis.js
// =============================================
// REDIS CLIENT — Dùng ioredis để thao tác
// SET/GET/DEL trực tiếp (lưu OTP tạm thời).
// BullMQ dùng config riêng trong email.worker.js.
// =============================================
import Redis from 'ioredis';

const redisClient = new Redis({
  host:     process.env.REDIS_HOST     || '127.0.0.1',
  port:     Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,  // Không connect ngay, connect khi dùng lần đầu
});

redisClient.on('connect', () => {
  console.log('[Redis] ✅ Kết nối Redis thành công.');
});

redisClient.on('error', (err) => {
  console.error('[Redis] ❌ Lỗi kết nối Redis:', err.message);
});

export default redisClient;
