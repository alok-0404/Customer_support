import '../config/env.js';
import twilio from 'twilio';

class TwilioService {
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }

    this.client = twilio(accountSid, authToken);
    this.whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    this.smsFrom = process.env.TWILIO_FROM_NUMBER || null;
    this.templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID || null;
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || null;
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || null;
  }

  requireVerifyService() {
    if (!this.verifyServiceSid) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured');
    }
  }

  buildMessagingPayload(phoneNumber, channel = 'whatsapp') {
    const payload = {
      to: this.formatPhoneNumber(phoneNumber, channel),
    };

    if (this.messagingServiceSid) {
      payload.messagingServiceSid = this.messagingServiceSid;
      return payload;
    }

    if (channel === 'whatsapp') {
      payload.from = this.whatsappFrom;
    } else {
      if (!this.smsFrom) {
        throw new Error('TWILIO_FROM_NUMBER is required for SMS messages');
      }
      payload.from = this.smsFrom;
    }

    return payload;
  }

  async sendVerifyOTP(phoneNumber, channel = 'whatsapp') {
    this.requireVerifyService();

    return this.client.verify.v2.services(this.verifyServiceSid).verifications.create({
      to: this.formatPhoneNumber(phoneNumber, channel),
      channel,
    });
  }

  async checkVerifyOTP(phoneNumber, code, channel = 'whatsapp') {
    this.requireVerifyService();

    return this.client.verify.v2.services(this.verifyServiceSid).verificationChecks.create({
      to: this.formatPhoneNumber(phoneNumber, channel),
      code,
      channel,
    });
  }

  async sendSimpleOTP(phoneNumber, otp, expiryMinutes = 5, channel = 'whatsapp') {
    const payload = this.buildMessagingPayload(phoneNumber, channel);
    payload.body = `Your verification code is ${otp}. Valid for ${expiryMinutes} minutes.`;

    return this.client.messages.create(payload);
  }

  async sendTemplateOTP(phoneNumber, otp, expiryMinutes = 5, channel = 'whatsapp') {
    if (!this.templateSid) {
      throw new Error('TWILIO_WHATSAPP_TEMPLATE_SID is not configured');
    }

    const payload = this.buildMessagingPayload(phoneNumber, channel);
    payload.contentSid = this.templateSid;
    payload.contentVariables = JSON.stringify({
      1: otp,
      2: String(expiryMinutes),
    });

    return this.client.messages.create(payload);
  }

  formatPhoneNumber(phoneNumber, channel = 'whatsapp') {
    if (channel === 'whatsapp') {
      if (phoneNumber.startsWith('whatsapp:')) {
        return phoneNumber;
      }

      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code and start with +');
      }

      return `whatsapp:${phoneNumber}`;
    }

    if (!phoneNumber.startsWith('+')) {
      throw new Error('Phone number must include country code and start with +');
    }

    return phoneNumber;
  }
}

const twilioService = new TwilioService();

export default twilioService;

