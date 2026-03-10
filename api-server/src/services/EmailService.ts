import { Resend } from 'resend';
import logger from '../config/logger';
import {
  passwordResetTemplate,
  verificationTemplate,
  welcomeTemplate,
} from '../email/templates';

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
        from: process.env.RESEND_FROM_EMAIL || 'Chiribito <noreply@chiribito.com>',
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
      const html = passwordResetTemplate(resetLink);
      const sent = await this.sendEmail(email, 'Restablecer contraseña - Chiribito', html);
      if (sent) {
        logger.info('Password reset email sent', { email, resetToken });
      }
      return sent;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to send password reset email', { email, error: error.message });
      } else {
        logger.error('Failed to send password reset email', { email });
      }
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationCode: string, verificationLink: string): Promise<boolean> {
    try {
      const html = verificationTemplate(verificationLink, verificationCode);
      const sent = await this.sendEmail(email, 'Verifica tu correo - Chiribito', html);
      if (sent) {
        logger.info('Verification email sent', { email, verificationCode });
      }
      return sent;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to send verification email', { email, error: error.message });
      } else {
        logger.error('Failed to send verification email', { email });
      }
      return false;
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      const appUrl = process.env.FRONTEND_URL || 'https://chiribito.com';
      const html = welcomeTemplate(username, appUrl);
      const sent = await this.sendEmail(email, '¡Bienvenido a Chiribito!', html);
      if (sent) {
        logger.info('Welcome email sent', { email, username });
      }
      return sent;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to send welcome email', { email, error: error.message });
      } else {
        logger.error('Failed to send welcome email', { email });
      }
      return false;
    }
  }
}

export const emailService = new EmailService();
