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
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendURL}/reset-password?token=${resetToken}`;

    // Email content - Professional English format
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: getFromName()
      },
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 10px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              margin: 20px 0;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .button:hover {
              background-color: #45a049;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              
              <p>We received a request to reset your account password. If you made this request, click the button below to set a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                ${resetLink}
              </p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link is valid for <strong>1 hour</strong> only</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>Your password will remain unchanged until you access the link above and create a new one</li>
                </ul>
              </div>
              
              <p>Thank you,<br>
              <strong>${process.env.APP_NAME || 'Customer Support'} Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
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

