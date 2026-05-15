// src/modules/review/review.repository.js
import pool from '../../config/database.js';

const mapReview = (r) => ({
  id:        r.id,
  userId:    r.user_id,
  movieId:   r.movie_id,
  rating:    r.rating,
  comment:   r.comment,
  createdAt: r.created_at,
  user:      r.user_name ? { id: r.user_id, name: r.user_name } : undefined,
});

const findByMovie = async (movieId) => {
  const [rows] = await pool.query(
    `SELECT rv.*, u.name AS user_name
     FROM reviews rv JOIN users u ON rv.user_id = u.id
     WHERE rv.movie_id = ?
     ORDER BY rv.created_at DESC`,
    [movieId]
  );
  return rows.map(mapReview);
};

const hasWatchedMovie = async (userId, movieId) => {
  const [rows] = await pool.query(
    `SELECT 1 FROM bookings b
     JOIN showtimes s ON b.showtime_id = s.id
     WHERE b.user_id = ? AND s.movie_id = ? AND b.status IN ('paid', 'used')
     LIMIT 1`,
    [userId, movieId]
  );
  return rows.length > 0;
};

const upsert = async (userId, movieId, { rating, comment }) => {
  // INSERT ... ON DUPLICATE KEY UPDATE (dùng unique index trên user_id, movie_id)
  await pool.query(
    `INSERT INTO reviews (user_id, movie_id, rating, comment, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), updated_at = NOW()`,
    [userId, movieId, rating, comment || '']
  );
  const [rows] = await pool.query(
    `SELECT rv.*, u.name AS user_name
     FROM reviews rv JOIN users u ON rv.user_id = u.id
     WHERE rv.user_id = ? AND rv.movie_id = ? LIMIT 1`,
    [userId, movieId]
  );
  return rows.length ? mapReview(rows[0]) : null;
};

export const ReviewRepository = { findByMovie, hasWatchedMovie, upsert };
