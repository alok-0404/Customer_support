/**
 * Contact Controller
 */

import Ticket from '../models/Ticket.js';
import nodemailer from 'nodemailer';

// Create nodemailer transporter (only if SMTP is configured)
const createTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email to support team
const sendSupportEmail = async (ticket) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SUPPORT_EMAIL,
      subject: `New Ticket: ${ticket.firstName} ${ticket.lastName || ''}`,
      text: `
New support ticket received:

Name: ${ticket.firstName} ${ticket.lastName || ''}
Email: ${ticket.email}
Phone: ${ticket.phone || 'Not provided'}
Message: ${ticket.message}

Ticket ID: ${ticket._id}
Status: ${ticket.status}
Created: ${ticket.createdAt}
      `.trim()
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Support email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send support email:', error.message);
  }
};

// Send acknowledgment email to user
const sendUserEmail = async (ticket) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: ticket.email,
      subject: 'We received your request',
      text: `
Dear ${ticket.firstName},

Thank you for contacting us. We have received your request and will get back to you soon.

Ticket ID: ${ticket._id}
Status: ${ticket.status}

Your message:
${ticket.message}

We aim to respond within 24 hours during business hours.

Best regards,
Customer Support Team
      `.trim()
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ User acknowledgment email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send user email:', error.message);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const ticket = await Ticket.create(req.body);
    
    // Send emails if SMTP is configured
    await Promise.all([
      sendSupportEmail(ticket),
      sendUserEmail(ticket)
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: ticket._id,
        status: ticket.status
      }
    });
  } catch (error) {
    next(error);
  }
};
