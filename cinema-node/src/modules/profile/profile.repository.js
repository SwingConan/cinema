// src/modules/profile/profile.repository.js
import pool from '../../config/database.js';

const update = async (userId, { name, phone }) => {
  const sets = [];
  const params = [];
  if (name !== undefined)  { sets.push('name = ?');  params.push(name); }
  if (phone !== undefined) { sets.push('phone = ?'); params.push(phone); }
  if (sets.length === 0) return null;
  params.push(userId);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role FROM users WHERE id = ? LIMIT 1', [userId]
  );
  return rows.length ? rows[0] : null;
};

export const ProfileRepository = { update };
