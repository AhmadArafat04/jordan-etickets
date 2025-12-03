import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';

const router = express.Router();

// One-time admin update endpoint
// Access this URL once after deployment: /api/update-admin-credentials
router.get('/update-admin-credentials', async (req, res) => {
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
      
      res.json({
        success: true,
        message: 'Admin credentials updated successfully!',
        email: newEmail,
        note: 'You can now login with the new credentials. For security, delete this route after use.'
      });
    } else {
      // Create new admin
      db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
        newEmail,
        hashedPassword,
        'Admin',
        'admin'
      );
      
      res.json({
        success: true,
        message: 'New admin created successfully!',
        email: newEmail,
        note: 'You can now login with the new credentials. For security, delete this route after use.'
      });
    }
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin credentials',
      details: error.message
    });
  }
});

export default router;
