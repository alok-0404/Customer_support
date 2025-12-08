/**
 * App Settings Model
 * Stores application-wide settings like universal WhatsApp link
 */

import mongoose from 'mongoose';

const WaLinkHistorySchema = new mongoose.Schema({
  link: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now }
}, { _id: true });

const BannerHistorySchema = new mongoose.Schema({
  bannerUrl: { type: String, required: true },
  bannerType: { type: String, enum: ['festival', 'discount', 'custom', 'event'], default: 'custom' },
  title: { type: String },
  description: { type: String },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now }
}, { _id: true });

const AppSettingsSchema = new mongoose.Schema(
  {
    // Unique identifier for settings document (only one document)
    settingKey: { 
      type: String, 
      unique: true, 
      default: 'app_settings',
      index: true 
    },
    // Current universal WhatsApp link
    universalWaLink: { 
      type: String, 
      required: true,
      default: 'https://wa.me/919999999999?text=Hello'
    },
    // History of all WhatsApp links (with timestamps)
    waLinkHistory: [WaLinkHistorySchema],
    // Current banner image URL (stored in S3)
    currentBanner: { 
      type: String,
      default: null
    },
    bannerType: {
      type: String,
      enum: ['festival', 'discount', 'custom', 'event'],
      default: 'custom'
    },
    bannerTitle: { type: String },
    bannerDescription: { type: String },
    // History of all banners (with timestamps)
    bannerHistory: [BannerHistorySchema]
  },
  { timestamps: true }
);

// Index for faster queries
AppSettingsSchema.index({ settingKey: 1 });

const AppSettings = mongoose.model('AppSettings', AppSettingsSchema);
export default AppSettings;

