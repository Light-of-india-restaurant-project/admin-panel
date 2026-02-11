/**
 * Create Admin User Script
 * Run this script to create a super admin user
 * 
 * Usage: node database/create-admin.js
 */

import bcrypt from 'bcryptjs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nisbat_connect',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function createAdmin() {
  // Default admin credentials - CHANGE THESE!
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nisbatconnect.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Super Admin';

  try {
    console.log('🔐 Creating admin user...');
    
    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM admin_users WHERE email = $1',
      [adminEmail]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Admin user already exists with email:', adminEmail);
      console.log('   To update the password, delete the existing admin first.');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'super_admin')
       RETURNING id, email, name, role`,
      [adminEmail, passwordHash, adminName]
    );

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', result.rows[0].email);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Name:', result.rows[0].name);
    console.log('🛡️  Role:', result.rows[0].role);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
