import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const run = async () => {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    if (!email || !password) {
      console.error('Usage: node src/scripts/seedRoot.js <email> <password>');
      process.exit(1);
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      console.log('Root user already exists with this email. Aborting.');
      process.exit(0);
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    const user = await User.create({
      userId: 'ROOT-ADMIN',
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'root',
      isActive: true,
      createdBy: null,
      tokenVersion: 0
    });

    console.log('✅ Root admin created:', { id: String(user._id), email: user.email });
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding root user:', err.message);
    process.exit(1);
  }
};

run();


