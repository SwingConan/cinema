// src/modules/showtime/showtime.service.js
import { ShowtimeRepository } from './showtime.repository.js';
import { MovieRepository } from '../movie/movie.repository.js';
import { PriceRuleRepository } from '../price-rule/price-rule.repository.js';

const getAll = async (page = 1, perPage = 20, branchId = null) => ShowtimeRepository.findAll(page, perPage, branchId);

const getById = async (id) => {
  const s = await ShowtimeRepository.findByIdWithSeatStatus(id);
  if (!s) { const e = new Error('Không tìm thấy suất chiếu.'); e.status = 404; throw e; }

  // ── Dynamic Pricing: tính giá thực tế cho từng loại ghế ──────────────
  const roomType = s.room?.type || '2D';
  const branchId = s.room?.branchId || s.room?.branch_id || s.room?.branch?.id || null;
  const [regPrice, vipPrice, copPrice] = await Promise.all([
    PriceRuleRepository.calculateDynamicPrice(Number(s.priceRegular), { roomType, startTime: s.startTime, seatType: 'regular', branchId }),
    PriceRuleRepository.calculateDynamicPrice(Number(s.priceVip),     { roomType, startTime: s.startTime, seatType: 'vip', branchId }),
    PriceRuleRepository.calculateDynamicPrice(Number(s.priceCouple),  { roomType, startTime: s.startTime, seatType: 'couple', branchId }),
  ]);

  s.priceRegular = regPrice.finalPrice;
  s.priceVip     = vipPrice.finalPrice;
  s.priceCouple  = copPrice.finalPrice;

  // Thu thập danh sách các quy tắc đã áp dụng (loại bỏ trùng lặp theo tên)
  const rulesMap = new Map();
  const allApplied = [
    ...(regPrice.appliedRules || []),
    ...(vipPrice.appliedRules || []),
    ...(copPrice.appliedRules || [])
  ];
  allApplied.forEach(r => {
    if (r.name) rulesMap.set(r.name, r);
  });
  s.appliedRules = Array.from(rulesMap.values());

  return s;
};

/**
 * Tính end_time = start_time + duration + 15 phút dọn dẹp
 */
const calcEndTime = (startTime, durationMinutes) => {
  // startTime có thể là string ('2026-05-01 10:00:00') hoặc Date object từ MySQL
  const start = startTime instanceof Date ? startTime : new Date(String(startTime).replace(' ', 'T'));
  if (isNaN(start.getTime())) throw Object.assign(new Error('start_time không hợp lệ.'), { status: 422 });
  start.setMinutes(start.getMinutes() + Number(durationMinutes) + 15);
  // Format: 'YYYY-MM-DD HH:MM:SS' (UTC offset-free cho MySQL)
  const pad = (n) => String(n).padStart(2, '0');
  return `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())} ${pad(start.getHours())}:${pad(start.getMinutes())}:${pad(start.getSeconds())}`;
};

const create = async (data) => {
  const movie = await MovieRepository.findById(data.movie_id || data.movieId);
  if (!movie) { const e = new Error('Không tìm thấy phim.'); e.status = 404; throw e; }

  const payload = {
    movieId:      movie.id,
    roomId:       data.room_id || data.roomId,
    startTime:    data.start_time || data.startTime,
    priceRegular: data.price_regular || data.priceRegular,
    priceVip:     data.price_vip || data.priceVip,
    priceCouple:  data.price_couple || data.priceCouple,
    format:       data.format,
  };
  payload.endTime = calcEndTime(payload.startTime, movie.duration);

  const overlap = await ShowtimeRepository.hasOverlap(payload.roomId, payload.startTime, payload.endTime);
  if (overlap) {
    const e = new Error(`Lỗi: Suất chiếu bị trùng thời gian trong phòng này. (${payload.startTime} → ${payload.endTime})`);
    e.status = 422; throw e;
  }

  return ShowtimeRepository.create(payload);
};

const update = async (id, data) => {
  const existing = await ShowtimeRepository.findById(id);
  if (!existing) { const e = new Error('Không tìm thấy suất chiếu.'); e.status = 404; throw e; }

  const movieId  = data.movie_id    || data.movieId    || existing.movieId;
  const startTime = data.start_time || data.startTime  || existing.startTime;
  const movie = await MovieRepository.findById(movieId);
  if (!movie) { const e = new Error('Không tìm thấy phim.'); e.status = 404; throw e; }

  const endTime = calcEndTime(startTime, movie.duration);
  const roomId  = data.room_id || data.roomId || existing.roomId;

  const overlap = await ShowtimeRepository.hasOverlap(roomId, startTime, endTime, id);
  if (overlap) {
    const e = new Error('Lỗi: Suất chiếu bị trùng thời gian trong phòng này.');
    e.status = 422; throw e;
  }

  return ShowtimeRepository.update(id, {
    movieId, roomId, startTime, endTime,
    priceRegular: data.price_regular || data.priceRegular,
    priceVip:     data.price_vip     || data.priceVip,
    priceCouple:  data.price_couple  || data.priceCouple,
    format:       data.format,
  });
};

const destroy = async (id) => {
  const existing = await ShowtimeRepository.findById(id);
  if (!existing) { const e = new Error('Không tìm thấy suất chiếu.'); e.status = 404; throw e; }
  const hasBookings = await ShowtimeRepository.hasActiveBookings(id);
  if (hasBookings) {
    const e = new Error('Không thể xóa! Suất chiếu này đã có khách hàng mua vé hợp lệ.');
    e.status = 422; throw e;
  }
  await ShowtimeRepository.destroy(id);
};

// ── Helper: format Date → 'YYYY-MM-DD HH:MM:SS' (UTC, cho MySQL) ─────────
const toMySQLDatetime = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} `
       + `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

/**
 * AUTO-GENERATE SHOWTIMES (Xếp lịch hàng loạt)
 *
 * Payload: { movieId, roomId, startDate, endDate, openTime, closeTime,
 *            priceRegular, priceVip, priceCouple, format, skipConflicts }
 *
 * skipConflicts = true  → bỏ qua suất bị trùng, tiếp tục insert phần còn lại
 * skipConflicts = false → ném lỗi ngay khi phát hiện trùng (default)
 */
const bulkGenerate = async (data) => {
  const {
    movieId, roomId,
    startDate, endDate,       // 'YYYY-MM-DD'
    openTime, closeTime,       // 'HH:MM'
    priceRegular, priceVip, priceCouple,
    format = 'Phòng thường',
    skipConflicts = true,      // mặc định: bỏ qua, không crash
  } = data;

  // ── Bước 1: Validate & lấy duration phim ────────────────────────────────
  const movie = await MovieRepository.findById(movieId);
  if (!movie) { const e = new Error('Không tìm thấy phim.'); e.status = 404; throw e; }
  const durationMin = Number(movie.duration); // phút
  if (!durationMin || durationMin <= 0) {
    const e = new Error('Phim không có thời lượng hợp lệ.'); e.status = 422; throw e;
  }

  // Validate giá
  if (!priceRegular || !priceVip || !priceCouple) {
    const e = new Error('Vui lòng nhập đủ giá vé (Thường, VIP, Couple).'); e.status = 422; throw e;
  }

  // ── Bước 2: Parse startDate / endDate sang UTC midnight ─────────────────
  // Input: 'YYYY-MM-DD' (local date string từ browser)
  // Xử lý an toàn bằng cách gắn T00:00:00Z để tránh lệch múi giờ
  const dayStart = new Date(`${startDate}T00:00:00Z`);
  const dayEnd   = new Date(`${endDate}T00:00:00Z`);
  if (isNaN(dayStart) || isNaN(dayEnd) || dayStart > dayEnd) {
    const e = new Error('startDate / endDate không hợp lệ.'); e.status = 422; throw e;
  }

  // Parse openTime / closeTime → số phút từ 00:00
  const parseTimeToMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) throw Object.assign(new Error('Giờ mở/đóng cửa không hợp lệ.'), { status: 422 });
    return h * 60 + m;
  };
  const openMin  = parseTimeToMinutes(openTime);
  const closeMin = parseTimeToMinutes(closeTime);
  if (openMin >= closeMin) {
    const e = new Error('Giờ mở cửa phải nhỏ hơn giờ đóng cửa.'); e.status = 422; throw e;
  }

  // ── Bước 3: Lấy toàn bộ suất đã có của phòng trong khoảng ngày (1 query) ─
  // Thay vì gọi hasOverlap() N lần (N+1 problem), ta fetch 1 lần rồi so sánh in-memory
  const rangeStartStr = `${startDate} 00:00:00`;
  const rangeEndStr   = `${endDate} 23:59:59`;
  const existing = await ShowtimeRepository.findExistingInRange(roomId, rangeEndStr, rangeStartStr);
  // existing: [{ start_time: Date, end_time: Date }, ...]
  const existingMs = existing.map(r => ({
    start: new Date(r.start_time).getTime(),
    end:   new Date(r.end_time).getTime(),
  }));

  // Helper: kiểm tra 1 slot có chồng lấp với suất đã có không
  const hasCollision = (slotStartMs, slotEndMs) =>
    existingMs.some(e =>
      slotStartMs < e.end && slotEndMs > e.start
    );

  // ── Bước 4: Vòng lặp sinh lịch chiếu ─────────────────────────────────────
  const TURNAROUND_MIN = 15; // phút dọn rạp giữa 2 suất
  const toInsert  = [];
  const conflicts = [];

  // Vòng ngoài: duyệt từng NGÀY (dayStart → dayEnd, bước 1 ngày = 86400s)
  for (let d = new Date(dayStart); d <= dayEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    // Suất đầu tiên bắt đầu lúc openTime
    let currentMin = openMin;

    // Vòng trong: sinh từng SUẤT CHIẾU trong ngày
    while (true) {
      const slotEndMin = currentMin + durationMin; // phút kết thúc phim

      // Bước 5: Dừng nếu giờ kết thúc vượt closeTime
      if (slotEndMin > closeMin) break;

      // Chuyển phút → Date object (UTC)
      const slotStartDate = new Date(`${dateStr}T00:00:00Z`);
      slotStartDate.setUTCMinutes(slotStartDate.getUTCMinutes() + currentMin);

      const slotEndDate = new Date(`${dateStr}T00:00:00Z`);
      slotEndDate.setUTCMinutes(slotEndDate.getUTCMinutes() + slotEndMin);

      const slotStartMs = slotStartDate.getTime();
      const slotEndMs   = slotEndDate.getTime();

      // Bước 6: Kiểm tra Collision Detection (in-memory, không query DB)
      if (hasCollision(slotStartMs, slotEndMs)) {
        const conflictInfo = `${toMySQLDatetime(slotStartDate)} → ${toMySQLDatetime(slotEndDate)}`;
        if (!skipConflicts) {
          const e = new Error(`Phát hiện trùng lịch tại: ${conflictInfo}`);
          e.status = 422; throw e;
        }
        conflicts.push(conflictInfo);
      } else {
        // Hợp lệ → thêm vào mảng chờ insert
        toInsert.push({
          movieId,
          roomId,
          startTime:    toMySQLDatetime(slotStartDate),
          endTime:      toMySQLDatetime(slotEndDate),
          priceRegular: Number(priceRegular),
          priceVip:     Number(priceVip),
          priceCouple:  Number(priceCouple),
          format,
        });
      }

      // Bước 7: Suất tiếp theo = kết thúc suất này + 15 phút dọn rạp
      currentMin = slotEndMin + TURNAROUND_MIN;
    }
  }

  if (toInsert.length === 0) {
    const e = new Error(
      conflicts.length > 0
        ? `Tất cả ${conflicts.length} suất đều bị trùng lịch. Không có suất nào được tạo.`
        : 'Không thể sinh suất chiếu nào với khung giờ và thời lượng phim hiện tại.'
    );
    e.status = 422; throw e;
  }

  // ── Bước 8: Bulk INSERT (1 query duy nhất) ────────────────────────────────
  const insertedCount = await ShowtimeRepository.bulkInsert(toInsert);

  return {
    inserted:  insertedCount,
    skipped:   conflicts.length,
    conflicts, // danh sách khung giờ bị bỏ qua (nếu skipConflicts=true)
  };
};

const getStaffShowtimes = async (branchId = null) => ShowtimeRepository.findUpcoming(branchId);

export const ShowtimeService = { getAll, getById, getStaffShowtimes, create, update, destroy, bulkGenerate };
