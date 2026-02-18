/**
 * Email Service
 * Handles transactional email delivery via nodemailer.
 * Falls back gracefully when SMTP is not configured.
 */

const nodemailer = require('nodemailer');
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
 * @param {Object} opts - { to, subject, html, text }
 * @returns {Promise<boolean>} true if sent, false on failure
 */
const sendEmail = async ({ to, subject, html, text }) => {
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
    // e.g. "Felicity Events <ujjwal.pg.gupta@gmail.com>"
    // Fall back to wrapping the bare user address if 'from' is somehow empty.
    const fromAddress = config.email.from
      || (config.email.user ? `"Felicity Events" <${config.email.user}>` : '"Felicity Events" <noreply@felicity.local>');

    const info = await t.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
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

/**
 * Send organizer welcome email with auto-generated credentials.
 */
const sendOrganizerCredentialsEmail = async (organizer, credentials) => {
  const { loginEmail, temporaryPassword } = credentials;

  const html = `
    <div style="font-family: 'Consolas', 'Courier New', monospace; background:#0b0f0d; color:#e6f2ec; padding:40px; border-radius:12px; max-width:600px; margin:auto;">
      <div style="background:linear-gradient(135deg,#1b7f5f,#27a57a); border-radius:10px; padding:24px 28px; margin-bottom:28px;">
        <h1 style="margin:0; font-size:22px; color:#eafff6;">Welcome to Felicity Events</h1>
        <p style="margin:6px 0 0; color:#a7f3d0; font-size:14px;">Your organizer account has been created.</p>
      </div>

      <p style="color:#b2c7bf;">Hello <strong style="color:#e6f2ec;">${organizer.name}</strong>,</p>
      <p style="color:#b2c7bf;">An admin has provisioned an organizer account for you on the Felicity Event Management Platform. Use the credentials below to log in.</p>

      <div style="background:#121b17; border:1px solid #23312b; border-radius:10px; padding:20px 24px; margin:24px 0;">
        <p style="margin:0 0 12px; font-size:13px; color:#8aa39a; text-transform:uppercase; letter-spacing:.5px;">Login Credentials</p>
        <p style="margin:0 0 8px;"><span style="color:#8aa39a;">Login Email:</span> <strong style="color:#3ddc97;">${loginEmail}</strong></p>
        <p style="margin:0;"><span style="color:#8aa39a;">Temporary Password:</span> <strong style="color:#3ddc97;">${temporaryPassword}</strong></p>
      </div>

      <p style="color:#b2c7bf;"><strong style="color:#e6f2ec;">Important:</strong> Please change your password after your first login.</p>

      <div style="border-top:1px solid #23312b; margin-top:32px; padding-top:16px;">
        <p style="margin:0; font-size:12px; color:#8aa39a;">Felicity Event Management System &mdash; IIIT Hyderabad</p>
      </div>
    </div>
  `;

  const text = `
Welcome to Felicity Events, ${organizer.name}!

Your organizer account has been created.

Login Email: ${loginEmail}
Temporary Password: ${temporaryPassword}

Please log in and change your password immediately.

Felicity Event Management System – IIIT Hyderabad
  `.trim();

  return sendEmail({
    to: organizer.contactEmail,
    subject: 'Your Felicity Organizer Account Credentials',
    html,
    text,
  });
};

/**
 * Send password reset approval email with new temporary password.
 */
const sendPasswordResetApprovedEmail = async (organizer, temporaryPassword) => {
  const html = `
    <div style="font-family: 'Consolas', 'Courier New', monospace; background:#0b0f0d; color:#e6f2ec; padding:40px; border-radius:12px; max-width:600px; margin:auto;">
      <div style="background:linear-gradient(135deg,#1b7f5f,#27a57a); border-radius:10px; padding:24px 28px; margin-bottom:28px;">
        <h1 style="margin:0; font-size:22px; color:#eafff6;">Password Reset Approved</h1>
        <p style="margin:6px 0 0; color:#a7f3d0; font-size:14px;">Your password reset request has been processed.</p>
      </div>

      <p style="color:#b2c7bf;">Hello <strong style="color:#e6f2ec;">${organizer.name}</strong>,</p>
      <p style="color:#b2c7bf;">Your password reset request has been approved. Your account password has been updated.</p>

      <div style="background:#121b17; border:1px solid #23312b; border-radius:10px; padding:20px 24px; margin:24px 0;">
        <p style="margin:0 0 12px; font-size:13px; color:#8aa39a; text-transform:uppercase; letter-spacing:.5px;">New Login Credentials</p>
        <p style="margin:0 0 8px;"><span style="color:#8aa39a;">Login Email:</span> <strong style="color:#3ddc97;">${organizer.loginEmail}</strong></p>
        <p style="margin:0;"><span style="color:#8aa39a;">New Temporary Password:</span> <strong style="color:#3ddc97;">${temporaryPassword}</strong></p>
      </div>

      <p style="color:#b2c7bf;"><strong style="color:#e6f2ec;">Important:</strong> Please log in with this new password and change it immediately for security.</p>

      <div style="border-top:1px solid #23312b; margin-top:32px; padding-top:16px;">
        <p style="margin:0; font-size:12px; color:#8aa39a;">Felicity Event Management System &mdash; IIIT Hyderabad</p>
      </div>
    </div>
  `;

  const text = `
Password Reset Approved

Hello ${organizer.name},

Your password reset request has been approved.

New Login Credentials:
Login Email: ${organizer.loginEmail}
New Temporary Password: ${temporaryPassword}

Please log in with this new password and change it immediately for security.

Felicity Event Management System – IIIT Hyderabad
  `.trim();

  return sendEmail({
    to: organizer.contactEmail,
    subject: 'Password Reset Approved - Felicity Events',
    html,
    text,
  });
};

/**
 * Send password reset rejection email with admin comment.
 */
const sendPasswordResetRejectedEmail = async (organizer, adminComment) => {
  const html = `
    <div style="font-family: 'Consolas', 'Courier New', monospace; background:#0b0f0d; color:#e6f2ec; padding:40px; border-radius:12px; max-width:600px; margin:auto;">
      <div style="background:linear-gradient(135deg,#8b3a3e,#b44749); border-radius:10px; padding:24px 28px; margin-bottom:28px;">
        <h1 style="margin:0; font-size:22px; color:#ffe6e6;">Password Reset Request Declined</h1>
        <p style="margin:6px 0 0; color:#ffcccc; font-size:14px;">Your request has been reviewed by an administrator.</p>
      </div>

      <p style="color:#b2c7bf;">Hello <strong style="color:#e6f2ec;">${organizer.name}</strong>,</p>
      <p style="color:#b2c7bf;">Unfortunately, your password reset request has been declined by an administrator.</p>

      ${adminComment ? `
      <div style="background:#1a1212; border:1px solid #3d2323; border-radius:10px; padding:20px 24px; margin:24px 0;">
        <p style="margin:0 0 12px; font-size:13px; color:#c88a8a; text-transform:uppercase; letter-spacing:.5px;">Administrator's Comment</p>
        <p style="margin:0; color:#e6c7c7; line-height:1.6;">${adminComment}</p>
      </div>
      ` : ''}

      <p style="color:#b2c7bf;">If you believe this was an error or need further assistance, please contact the system administrator directly.</p>

      <div style="border-top:1px solid #23312b; margin-top:32px; padding-top:16px;">
        <p style="margin:0; font-size:12px; color:#8aa39a;">Felicity Event Management System &mdash; IIIT Hyderabad</p>
      </div>
    </div>
  `;

  const text = `
Password Reset Request Declined

Hello ${organizer.name},

Unfortunately, your password reset request has been declined by an administrator.

${adminComment ? `Administrator's Comment:\n${adminComment}\n\n` : ''}If you believe this was an error or need further assistance, please contact the system administrator directly.

Felicity Event Management System – IIIT Hyderabad
  `.trim();

  return sendEmail({
    to: organizer.contactEmail,
    subject: 'Password Reset Request Declined - Felicity Events',
    html,
    text,
  });
};

/**
 * Send registration confirmation + ticket to a participant.
 */
const sendRegistrationConfirmationEmail = async (participant, event, ticket) => {
  const startDate = event.startDate
    ? new Date(event.startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : 'TBA';
  const endDate = event.endDate
    ? new Date(event.endDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : 'TBA';

  const html = `
    <div style="font-family:'Consolas','Courier New',monospace;background:#0b0f0d;color:#e6f2ec;padding:40px;border-radius:12px;max-width:600px;margin:auto;">
      <div style="background:linear-gradient(135deg,#1d6a40,#2e9e62);border-radius:10px;padding:24px 28px;margin-bottom:28px;">
        <h1 style="margin:0;font-size:22px;color:#ecfdf5;">Registration Confirmed!</h1>
        <p style="margin:6px 0 0;color:#a7f3d0;font-size:14px;">Your ticket is ready for ${event.name}</p>
      </div>

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
        <p style="margin:8px 0 0;font-size:12px;color:#8aa39a;">Show this ID or QR code at the event entrance</p>
      </div>

      <p style="color:#b2c7bf;">Please keep this email as your registration proof. We look forward to seeing you at the event!</p>

      <div style="border-top:1px solid #23312b;margin-top:32px;padding-top:16px;">
        <p style="margin:0;font-size:12px;color:#8aa39a;">Felicity Event Management System &mdash; IIIT Hyderabad</p>
      </div>
    </div>
  `;

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

Felicity Event Management System – IIIT Hyderabad
  `.trim();

  return sendEmail({
    to: participant.email,
    subject: `Registration Confirmed – ${event.name}`,
    html,
    text,
  });
};

module.exports = {
  sendEmail,
  sendOrganizerCredentialsEmail,
  sendPasswordResetApprovedEmail,
  sendPasswordResetRejectedEmail,
  sendRegistrationConfirmationEmail,
};

