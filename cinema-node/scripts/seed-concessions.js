// scripts/seed-concessions.js
// =============================================
// SEEDER: Bắp Nước (Concessions)
// Chạy: node scripts/seed-concessions.js
//
// Tự động:
//   1. CREATE TABLE IF NOT EXISTS concessions
//   2. CREATE TABLE IF NOT EXISTS booking_concessions
//   3. Bơm dữ liệu mồi nếu bảng đang trống
// =============================================
import 'dotenv/config';
import pool from '../src/config/database.js';

// ── 1. DDL: Tạo bảng nếu chưa có ──────────────────────────────────────────
const CREATE_CONCESSIONS = `
  CREATE TABLE IF NOT EXISTS \`concessions\` (
    \`id\`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`name\`        VARCHAR(255)    NOT NULL,
    \`description\` TEXT            NULL,
    \`price\`       DECIMAL(12, 0)  NOT NULL,
    \`image\`       VARCHAR(500)    NULL COMMENT 'URL ảnh sản phẩm',
    \`is_active\`   TINYINT(1)      NOT NULL DEFAULT 1,
    \`created_at\`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_BOOKING_CONCESSIONS = `
  CREATE TABLE IF NOT EXISTS \`booking_concessions\` (
    \`id\`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`booking_id\`     BIGINT UNSIGNED NOT NULL,
    \`concession_id\`  BIGINT UNSIGNED NOT NULL,
    \`quantity\`       TINYINT UNSIGNED NOT NULL DEFAULT 1,
    \`price\`          DECIMAL(12, 0)  NOT NULL COMMENT 'Giá tại thời điểm mua (snapshot)',
    PRIMARY KEY (\`id\`),
    KEY \`idx_bc_booking\`    (\`booking_id\`),
    KEY \`idx_bc_concession\` (\`concession_id\`),
    CONSTRAINT \`fk_bc_booking\`
      FOREIGN KEY (\`booking_id\`)    REFERENCES \`bookings\`(\`id\`)     ON DELETE CASCADE,
    CONSTRAINT \`fk_bc_concession\`
      FOREIGN KEY (\`concession_id\`) REFERENCES \`concessions\`(\`id\`) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// ── 2. Dữ liệu mồi ────────────────────────────────────────────────────────
// Ảnh placeholder từ Unsplash (free-to-use, không cần API key)
const SEED_DATA = [
  {
    name:        'Combo Solo',
    description: 'Bắp rang bơ cỡ vừa + 1 ly nước ngọt — Lựa chọn lý tưởng cho 1 người.',
    price:       65000,
    image:       'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80',
  },
  {
    name:        'Combo Couple',
    description: 'Bắp rang bơ cỡ lớn + 2 ly nước ngọt — Dành cho cặp đôi đi cùng nhau.',
    price:       110000,
    image:       'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=80',
  },
  {
    name:        'Bắp Phô Mai',
    description: 'Bắp phủ phô mai tan chảy đặc biệt — Hương vị khác biệt, cực kỳ hấp dẫn.',
    price:       55000,
    image:       'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&q=80',
  },
  {
    name:        'Nước Ngọt Pepsi',
    description: 'Pepsi lon 330ml ướp lạnh.',
    price:       25000,
    image:       'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  },
  {
    name:        'Nước Suối Aquafina',
    description: 'Aquafina 500ml, mát lạnh sảng khoái.',
    price:       15000,
    image:       null,
  },
];

// ── MAIN ───────────────────────────────────────────────────────────────────
const run = async () => {
  console.log('\n🌱  [Seeder] Bắt đầu seed Bắp Nước (Concessions)...\n');

  const conn = await pool.getConnection();
  try {
    // Bước 1: Tạo bảng
    console.log('📋  Tạo bảng `concessions`...');
    await conn.query(CREATE_CONCESSIONS);
    console.log('    ✅ Bảng `concessions` đã sẵn sàng.\n');

    console.log('📋  Tạo bảng `booking_concessions`...');
    await conn.query(CREATE_BOOKING_CONCESSIONS);
    console.log('    ✅ Bảng `booking_concessions` đã sẵn sàng.\n');

    // Bước 2: Kiểm tra có dữ liệu chưa
    const [[{ count }]] = await conn.query('SELECT COUNT(*) AS count FROM concessions');
    console.log(`🔍  Kiểm tra dữ liệu: hiện có ${count} bản ghi trong \`concessions\`.`);

    if (Number(count) > 0) {
      console.log('\n⚠️   Bảng đã có dữ liệu — bỏ qua bước seeding để tránh trùng lặp.');
      console.log('    (Nếu muốn seed lại, hãy chạy: TRUNCATE TABLE concessions;)\n');
    } else {
      // Bước 3: Bơm dữ liệu
      console.log('\n🚀  Bơm dữ liệu mồi...');
      for (const item of SEED_DATA) {
        await conn.query(
          `INSERT INTO concessions (name, description, price, image, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
          [item.name, item.description, item.price, item.image]
        );
        console.log(`    ✔ Đã thêm: "${item.name}" — ${item.price.toLocaleString('vi-VN')}đ`);
      }
      console.log(`\n    🎉 Đã bơm ${SEED_DATA.length} món bắp nước thành công!`);
    }

    // Tổng kết
    const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM concessions');
    console.log(`\n📊  Tổng số món trong database: ${total} bản ghi.`);
    console.log('\n✅  [Seeder] Đã tạo bảng và bơm dữ liệu bắp nước thành công!\n');

  } catch (err) {
    console.error('\n❌  [Seeder] Lỗi xảy ra:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
    process.exit(0);
  }
};

run();
