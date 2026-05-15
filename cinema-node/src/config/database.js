// src/config/database.js
// =============================================
// DATABASE CONNECTION POOL
// Sử dụng mysql2/promise với Connection Pool.
// Pool tự động quản lý kết nối, tái sử dụng thay vì
// tạo mới mỗi request — hiệu năng cao hơn nhiều.
// =============================================
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'cinema_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  waitForConnections: true,
  connectionLimit: 100,   // Tối đa 10 kết nối đồng thời
  queueLimit: 0,    // Không giới hạn hàng chờ
  charset: 'utf8mb4',
  timezone: 'Z', // Phải là 'Z' vì MySQL đang chạy ở múi giờ UTC (Docker mặc định)
});

// Kiểm tra kết nối ngay khi khởi động
pool.getConnection()
  .then(conn => {
    console.log('[DB] ✅ MySQL Pool kết nối thành công!');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] ❌ Lỗi kết nối MySQL:', err.message);
    process.exit(1); // Dừng app nếu không kết nối được DB
  });

export default pool;
