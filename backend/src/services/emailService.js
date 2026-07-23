const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }
  init() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false }
      });
    } catch (err) {
      logger.error('Email service initialization failed:', err.message);
    }
  }
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.transporter) return logger.warn('Email service not configured');
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'HRMS <noreply@hrms.com>',
        to, subject, html, text, attachments
      });
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      logger.error(`Email send failed: ${err.message}`);
      throw err;
    }
  }
  async sendWelcomeEmail(user, password) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to HRMS - Your Account Details',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#3B82F6;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Welcome to HRMS!</h1>
        </div>
        <div style="padding:20px;background:#f9f9f9">
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          <p>Your account has been created. Here are your login details:</p>
          <div style="background:white;padding:15px;border-radius:8px;border-left:4px solid #3B82F6">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please change your password after first login.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="background:#3B82F6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px">Login Now</a>
        </div>
      </div>`
    });
  }
  async sendLeaveStatusEmail(leave, status, reason = '') {
    const employee = leave.employee;
    if (!employee || !employee.user || !employee.user.email) return;
    return this.sendEmail({
      to: employee.user.email,
      subject: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px">
        <h2>Leave Request ${status}</h2>
        <p>Your leave request has been <strong>${status}</strong>.</p>
        <p><strong>Type:</strong> ${leave.leaveType}</p>
        <p><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</p>
        <p><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</p>
        <p><strong>Days:</strong> ${leave.totalDays}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>`
    });
  }
}

module.exports = new EmailService();
