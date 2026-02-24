const User = require("../models/User");
const Organizer = require("../models/Organizer");
const { sendTokenResponse } = require("../middleware/auth");

/**
 * @desc    Register participant
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerParticipant = async (req, res) => {
	try {
		const { email, password, firstName, lastName, contactNumber, collegeName } =
			req.body;

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User with this email already exists",
			});
		}

		// Check if email is also used by an organizer
		const existingOrganizer = await Organizer.findOne({ loginEmail: email });
		if (existingOrganizer) {
			return res.status(400).json({
				success: false,
				message: "Email is already in use",
			});
		}

		// Determine participant type based on email domain
		const isIIIT = User.isIIITEmail(email);
		const participantType = isIIIT ? "iiit" : "non-iiit";

		// Create user
		const user = await User.create({
			email,
			password,
			firstName,
			lastName,
			contactNumber,
			collegeName: isIIIT ? "IIIT Hyderabad" : collegeName,
			participantType,
			role: "participant",
		});

		// Send token response
		sendTokenResponse(user, 201, res, "participant");
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({
			success: false,
			message: "Error registering user",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

/**
 * @desc    Login user (participant/admin/organizer)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// First, check if it's an organizer
		let organizer = await Organizer.findOne({ loginEmail: email }).select(
			"+password",
		);
		if (organizer) {
			// Check if organizer is active
			if (!organizer.isActive) {
				return res.status(401).json({
					success: false,
					message: "Your account has been deactivated. Please contact admin.",
				});
			}

			// Verify password
			const isMatch = await organizer.comparePassword(password);
			if (!isMatch) {
				return res.status(401).json({
					success: false,
					message: "Invalid credentials",
				});
			}

			return sendTokenResponse(organizer, 200, res, "organizer");
		}

		// Check if it's a user (participant or admin)
		const user = await User.findOne({ email }).select("+password");
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		// Verify password
		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		sendTokenResponse(user, 200, res, user.role);
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			message: "Error logging in",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

/**
 * @desc    Logout user - clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
	try {
		res.cookie("token", "none", {
			expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
			httpOnly: true,
		});

		res.status(200).json({
			success: true,
			message: "Logged out successfully",
		});
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({
			success: false,
			message: "Error logging out",
		});
	}
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
	try {
		let userData;

		if (req.user.role === "organizer") {
			const organizer = await Organizer.findById(req.user.id);
			if (!organizer) {
				return res.status(404).json({
					success: false,
					message: "Organizer not found",
				});
			}
			userData = {
				id: organizer._id,
				email: organizer.loginEmail,
				role: "organizer",
				name: organizer.name,
				category: organizer.category,
				description: organizer.description,
				contactEmail: organizer.contactEmail,
				contactNumber: organizer.contactNumber,
			};
		} else {
			const user = await User.findById(req.user.id).populate(
				"followedOrganizers",
				"name category",
			);
			if (!user) {
				return res.status(404).json({
					success: false,
					message: "User not found",
				});
			}
			userData = {
				id: user._id,
				email: user.email,
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName,
				participantType: user.participantType,
				contactNumber: user.contactNumber,
				collegeName: user.collegeName,
				interests: user.interests,
				followedOrganizers: user.followedOrganizers,
				onboardingCompleted: user.onboardingCompleted,
			};
		}

		res.status(200).json({
			success: true,
			user: userData,
		});
	} catch (error) {
		console.error("GetMe error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching user data",
		});
	}
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		let entity;
		if (req.user.role === "organizer") {
			entity = await Organizer.findById(req.user.id).select("+password");
		} else {
			entity = await User.findById(req.user.id).select("+password");
		}

		if (!entity) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Verify current password
		const isMatch = await entity.comparePassword(currentPassword);
		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Current password is incorrect",
			});
		}

		// Update password
		entity.password = newPassword;
		await entity.save();

		res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error("Change password error:", error);
		res.status(500).json({
			success: false,
			message: "Error changing password",
		});
	}
};

/**
 * @desc    Request password reset for organizers
 * @route   POST /api/auth/request-password-reset
 * @access  Public
 */
const requestPasswordReset = async (req, res) => {
	try {
		const { email, reason } = req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: "Email is required",
			});
		}

		// Find organizer by email
		const organizer = await Organizer.findOne({ loginEmail: email });

		if (!organizer) {
			// Don't reveal if email exists or not for security
			return res.status(200).json({
				success: true,
				message:
					"If an account with this email exists, a password reset request has been submitted to the admin.",
			});
		}

		// Check if already requested
		if (organizer.passwordResetRequested) {
			return res.status(400).json({
				success: false,
				message:
					"A password reset request is already pending. Please wait for admin to process it.",
			});
		}

		// Set password reset request flags
		organizer.passwordResetRequested = true;
		organizer.passwordResetReason = reason || "Password forgotten";
		organizer.passwordResetRequestedAt = new Date();
		await organizer.save();

		res.status(200).json({
			success: true,
			message:
				"Password reset request submitted. Admin will review and reset your password.",
		});
	} catch (error) {
		console.error("Request password reset error:", error);
		res.status(500).json({
			success: false,
			message: "Error submitting password reset request",
		});
	}
};

module.exports = {
	registerParticipant,
	login,
	logout,
	getMe,
	changePassword,
	requestPasswordReset,
};
