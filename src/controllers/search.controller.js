/**
 * Search Controller
 */

import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import User from '../models/User.js';
import { findUserWithBranch, getRedirectWaLink, findUserByPhoneWithBranch } from '../services/search.service.js';

const normalizePhone = (phone) => (phone ? String(phone).replace(/\s+/g, '').trim() : '');

const getOtpConfig = () => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  fromNumber: process.env.TWILIO_FROM_NUMBER,
  tokenSecret: process.env.OTP_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET,
  tokenExpiresIn: process.env.OTP_TOKEN_EXPIRES_IN || '10m'
});

let twilioClient = null;
const ensureTwilioClient = () => {
  if (twilioClient) return twilioClient;
  const { accountSid, authToken } = getOtpConfig();
  if (!accountSid || !authToken) return null;
  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
};

const isOtpServiceConfigured = () => {
  const { verifyServiceSid } = getOtpConfig();
  return !!(verifyServiceSid && ensureTwilioClient());
};

const getVerifiedPhoneFromRequest = (req) => {
  const token = req.headers['x-otp-token'] || req.query.otpToken || req.body?.otpToken;
  const { tokenSecret } = getOtpConfig();
  if (!token || !tokenSecret) return null;
  try {
    const payload = jwt.verify(String(token), tokenSecret);
    if (!payload || payload.purpose !== 'search-otp' || !payload.phone) {
      return null;
    }
    return normalizePhone(payload.phone);
  } catch (err) {
    return null;
  }
};

const formatTwilioError = (error) => {
  if (!error) return 'Failed to process OTP request';
  
  // Twilio authentication errors
  if (error.message && error.message.toLowerCase().includes('authenticate')) {
    return 'Twilio authentication failed. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.';
  }
  
  // Twilio 401/403 errors
  if (error.status === 401 || error.status === 403) {
    return 'Twilio authentication failed. Invalid credentials.';
  }
  
  // Twilio 404 errors (service not found)
  if (error.status === 404) {
    return 'Twilio Verify Service not found. Please check TWILIO_VERIFY_SERVICE_SID.';
  }
  
  if (error.message) return error.message;
  if (error.code) return `Twilio error: ${error.code}`;
  return 'Failed to process OTP request';
};
export const startOtpVerification = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) {
      res.status(400);
      return res.json({ success: false, message: 'phone is required' });
    }

    const existingUser = await User.findOne({ phone }).select('_id role isActive');
    if (!existingUser) {
      res.status(404);
      return res.json({ success: false, message: 'Phone number is not registered' });
    }
    if (!existingUser.isActive) {
      res.status(403);
      return res.json({ success: false, message: 'Account is inactive' });
    }
    if (!isOtpServiceConfigured()) {
      res.status(503);
      const config = getOtpConfig();
      const missing = [];
      if (!config.accountSid) missing.push('TWILIO_ACCOUNT_SID');
      if (!config.authToken) missing.push('TWILIO_AUTH_TOKEN');
      if (!config.verifyServiceSid) missing.push('TWILIO_VERIFY_SERVICE_SID');
      return res.json({ 
        success: false, 
        message: `OTP service not configured. Missing: ${missing.join(', ')}` 
      });
    }

    const client = ensureTwilioClient();
    if (!client) {
      res.status(503);
      return res.json({ success: false, message: 'Failed to initialize Twilio client. Check credentials.' });
    }
    const { verifyServiceSid } = getOtpConfig();

    await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: phone,
      channel: 'sms'
    });

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    // Log error for debugging
    console.error('❌ OTP Start Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      moreInfo: error.moreInfo
    });
    
    if (error?.status === 429) {
      res.status(429);
      return res.json({ success: false, message: 'Too many OTP requests. Please try again later.' });
    }
    if (error?.status) {
      res.status(error.status);
      return res.json({ success: false, message: formatTwilioError(error) });
    }
    next(error);
  }
};

export const verifyOtpCode = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code || '').trim();

    if (!phone || !code) {
      res.status(400);
      return res.json({ success: false, message: 'phone and code are required' });
    }

    if (!isOtpServiceConfigured()) {
      res.status(503);
      return res.json({ success: false, message: 'OTP service not configured' });
    }

    const client = ensureTwilioClient();
    const { verifyServiceSid, tokenSecret, tokenExpiresIn } = getOtpConfig();

    let verificationResult = null;
    try {
      verificationResult = await client.verify.v2.services(verifyServiceSid).verificationChecks.create({
        to: phone,
        code
      });
    } catch (err) {
      res.status(err?.status || 400);
      return res.json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (!verificationResult || verificationResult.status !== 'approved') {
      res.status(400);
      return res.json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (!tokenSecret) {
      res.status(500);
      return res.json({ success: false, message: 'OTP token secret not configured' });
    }

    const otpToken = jwt.sign({
      phone,
      purpose: 'search-otp'
    }, tokenSecret, {
      expiresIn: tokenExpiresIn
    });

    // Fetch WhatsApp link and branch info directly using phone
    const userLinkData = await findUserByPhoneWithBranch(phone);
    if (!userLinkData || !userLinkData.waLink) {
      res.status(404);
      return res.json({
        success: false,
        message: 'No active user or WhatsApp link found for this phone number'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified. Redirect to WhatsApp link.',
      data: {
        otpToken,
        expiresIn: tokenExpiresIn,
        waLink: userLinkData.waLink,
        userId: userLinkData.userId,
        branchName: userLinkData.branchName
      }
    });
  } catch (error) {
    next(error);
  }
};

export const searchByUserId = async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      res.status(400);
      return res.json({ success: false, message: 'userId is required', data: null });
    }

    const verifiedPhone = getVerifiedPhoneFromRequest(req);
    if (!verifiedPhone) {
      res.status(401);
      return res.json({ success: false, message: 'OTP verification required', data: null });
    }

    const result = await findUserWithBranch(userId, { requirePhone: verifiedPhone });
    if (!result) {
      res.status(404);
      return res.json({ success: false, message: 'User not found', data: null });
    }
    return res.status(200).json({ success: true, message: 'User found', data: result });
  } catch (error) {
    next(error);
  }
};

export const redirectByUserId = async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      res.status(400);
      return res.json({ success: false, message: 'userId is required', data: null });
    }

    const verifiedPhone = getVerifiedPhoneFromRequest(req);
    if (!verifiedPhone) {
      res.status(401);
      return res.json({ success: false, message: 'OTP verification required', data: null });
    }

    const waLink = await getRedirectWaLink(userId, { requirePhone: verifiedPhone });
    if (!waLink) {
      res.status(404);
      return res.json({ success: false, message: 'User not found', data: null });
    }
    return res.redirect(302, waLink);
  } catch (error) {
    next(error);
  }
};

