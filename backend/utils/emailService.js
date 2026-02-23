const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
	// For development, use ethereal email or configure your SMTP
	if (process.env.NODE_ENV === "production") {
		return nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT,
			secure: process.env.SMTP_PORT === "465",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});
	} else {
		// For development, log emails to console
		return nodemailer.createTransport({
			host: process.env.SMTP_HOST || "smtp.gmail.com",
			port: process.env.SMTP_PORT || 587,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});
	}
};

/**
 * Send ticket email to participant
 */
const sendTicketEmail = async (registration, event, participant) => {
	try {
		if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
			console.log("Email service not configured. Skipping email send.");
			console.log("Ticket details:", {
				ticketId: registration.ticketId,
				event: event.name,
				participant: `${participant.firstName} ${participant.lastName}`,
			});
			return { success: true, message: "Email service not configured" };
		}

		const transporter = createTransporter();

		// Format event dates
		const startDate = new Date(event.eventStartDate).toLocaleString("en-US", {
			dateStyle: "long",
			timeStyle: "short",
		});
		const endDate = new Date(event.eventEndDate).toLocaleString("en-US", {
			dateStyle: "long",
			timeStyle: "short",
		});

		// Build email content
		let emailContent = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
				<div style="background-color: #1f2937; padding: 30px; border-radius: 10px 10px 0 0;">
					<h1 style="color: #10b981; margin: 0; text-align: center;">🎉 Felicity Event Registration</h1>
				</div>
				
				<div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
					<h2 style="color: #1f2937; margin-top: 0;">Hello ${participant.firstName}!</h2>
					
					<p style="color: #4b5563; font-size: 16px;">
						Your registration for <strong>${event.name}</strong> has been confirmed! 🎊
					</p>
					
					<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #1f2937; margin-top: 0;">Event Details</h3>
						<table style="width: 100%; border-collapse: collapse;">
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Event:</td>
								<td style="padding: 8px 0; color: #1f2937;">${event.name}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Organizer:</td>
								<td style="padding: 8px 0; color: #1f2937;">${event.organizer.name}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Start Date:</td>
								<td style="padding: 8px 0; color: #1f2937;">${startDate}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #6b7280; font-weight: 600;">End Date:</td>
								<td style="padding: 8px 0; color: #1f2937;">${endDate}</td>
							</tr>
							${event.venue ? `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Venue:</td><td style="padding: 8px 0; color: #1f2937;">${event.venue}</td></tr>` : ""}
						</table>
					</div>
					
					<div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
						<h3 style="color: #065f46; margin-top: 0;">Your Ticket ID</h3>
						<p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 10px 0; font-family: monospace;">
							${registration.ticketId}
						</p>
						<p style="color: #065f46; font-size: 14px; margin-bottom: 0;">
							Please keep this ticket ID safe. You'll need it for event check-in.
						</p>
					</div>
		`;

		// Add merchandise details if applicable
		if (event.eventType === "merchandise" && registration.merchandiseDetails) {
			emailContent += `
				<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
					<h3 style="color: #92400e; margin-top: 0;">Purchase Details</h3>
					<p style="color: #92400e;"><strong>Item:</strong> ${registration.merchandiseDetails.variantName}</p>
					<p style="color: #92400e;"><strong>Quantity:</strong> ${registration.merchandiseDetails.quantity}</p>
					<p style="color: #92400e;"><strong>Total Amount:</strong> ₹${registration.merchandiseDetails.totalPrice}</p>
				</div>
			`;
		}

		// Add QR code if available
		if (registration.qrCode) {
			emailContent += `
				<div style="text-align: center; margin: 30px 0;">
					<h3 style="color: #1f2937;">Your Event Ticket QR Code</h3>
					<img src="${registration.qrCode}" alt="Ticket QR Code" style="max-width: 200px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px;"/>
					<p style="color: #6b7280; font-size: 14px;">Present this QR code at the event venue for check-in</p>
				</div>
			`;
		}

		emailContent += `
					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
						<p style="color: #6b7280; font-size: 14px;">
							If you have any questions, please contact the organizer at 
							<a href="mailto:${event.organizer.contactEmail}" style="color: #10b981;">${event.organizer.contactEmail}</a>
						</p>
						<p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
							This is an automated email. Please do not reply to this email.
						</p>
					</div>
				</div>
			</div>
		`;

		const mailOptions = {
			from: `"Felicity" <${process.env.SMTP_USER}>`,
			to: participant.email,
			subject: `Event Registration Confirmed - ${event.name}`,
			html: emailContent,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("Email sent:", info.messageId);

		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("Error sending email:", error);
		return { success: false, error: error.message };
	}
};

/**
 * Send password reset email to organizer
 */
const sendPasswordResetEmail = async (organizer, newPassword) => {
	try {
		if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
			console.log("Email service not configured. Skipping email send.");
			return { success: true, message: "Email service not configured" };
		}

		const transporter = createTransporter();

		const emailContent = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
				<div style="background-color: #1f2937; padding: 30px; border-radius: 10px 10px 0 0;">
					<h1 style="color: #10b981; margin: 0;">🔐 Password Reset - Felicity</h1>
				</div>
				
				<div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
					<h2 style="color: #1f2937;">Hello ${organizer.name}!</h2>
					
					<p style="color: #4b5563; font-size: 16px;">
						Your password has been reset by the admin. Here are your new login credentials:
					</p>
					
					<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<p style="color: #1f2937;"><strong>Email:</strong> ${organizer.loginEmail}</p>
						<p style="color: #1f2937;"><strong>New Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${newPassword}</code></p>
					</div>
					
					<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
						<p style="color: #991b1b; margin: 0; font-size: 14px;">
							⚠️ Please change your password after logging in for security purposes.
						</p>
					</div>
					
					<p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
						If you didn't request this password reset, please contact the admin immediately.
					</p>
				</div>
			</div>
		`;

		const mailOptions = {
			from: `"Felicity Admin" <${process.env.SMTP_USER}>`,
			to: organizer.loginEmail,
			subject: "Password Reset - Felicity Event Management",
			html: emailContent,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("Password reset email sent:", info.messageId);

		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("Error sending password reset email:", error);
		return { success: false, error: error.message };
	}
};

module.exports = {
	sendTicketEmail,
	sendPasswordResetEmail,
};
