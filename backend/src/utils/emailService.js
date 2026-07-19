/**
 * Email Service
 * Handles transactional email delivery via nodemailer.
 * Falls back gracefully when SMTP is not configured.
 */

const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const config = require('../config/env');

let transporter = null;
let transporterReady = false;

/**
 * Initialise or return the existing transporter.
 * If real SMTP is configured → use it.
 * Otherwise → lazily create a free Nodemailer Ethereal test account so
 * emails are actually delivered and can be inspected at https://ethereal.email
 */
const initTransporter = async () => {
  if (transporterReady) return transporter;

  if (config.email.host && config.email.user) {
    // Production / manually configured SMTP
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
    transporterReady = true;
    console.log('[EmailService] Using configured SMTP:', config.email.host);
  } else {
    // Fallback: spin up a free Ethereal test account automatically
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      transporterReady = true;
      console.log('[EmailService] No SMTP configured – using Ethereal test account.');
      console.log(`[EmailService] Ethereal user: ${testAccount.user}`);
      console.log('[EmailService] Preview emails at https://ethereal.email/messages');
    } catch (err) {
      console.warn('[EmailService] Could not create Ethereal account:', err.message);
      transporter = null;
      transporterReady = false;
    }
  }

  return transporter;
};

/**
 * Send an email.
 * @param {Object} opts - { to, subject, html, text, attachments? }
 * @returns {Promise<boolean>} true if sent, false on failure
 */
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const t = await initTransporter();

  if (!t) {
    // Last-resort fallback: just log
    console.log('\n─────────────────────────────────────────');
    console.log(`[Email] TO: ${to}`);
    console.log(`[Email] SUBJECT: ${subject}`);
    console.log(`[Email] BODY:\n${text || html}`);
    console.log('─────────────────────────────────────────\n');
    return { sent: false, previewUrl: null };
  }

  try {
    // config.email.from is already a fully-formatted address string,
    // e.g. "Convene <ujjwal.pg.gupta@gmail.com>"
    // Fall back to wrapping the bare user address if 'from' is somehow empty.
    const fromAddress = config.email.from
      || (config.email.user ? `"Convene" <${config.email.user}>` : '"Convene" <noreply@convene.app>');

    const info = await t.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
      ...(attachments && attachments.length > 0 && { attachments }),
    });

    console.log(`[EmailService] Email sent to ${to} – Message ID: ${info.messageId}`);

    // If using Ethereal, log the preview URL prominently
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('\n══════════════════════════════════════════════════════');
      console.log(`[EmailService] ⚠  DEVELOPMENT MODE – Email not delivered to real inbox`);
      console.log(`[EmailService] 📧 Preview the email sent to "${to}" at:`);
      console.log(`[EmailService]    ${previewUrl}`);
      console.log('══════════════════════════════════════════════════════\n');
      return { sent: true, previewUrl };
    }

    return { sent: true, previewUrl: null };
  } catch (err) {
    console.error('[EmailService] Failed to send email:', err.message);
    return { sent: false, previewUrl: null };
  }
};

/** Shared HTML shell for transactional emails — keeps every template visually consistent. */
const emailShell = ({ headerGradient, headerTitle, headerSubtitle, bodyHtml }) => `
  <div style="font-family:'Inter',Arial,sans-serif;background:#0b0f0d;color:#e6f2ec;padding:40px;border-radius:12px;max-width:600px;margin:auto;">
    <div style="background:${headerGradient};border-radius:10px;padding:24px 28px;margin-bottom:28px;">
      <h1 style="margin:0;font-size:22px;color:#eafff6;">${headerTitle}</h1>
      <p style="margin:6px 0 0;color:#a7f3d0;font-size:14px;">${headerSubtitle}</p>
    </div>
    ${bodyHtml}
    <div style="border-top:1px solid #23312b;margin-top:32px;padding-top:16px;">
      <p style="margin:0;font-size:12px;color:#8aa39a;">Convene &mdash; Event Management</p>
    </div>
  </div>
`;

/**
 * Send organizer welcome email with auto-generated credentials.
 */
const sendOrganizerCredentialsEmail = async (organizer, credentials) => {
  const { loginEmail, temporaryPassword } = credentials;

  const html = emailShell({
    headerGradient: 'linear-gradient(135deg,#1b7f5f,#27a57a)',
    headerTitle: 'Welcome to Convene',
    headerSubtitle: 'Your organizer account has been created.',
    bodyHtml: `
      <p style="color:#b2c7bf;">Hello <strong style="color:#e6f2ec;">${organizer.name}</strong>,</p>
      <p style="color:#b2c7bf;">An admin has provisioned an organizer account for you on Convene. Use the credentials below to log in.</p>
      <div style="background:#121b17;border:1px solid #23312b;border-radius:10px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 12px;font-size:13px;color:#8aa39a;text-transform:uppercase;letter-spacing:.5px;">Login Credentials</p>
        <p style="margin:0 0 8px;"><span style="color:#8aa39a;">Login Email:</span> <strong style="color:#3ddc97;">${loginEmail}</strong></p>
        <p style="margin:0;"><span style="color:#8aa39a;">Temporary Password:</span> <strong style="color:#3ddc97;">${temporaryPassword}</strong></p>
      </div>
      <p style="color:#b2c7bf;"><strong style="color:#e6f2ec;">Important:</strong> Please change your password after your first login.</p>
    `
  });

  const text = `
Welcome to Convene, ${organizer.name}!

Your organizer account has been created.

Login Email: ${loginEmail}
Temporary Password: ${temporaryPassword}

Please log in and change your password immediately.

Convene — Event Management
  `.trim();

  return sendEmail({
    to: organizer.contactEmail,
    subject: 'Your Convene Organizer Account Credentials',
    html,
    text,
  });
};

/**
 * Send a self-service password reset link (used for both participants and organizers).
 */
const sendPasswordResetEmail = async (toEmail, name, resetUrl) => {
  const html = emailShell({
    headerGradient: 'linear-gradient(135deg,#1b7f5f,#27a57a)',
    headerTitle: 'Reset Your Password',
    headerSubtitle: 'We received a request to reset your Convene password.',
    bodyHtml: `
      <p style="color:#b2c7bf;">Hello${name ? ` <strong style="color:#e6f2ec;">${name}</strong>` : ''},</p>
      <p style="color:#b2c7bf;">Click the button below to choose a new password. This link expires in 1 hour and can only be used once.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1b7f5f,#27a57a);color:#eafff6;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px;">Reset Password</a>
      </div>
      <p style="color:#8aa39a;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color:#3ddc97;word-break:break-all;">${resetUrl}</a>
      </p>
      <p style="color:#b2c7bf;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>
    `
  });

  const text = `
Reset Your Password

Hello${name ? ` ${name}` : ''},

We received a request to reset your Convene password. Use the link below within
the next hour to choose a new one:

${resetUrl}

If you didn't request this, you can safely ignore this email.

Convene — Event Management
  `.trim();

  return sendEmail({
    to: toEmail,
    subject: 'Reset your Convene password',
    html,
    text,
  });
};

/**
 * Send registration confirmation + ticket to a participant.
 * Generates a QR code PNG and embeds it inline in the email.
 */
const sendRegistrationConfirmationEmail = async (participant, event, ticket) => {
  const startDate = event.startDate
    ? new Date(event.startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : 'TBA';
  const endDate = event.endDate
    ? new Date(event.endDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : 'TBA';

  // Generate QR code as PNG buffer encoding the unique ticketId
  let qrBuffer = null;
  try {
    qrBuffer = await QRCode.toBuffer(ticket.ticketId, {
      width: 220,
      margin: 2,
      color: { dark: '#0b0f0d', light: '#e6f2ec' }
    });
  } catch (qrErr) {
    console.warn('QR code generation failed (non-fatal):', qrErr.message);
  }

  const html = emailShell({
    headerGradient: 'linear-gradient(135deg,#1d6a40,#2e9e62)',
    headerTitle: 'Registration Confirmed!',
    headerSubtitle: `Your ticket is ready for ${event.name}`,
    bodyHtml: `
      <p style="color:#b2c7bf;">Hello <strong style="color:#e6f2ec;">${participant.name || participant.email}</strong>,</p>
      <p style="color:#b2c7bf;">Your registration has been confirmed. Here are your event and ticket details:</p>

      <div style="background:#111d16;border:1px solid #1e3328;border-radius:10px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 6px;font-size:13px;color:#6fcf97;text-transform:uppercase;letter-spacing:.5px;">Event Details</p>
        <p style="margin:4px 0;color:#e6f2ec;"><strong>Name:</strong> ${event.name}</p>
        <p style="margin:4px 0;color:#b2c7bf;"><strong>Start:</strong> ${startDate}</p>
        <p style="margin:4px 0;color:#b2c7bf;"><strong>End:</strong> ${endDate}</p>
        ${event.venue ? `<p style="margin:4px 0;color:#b2c7bf;"><strong>Venue:</strong> ${event.venue}</p>` : ''}
      </div>

      <div style="background:#0e1f16;border:2px solid #2e9e62;border-radius:10px;padding:20px 24px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#6fcf97;text-transform:uppercase;letter-spacing:.5px;">Your Ticket ID</p>
        <p style="margin:0;font-size:24px;font-family:monospace;font-weight:bold;color:#4ade80;letter-spacing:2px;">${ticket.ticketId}</p>
        ${qrBuffer ? '<img src="cid:ticketqr@convene" width="180" height="180" style="display:block;margin:16px auto 8px;border-radius:8px;" alt="Ticket QR Code" />' : ''}
        <p style="margin:8px 0 0;font-size:12px;color:#8aa39a;">Show this QR code at the event entrance</p>
      </div>

      <p style="color:#b2c7bf;">Please keep this email as your registration proof. We look forward to seeing you at the event!</p>
    `
  });

  const text = `
Registration Confirmed – ${event.name}

Hello ${participant.name || participant.email},

Your registration has been confirmed.

Event: ${event.name}
Start: ${startDate}
End:   ${endDate}
${event.venue ? `Venue: ${event.venue}\n` : ''}
Ticket ID: ${ticket.ticketId}

Please keep this email as your registration proof.

Convene — Event Management
  `.trim();

  return sendEmail({
    to: participant.email,
    subject: `Registration Confirmed – ${event.name}`,
    html,
    text,
    ...(qrBuffer && {
      attachments: [{
        filename: 'ticket-qr.png',
        content: qrBuffer,
        cid: 'ticketqr@convene',
        contentType: 'image/png'
      }]
    })
  });
};

module.exports = {
  sendEmail,
  sendOrganizerCredentialsEmail,
  sendPasswordResetEmail,
  sendRegistrationConfirmationEmail,
};
