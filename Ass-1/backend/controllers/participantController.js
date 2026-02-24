const User = require("../models/User");

/**
 * @desc    Update participant preferences
 * @route   PUT /api/participant/preferences
 * @access  Private (Participant only)
 */
const updatePreferences = async (req, res) => {
	try {
		const { interests, followedOrganizers, onboardingCompleted } = req.body;

		const user = await User.findById(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Update preferences
		if (interests !== undefined) {
			user.interests = interests;
		}
		if (followedOrganizers !== undefined) {
			user.followedOrganizers = followedOrganizers;
		}
		if (onboardingCompleted !== undefined) {
			user.onboardingCompleted = onboardingCompleted;
		}

		await user.save();

		res.status(200).json({
			success: true,
			message: "Preferences updated successfully",
			data: {
				interests: user.interests,
				followedOrganizers: user.followedOrganizers,
				onboardingCompleted: user.onboardingCompleted,
			},
		});
	} catch (error) {
		console.error("Update preferences error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating preferences",
		});
	}
};

/**
 * @desc    Get participant profile
 * @route   GET /api/participant/profile
 * @access  Private (Participant only)
 */
const getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.id)
			.select("-password")
			.populate("followedOrganizers", "name category");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching profile",
		});
	}
};

/**
 * @desc    Update participant profile
 * @route   PUT /api/participant/profile
 * @access  Private (Participant only)
 */
const updateProfile = async (req, res) => {
	try {
		const { firstName, lastName, contactNumber, collegeName, interests } =
			req.body;

		const user = await User.findById(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Update editable fields only
		if (firstName) user.firstName = firstName;
		if (lastName) user.lastName = lastName;
		if (contactNumber !== undefined) user.contactNumber = contactNumber;
		if (collegeName && user.participantType !== "iiit") {
			user.collegeName = collegeName;
		}
		if (interests !== undefined) {
			user.interests = interests;
		}

		await user.save();

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: {
				firstName: user.firstName,
				lastName: user.lastName,
				contactNumber: user.contactNumber,
				collegeName: user.collegeName,
				interests: user.interests,
			},
		});
	} catch (error) {
		console.error("Update profile error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating profile",
		});
	}
};

/**
 * @desc    Follow/Unfollow organizer
 * @route   POST /api/participant/organizers/:id/follow
 * @access  Private (Participant only)
 */
const toggleFollowOrganizer = async (req, res) => {
	try {
		const organizerId = req.params.id;

		const user = await User.findById(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		const isFollowing = user.followedOrganizers.includes(organizerId);

		if (isFollowing) {
			// Unfollow
			user.followedOrganizers = user.followedOrganizers.filter(
				(id) => id.toString() !== organizerId,
			);
		} else {
			// Follow
			user.followedOrganizers.push(organizerId);
		}

		await user.save();

		res.status(200).json({
			success: true,
			message: isFollowing ? "Unfollowed successfully" : "Following now",
			isFollowing: !isFollowing,
		});
	} catch (error) {
		console.error("Toggle follow error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating follow status",
		});
	}
};

module.exports = {
	updatePreferences,
	getProfile,
	updateProfile,
	toggleFollowOrganizer,
};
