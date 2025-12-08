/**
 * AWS S3 Service
 * Handles file uploads to S3 cloud storage
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
const BANNER_FOLDER = 'banners/';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Upload banner image to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} mimeType - File MIME type
 * @param {String} originalName - Original filename
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadBannerToS3 = async (fileBuffer, mimeType, originalName) => {
  try {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
    }

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Generate unique filename
    const fileExtension = path.extname(originalName) || '.jpg';
    const uniqueFileName = `${BANNER_FOLDER}${randomUUID()}${fileExtension}`;

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: mimeType,
      // ACL removed - use bucket policy for public access instead
      CacheControl: 'max-age=31536000' // Cache for 1 year
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct public URL
    const bannerUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueFileName}`;

    return {
      success: true,
      url: bannerUrl,
      key: uniqueFileName,
      size: fileBuffer.length,
      mimeType
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload banner: ${error.message}`);
  }
};

/**
 * Delete banner from S3
 * @param {String} s3Key - S3 object key
 * @returns {Promise<Boolean>} Success status
 */
export const deleteBannerFromS3 = async (s3Key) => {
  try {
    // Extract key from URL if full URL provided
    let key = s3Key;
    if (s3Key.includes('amazonaws.com/')) {
      key = s3Key.split('amazonaws.com/')[1];
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    // Don't throw error on delete failure (file might not exist)
    return false;
  }
};

/**
 * Validate banner file
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result
 */
export const validateBannerFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file uploaded' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` 
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` 
    };
  }

  return { valid: true };
};

