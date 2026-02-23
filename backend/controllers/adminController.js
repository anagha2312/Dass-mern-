const Organizer = require("../models/Organizer");
const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

/**
 * @desc    Create new organizer (club/council)
 * @route   POST /api/admin/organizers
 * @access  Private (Admin only)
 */
const createOrganizer = async (req, res) => {
	try {
		const {
			loginEmail,
			password,
			name,
			category,
			description,
			contactEmail,
			contactNumber,
		} = req.body;

		// Check if email already exists
		const existingOrganizer = await Organizer.findOne({ loginEmail });
		if (existingOrganizer) {
			return res.status(400).json({
				success: false,
				message: "An organizer with this email already exists",
			});
		}

		// Also check if email is used by a participant
		const existingUser = await User.findOne({ email: loginEmail });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "This email is already in use by a participant",
			});
		}

		// Create organizer
		const organizer = await Organizer.create({
			loginEmail,
			password,
			name,
			category,
			description,
			contactEmail: contactEmail || loginEmail,
			contactNumber,
			createdBy: req.user.id,
		});

		res.status(201).json({
			success: true,
			message: "Organizer created successfully",
			data: {
				id: organizer._id,
				loginEmail: organizer.loginEmail,
				name: organizer.name,
				category: organizer.category,
				// Return password only once for admin to share
				temporaryPassword: password,
			},
		});
	} catch (error) {
		console.error("Create organizer error:", error);
		res.status(500).json({
			success: false,
			message: "Error creating organizer",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

/**
 * @desc    Get all organizers
 * @route   GET /api/admin/organizers
 * @access  Private (Admin only)
 */
const getAllOrganizers = async (req, res) => {
	try {
		const { status, category } = req.query;

		let query = {};

		if (status === "active") {
			query.isActive = true;
		} else if (status === "inactive") {
			query.isActive = false;
		}

		if (category) {
			query.category = category;
		}

		const organizers = await Organizer.find(query)
			.select("-password")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: organizers.length,
			data: organizers,
		});
	} catch (error) {
		console.error("Get organizers error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching organizers",
		});
	}
};

/**
 * @desc    Get single organizer
 * @route   GET /api/admin/organizers/:id
 * @access  Private (Admin only)
 */
const getOrganizer = async (req, res) => {
	try {
		const organizer = await Organizer.findById(req.params.id).select(
			"-password",
		);

		if (!organizer) {
			return res.status(404).json({
				success: false,
				message: "Organizer not found",
			});
		}

		res.status(200).json({
			success: true,
			data: organizer,
		});
	} catch (error) {
		console.error("Get organizer error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching organizer",
		});
	}
};

/**
 * @desc    Update organizer
 * @route   PUT /api/admin/organizers/:id
 * @access  Private (Admin only)
 */
const updateOrganizer = async (req, res) => {
	try {
		const {
			name,
			category,
			description,
			contactEmail,
			contactNumber,
			isActive,
		} = req.body;

		const organizer = await Organizer.findById(req.params.id);

		if (!organizer) {
			return res.status(404).json({
				success: false,
				message: "Organizer not found",
			});
		}

		// Update fields
		if (name) organizer.name = name;
		if (category) organizer.category = category;
		if (description !== undefined) organizer.description = description;
		if (contactEmail) organizer.contactEmail = contactEmail;
		if (contactNumber !== undefined) organizer.contactNumber = contactNumber;
		if (isActive !== undefined) organizer.isActive = isActive;

		await organizer.save();

		res.status(200).json({
			success: true,
			message: "Organizer updated successfully",
			data: organizer,
		});
	} catch (error) {
		console.error("Update organizer error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating organizer",
		});
	}
};

/**
 * @desc    Delete/Deactivate organizer
 * @route   DELETE /api/admin/organizers/:id
 * @access  Private (Admin only)
 */
const deleteOrganizer = async (req, res) => {
	try {
		const { permanent } = req.query;

		const organizer = await Organizer.findById(req.params.id);

		if (!organizer) {
			return res.status(404).json({
				success: false,
				message: "Organizer not found",
			});
		}

		if (permanent === "true") {
			// Permanently delete
			await Organizer.findByIdAndDelete(req.params.id);
			res.status(200).json({
				success: true,
				message: "Organizer permanently deleted",
			});
		} else {
			// Soft delete - deactivate
			organizer.isActive = false;
			await organizer.save();
			res.status(200).json({
				success: true,
				message: "Organizer deactivated successfully",
			});
		}
	} catch (error) {
		console.error("Delete organizer error:", error);
		res.status(500).json({
			success: false,
			message: "Error deleting organizer",
		});
	}
};

/**
 * @desc    Reset organizer password (by admin)
 * @route   PUT /api/admin/organizers/:id/reset-password
 * @access  Private (Admin only)
 */
const resetOrganizerPassword = async (req, res) => {
	try {
		const password = req.body.password || req.body.newPassword;

		if (!password || password.length < 6) {
			return res.status(400).json({
				success: false,
				message: "Password must be at least 6 characters",
			});
		}

		const organizer = await Organizer.findById(req.params.id);

		if (!organizer) {
			return res.status(404).json({
				success: false,
				message: "Organizer not found",
			});
		}

		// Update password
		organizer.password = password;
		organizer.passwordResetRequested = false;
		organizer.passwordResetReason = null;
		organizer.passwordResetRequestedAt = null;
		await organizer.save();

		res.status(200).json({
			success: true,
			message: "Password reset successfully",
			data: {
				organizerName: organizer.name,
				organizerEmail: organizer.loginEmail,
				// Return new password for admin to share
				newPassword: password,
			},
		});
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({
			success: false,
			message: "Error resetting password",
		});
	}
};

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getDashboardStats = async (req, res) => {
	try {
		const totalOrganizers = await Organizer.countDocuments();
		const activeOrganizers = await Organizer.countDocuments({ isActive: true });
		const pendingPasswordRequests = await Organizer.countDocuments({
			passwordResetRequested: true,
		});
		const totalEvents = await Event.countDocuments();
		const totalRegistrations = await Registration.countDocuments();

		res.status(200).json({
			success: true,
			data: {
				totalOrganizers,
				activeOrganizers,
				pendingPasswordRequests,
				totalEvents,
				totalRegistrations,
			},
		});
	} catch (error) {
		console.error("Get dashboard stats error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching dashboard stats",
		});
	}
};

/**
 * @desc    Get password reset requests
 * @route   GET /api/admin/password-requests
 * @access  Private (Admin only)
 */
const getPasswordRequests = async (req, res) => {
	try {
		const requests = await Organizer.find({ passwordResetRequested: true })
			.select(
				"_id name loginEmail passwordResetReason passwordResetRequestedAt",
			)
			.sort({ passwordResetRequestedAt: -1 });

		// Transform the data
		const formattedRequests = requests.map((org) => ({
			_id: org._id,
			organizerId: org._id,
			organizerName: org.name,
			organizerEmail: org.loginEmail,
			reason: org.passwordResetReason,
			createdAt: org.passwordResetRequestedAt,
		}));

		res.status(200).json({
			success: true,
			data: formattedRequests,
		});
	} catch (error) {
		console.error("Get password requests error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching password requests",
		});
	}
};

/**
 * @desc    Handle password reset request
 * @route   PUT /api/admin/password-requests/:id
 * @access  Private (Admin only)
 */
const handlePasswordRequest = async (req, res) => {
	try {
		const { action, newPassword } = req.body;

		const organizer = await Organizer.findById(req.params.id);

		if (!organizer) {
			return res.status(404).json({
				success: false,
				message: "Organizer not found",
			});
		}

		if (action === "reject") {
			organizer.passwordResetRequested = false;
			organizer.passwordResetReason = null;
			organizer.passwordResetRequestedAt = null;
			await organizer.save();

			res.status(200).json({
				success: true,
				message: "Password request rejected",
			});
		} else if (action === "approve") {
			// Generate new password or use provided one
			const generatedPassword =
				newPassword || Math.random().toString(36).slice(-10) + "A1!";

			organizer.password = generatedPassword;
			organizer.passwordResetRequested = false;
			organizer.passwordResetReason = null;
			organizer.passwordResetRequestedAt = null;
			await organizer.save();

			res.status(200).json({
				success: true,
				message: "Password reset approved and new password generated",
				data: {
					organizerName: organizer.name,
					organizerEmail: organizer.loginEmail,
					newPassword: generatedPassword,
				},
			});
		} else {
			res.status(400).json({
				success: false,
				message: "Invalid action",
			});
		}
	} catch (error) {
		console.error("Handle password request error:", error);
		res.status(500).json({
			success: false,
			message: "Error handling password request",
		});
	}
};

module.exports = {
	createOrganizer,
	getAllOrganizers,
	getOrganizer,
	updateOrganizer,
	deleteOrganizer,
	resetOrganizerPassword,
	getDashboardStats,
	getPasswordRequests,
	handlePasswordRequest,
};
