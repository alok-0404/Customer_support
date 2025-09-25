/**
 * WhatsApp Intent Model
 */

import mongoose from 'mongoose';

const whatsAppIntentSchema = new mongoose.Schema({
  targetNumber: {
    type: String,
    required: [true, 'Target number is required'],
    trim: true
  },
  prefilledText: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  source: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  referer: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('WhatsAppIntent', whatsAppIntentSchema);


