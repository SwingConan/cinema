-- ========================================================
-- Phase 3 demo seed: multi-branch data for visual testing
-- Safe to re-run: uses INSERT IGNORE / WHERE NOT EXISTS.
-- ========================================================

SET @hcm       := CONVERT(UNHEX('48E1BB93204368C3AD204D696E68') USING utf8mb4);
SET @hanoi     := CONVERT(UNHEX('48C3A0204EE1BB9969') USING utf8mb4);
SET @danang    := CONVERT(UNHEX('C490C3A0204EE1BAB56E67') USING utf8mb4);
SET @cantho    := CONVERT(UNHEX('43E1BAA76E205468C6A1') USING utf8mb4);
SET @haiphong  := CONVERT(UNHEX('48E1BAA369205068C3B26E67') USING utf8mb4);
SET @khanhhoa  := CONVERT(UNHEX('4B68C3A16E682048C3B261') USING utf8mb4);
SET @dongnai   := CONVERT(UNHEX('C490E1BB936E67204E6169') USING utf8mb4);
SET @tayninh   := CONVERT(UNHEX('54C3A279204E696E68') USING utf8mb4);
SET @lamdong   := CONVERT(UNHEX('4CC3A26D20C490E1BB936E67') USING utf8mb4);
SET @hue       := CONVERT(UNHEX('4875E1BABF') USING utf8mb4);

-- Normalize any previously malformed HCM city names.
UPDATE branches
SET city = @hcm
WHERE city IN ('Ho Chi Minh', 'TP.HCM', 'TP Ho Chi Minh', 'HCM', 'H??? Ch?? Minh');

-- Branches across provinces/cities.
INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Ha Noi Center', '72 Tran Duy Hung, Cau Giay', @hanoi, '02473001234', 'hanoi.center@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Ha Noi Center');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Da Nang Riverside', '1 Bach Dang, Hai Chau', @danang, '02367300123', 'danang.riverside@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Da Nang Riverside');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Can Tho Ninh Kieu', '30 Hai Ba Trung, Ninh Kieu', @cantho, '02927300123', 'cantho.ninhkieu@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Can Tho Ninh Kieu');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Hai Phong Harbor', '2 Le Hong Phong, Ngo Quyen', @haiphong, '02257300123', 'haiphong.harbor@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Hai Phong Harbor');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Nha Trang Beach', '86 Tran Phu, Nha Trang', @khanhhoa, '02587300123', 'nhatrang.beach@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Nha Trang Beach');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS HCM Landmark', '720A Dien Bien Phu, Binh Thanh', @hcm, '02873005678', 'hcm.landmark@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS HCM Landmark');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Dong Nai Bien Hoa', '25 Vo Thi Sau, Bien Hoa', @dongnai, '02517300123', 'dongnai.bienhoa@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Dong Nai Bien Hoa');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Tay Ninh Plaza', '11 Cach Mang Thang Tam, Tay Ninh', @tayninh, '02767300123', 'tayninh.plaza@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Tay Ninh Plaza');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Da Lat Hills', '3 Le Dai Hanh, Da Lat', @lamdong, '02637300123', 'dalat.hills@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Da Lat Hills');

INSERT INTO branches (name, address, city, phone, email, status)
SELECT 'CinemaMS Hue Citadel', '18 Le Loi, Hue', @hue, '02347300123', 'hue.citadel@cinemams.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'CinemaMS Hue Citadel');

-- Rooms. Room names are globally unique in this schema, so each room is prefixed.
INSERT IGNORE INTO rooms (branch_id, name, type, total_seats, created_at, updated_at)
SELECT b.id, room_name, room_type, total_seats, NOW(), NOW()
FROM branches b
JOIN (
  SELECT 'CinemaMS Ha Noi Center' branch_name, 'HN - Screen 1 IMAX' room_name, 'IMAX' room_type, 96 total_seats UNION ALL
  SELECT 'CinemaMS Ha Noi Center', 'HN - Screen 2 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Da Nang Riverside', 'DN - Screen 1 4DX', '4DX', 96 UNION ALL
  SELECT 'CinemaMS Da Nang Riverside', 'DN - Screen 2 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Can Tho Ninh Kieu', 'CT - Screen 1 3D', '3D', 96 UNION ALL
  SELECT 'CinemaMS Can Tho Ninh Kieu', 'CT - Screen 2 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Hai Phong Harbor', 'HP - Screen 1 IMAX', 'IMAX', 96 UNION ALL
  SELECT 'CinemaMS Hai Phong Harbor', 'HP - Screen 2 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Nha Trang Beach', 'NT - Screen 1 3D', '3D', 96 UNION ALL
  SELECT 'CinemaMS Nha Trang Beach', 'NT - Screen 2 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS HCM Landmark', 'HCM Landmark - Screen 1 4DX', '4DX', 96 UNION ALL
  SELECT 'CinemaMS HCM Landmark', 'HCM Landmark - Screen 2 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Dong Nai Bien Hoa', 'DNai - Screen 1 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Dong Nai Bien Hoa', 'DNai - Screen 2 3D', '3D', 96 UNION ALL
  SELECT 'CinemaMS Tay Ninh Plaza', 'TN - Screen 1 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Tay Ninh Plaza', 'TN - Screen 2 IMAX', 'IMAX', 96 UNION ALL
  SELECT 'CinemaMS Da Lat Hills', 'DL - Screen 1 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Da Lat Hills', 'DL - Screen 2 3D', '3D', 96 UNION ALL
  SELECT 'CinemaMS Hue Citadel', 'HUE - Screen 1 2D', '2D', 64 UNION ALL
  SELECT 'CinemaMS Hue Citadel', 'HUE - Screen 2 IMAX', 'IMAX', 96
) demo_rooms ON demo_rooms.branch_name = b.name;

-- Seats for new demo rooms only.
INSERT INTO seats (room_id, `row`, `column`, type, status, created_at, updated_at)
WITH RECURSIVE nums AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM nums WHERE n < 12
),
rows_map AS (
  SELECT 'A' AS row_label, 1 AS row_no UNION ALL
  SELECT 'B', 2 UNION ALL
  SELECT 'C', 3 UNION ALL
  SELECT 'D', 4 UNION ALL
  SELECT 'E', 5 UNION ALL
  SELECT 'F', 6 UNION ALL
  SELECT 'G', 7 UNION ALL
  SELECT 'H', 8
)
SELECT r.id, rows_map.row_label, nums.n,
       CASE
         WHEN rows_map.row_no <= 3 THEN 'regular'
         WHEN rows_map.row_no <= 6 THEN 'vip'
         ELSE 'couple'
       END,
       'available', NOW(), NOW()
FROM rooms r
JOIN rows_map
JOIN nums ON nums.n <= CASE WHEN r.total_seats >= 96 THEN 12 ELSE 8 END
WHERE r.name IN (
  'HN - Screen 1 IMAX', 'HN - Screen 2 2D',
  'DN - Screen 1 4DX', 'DN - Screen 2 2D',
  'CT - Screen 1 3D', 'CT - Screen 2 2D',
  'HP - Screen 1 IMAX', 'HP - Screen 2 2D',
  'NT - Screen 1 3D', 'NT - Screen 2 2D',
  'HCM Landmark - Screen 1 4DX', 'HCM Landmark - Screen 2 2D',
  'DNai - Screen 1 2D', 'DNai - Screen 2 3D',
  'TN - Screen 1 2D', 'TN - Screen 2 IMAX',
  'DL - Screen 1 2D', 'DL - Screen 2 3D',
  'HUE - Screen 1 2D', 'HUE - Screen 2 IMAX'
)
AND NOT EXISTS (SELECT 1 FROM seats existing WHERE existing.room_id = r.id);

-- Staff accounts by branch, all reuse the current demo staff password hash.
INSERT IGNORE INTO users (name, email, password, phone, role, branch_id, is_active, created_at, updated_at)
SELECT staff_name, staff_email, COALESCE((SELECT password FROM users WHERE email = 'staff@cinema.com' LIMIT 1), (SELECT password FROM users WHERE role = 'admin' LIMIT 1)),
       staff_phone, 'staff', b.id, 1, NOW(), NOW()
FROM branches b
JOIN (
  SELECT 'CinemaMS Ha Noi Center' branch_name, 'Staff Ha Noi' staff_name, 'staff.hanoi@cinema.com' staff_email, '0901000001' staff_phone UNION ALL
  SELECT 'CinemaMS Da Nang Riverside', 'Staff Da Nang', 'staff.danang@cinema.com', '0901000002' UNION ALL
  SELECT 'CinemaMS Can Tho Ninh Kieu', 'Staff Can Tho', 'staff.cantho@cinema.com', '0901000003' UNION ALL
  SELECT 'CinemaMS Hai Phong Harbor', 'Staff Hai Phong', 'staff.haiphong@cinema.com', '0901000004' UNION ALL
  SELECT 'CinemaMS Nha Trang Beach', 'Staff Nha Trang', 'staff.nhatrang@cinema.com', '0901000005' UNION ALL
  SELECT 'CinemaMS HCM Landmark', 'Staff HCM Landmark', 'staff.hcmlandmark@cinema.com', '0901000006' UNION ALL
  SELECT 'CinemaMS Dong Nai Bien Hoa', 'Staff Dong Nai', 'staff.dongnai@cinema.com', '0901000007' UNION ALL
  SELECT 'CinemaMS Tay Ninh Plaza', 'Staff Tay Ninh', 'staff.tayninh@cinema.com', '0901000008' UNION ALL
  SELECT 'CinemaMS Da Lat Hills', 'Staff Da Lat', 'staff.dalat@cinema.com', '0901000009' UNION ALL
  SELECT 'CinemaMS Hue Citadel', 'Staff Hue', 'staff.hue@cinema.com', '0901000010'
) staff_rows ON staff_rows.branch_name = b.name;

-- Per-branch concession inventory. New branches get meaningful stock differences.
INSERT IGNORE INTO branch_concessions (branch_id, concession_id, stock_quantity, status)
SELECT b.id, c.id, 120, IF(c.is_active = 1, 'available', 'unavailable')
FROM branches b
CROSS JOIN concessions c;

UPDATE branch_concessions bc
JOIN branches b ON b.id = bc.branch_id
JOIN concessions c ON c.id = bc.concession_id
SET bc.stock_quantity = CASE
      WHEN b.name = 'CinemaMS Ha Noi Center' THEN 220
      WHEN b.name = 'CinemaMS Da Nang Riverside' THEN IF(c.id = 5, 0, 140)
      WHEN b.name = 'CinemaMS Can Tho Ninh Kieu' THEN IF(c.id = 2, 8, 90)
      WHEN b.name = 'CinemaMS Hai Phong Harbor' THEN 110
      WHEN b.name = 'CinemaMS Nha Trang Beach' THEN IF(c.id = 4, 25, 180)
      WHEN b.name = 'CinemaMS HCM Landmark' THEN 260
      WHEN b.name = 'CinemaMS Dong Nai Bien Hoa' THEN 130
      WHEN b.name = 'CinemaMS Tay Ninh Plaza' THEN IF(c.id = 3, 15, 95)
      WHEN b.name = 'CinemaMS Da Lat Hills' THEN 105
      WHEN b.name = 'CinemaMS Hue Citadel' THEN IF(c.id = 1, 35, 100)
      ELSE bc.stock_quantity
    END,
    bc.status = CASE
      WHEN b.name = 'CinemaMS Da Nang Riverside' AND c.id = 5 THEN 'unavailable'
      ELSE 'available'
    END,
    bc.updated_at = NOW()
WHERE b.name IN (
  'CinemaMS Ha Noi Center', 'CinemaMS Da Nang Riverside', 'CinemaMS Can Tho Ninh Kieu',
  'CinemaMS Hai Phong Harbor', 'CinemaMS Nha Trang Beach', 'CinemaMS HCM Landmark',
  'CinemaMS Dong Nai Bien Hoa', 'CinemaMS Tay Ninh Plaza', 'CinemaMS Da Lat Hills', 'CinemaMS Hue Citadel'
);

-- Branch-local dynamic pricing rules.
INSERT INTO price_rules (branch_id, name, room_type, day_type, time_slot, seat_type, modifier_type, modifier_value, priority, is_active)
SELECT b.id, 'Ha Noi IMAX prime +10%', 'IMAX', NULL, 'evening', NULL, 'percentage', 10.00, 4, 1
FROM branches b
WHERE b.name = 'CinemaMS Ha Noi Center'
  AND NOT EXISTS (SELECT 1 FROM price_rules WHERE name = 'Ha Noi IMAX prime +10%');

INSERT INTO price_rules (branch_id, name, room_type, day_type, time_slot, seat_type, modifier_type, modifier_value, priority, is_active)
SELECT b.id, 'Da Nang weekday afternoon -5%', NULL, 'weekday', 'afternoon', NULL, 'percentage', -5.00, 4, 1
FROM branches b
WHERE b.name = 'CinemaMS Da Nang Riverside'
  AND NOT EXISTS (SELECT 1 FROM price_rules WHERE name = 'Da Nang weekday afternoon -5%');

INSERT INTO price_rules (branch_id, name, room_type, day_type, time_slot, seat_type, modifier_type, modifier_value, priority, is_active)
SELECT b.id, 'Can Tho morning -15%', NULL, NULL, 'morning', NULL, 'percentage', -15.00, 4, 1
FROM branches b
WHERE b.name = 'CinemaMS Can Tho Ninh Kieu'
  AND NOT EXISTS (SELECT 1 FROM price_rules WHERE name = 'Can Tho morning -15%');

INSERT INTO price_rules (branch_id, name, room_type, day_type, time_slot, seat_type, modifier_type, modifier_value, priority, is_active)
SELECT b.id, 'Nha Trang weekend beach deal -5%', NULL, 'weekend', NULL, NULL, 'percentage', -5.00, 4, 1
FROM branches b
WHERE b.name = 'CinemaMS Nha Trang Beach'
  AND NOT EXISTS (SELECT 1 FROM price_rules WHERE name = 'Nha Trang weekend beach deal -5%');

INSERT INTO price_rules (branch_id, name, room_type, day_type, time_slot, seat_type, modifier_type, modifier_value, priority, is_active)
SELECT b.id, 'Hue weekday student -10%', NULL, 'weekday', NULL, 'regular', 'percentage', -10.00, 4, 1
FROM branches b
WHERE b.name = 'CinemaMS Hue Citadel'
  AND NOT EXISTS (SELECT 1 FROM price_rules WHERE name = 'Hue weekday student -10%');

INSERT INTO price_rules (branch_id, name, room_type, day_type, time_slot, seat_type, modifier_type, modifier_value, priority, is_active)
SELECT b.id, 'Da Lat morning chill -8%', NULL, NULL, 'morning', NULL, 'percentage', -8.00, 4, 1
FROM branches b
WHERE b.name = 'CinemaMS Da Lat Hills'
  AND NOT EXISTS (SELECT 1 FROM price_rules WHERE name = 'Da Lat morning chill -8%');

-- Branch-local vouchers.
INSERT INTO vouchers (branch_id, code, name, description, discount_type, discount_value, max_discount, min_order, usage_limit, per_user_limit, valid_from, valid_to, applicable_days, is_active)
SELECT b.id, 'HANOI30', 'Ha Noi opening 30%', 'Branch-local campaign for Ha Noi Center', 'percentage', 30.00, 90000, 120000, 300, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, 1
FROM branches b
WHERE b.name = 'CinemaMS Ha Noi Center'
  AND NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'HANOI30');

INSERT INTO vouchers (branch_id, code, name, description, discount_type, discount_value, max_discount, min_order, usage_limit, per_user_limit, valid_from, valid_to, applicable_days, is_active)
SELECT b.id, 'DANANG20', 'Da Nang riverside 20%', 'Branch-local campaign for Da Nang Riverside', 'percentage', 20.00, 70000, 100000, 250, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, 1
FROM branches b
WHERE b.name = 'CinemaMS Da Nang Riverside'
  AND NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'DANANG20');

INSERT INTO vouchers (branch_id, code, name, description, discount_type, discount_value, max_discount, min_order, usage_limit, per_user_limit, valid_from, valid_to, applicable_days, is_active)
SELECT b.id, 'CANTHO25K', 'Can Tho 25K off', 'Fixed discount for Can Tho Ninh Kieu', 'fixed', 25000.00, NULL, 80000, 300, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, 1
FROM branches b
WHERE b.name = 'CinemaMS Can Tho Ninh Kieu'
  AND NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'CANTHO25K');

INSERT INTO vouchers (branch_id, code, name, description, discount_type, discount_value, max_discount, min_order, usage_limit, per_user_limit, valid_from, valid_to, applicable_days, is_active)
SELECT b.id, 'NTBEACH15', 'Nha Trang beach 15%', 'Branch-local campaign for Nha Trang Beach', 'percentage', 15.00, 60000, 100000, 200, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, 1
FROM branches b
WHERE b.name = 'CinemaMS Nha Trang Beach'
  AND NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'NTBEACH15');

INSERT INTO vouchers (branch_id, code, name, description, discount_type, discount_value, max_discount, min_order, usage_limit, per_user_limit, valid_from, valid_to, applicable_days, is_active)
SELECT b.id, 'DONGNAI50K', 'Dong Nai 50K off', 'Fixed discount for Dong Nai Bien Hoa', 'fixed', 50000.00, NULL, 150000, 250, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, 1
FROM branches b
WHERE b.name = 'CinemaMS Dong Nai Bien Hoa'
  AND NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'DONGNAI50K');

INSERT INTO vouchers (branch_id, code, name, description, discount_type, discount_value, max_discount, min_order, usage_limit, per_user_limit, valid_from, valid_to, applicable_days, is_active)
SELECT b.id, 'HUE10', 'Hue citadel 10%', 'Branch-local campaign for Hue Citadel', 'percentage', 10.00, 50000, 90000, 200, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), NULL, 1
FROM branches b
WHERE b.name = 'CinemaMS Hue Citadel'
  AND NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'HUE10');

-- Showtimes for the next 7 days on demo rooms, four slots per day.
INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price_regular, price_vip, price_couple, format, created_at, updated_at)
WITH RECURSIVE day_offsets AS (
  SELECT 0 AS day_offset
  UNION ALL
  SELECT day_offset + 1 FROM day_offsets WHERE day_offset < 6
),
slot_defs AS (
  SELECT 1 AS slot_no, TIME('09:30:00') AS slot_time UNION ALL
  SELECT 2, TIME('13:30:00') UNION ALL
  SELECT 3, TIME('17:30:00') UNION ALL
  SELECT 4, TIME('21:30:00')
),
active_movies AS (
  SELECT id, duration, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM movies
  WHERE status = 'now_showing'
),
movie_count AS (
  SELECT COUNT(*) AS cnt FROM active_movies
),
demo_rooms AS (
  SELECT id, type
  FROM rooms
  WHERE name IN (
    'HN - Screen 1 IMAX', 'HN - Screen 2 2D',
    'DN - Screen 1 4DX', 'DN - Screen 2 2D',
    'CT - Screen 1 3D', 'CT - Screen 2 2D',
    'HP - Screen 1 IMAX', 'HP - Screen 2 2D',
    'NT - Screen 1 3D', 'NT - Screen 2 2D',
    'HCM Landmark - Screen 1 4DX', 'HCM Landmark - Screen 2 2D',
    'DNai - Screen 1 2D', 'DNai - Screen 2 3D',
    'TN - Screen 1 2D', 'TN - Screen 2 IMAX',
    'DL - Screen 1 2D', 'DL - Screen 2 3D',
    'HUE - Screen 1 2D', 'HUE - Screen 2 IMAX'
  )
)
SELECT m.id,
       r.id,
       TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY), s.slot_time) AS start_time,
       DATE_ADD(TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY), s.slot_time), INTERVAL (m.duration + 15) MINUTE) AS end_time,
       CASE r.type WHEN 'IMAX' THEN 110000 WHEN '4DX' THEN 120000 WHEN '3D' THEN 95000 ELSE 75000 END AS price_regular,
       CASE r.type WHEN 'IMAX' THEN 145000 WHEN '4DX' THEN 155000 WHEN '3D' THEN 120000 ELSE 95000 END AS price_vip,
       CASE r.type WHEN 'IMAX' THEN 260000 WHEN '4DX' THEN 280000 WHEN '3D' THEN 220000 ELSE 180000 END AS price_couple,
       CASE r.type WHEN 'IMAX' THEN 'IMAX 2D' WHEN '4DX' THEN '4DX 2D' WHEN '3D' THEN '3D Phu de' ELSE '2D Phu de' END AS format,
       NOW(),
       NOW()
FROM demo_rooms r
JOIN day_offsets d
JOIN slot_defs s
JOIN movie_count mc
JOIN active_movies m ON m.rn = 1 + MOD(r.id + d.day_offset + s.slot_no, mc.cnt)
WHERE mc.cnt > 0
  AND NOT EXISTS (
    SELECT 1
    FROM showtimes existing
    WHERE existing.room_id = r.id
      AND existing.start_time = TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL d.day_offset DAY), s.slot_time)
  );
