const nodemailer = require('nodemailer');
const logger = require('../config/logger');
const Settings = require('../models/Settings.model');

class EmailService {
  constructor() {
    this.transporter = null;
    // Don't initialize in constructor to avoid errors during module load
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    try {
      // Skip if already initialized
      if (this.transporter) {
        return;
      }

      // Configure based on environment variables
      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      // Create transporter (fixed: createTransport not createTransporter)
      this.transporter = nodemailer.createTransport(config);

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Verify email configuration
   */
  async verify() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      await this.transporter.verify();
      logger.info('Email service configuration verified');
      return true;
    } catch (error) {
      logger.error('Email service verification failed:', error);
      return false;
    }
  }

  /**
   * Send email with attachment
   */
  async sendEmail({ to, subject, text, html, attachments }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent successfully: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send export report email
   */
  async sendExportReport({ recipients, subject, message, filePath, fileName, module }) {
    try {
      const companyName = await Settings.getCompanyName();
      const recipientList = Array.isArray(recipients)
        ? recipients
        : recipients.split(',').map(r => r.trim());

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .message {
              background: white;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 15px 0;
            }
            .info-box {
              background: #e8f5e9;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${companyName} Management</h1>
            <p>Automated Export Report</p>
          </div>
          <div class="content">
            <h2>Export Report Ready</h2>
            <p>Hello,</p>
            <p>Your requested ${module} export report has been generated and is attached to this email.</p>

            ${message ? `
              <div class="message">
                <h3>Message:</h3>
                <p>${message}</p>
              </div>
            ` : ''}

            <div class="info-box">
              <strong>Report Details:</strong>
              <ul>
                <li><strong>Module:</strong> ${module}</li>
                <li><strong>File Name:</strong> ${fileName}</li>
                <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>

            <p>The report file is attached to this email. Please download it to view the complete data.</p>

            <div class="footer">
              <p>This is an automated email from ${companyName} Management System.</p>
              <p>${companyName} &copy; ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
${companyName} Management - Export Report

Your requested ${module} export report has been generated.

${message ? `Message: ${message}` : ''}

Report Details:
- Module: ${module}
- File Name: ${fileName}
- Generated: ${new Date().toLocaleString()}

The report file is attached to this email.

---
This is an automated email from ${companyName} Management System.
${companyName} © ${new Date().getFullYear()}
      `;

      const attachments = [];

      if (filePath) {
        attachments.push({
          filename: fileName,
          path: filePath
        });
      }

      return await this.sendEmail({
        to: recipientList,
        subject,
        text: textContent,
        html: htmlContent,
        attachments
      });
    } catch (error) {
      logger.error('Failed to send export report email:', error);
      throw error;
    }
  }

  /**
   * Send scheduled report notification
   */
  async sendScheduledReport({ recipients, reportName, filePath, fileName, module }) {
    try {
      const subject = `Scheduled Report: ${reportName} - ${new Date().toLocaleDateString()}`;

      return await this.sendExportReport({
        recipients,
        subject,
        message: `This is your scheduled ${reportName} report.`,
        filePath,
        fileName,
        module
      });
    } catch (error) {
      logger.error('Failed to send scheduled report:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
