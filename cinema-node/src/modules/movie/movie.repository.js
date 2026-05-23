// src/modules/movie/movie.repository.js
// =============================================
// MOVIE REPOSITORY — Raw SQL only.
// map snake_case → camelCase khi trả về.
// =============================================
import pool from '../../config/database.js';

// SQL fragment trính tính status động:
// - 'now_showing' : có ít nhất 1 suất chiếu trước 48h tới hoặc chưa kết thúc trong ngày
// - 'coming_soon' : release_date > CURDATE()
// - 'stopped'     : không còn suất chiếu nào trong tương lai và đã release
const STATUS_EXPR = `m.status AS computed_status`;

const mapMovie = (r) => ({
  id:          r.id,
  title:       r.title,
  description: r.description,
  duration:    r.duration,
  trailerUrl:  r.trailer_url,
  releaseDate: r.release_date,
  // Status luôn dùng computed_status (tính từ SQL), fallback sang cột cũ nếu không có
  status:      r.computed_status ?? r.status ?? 'coming_soon',
  poster:      r.poster,
  director:    r.director,
  cast:        r.cast,
  genre:       r.genre,
  rated:       r.rated,
  createdAt:   r.created_at,
  updatedAt:   r.updated_at,
});

// FIX #5: Real SQL pagination — LIMIT/OFFSET + parallel COUNT(*)
const findAll = async (status = null, page = 1, perPage = 20, branchId = null) => {
  const offset = (page - 1) * perPage;

  // Filter theo computed status bằng HAVING (vì là alias)
  let having = '';
  const params = [];
  if (status) { having = ' HAVING computed_status = ?'; params.push(status); }
  const branchWhere = branchId
    ? `WHERE EXISTS (
         SELECT 1
         FROM showtimes s
         JOIN rooms r ON r.id = s.room_id
         WHERE s.movie_id = m.id
           AND r.branch_id = ?
           AND s.start_time >= DATE_ADD(NOW(), INTERVAL 7 HOUR)
       )`
    : '';
  const branchParams = branchId ? [branchId] : [];

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM (
       SELECT m.id, ${STATUS_EXPR}
       FROM movies m
       ${branchWhere}
       ${having}
     ) AS sub`,
    [...branchParams, ...params]
  );
  const [rows] = await pool.query(
     `SELECT m.*, ${STATUS_EXPR}
     FROM movies m
     ${branchWhere}
     ${having}
     ORDER BY m.release_date DESC
     LIMIT ? OFFSET ?`,
    [...branchParams, ...params, perPage, offset]
  );
  return { rows: rows.map(mapMovie), total: Number(total) };
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT m.*, ${STATUS_EXPR} FROM movies m WHERE m.id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;
  return mapMovie(rows[0]);
};

/**
 * Lấy movie kèm showtimes tương lai
 */
const findByIdWithShowtimes = async (id, branchId = null) => {
  const movie = await findById(id);
  if (!movie) return null;
  const branchFilter = branchId ? 'AND r.branch_id = ?' : '';
  const queryParams = branchId ? [id, branchId] : [id];

  const [showtimes] = await pool.query(
    `SELECT s.id, s.movie_id, s.room_id, s.start_time, s.end_time,
            s.price_regular, s.price_vip, s.price_couple, s.format,
            r.id AS r_id, r.name AS r_name, r.type AS r_type, r.total_seats AS r_total_seats,
            r.branch_id AS r_branch_id, b.name AS branch_name, b.city AS branch_city, b.address AS branch_address,
            (
              SELECT COUNT(*) FROM booking_seats bs
              JOIN bookings b ON bs.booking_id = b.id
              WHERE b.showtime_id = s.id AND b.status != 'cancelled'
            ) AS booked_seats
     FROM showtimes s
     JOIN rooms r ON s.room_id = r.id
     LEFT JOIN branches b ON b.id = r.branch_id
     WHERE s.movie_id = ? AND s.start_time >= DATE_ADD(NOW(), INTERVAL 7 HOUR)
       ${branchFilter}
     ORDER BY s.start_time ASC`,
    queryParams
  );

  movie.showtimes = showtimes.map(s => ({
    id:           s.id,
    movieId:      s.movie_id,
    roomId:       s.room_id,
    startTime:    s.start_time,
    endTime:      s.end_time,
    priceRegular: s.price_regular,
    priceVip:     s.price_vip,
    priceCouple:  s.price_couple,
    format:       s.format,
    available_seats: s.r_total_seats - (s.booked_seats || 0), // Cho Frontend map snake_case
    room: {
      id:         s.r_id,
      name:       s.r_name,
      type:       s.r_type,
      totalSeats: s.r_total_seats,
      total_seats: s.r_total_seats, // Cho Frontend map snake_case
      branchId:   s.r_branch_id,
      branch:     s.branch_name ? { id: s.r_branch_id, name: s.branch_name, city: s.branch_city, address: s.branch_address } : null,
    },
  }));

  return movie;
};

const create = async ({ title, description, duration, trailerUrl, releaseDate, status, poster, director, cast, genre, rated }) => {
  const [result] = await pool.query(
    `INSERT INTO movies (title, description, duration, trailer_url, release_date, status, poster, director, \`cast\`, genre, rated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, duration, trailerUrl || null, releaseDate, status, poster || null, director || null, cast || null, genre || null, rated]
  );
  return findById(result.insertId);
};

const update = async (id, fields) => {
  // Xây SET clause động (chỉ update field được gửi lên)
  const colMap = {
    title: 'title', description: 'description', duration: 'duration',
    trailerUrl: 'trailer_url', releaseDate: 'release_date', status: 'status',
    poster: 'poster', director: 'director', cast: '`cast`', genre: 'genre', rated: 'rated',
  };
  const setClauses = [];
  const params = [];
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      params.push(fields[key]);
    }
  }
  if (setClauses.length === 0) return findById(id);
  params.push(id);
  await pool.query(`UPDATE movies SET ${setClauses.join(', ')} WHERE id = ?`, params);
  return findById(id);
};

const destroy = async (id) => {
  await pool.query('DELETE FROM movies WHERE id = ?', [id]);
};

/**
 * Kiểm tra phim đã có booking paid/used chưa (bảo vệ khi xóa)
 */
const hasActiveBookings = async (movieId) => {
  const [rows] = await pool.query(
    `SELECT 1 FROM bookings b
     JOIN showtimes s ON b.showtime_id = s.id
     WHERE s.movie_id = ? AND b.status IN ('paid', 'used')
     LIMIT 1`,
    [movieId]
  );
  return rows.length > 0;
};

export const MovieRepository = {
  findAll,
  findById,
  findByIdWithShowtimes,
  create,
  update,
  destroy,
  hasActiveBookings,
};
