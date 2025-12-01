import '../config/env.js';

/**
 * Email Service - For sending Password Reset Emails
 * Uses SendGrid REST API
 */

import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const getFromEmail = () =>
  process.env.SENDGRID_FROM_EMAIL ||
  process.env.EMAIL_FROM ||
  process.env.EMAIL_USER;
const getFromName = () =>
  process.env.SENDGRID_FROM_NAME ||
  process.env.APP_NAME ||
  'Customer Support';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Sends password reset email to user
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name (optional)
 */
export const sendPasswordResetEmail = async (email, resetToken, userName = 'User') => {
  try {
    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    const fromEmail = getFromEmail();
    if (!fromEmail) {
      throw new Error('SendGrid from email not configured');
    }

    // Frontend URL where reset form is located
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000' || 'http://mydiamond99adminsupport.in.s3-website-us-east-1.amazonaws.com';
    console.log('frontendURL', frontendURL);
    const resetLink = `${frontendURL}/#/reset-password?token=${resetToken}`;

    // Email content - Simple HTML to reduce spam flags
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: getFromName()
      },
      subject: 'Password Reset Request',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Password Reset Request</h2>
            <p>Hello ${userName},</p>
            <p>We received a request to reset your account password. If you made this request, click the link below to set a new password:</p>
            <p>
              <a href="${resetLink}" style="display:inline-block;padding:10px 18px;background-color:#1a73e8;color:#ffffff;text-decoration:none;border-radius:4px;">
                Reset Password
              </a>
            </p>
            <p>If the button above does not work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all;">${resetLink}</p>
            <p><strong>Note:</strong> This link is valid for 1 hour. If you did not request this password reset, you can safely ignore this email.</p>
            <p>Thank you,<br>${process.env.APP_NAME || 'Customer Support'} Team</p>
          </body>
        </html>
      `,
      // Plain text version for email clients that don't support HTML
      text: `
Hello ${userName},

We received a request to reset your account password.

To reset your password, visit this link:
${resetLink}

This link is valid for 1 hour only.

If you didn't request this password reset, please ignore this email.

Thank you,
${process.env.APP_NAME || 'Customer Support'} Team
      `
    };

    const [response] = await sgMail.send(msg);
    const messageId = response?.headers?.['x-message-id'] || response?.headers?.['X-Message-Id'];
    console.log('📧 Password reset email sent via SendGrid:', messageId || 'unknown');
    return { success: true, messageId: messageId || null };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('❌ SendGrid error payload:', error.response?.body);
    throw new Error('Email sending failed: ' + error.message);
  }
};

/**
 * Tests email configuration
 */
export const testEmailConnection = async () => {
  try {
    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }
    const { body } = await sgMail.client.request({
      method: 'GET',
      url: '/v3/user/profile'
    });
    console.log('✅ SendGrid connection successful for user:', body?.email || 'unknown');
    return true;
  } catch (error) {
    console.error('❌ SendGrid connection failed:', error);
    return false;
  }
};

