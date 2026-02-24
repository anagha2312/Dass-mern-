const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
			select: false, // Don't include password in queries by default
		},
		role: {
			type: String,
			enum: ["participant", "admin"],
			default: "participant",
		},
		participantType: {
			type: String,
			enum: ["iiit", "non-iiit"],
			required: function () {
				return this.role === "participant";
			},
		},
		firstName: {
			type: String,
			required: function () {
				return this.role === "participant";
			},
			trim: true,
		},
		lastName: {
			type: String,
			required: function () {
				return this.role === "participant";
			},
			trim: true,
		},
		contactNumber: {
			type: String,
			trim: true,
		},
		collegeName: {
			type: String,
			trim: true,
		},
		// Preferences
		interests: [
			{
				type: String,
				trim: true,
			},
		],
		followedOrganizers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Organizer",
			},
		],
		// Onboarding status
		onboardingCompleted: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

// Hash password before saving
userSchema.pre("save", async function () {
	// Only hash if password is modified
	if (!this.isModified("password")) {
		return;
	}

	// Hash password with bcrypt (cost factor 12)
	const salt = await bcrypt.genSalt(12);
	this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user is IIIT student
userSchema.methods.isIIITStudent = function () {
	return this.participantType === "iiit";
};

// Static method to check if email is IIIT email
userSchema.statics.isIIITEmail = function (email) {
	const iiitDomains = [
		"iiit.ac.in",
		"students.iiit.ac.in",
		"research.iiit.ac.in",
	];
	const domain = email.split("@")[1];
	return iiitDomains.includes(domain);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
