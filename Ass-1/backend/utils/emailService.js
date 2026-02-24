const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Remove spaces from Gmail App Password (e.g. "nhuv txyx jwrt sodf" → "nhuvtxyxjwrtsodf")
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass
    }
});

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER;

// Core send helper
async function sendMail(to, subject, html, attachments = []) {
    if (!process.env.SMTP_USER || !smtpPass) {
        console.warn('[Mailer] SMTP not configured, skipping email');
        return;
    }
    try {
        await transporter.sendMail({ from: FROM, to, subject, html, attachments });
        console.log(`[Mailer] ✅ Email sent to ${to}: ${subject}`);
    } catch (err) {
        console.error(`[Mailer] ❌ Failed to send to ${to}:`, err.message);
    }
}

// Registration confirmation email with QR code
async function sendTicketEmail({ to, name, eventName, eventStart, ticketId, qrCodeText }) {
    const subject = `Your ticket for ${eventName}`;
    // Generate QR as base64 data URL (works in all email clients, unlike CID)
    const qrDataUrl = await QRCode.toDataURL(qrCodeText || ticketId, { width: 200 });
    const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="background:#3182ce;padding:24px;color:white">
                <h1 style="margin:0;font-size:22px">Felicity Event Management</h1>
                <p style="margin:4px 0 0">Registration Confirmed 🎉</p>
            </div>
            <div style="padding:24px">
                <p>Hi <strong>${name}</strong>,</p>
                <p>You've successfully registered for <strong>${eventName}</strong>.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Event</td><td style="padding:8px;border:1px solid #e2e8f0">${eventName}</td></tr>
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Start Date</td><td style="padding:8px;border:1px solid #e2e8f0">${new Date(eventStart).toLocaleString()}</td></tr>
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Ticket ID</td><td style="padding:8px;border:1px solid #e2e8f0;font-family:monospace">${ticketId}</td></tr>
                </table>
                <div style="text-align:center;margin:16px 0">
                    <p style="margin:0 0 8px;font-weight:bold">Your QR Code</p>
                    <img src="${qrDataUrl}" alt="QR Code" style="width:200px;height:200px;display:block;margin:auto" />
                </div>
                <p style="color:#718096;font-size:13px">Present this QR code at the event entrance. Keep this email for your records.</p>
            </div>
        </div>`;
    await sendMail(to, subject, html);
}

// Merchandise order confirmation (pending approval)
async function sendMerchandiseConfirmationEmail({ to, name, eventName, ticketId, variantLabel, quantity, fee }) {
    const subject = `Merchandise order received – ${eventName}`;
    const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="background:#805ad5;padding:24px;color:white">
                <h1 style="margin:0;font-size:22px">Felicity Event Management</h1>
                <p style="margin:4px 0 0">Order Received – Pending Approval</p>
            </div>
            <div style="padding:24px">
                <p>Hi <strong>${name}</strong>,</p>
                <p>Your order for <strong>${eventName}</strong> merchandise has been received and is awaiting organizer approval.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Ticket ID</td><td style="padding:8px;border:1px solid #e2e8f0;font-family:monospace">${ticketId}</td></tr>
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Variant</td><td style="padding:8px;border:1px solid #e2e8f0">${variantLabel || 'N/A'}</td></tr>
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Quantity</td><td style="padding:8px;border:1px solid #e2e8f0">${quantity}</td></tr>
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Amount</td><td style="padding:8px;border:1px solid #e2e8f0">₹${fee}</td></tr>
                </table>
                <p style="color:#718096;font-size:13px">You'll receive another email once the organizer reviews your payment proof.</p>
            </div>
        </div>`;
    await sendMail(to, subject, html);
}

// Merchandise order approved
async function sendMerchandiseApprovalEmail({ to, name, eventName, ticketId, qrCodeText, organizerComment }) {
    const subject = `Order Approved – ${eventName}`;
    const qrBuffer = await QRCode.toBuffer(qrCodeText || ticketId, { width: 200 });
    const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="background:#38a169;padding:24px;color:white">
                <h1 style="margin:0;font-size:22px">Felicity Event Management</h1>
                <p style="margin:4px 0 0">Order Approved ✅</p>
            </div>
            <div style="padding:24px">
                <p>Hi <strong>${name}</strong>,</p>
                <p>Great news! Your merchandise order for <strong>${eventName}</strong> has been approved.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Ticket ID</td><td style="padding:8px;border:1px solid #e2e8f0;font-family:monospace">${ticketId}</td></tr>
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Organizer Note</td><td style="padding:8px;border:1px solid #e2e8f0">${organizerComment || 'Approved'}</td></tr>
                </table>
                <div style="text-align:center;margin:16px 0">
                    <p style="margin:0 0 8px;font-weight:bold">Your QR Code</p>
                    <img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px" />
                </div>
                <p style="color:#718096;font-size:13px">Present this QR code when collecting your merchandise.</p>
            </div>
        </div>`;
    await sendMail(to, subject, html, [{ filename: 'qrcode.png', content: qrBuffer, cid: 'qrcode' }]);
}

// Merchandise order rejected
async function sendMerchandiseRejectionEmail({ to, name, eventName, organizerComment }) {
    const subject = `Order Rejected – ${eventName}`;
    const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="background:#e53e3e;padding:24px;color:white">
                <h1 style="margin:0;font-size:22px">Felicity Event Management</h1>
                <p style="margin:4px 0 0">Order Rejected ❌</p>
            </div>
            <div style="padding:24px">
                <p>Hi <strong>${name}</strong>,</p>
                <p>Unfortunately, your merchandise order for <strong>${eventName}</strong> has been rejected.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Reason</td><td style="padding:8px;border:1px solid #e2e8f0">${organizerComment || 'Payment proof rejected'}</td></tr>
                </table>
                <p style="color:#718096;font-size:13px">Stock has been restored. You may try purchasing again with a valid payment proof.</p>
            </div>
        </div>`;
    await sendMail(to, subject, html);
}

// Password reset email for organizers
async function sendPasswordResetEmail(organizer, newPassword) {
    const subject = 'Your Felicity Organizer Password Reset';
    const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="background:#2d3748;padding:24px;color:white">
                <h1 style="margin:0;font-size:22px">Felicity Event Management</h1>
                <p style="margin:4px 0 0">🔐 Password Reset</p>
            </div>
            <div style="padding:24px">
                <p>Hi <strong>${organizer.name}</strong>,</p>
                <p>Your password has been reset by the admin. Here are your new login credentials:</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Email</td><td style="padding:8px;border:1px solid #e2e8f0">${organizer.loginEmail}</td></tr>
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">New Password</td><td style="padding:8px;border:1px solid #e2e8f0;font-family:monospace">${newPassword}</td></tr>
                </table>
                <p style="color:#e53e3e;font-size:13px">⚠️ Please change your password after your first login.</p>
            </div>
        </div>`;
    await sendMail(organizer.loginEmail, subject, html);
}

// Organizer credentials email (new account)
async function sendOrganizerCredentialsEmail({ to, organizerName, password }) {
    const subject = 'Your Felicity Organizer Account';
    const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="background:#2d3748;padding:24px;color:white">
                <h1 style="margin:0;font-size:22px">Felicity Event Management</h1>
                <p style="margin:4px 0 0">Your organizer account has been created</p>
            </div>
            <div style="padding:24px">
                <p>Hi <strong>${organizerName}</strong>,</p>
                <p>An admin has created an organizer account for you on Felicity. Here are your login credentials:</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Email</td><td style="padding:8px;border:1px solid #e2e8f0">${to}</td></tr>
                    <tr><td style="padding:8px;background:#f7fafc;font-weight:bold;border:1px solid #e2e8f0">Password</td><td style="padding:8px;border:1px solid #e2e8f0;font-family:monospace">${password}</td></tr>
                </table>
                <p style="color:#e53e3e;font-size:13px">Please change your password after your first login.</p>
            </div>
        </div>`;
    await sendMail(to, subject, html);
}

module.exports = {
    sendTicketEmail,
    sendMerchandiseConfirmationEmail,
    sendMerchandiseApprovalEmail,
    sendMerchandiseRejectionEmail,
    sendPasswordResetEmail,
    sendOrganizerCredentialsEmail
};
