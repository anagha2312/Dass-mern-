const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Organizer = require("../models/Organizer");
const bcrypt = require("bcryptjs");

/**
 * @desc    Create new event
 * @route   POST /api/organizer/events
 * @access  Private (Organizer only)
 */
const createEvent = async (req, res) => {
	try {
		const organizerId = req.user.id;

		const eventData = {
			...req.body,
			organizer: organizerId,
		};

		// Strip empty string dates (drafts may not have dates yet)
		["registrationDeadline", "eventStartDate", "eventEndDate"].forEach((key) => {
			if (eventData[key] === "" || eventData[key] === null) {
				delete eventData[key];
			}
		});

		// Validation for event dates
		const { registrationDeadline, eventStartDate, eventEndDate, status } = req.body;

		// Only enforce date ordering for non-draft events
		if (status !== "draft") {
			if (new Date(registrationDeadline) >= new Date(eventStartDate)) {
				return res.status(400).json({
					success: false,
					message: "Registration deadline must be before event start date",
				});
			}

			if (new Date(eventStartDate) >= new Date(eventEndDate)) {
				return res.status(400).json({
					success: false,
					message: "Event start date must be before event end date",
				});
			}
		}

		const event = await Event.create(eventData);

		// Send Discord webhook notification if event is published
		if (event.status === "published") {
			try {
				const organizer = await Organizer.findById(organizerId);
				if (organizer && organizer.discordWebhook) {
					const eventUrl = `${process.env.FRONTEND_URL || "https://mernfront-lemon.vercel.app"}/events/${event._id}`;
					const message = {
						embeds: [
							{
								title: `🎉 New Event: ${event.name}`,
								description:
									event.description?.substring(0, 200) +
									(event.description?.length > 200 ? "..." : ""),
								color: 0x6366f1,
								fields: [
									{
										name: "📅 Event Date",
										value: new Date(event.eventStartDate).toLocaleDateString(
											"en-US",
											{
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
											},
										),
										inline: true,
									},
									{
										name: "📍 Venue",
										value: event.venue || "TBA",
										inline: true,
									},
									{
										name: "💰 Fee",
										value:
											event.registrationFee > 0
												? `₹${event.registrationFee}`
												: "Free",
										inline: true,
									},
								],
								url: eventUrl,
								footer: {
									text: `Organized by ${organizer.name}`,
								},
								timestamp: new Date().toISOString(),
							},
						],
					};

					await fetch(organizer.discordWebhook, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(message),
					});
				}
			} catch (webhookError) {
				console.error("Discord webhook error:", webhookError);
			}
		}

		res.status(201).json({
			success: true,
			message: "Event created successfully",
			data: event,
		});
	} catch (error) {
		console.error("Create event error:", error);
		res.status(500).json({
			success: false,
			message: "Error creating event",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

/**
 * @desc    Get all events for organizer
 * @route   GET /api/organizer/events
 * @access  Private (Organizer only)
 */
const getOrganizerEvents = async (req, res) => {
	try {
		const organizerId = req.user.id;
		const { status, eventType } = req.query;

		let query = { organizer: organizerId };

		if (status) {
			query.status = status;
		}

		if (eventType) {
			query.eventType = eventType;
		}

		const events = await Event.find(query)
			.sort({ createdAt: -1 })
			.populate("organizer", "name category");

		res.status(200).json({
			success: true,
			count: events.length,
			data: events,
		});
	} catch (error) {
		console.error("Get organizer events error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching events",
		});
	}
};

/**
 * @desc    Get single event (organizer view)
 * @route   GET /api/organizer/events/:id
 * @access  Private (Organizer only)
 */
const getOrganizerEvent = async (req, res) => {
	try {
		const organizerId = req.user.id;
		const event = await Event.findOne({
			_id: req.params.id,
			organizer: organizerId,
		}).populate("organizer", "name category contactEmail");

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found or you don't have permission to view it",
			});
		}

		res.status(200).json({
			success: true,
			data: event,
		});
	} catch (error) {
		console.error("Get event error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching event",
		});
	}
};

/**
 * @desc    Update event
 * @route   PUT /api/organizer/events/:id
 * @access  Private (Organizer only)
 */
const updateEvent = async (req, res) => {
	try {
		const organizerId = req.user.id;

		const event = await Event.findOne({
			_id: req.params.id,
			organizer: organizerId,
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found or you don't have permission to update it",
			});
		}

		const currentStatus = event.status;
		const now = new Date();

		// Strip empty-string dates from request body to prevent overwriting valid dates with ""
		["registrationDeadline", "eventStartDate", "eventEndDate"].forEach((key) => {
			if (req.body[key] === "" || req.body[key] === null) {
				delete req.body[key];
			}
		});

		// Check if event is ongoing (started but not ended) — guard against null dates on drafts
		const isOngoing =
			event.eventStartDate &&
			event.eventEndDate &&
			event.eventStartDate <= now &&
			event.eventEndDate > now;

		// Define allowed updates based on status
		let allowedUpdates = [];

		if (currentStatus === "draft") {
			// Draft: free edits
			allowedUpdates = [
				"name",
				"description",
				"eligibility",
				"registrationDeadline",
				"eventStartDate",
				"eventEndDate",
				"registrationLimit",
				"registrationFee",
				"tags",
				"customForm",
				"merchandise",
				"status",
				"venue",
				"imageUrl",
				"externalLinks",
			];
		} else if (currentStatus === "published" && !isOngoing) {
			// Published (not ongoing): limited edits
			allowedUpdates = [
				"description",
				"status",
				"venue",
				"imageUrl",
				"externalLinks",
			];

			// Can extend deadline (but not shorten)
			if (req.body.registrationDeadline) {
				const newDeadline = new Date(req.body.registrationDeadline);
				if (newDeadline > event.registrationDeadline) {
					event.registrationDeadline = newDeadline;
				}
			}

			// Can increase limit (but not decrease)
			if (req.body.registrationLimit) {
				if (req.body.registrationLimit > (event.registrationLimit || 0)) {
					event.registrationLimit = req.body.registrationLimit;
				}
			}

			// Check if form has registrations - if so, lock customForm
			const hasRegistrations = await Registration.countDocuments({
				event: event._id,
				status: { $in: ["confirmed", "pending"] },
			});

			if (hasRegistrations === 0 && req.body.customForm !== undefined) {
				event.customForm = req.body.customForm;
			}
		} else if (isOngoing || currentStatus === "completed") {
			// Ongoing/Completed: only status changes allowed
			allowedUpdates = ["status"];
		} else if (currentStatus === "cancelled") {
			return res.status(400).json({
				success: false,
				message: "Cannot edit a cancelled event",
			});
		}

		const wasPublished = event.status === "published";

		// Apply allowed updates
		allowedUpdates.forEach((field) => {
			if (req.body[field] !== undefined) {
				event[field] = req.body[field];
			}
		});

		// If publishing (draft → published), validate dates
		if (event.status === "published" && currentStatus === "draft") {
			const rd = event.registrationDeadline;
			const es = event.eventStartDate;
			const ee = event.eventEndDate;
			if (!rd || !es || !ee) {
				return res.status(400).json({
					success: false,
					message: "Cannot publish: registration deadline, start date, and end date are required",
				});
			}
			if (new Date(rd) >= new Date(es)) {
				return res.status(400).json({
					success: false,
					message: "Registration deadline must be before event start date",
				});
			}
			if (new Date(es) >= new Date(ee)) {
				return res.status(400).json({
					success: false,
					message: "Event start date must be before event end date",
				});
			}
		}

		await event.save();

		// Send Discord webhook notification when event is published for the first time
		if (!wasPublished && event.status === "published") {
			try {
				const organizer = await Organizer.findById(organizerId);
				if (organizer && organizer.discordWebhook) {
					const eventUrl = `${process.env.FRONTEND_URL || "https://mernfront-lemon.vercel.app"}/events/${event._id}`;
					const message = {
						embeds: [
							{
								title: `🎉 New Event: ${event.name}`,
								description:
									event.description?.substring(0, 200) +
									(event.description?.length > 200 ? "..." : ""),
								color: 0x6366f1, // primary color
								fields: [
									{
										name: "📅 Event Date",
										value: new Date(event.eventStartDate).toLocaleDateString(
											"en-US",
											{
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
											},
										),
										inline: true,
									},
									{
										name: "📍 Venue",
										value: event.venue || "TBA",
										inline: true,
									},
									{
										name: "💰 Fee",
										value:
											event.registrationFee > 0
												? `₹${event.registrationFee}`
												: "Free",
										inline: true,
									},
								],
								url: eventUrl,
								footer: {
									text: `Organized by ${organizer.name}`,
								},
								timestamp: new Date().toISOString(),
							},
						],
					};

					await fetch(organizer.discordWebhook, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(message),
					});
				}
			} catch (webhookError) {
				console.error("Discord webhook error:", webhookError);
				// Don't fail the update if webhook fails
			}
		}

		res.status(200).json({
			success: true,
			message: "Event updated successfully",
			data: event,
		});
	} catch (error) {
		console.error("Update event error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating event",
		});
	}
};

/**
 * @desc    Delete event
 * @route   DELETE /api/organizer/events/:id
 * @access  Private (Organizer only)
 */
const deleteEvent = async (req, res) => {
	try {
		const organizerId = req.user.id;

		const event = await Event.findOne({
			_id: req.params.id,
			organizer: organizerId,
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found or you don't have permission to delete it",
			});
		}

		// Check if event has registrations
		const registrationCount = await Registration.countDocuments({
			event: event._id,
			status: { $in: ["confirmed", "pending"] },
		});

		if (registrationCount > 0) {
			return res.status(400).json({
				success: false,
				message: `Cannot delete event with ${registrationCount} active registrations. Please cancel the event instead.`,
			});
		}

		await event.deleteOne();

		res.status(200).json({
			success: true,
			message: "Event deleted successfully",
		});
	} catch (error) {
		console.error("Delete event error:", error);
		res.status(500).json({
			success: false,
			message: "Error deleting event",
		});
	}
};

/**
 * @desc    Get event registrations
 * @route   GET /api/organizer/events/:id/registrations
 * @access  Private (Organizer only)
 */
const getEventRegistrations = async (req, res) => {
	try {
		const organizerId = req.user.id;
		const { status } = req.query;

		// Verify organizer owns this event
		const event = await Event.findOne({
			_id: req.params.id,
			organizer: organizerId,
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found or you don't have permission to view it",
			});
		}

		let query = { event: event._id };

		if (status) {
			query.status = status;
		}

		const registrations = await Registration.find(query)
			.populate(
				"participant",
				"firstName lastName email contactNumber collegeName",
			)
			.sort({ createdAt: -1 });

		// Transform participant to user for frontend compatibility
		const transformedRegistrations = registrations.map((reg) => {
			const regObj = reg.toObject();
			regObj.user = regObj.participant;
			return regObj;
		});

		res.status(200).json({
			success: true,
			count: transformedRegistrations.length,
			data: transformedRegistrations,
		});
	} catch (error) {
		console.error("Get event registrations error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching registrations",
		});
	}
};

/**
 * @desc    Update registration status
 * @route   PUT /api/organizer/events/:eventId/registrations/:registrationId
 * @access  Private (Organizer only)
 */
const updateRegistrationStatus = async (req, res) => {
	try {
		const organizerId = req.user.id;
		const { eventId, registrationId } = req.params;
		const { status } = req.body;

		// Verify organizer owns this event
		const event = await Event.findOne({
			_id: eventId,
			organizer: organizerId,
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found or you don't have permission",
			});
		}

		const registration = await Registration.findOne({
			_id: registrationId,
			event: eventId,
		});

		if (!registration) {
			return res.status(404).json({
				success: false,
				message: "Registration not found",
			});
		}

		registration.status = status;
		await registration.save();

		res.status(200).json({
			success: true,
			message: "Registration status updated successfully",
			data: registration,
		});
	} catch (error) {
		console.error("Update registration status error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating registration status",
		});
	}
};

/**
 * @desc    Get organizer dashboard stats
 * @route   GET /api/organizer/dashboard
 * @access  Private (Organizer only)
 */
const getDashboardStats = async (req, res) => {
	try {
		const organizerId = req.user.id;

		// Get event counts
		const totalEvents = await Event.countDocuments({ organizer: organizerId });
		const activeEvents = await Event.countDocuments({
			organizer: organizerId,
			status: "published",
			eventEndDate: { $gte: new Date() },
		});
		const draftEvents = await Event.countDocuments({
			organizer: organizerId,
			status: "draft",
		});

		// Get registration counts
		const events = await Event.find({ organizer: organizerId });
		const eventIds = events.map((e) => e._id);

		const totalRegistrations = await Registration.countDocuments({
			event: { $in: eventIds },
			status: { $in: ["confirmed", "pending", "approved"] },
		});

		// Get upcoming events
		const upcomingEvents = await Event.find({
			organizer: organizerId,
			status: "published",
			eventStartDate: { $gte: new Date() },
		})
			.limit(5)
			.sort({ eventStartDate: 1 });

		res.status(200).json({
			success: true,
			data: {
				stats: {
					totalEvents,
					activeEvents,
					draftEvents,
					totalRegistrations,
				},
				upcomingEvents,
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
 * @desc    Get organizer profile
 * @route   GET /api/organizer/profile
 * @access  Private (Organizer only)
 */
const getProfile = async (req, res) => {
	try {
		const organizer = await Organizer.findById(req.user.id).select("-password");

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
		console.error("Get profile error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching profile",
		});
	}
};

/**
 * @desc    Update organizer profile
 * @route   PUT /api/organizer/profile
 * @access  Private (Organizer only)
 */
const updateProfile = async (req, res) => {
	try {
		const allowedFields = [
			"name",
			"description",
			"category",
			"contactEmail",
			"contactNumber",
			"discordWebhook",
		];

		const updates = {};
		allowedFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				updates[field] = req.body[field];
			}
		});

		const organizer = await Organizer.findByIdAndUpdate(req.user.id, updates, {
			new: true,
			runValidators: true,
		}).select("-password");

		if (!organizer) {
			return res.status(404).json({
				success: false,
				message: "Organizer not found",
			});
		}

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: organizer,
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
 * @desc    Change organizer password
 * @route   PUT /api/organizer/change-password
 * @access  Private (Organizer only)
 */
const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: "Please provide current and new password",
			});
		}

		if (newPassword.length < 6) {
			return res.status(400).json({
				success: false,
				message: "New password must be at least 6 characters",
			});
		}

		const organizer = await Organizer.findById(req.user.id).select("+password");

		if (!organizer) {
			return res.status(404).json({
				success: false,
				message: "Organizer not found",
			});
		}

		// Check current password
		const isMatch = await organizer.comparePassword(currentPassword);

		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Current password is incorrect",
			});
		}

		// Set new password - pre-save hook will hash it
		organizer.password = newPassword;
		await organizer.save();

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
 * @desc    Mark attendance for registration
 * @route   PUT /api/organizer/events/:eventId/registrations/:registrationId/attendance
 * @access  Private (Organizer only)
 */
const markAttendance = async (req, res) => {
	try {
		const organizerId = req.user.id;
		const { eventId, registrationId } = req.params;

		// Verify organizer owns this event
		const event = await Event.findOne({
			_id: eventId,
			organizer: organizerId,
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found or you don't have permission",
			});
		}

		const registration = await Registration.findOne({
			_id: registrationId,
			event: eventId,
		});

		if (!registration) {
			return res.status(404).json({
				success: false,
				message: "Registration not found",
			});
		}

		if (registration.status !== "confirmed") {
			return res.status(400).json({
				success: false,
				message: "Can only mark attendance for confirmed registrations",
			});
		}

		registration.attended = true;
		registration.attendedAt = new Date();
		await registration.save();

		res.status(200).json({
			success: true,
			message: "Attendance marked successfully",
			data: registration,
		});
	} catch (error) {
		console.error("Mark attendance error:", error);
		res.status(500).json({
			success: false,
			message: "Error marking attendance",
		});
	}
};

/**
 * @desc    Get pending payment approvals for merchandise events
 * @route   GET /api/organizer/events/:id/pending-payments
 * @access  Private (Organizer only)
 */
const getPendingPayments = async (req, res) => {
	try {
		const organizerId = req.user.id;

		// Verify organizer owns this event
		const event = await Event.findOne({
			_id: req.params.id,
			organizer: organizerId,
			eventType: "merchandise",
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Merchandise event not found",
			});
		}

		const registrations = await Registration.find({
			event: event._id,
			paymentStatus: "awaiting_approval",
		})
			.populate("participant", "firstName lastName email contactNumber")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: registrations.length,
			data: registrations,
		});
	} catch (error) {
		console.error("Get pending payments error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching pending payments",
		});
	}
};

/**
 * @desc    Approve/Reject merchandise payment
 * @route   PUT /api/organizer/events/:eventId/payments/:registrationId
 * @access  Private (Organizer only)
 */
const handlePaymentApproval = async (req, res) => {
	try {
		const organizerId = req.user.id;
		const { eventId, registrationId } = req.params;
		const { action, comment } = req.body; // action: 'approve' or 'reject'

		// Verify organizer owns this event
		const event = await Event.findOne({
			_id: eventId,
			organizer: organizerId,
			eventType: "merchandise",
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Merchandise event not found",
			});
		}

		const registration = await Registration.findOne({
			_id: registrationId,
			event: eventId,
			paymentStatus: "awaiting_approval",
		}).populate("participant");

		if (!registration) {
			return res.status(404).json({
				success: false,
				message: "Pending payment registration not found",
			});
		}

		if (action === "approve") {
			// Generate QR code
			const { generateTicketQR } = require("../utils/qrService");
			const qrCode = await generateTicketQR({
				ticketId: registration.ticketId,
				eventId: event._id.toString(),
				participantId: registration.participant._id.toString(),
				eventName: event.name,
				participantName: `${registration.participant.firstName} ${registration.participant.lastName}`,
			});

			// Update registration
			registration.paymentStatus = "completed";
			registration.status = "confirmed";
			registration.qrCode = qrCode;
			registration.paymentApproval = {
				status: "approved",
				reviewedBy: organizerId,
				reviewedAt: new Date(),
				comment: comment || "Payment approved",
			};

			// Decrement merchandise stock (wasn't done during pending registration)
			if (registration.merchandiseDetails?.variantId) {
				const variant = event.merchandise.variants.id(
					registration.merchandiseDetails.variantId,
				);
				if (variant) {
					variant.stock -= registration.merchandiseDetails.quantity || 1;
				}
			}

			// Increment event registration count (since it wasn't incremented at pending creation)
			event.currentRegistrations += 1;
			await event.save();

			await registration.save();

			// Send confirmation email
			try {
				const { sendTicketEmail } = require("../utils/emailService");
				const p = registration.participant;
				await sendTicketEmail({
					to: p.email,
					name: `${p.firstName} ${p.lastName}`,
					eventName: event.name,
					eventStart: event.eventStartDate,
					ticketId: registration.ticketId,
					qrCodeText: registration.ticketId,
				});
			} catch (emailError) {
				console.error("Email send error:", emailError);
			}

			res.status(200).json({
				success: true,
				message: "Payment approved successfully",
				data: registration,
			});
		} else if (action === "reject") {
			registration.paymentStatus = "failed";
			registration.status = "rejected";
			registration.paymentApproval = {
				status: "rejected",
				reviewedBy: organizerId,
				reviewedAt: new Date(),
				comment: comment || "Payment rejected",
			};
			await registration.save();

			res.status(200).json({
				success: true,
				message: "Payment rejected",
				data: registration,
			});
		} else {
			return res.status(400).json({
				success: false,
				message: "Invalid action. Use 'approve' or 'reject'",
			});
		}
	} catch (error) {
		console.error("Payment approval error:", error);
		res.status(500).json({
			success: false,
			message: "Error processing payment approval",
		});
	}
};

/**
 * @desc    Scan QR code and validate ticket
 * @route   POST /api/organizer/events/:eventId/scan-qr
 * @access  Private (Organizer only)
 */
const scanQRCode = async (req, res) => {
	try {
		const organizerId = req.user.id;
		const { eventId } = req.params;
		const { qrData, manualTicketId } = req.body;

		// Verify organizer owns this event
		const event = await Event.findOne({
			_id: eventId,
			organizer: organizerId,
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found",
			});
		}

		let ticketId;

		// If manual ticket ID provided
		if (manualTicketId) {
			ticketId = manualTicketId.toUpperCase();
		} else if (qrData) {
			// Parse QR data
			try {
				const parsedData = JSON.parse(qrData);
				ticketId = parsedData.ticketId;

				// Verify event ID matches
				if (parsedData.eventId !== eventId) {
					return res.status(400).json({
						success: false,
						message: "This ticket is for a different event",
					});
				}
			} catch {
				return res.status(400).json({
					success: false,
					message: "Invalid QR code data",
				});
			}
		} else {
			return res.status(400).json({
				success: false,
				message: "QR data or ticket ID required",
			});
		}

		const registration = await Registration.findOne({
			ticketId: ticketId,
			event: eventId,
		}).populate("participant", "firstName lastName email");

		if (!registration) {
			return res.status(404).json({
				success: false,
				message: "Invalid ticket - Registration not found",
			});
		}

		if (registration.status !== "confirmed") {
			return res.status(400).json({
				success: false,
				message: `Ticket status is '${registration.status}' - Cannot mark attendance`,
			});
		}

		// Check for duplicate scan
		if (registration.attended) {
			return res.status(400).json({
				success: false,
				message: "Already checked in",
				alreadyScanned: true,
				scannedAt: registration.attendedAt,
				data: registration,
			});
		}

		// Mark attendance
		registration.attended = true;
		registration.attendedAt = new Date();
		registration.checkedInBy = organizerId;
		await registration.save();

		res.status(200).json({
			success: true,
			message: "Check-in successful",
			data: {
				ticketId: registration.ticketId,
				participant: registration.participant,
				checkedInAt: registration.attendedAt,
			},
		});
	} catch (error) {
		console.error("QR scan error:", error);
		res.status(500).json({
			success: false,
			message: "Error processing QR scan",
		});
	}
};

/**
 * @desc    Get attendance dashboard stats
 * @route   GET /api/organizer/events/:id/attendance
 * @access  Private (Organizer only)
 */
const getAttendanceStats = async (req, res) => {
	try {
		const organizerId = req.user.id;

		const event = await Event.findOne({
			_id: req.params.id,
			organizer: organizerId,
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found",
			});
		}

		const totalRegistrations = await Registration.countDocuments({
			event: event._id,
			status: "confirmed",
		});

		const attendedCount = await Registration.countDocuments({
			event: event._id,
			status: "confirmed",
			attended: true,
		});

		const notAttendedCount = totalRegistrations - attendedCount;

		// Get list with attendance status
		const registrations = await Registration.find({
			event: event._id,
			status: "confirmed",
		})
			.populate("participant", "firstName lastName email")
			.select("ticketId attended attendedAt participant")
			.sort({ attendedAt: -1, createdAt: -1 });

		res.status(200).json({
			success: true,
			data: {
				total: totalRegistrations,
				attended: attendedCount,
				notAttended: notAttendedCount,
				attendanceRate:
					totalRegistrations > 0
						? Math.round((attendedCount / totalRegistrations) * 100)
						: 0,
				registrations,
			},
		});
	} catch (error) {
		console.error("Get attendance stats error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching attendance stats",
		});
	}
};

/**
 * @desc    Get event feedback (for organizers)
 * @route   GET /api/organizer/events/:id/feedback
 * @access  Private (Organizer only)
 */
const getEventFeedback = async (req, res) => {
	try {
		const organizerId = req.user.id;
		const Feedback = require("../models/Feedback");

		const event = await Event.findOne({
			_id: req.params.id,
			organizer: organizerId,
		});

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found",
			});
		}

		const { rating } = req.query;
		let query = { event: event._id };

		if (rating) {
			query.rating = parseInt(rating);
		}

		const feedbacks = await Feedback.find(query)
			.select("-participant") // Anonymous - don't expose participant
			.sort({ createdAt: -1 });

		// Calculate stats
		const stats = await Feedback.aggregate([
			{ $match: { event: event._id } },
			{
				$group: {
					_id: null,
					avgRating: { $avg: "$rating" },
					totalFeedback: { $sum: 1 },
					rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
					rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
					rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
					rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
					rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
				},
			},
		]);

		res.status(200).json({
			success: true,
			data: {
				feedbacks,
				stats: stats[0] || {
					avgRating: 0,
					totalFeedback: 0,
					rating1: 0,
					rating2: 0,
					rating3: 0,
					rating4: 0,
					rating5: 0,
				},
			},
		});
	} catch (error) {
		console.error("Get event feedback error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching feedback",
		});
	}
};

module.exports = {
	createEvent,
	getOrganizerEvents,
	getOrganizerEvent,
	updateEvent,
	deleteEvent,
	getEventRegistrations,
	updateRegistrationStatus,
	getDashboardStats,
	getProfile,
	updateProfile,
	changePassword,
	markAttendance,
	getPendingPayments,
	handlePaymentApproval,
	scanQRCode,
	getAttendanceStats,
	getEventFeedback,
};
