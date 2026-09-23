const nodemailer = require('nodemailer');

const isProductionEnv = () => {
  const env = String(process.env.NODE_ENV || '').toLowerCase();
  return env === 'production' || env === 'prod';
};

const buildTransport = () => {
  if (isProductionEnv()) {
    return nodemailer.createTransport({
      host: process.env.SENDGRID_HOST || 'smtp.sendgrid.net',
      port: Number(process.env.SENDGRID_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SENDGRID_USERNAME || 'apikey',
        pass: process.env.SENDGRID_PASSWORD || process.env.SENDGRID_API_KEY,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

class Email {
  constructor(user, url = '') {
    this.to = user.email;
    this.firstName = (user.name || 'there').split(' ')[0];
    this.url = url;
    this.from = process.env.EMAIL_FROM || 'Irin Tours <no-reply@irin.tours>';
  }

  newTransport() {
    return buildTransport();
  }

  async send(subject, text, html) {
    await this.newTransport().sendMail({
      from: this.from,
      to: this.to,
      subject,
      text,
      html,
    });
  }

  buildCard({ eyebrow, title, body, ctaText, ctaUrl, closing }) {
    const button = ctaText && ctaUrl
      ? `
        <p style="margin: 28px 0 0;">
          <a href="${ctaUrl}" style="display:inline-block;background:#c9a96e;color:#181310;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px;">
            ${ctaText}
          </a>
        </p>
      `
      : '';

    return `
      <div style="margin:0;background:#f4efe7;padding:32px 0;font-family:Arial,Helvetica,sans-serif;color:#2c241c;">
        <div style="max-width:640px;margin:0 auto;padding:0 20px;">
          <div style="background:#181310;border-radius:24px;padding:32px 28px 28px;border:1px solid rgba(201,169,110,0.15);box-shadow:0 18px 50px rgba(24,19,16,0.12);">
            <p style="margin:0 0 10px;color:#c9a96e;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${eyebrow}</p>
            <h1 style="margin:0 0 16px;color:#fff;font-size:30px;line-height:1.2;">${title}</h1>
            <p style="margin:0;color:#ebe3d5;font-size:16px;line-height:1.7;">${body}</p>
            ${button}
            <p style="margin:28px 0 0;color:#b9afa2;font-size:13px;line-height:1.6;">${closing}</p>
          </div>
        </div>
      </div>
    `;
  }

  getAppUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  }

  async sendWelcome() {
    const subject = 'Welcome to Irin';
    const text = `Welcome to Irin, ${this.firstName}! Your account is ready.`;
    const appUrl = this.getAppUrl();

    const html = this.buildCard({
      eyebrow: 'Welcome',
      title: `Welcome to Irin, ${this.firstName}`,
      body: 'Your account is ready. You can start exploring trips, manage your profile, and pick up right where you left off whenever you log back in.',
      ctaText: 'Open your account',
      ctaUrl: `${appUrl}/login`,
      closing: 'If you did not create this account, you can safely ignore this message.',
    });

    return this.send(subject, text, html);
  }

  async sendPasswordReset() {
    const subject = 'Your password reset token (valid for 10 minutes)';
    const text = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${this.url}`;

    const html = this.buildCard({
      eyebrow: 'Password reset',
      title: 'Reset your password',
      body: `We received a request to reset your password. Use the link below within 10 minutes to continue: <br /><span style="color:#fff;font-weight:700;word-break:break-all;">${this.url}</span>`,
      ctaText: 'Reset password',
      ctaUrl: this.url,
      closing: 'If you did not request a password reset, you can ignore this email and your password will stay unchanged.',
    });

    return this.send(subject, text, html);
  }
}

module.exports = Email;
