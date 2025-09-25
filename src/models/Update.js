/**
 * Update Model
 */

import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual field to map createdAt to publishedAt
updateSchema.virtual('publishedAt').get(function() {
  return this.createdAt;
});

// Ensure virtual fields are serialized
updateSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.publishedAt = ret.createdAt;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  }
});

export default mongoose.model('Update', updateSchema);
