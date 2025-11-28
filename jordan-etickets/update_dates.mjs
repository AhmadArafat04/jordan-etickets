import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database', 'etickets.db'));

// Update dates from 2024 to 2025
const updates = [
  { old: '2024-12-25', new: '2025-12-25' },
  { old: '2024-12-26', new: '2025-12-26' },
  { old: '2024-12-27', new: '2025-12-27' },
  { old: '2024-12-28', new: '2025-12-28' },
  { old: '2024-12-29', new: '2025-12-29' },
  { old: '2024-12-30', new: '2025-12-30' },
  { old: '2024-12-31', new: '2025-12-31' }
];

updates.forEach(({ old, new: newDate }) => {
  const stmt = db.prepare('UPDATE events SET date = ? WHERE date = ?');
  const result = stmt.run(newDate, old);
  console.log(`✅ Updated ${result.changes} event(s) from ${old} to ${newDate}`);
});

db.close();
console.log('✅ All dates updated to 2025!');
