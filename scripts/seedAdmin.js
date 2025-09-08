require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const connectDB = require('../config/database');

async function seedAdmin() {
  try {
    // Connect to database
    await connectDB();
    
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminUser = new User({
      email: adminEmail,
      passwordHash,
      name: 'System Administrator',
      role: 'admin',
      credits: 1000
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();