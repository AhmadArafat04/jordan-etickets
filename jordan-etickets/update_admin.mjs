import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../database/etickets.db'));

async function updateAdmin() {
  try {
    // New admin credentials
    const newEmail = 'arafatahmad728@gmail.com';
    const newPassword = 'ADHam24331$';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Check if admin exists
    const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
    
    if (admin) {
      // Update existing admin
      db.prepare('UPDATE users SET email = ?, password = ? WHERE role = ?').run(
        newEmail,
        hashedPassword,
        'admin'
      );
      console.log('✅ Admin credentials updated successfully!');
      console.log(`   Email: ${newEmail}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      // Create new admin
      db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
        newEmail,
        hashedPassword,
        'Admin',
        'admin'
      );
      console.log('✅ New admin created successfully!');
      console.log(`   Email: ${newEmail}`);
      console.log(`   Password: ${newPassword}`);
    }
    
    db.close();
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    process.exit(1);
  }
}

updateAdmin();
