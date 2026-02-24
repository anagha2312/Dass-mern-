const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
	{
		// Core Info
		ticketId: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
		},
		event: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
		},
		participant: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		// Registration Status
		status: {
			type: String,
			enum: ["pending", "confirmed", "cancelled", "rejected", "attended"],
			default: "confirmed",
		},

		// For normal events - custom form responses
		formResponses: {
			type: Map,
			of: mongoose.Schema.Types.Mixed,
		},

		// For merchandise events
		merchandiseDetails: {
			variantId: mongoose.Schema.Types.ObjectId,
			variantName: String,
			quantity: {
				type: Number,
				default: 1,
				min: 1,
			},
			totalPrice: Number,
		},

		// Payment info (placeholder for future payment gateway integration)
		paymentStatus: {
			type: String,
			enum: ["pending", "completed", "failed", "refunded", "awaiting_approval"],
			default: "completed", // Default to completed for now
		},
		paymentAmount: {
			type: Number,
			default: 0,
		},

		// Payment proof for merchandise approval workflow
		paymentProof: {
			imageUrl: String, // Base64 or URL of uploaded payment screenshot
			uploadedAt: Date,
			note: String, // Optional note from participant
		},
		paymentApproval: {
			status: {
				type: String,
				enum: ["pending", "approved", "rejected"],
				default: "pending",
			},
			reviewedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Organizer",
			},
			reviewedAt: Date,
			comment: String, // Approval/rejection comment
		},

		// QR Code for ticket verification
		qrCode: {
			type: String, // Base64 encoded QR code
		},

		// Attendance tracking
		attended: {
			type: Boolean,
			default: false,
		},
		attendedAt: Date,
		checkedInAt: Date,
		checkedInBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Organizer",
		},

		// Cancellation
		cancelledAt: Date,
		cancellationReason: String,
	},
	{
		timestamps: true,
	},
);

// Compound index to prevent duplicate registrations
registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

// Indexes for queries
registrationSchema.index({ participant: 1, status: 1 });
registrationSchema.index({ event: 1, status: 1 });
// Note: ticketId already has unique: true in schema which creates an index

// Generate unique ticket ID
registrationSchema.statics.generateTicketId = async function () {
	const prefix = "FEL";
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	const ticketId = `${prefix}${timestamp}${random}`;

	// Check if ticket ID already exists (very unlikely but good to check)
	const existing = await this.findOne({ ticketId });
	if (existing) {
		return this.generateTicketId(); // Recursive call if duplicate
	}

	return ticketId;
};

// Method to check if registration can be cancelled
registrationSchema.methods.canBeCancelled = function () {
	const event = this.event;
	if (!event) return false;

	// Can't cancel if already attended
	if (this.status === "attended") return false;

	// Can't cancel if event has already started
	const now = new Date();
	if (event.eventStartDate && event.eventStartDate <= now) return false;

	return ["confirmed", "pending"].includes(this.status);
};

// Virtual for getting registration age
registrationSchema.virtual("age").get(function () {
	return Date.now() - this.createdAt.getTime();
});

const Registration = mongoose.model("Registration", registrationSchema);

module.exports = Registration;
