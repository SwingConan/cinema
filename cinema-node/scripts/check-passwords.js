// scripts/check-passwords.js
import pool from '../src/config/database.js';
import bcrypt from 'bcrypt';

const [rows] = await pool.query(
  'SELECT id, email, password FROM users WHERE role = ? LIMIT 5',
  ['customer']
);

const candidates = ['123456', 'password', '12345678', 'cinema123', '111111',
  '123456789', 'admin123', 'customer', 'letmein', 'qwerty', '000000',
  'huuloi', 'huuloi1', 'huuloi2', '1', 'test', 'test123'];

console.log('\n=== Password Check ===');
for (const user of rows) {
  console.log(`\nUser: ${user.email}`);
  // Normalize $2y$ (PHP/Laravel) → $2b$ (Node.js bcrypt) — functionally identical
  const hash = user.password.replace(/^\$2y\$/, '$2b$');
  let found = false;
  for (const pwd of candidates) {
    const match = await bcrypt.compare(pwd, hash);
    if (match) {
      console.log(`  ✅ Password: "${pwd}"`);
      found = true;
      break;
    }
  }
  if (!found) {
    console.log(`  ❌ Không khớp với các password thử: ${candidates.join(', ')}`);
    console.log(`  Hash prefix: ${user.password.slice(0, 20)}...`);
  }
}

await pool.end();
process.exit(0);
