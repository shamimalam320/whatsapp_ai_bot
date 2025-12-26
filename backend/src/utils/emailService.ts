import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
    };

    // Check if email is configured
    if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
      logger.warn('Email service not configured. Email notifications will be logged to console.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.port === 465, // true for 465, false for other ports
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });

      this.isConfigured = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.transporter) {
        // Log email to console in development
        logger.info('=== EMAIL (Development Mode) ===');
        logger.info(`To: ${options.to}`);
        logger.info(`Subject: ${options.subject}`);
        logger.info(`Content: ${options.text || 'See HTML content'}`);
        logger.info('================================');
        console.log('\n📧 EMAIL NOTIFICATION:');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Content:\n${options.text || options.html}`);
        console.log('================================\n');
        return true;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
    const subject = 'Password Reset Request - WhatsApp AI';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #25D366; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #25D366; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>You requested to reset your password for your WhatsApp AI account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>WhatsApp AI - Automated Customer Support</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

You requested to reset your password for your WhatsApp AI account.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'Welcome to WhatsApp AI! 🎉';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #25D366; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .step { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #25D366; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to WhatsApp AI!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for registering! We're excited to help you automate your WhatsApp customer support with AI.</p>
            <h3>Getting Started:</h3>
            <div class="step">
              <strong>1️⃣ Connect WhatsApp</strong><br>
              Set up your WhatsApp Business number
            </div>
            <div class="step">
              <strong>2️⃣ Add Products</strong><br>
              Upload your product catalog
            </div>
            <div class="step">
              <strong>3️⃣ Configure AI</strong><br>
              Train your AI assistant
            </div>
            <p>Visit your dashboard to get started!</p>
          </div>
          <div class="footer">
            <p>WhatsApp AI - Automated Customer Support</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to WhatsApp AI!

Hi ${name},

Thank you for registering! We're excited to help you automate your WhatsApp customer support with AI.

Getting Started:
1. Connect WhatsApp - Set up your WhatsApp Business number
2. Add Products - Upload your product catalog
3. Configure AI - Train your AI assistant

Visit your dashboard to get started!
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  async sendVerificationEmail(email: string, name: string, verificationUrl: string): Promise<boolean> {
    const subject = 'Verify Your Email - WhatsApp AI Bot';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: #ffffff !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to WhatsApp AI Bot! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering! Please verify your email address to activate your account.</p>
            
            <p>Click the button below to verify your email:</p>
            
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 WhatsApp AI Bot. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to WhatsApp AI Bot!

Hello ${name},

Thank you for registering! Please verify your email address to activate your account.

Click this link to verify your email: ${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
