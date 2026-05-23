import pool from '../../config/database.js';

const mapBranch = (r) => ({
  id: r.id,
  name: r.name,
  address: r.address,
  city: r.city,
  phone: r.phone,
  email: r.email,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAll = async ({ activeOnly = false } = {}) => {
  const where = activeOnly ? "WHERE status = 'active'" : '';
  const [rows] = await pool.query(
    `SELECT * FROM branches ${where} ORDER BY city ASC, name ASC`
  );
  return rows.map(mapBranch);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM branches WHERE id = ? LIMIT 1', [id]);
  return rows.length ? mapBranch(rows[0]) : null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO branches (name, address, city, phone, email, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.address,
      data.city,
      data.phone || null,
      data.email || null,
      data.status || 'active',
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  const fields = {
    name: 'name',
    address: 'address',
    city: 'city',
    phone: 'phone',
    email: 'email',
    status: 'status',
  };
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(fields)) {
    if (data[key] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(data[key] || null);
    }
  }
  if (sets.length === 0) return findById(id);
  params.push(id);
  await pool.query(`UPDATE branches SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM branches WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const hasDependencies = async (id) => {
  const [[roomRow]] = await pool.query('SELECT COUNT(*) AS total FROM rooms WHERE branch_id = ?', [id]);
  const [[userRow]] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE branch_id = ?', [id]);
  const [[bookingRow]] = await pool.query('SELECT COUNT(*) AS total FROM bookings WHERE branch_id = ?', [id]);
  return Number(roomRow.total) > 0 || Number(userRow.total) > 0 || Number(bookingRow.total) > 0;
};

export const BranchRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
  hasDependencies,
};
