/**
 * User Model
 */

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true }
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
export default User;


