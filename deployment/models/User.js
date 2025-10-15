/**
 * User Model
 */

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: function() { return this.role === 'sub' || this.role === 'client'; } },
    // Denormalized snapshot for clarity/auditing
    branchName: { type: String },
    branchWaLink: { type: String },
    // For clients: which subadmin created this client
    parentSubAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: function() { return this.role === 'client'; }, index: true },
    // Additional fields for clients
    name: { type: String },
    phone: { type: String },
    // Auth fields
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['root', 'sub', 'client'], default: 'sub', index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    lastLogoutAt: { type: Date },
    // Password Reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
export default User;


