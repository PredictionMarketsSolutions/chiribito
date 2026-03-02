import { Resend } from 'resend';
import logger from '../config/logger';

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      logger.warn('RESEND_API_KEY not set - email sending disabled');
    } else {
      this.resend = new Resend(resendApiKey);
    }
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      if (!this.resend) {
        logger.warn('Cannot send email - RESEND_API_KEY not configured');
        return false;
      }

      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@yourapp.com',
        to,
        subject,
        html,
      });

      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to send email', { to, subject, error: error.message });
      } else {
        logger.error('Failed to send email', { to, subject });
      }
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, resetLink: string): Promise<boolean> {
    try {
      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset the password for your account.</p>
            <p>Click the link below to reset your password (valid for 30 minutes):</p>
            <p>
              <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                Reset Password
              </a>
            </p>
            <p>Or copy this link in your browser: ${resetLink}</p>
            <p style="color: #666; font-size: 12px;">
              If you didn't request a password reset, please ignore this email.
              This link will expire in 30 minutes.
            </p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 30px 0;">
            <p style="color: #999; font-size: 11px; text-align: center;">
              © ${new Date().getFullYear()} Chiribito. All rights reserved.
            </p>
          </div>
        `;

      const sent = await this.sendEmail(email, 'Password Reset Request', html);
      if (sent) {
        logger.info('Password reset email sent', { email, resetToken });
      }
      return sent;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to send password reset email', { 
          email, 
          error: error.message 
        });
      } else {
        logger.error('Failed to send password reset email', { email });
      }
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationCode: string, verificationLink: string): Promise<boolean> {
    try {
      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Thank you for registering! Please verify your email address to activate your account.</p>
            <p>Click the link below to verify your email (valid for 24 hours):</p>
            <p>
              <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
                Verify Email
              </a>
            </p>
            <p>Or enter this code: <strong>${verificationCode}</strong></p>
            <p style="color: #666; font-size: 12px;">
              If you didn't create this account, please ignore this email.
              This link will expire in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 30px 0;">
            <p style="color: #999; font-size: 11px; text-align: center;">
              © ${new Date().getFullYear()} Chiribito. All rights reserved.
            </p>
          </div>
        `;

      const sent = await this.sendEmail(email, 'Verify Your Email Address', html);
      if (sent) {
        logger.info('Verification email sent', { email, verificationCode });
      }
      return sent;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to send verification email', { 
          email, 
          error: error.message 
        });
      } else {
        logger.error('Failed to send verification email', { email });
      }
      return false;
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome, ${username}!</h2>
            <p>Your account has been successfully created. You're ready to start playing poker!</p>
            <p>
              <a href="${process.env.FRONTEND_URL || 'https://chiri-poker.com'}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                Go to Chiri Poker
              </a>
            </p>
            <p style="color: #666; font-size: 12px;">
              If you have any questions, feel free to reach out to our support team.
            </p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 30px 0;">
            <p style="color: #999; font-size: 11px; text-align: center;">
              © ${new Date().getFullYear()} Chiribito. All rights reserved.
            </p>
          </div>
        `;

      const sent = await this.sendEmail(email, 'Welcome to Chiri Poker!', html);
      if (sent) {
        logger.info('Welcome email sent', { email, username });
      }
      return sent;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to send welcome email', { 
          email, 
          error: error.message 
        });
      } else {
        logger.error('Failed to send welcome email', { email });
      }
      return false;
    }
  }
}

export const emailService = new EmailService();
