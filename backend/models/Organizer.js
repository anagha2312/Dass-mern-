const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const organizerSchema = new mongoose.Schema(
	{
		// Authentication fields
		loginEmail: {
			type: String,
			required: [true, "Login email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
			select: false,
		},

		// Profile fields
		name: {
			type: String,
			required: [true, "Organizer name is required"],
			trim: true,
		},
		category: {
			type: String,
			required: [true, "Category is required"],
			enum: ["technical", "cultural", "sports", "literary", "gaming", "other"],
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			maxlength: [1000, "Description cannot exceed 1000 characters"],
		},
		contactEmail: {
			type: String,
			trim: true,
			lowercase: true,
		},
		contactNumber: {
			type: String,
			trim: true,
		},

		// Discord webhook for event notifications
		discordWebhook: {
			type: String,
			trim: true,
		},

		// Status
		isActive: {
			type: Boolean,
			default: true,
		},

		// Admin who created this organizer
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		// For password reset workflow
		passwordResetRequested: {
			type: Boolean,
			default: false,
		},
		passwordResetReason: {
			type: String,
			trim: true,
		},
		passwordResetRequestedAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
	},
);

// Hash password before saving
organizerSchema.pre("save", async function () {
	if (!this.isModified("password")) {
		return;
	}

	const salt = await bcrypt.genSalt(12);
	this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
organizerSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

const Organizer = mongoose.model("Organizer", organizerSchema);

module.exports = Organizer;
