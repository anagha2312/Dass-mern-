const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Organizer = require("../models/Organizer");
const Fuse = require("fuse.js");
const { generateTicketQR } = require("../utils/qrService");
const { sendTicketEmail } = require("../utils/emailService");

/**
 * @desc    Browse/Search events with filters
 * @route   GET /api/participant/events
 * @access  Private (Participant only)
 */
const browseEvents = async (req, res) => {
	try {
		const {
			search,
			eventType,
			eligibility,
			startDate,
			endDate,
			followedOnly,
			sort = "eventStartDate",
		} = req.query;

		const participantId = req.user.id;
		const user = await User.findById(participantId);

		let query = {
			status: "published",
		};

		// Build $and conditions for combining search and eligibility
		let andConditions = [];

		// Search: loose DB pre-filter, then Fuse.js fuzzy ranking in-memory
		let fuseSearch = null;
		if (search) {
			const trimmed = search.trim();
			// Escape for regex — broad OR filter to fetch candidates from DB
			const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			andConditions.push({
				$or: [
					{ name: { $regex: escaped, $options: "i" } },
					{ description: { $regex: escaped, $options: "i" } },
					{ tags: { $in: [new RegExp(escaped, "i")] } },
				],
			});
			fuseSearch = trimmed; // save for Fuse.js post-filter
		}

		// Filter by event type
		if (eventType && ["normal", "merchandise"].includes(eventType)) {
			query.eventType = eventType;
		}

		// Filter by eligibility (only when explicitly selected)
		if (
			eligibility &&
			["all", "iiit-only", "non-iiit-only"].includes(eligibility)
		) {
			query.eligibility = eligibility;
		}

		// Apply $and conditions if any
		if (andConditions.length > 0) {
			query.$and = andConditions;
		}

		// Filter by date range
		if (startDate || endDate) {
			query.eventStartDate = {};
			if (startDate) query.eventStartDate.$gte = new Date(startDate);
			if (endDate) query.eventStartDate.$lte = new Date(endDate);
		}

		// Filter by followed organizers
		if (followedOnly === "true" && user.followedOrganizers.length > 0) {
			query.organizer = { $in: user.followedOrganizers };
		}

		// Build sort criteria
		let sortCriteria = {};
		if (sort === "trending") {
			sortCriteria = { last24hViews: -1, viewCount: -1 };
		} else if (sort === "registrationDeadline") {
			sortCriteria = { registrationDeadline: 1 };
		} else {
			sortCriteria = { eventStartDate: 1 };
		}

		let events = await Event.find(query)
			.sort(sortCriteria)
			.populate("organizer", "name category description")
			.limit(200); // Broader fetch for fuzzy re-ranking

		// Apply Fuse.js fuzzy ranking if a search was made
		if (fuseSearch) {
			const fuse = new Fuse(events, {
				keys: [
					{ name: "name", weight: 0.6 },
					{ name: "tags", weight: 0.3 },
					{ name: "description", weight: 0.1 },
				],
				threshold: 0.5,        // 0 = exact, 1 = match anything
				includeScore: true,
				minMatchCharLength: 2,
				ignoreLocation: true,  // match anywhere in the string
			});
			const fuseResults = fuse.search(fuseSearch);
			// Re-order by fuzzy score (lower score = better match)
			events = fuseResults.map((r) => r.item);
		}

		// Add user-specific data (if registered, if following organizer)
		const registrations = await Registration.find({
			participant: participantId,
			event: { $in: events.map((e) => e._id) },
		});

		const registrationMap = {};
		registrations.forEach((reg) => {
			registrationMap[reg.event.toString()] = reg.status;
		});

		// Filter out events whose organizer was deleted
		const validEvents = events.filter((event) => event.organizer != null);

		const eventsWithUserData = validEvents.map((event) => ({
			...event.toObject(),
			isRegistered: !!registrationMap[event._id.toString()],
			registrationStatus: registrationMap[event._id.toString()] || null,
			isFollowingOrganizer: event.organizer
				? user.followedOrganizers.some(
						(id) => id.toString() === event.organizer._id.toString(),
					)
				: false,
		}));

		res.status(200).json({
			success: true,
			count: eventsWithUserData.length,
			data: eventsWithUserData,
		});
	} catch (error) {
		console.error("Browse events error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching events",
		});
	}
};

/**
 * @desc    Get trending events (top 5 by 24h views)
 * @route   GET /api/participant/events/trending
 * @access  Private (Participant only)
 */
const getTrendingEvents = async (req, res) => {
	try {
		const participantId = req.user.id;
		const user = await User.findById(participantId);

		const events = await Event.find({
			status: "published",
			registrationDeadline: { $gte: new Date() },
			$or: [
				{ eligibility: "all" },
				{
					eligibility:
						user.participantType === "iiit" ? "iiit-only" : "non-iiit-only",
				},
			],
		})
			.sort({ last24hViews: -1, viewCount: -1 })
			.limit(5)
			.populate("organizer", "name category");

		res.status(200).json({
			success: true,
			count: events.length,
			data: events,
		});
	} catch (error) {
		console.error("Get trending events error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching trending events",
		});
	}
};

/**
 * @desc    Get single event details
 * @route   GET /api/participant/events/:id
 * @access  Private (Participant only)
 */
const getEventDetails = async (req, res) => {
	try {
		const participantId = req.user.id;
		const user = await User.findById(participantId);

		const event = await Event.findOne({
			_id: req.params.id,
			status: "published",
		}).populate("organizer", "name category description contactEmail");

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found",
			});
		}

		// Increment view count
		await event.incrementViewCount();

		// Check if user is registered
		const registration = await Registration.findOne({
			event: event._id,
			participant: participantId,
		});

		const eventData = {
			...event.toObject(),
			isRegistered: !!registration,
			registrationStatus: registration?.status || null,
			userRegistration: registration || null,
			isEligible: event.checkEligibility(user.participantType),
			isFollowingOrganizer: user.followedOrganizers.some(
				(id) => id.toString() === event.organizer._id.toString(),
			),
		};

		res.status(200).json({
			success: true,
			data: eventData,
		});
	} catch (error) {
		console.error("Get event details error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching event details",
		});
	}
};

/**
 * @desc    Register for normal event
 * @route   POST /api/participant/events/:id/register
 * @access  Private (Participant only)
 */
const registerForEvent = async (req, res) => {
	try {
		const participantId = req.user.id;
		const eventId = req.params.id;
		const { formResponses, variantId, quantity } = req.body;

		const user = await User.findById(participantId);
		const event = await Event.findById(eventId).populate(
			"organizer",
			"name contactEmail",
		);

		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found",
			});
		}

		// Validation checks
		if (event.status !== "published") {
			return res.status(400).json({
				success: false,
				message: "Event is not open for registration",
			});
		}

		if (!event.isRegistrationOpen) {
			return res.status(400).json({
				success: false,
				message: "Registration is closed for this event",
			});
		}

		if (!event.checkEligibility(user.participantType)) {
			return res.status(403).json({
				success: false,
				message: "You are not eligible for this event",
			});
		}

		// Check if already registered
		const existingRegistration = await Registration.findOne({
			event: eventId,
			participant: participantId,
		});

		if (existingRegistration) {
			return res.status(400).json({
				success: false,
				message: "You are already registered for this event",
			});
		}

		// Check capacity
		if (!event.hasCapacity) {
			return res.status(400).json({
				success: false,
				message: "Event registration is full",
			});
		}

		// Generate ticket ID
		const ticketId = await Registration.generateTicketId();

		let registrationData = {
			ticketId,
			event: eventId,
			participant: participantId,
			status: "confirmed",
			paymentAmount: event.registrationFee,
		};

		// Handle event-specific registration
		if (event.eventType === "normal") {
			registrationData.formResponses = formResponses || {};
		} else if (event.eventType === "merchandise") {
			// Validate variant and quantity
			const hasVariants = event.merchandise?.variants?.length > 0;

			if (hasVariants && !variantId) {
				return res.status(400).json({
					success: false,
					message: "Please select a variant",
				});
			}

			if (hasVariants) {
				const variant = event.merchandise.variants.id(variantId);
			if (!variant) {
				return res.status(400).json({
					success: false,
					message: "Invalid variant selected",
				});
			}

			const purchaseQty = quantity || 1;

			if (purchaseQty > event.merchandise.purchaseLimit) {
				return res.status(400).json({
					success: false,
					message: `Purchase limit is ${event.merchandise.purchaseLimit} per person`,
				});
			}

			if (variant.stock < purchaseQty) {
				return res.status(400).json({
					success: false,
					message: "Insufficient stock",
				});
			}

			const totalPrice =
				(event.registrationFee + variant.priceModifier) * purchaseQty;

			registrationData.merchandiseDetails = {
				variantId: variant._id,
				variantName: variant.name,
				quantity: purchaseQty,
				totalPrice,
			};
			registrationData.paymentAmount = totalPrice;

				// If merchandise has a fee, it requires payment approval workflow
				if (totalPrice > 0) {
					registrationData.status = "pending";
					registrationData.paymentStatus = "pending";
					// Stock will be deducted and QR generated only after payment approval
				} else {
					// Free merchandise - confirm immediately and deduct stock
					variant.stock -= purchaseQty;
					await event.save();
				}
			} else {
				// No variants — simple merchandise purchase
				const purchaseQty = quantity || 1;
				registrationData.merchandiseDetails = {
					variantName: "Default",
					quantity: purchaseQty,
					totalPrice: event.registrationFee * purchaseQty,
				};
				registrationData.paymentAmount = event.registrationFee * purchaseQty;

				if (registrationData.paymentAmount > 0) {
					registrationData.status = "pending";
					registrationData.paymentStatus = "pending";
				}
			}
		}

		// Create registration
		const registration = await Registration.create(registrationData);

		// Increment event registration count only for confirmed registrations
		if (registration.status === "confirmed") {
			event.currentRegistrations += 1;
			await event.save();
		}

		// Populate registration for response
		await registration.populate(
			"event",
			"name eventStartDate eventEndDate venue",
		);
		await registration.populate("participant", "firstName lastName email");

		// Generate QR code and send email only for confirmed registrations
		if (registration.status === "confirmed") {
			try {
				const qrCode = await generateTicketQR({
					ticketId: registration.ticketId,
					eventId: event._id.toString(),
					participantId: user._id.toString(),
					eventName: event.name,
					participantName: `${user.firstName} ${user.lastName}`,
				});

				registration.qrCode = qrCode;
				await registration.save();
			} catch (qrError) {
				console.error("QR generation error:", qrError);
				// Continue even if QR generation fails
			}

			// Send ticket email
			try {
				console.log("[Email Debug] Sending to:", user.email, "| Name:", user.firstName, user.lastName);
				await sendTicketEmail({
					to: user.email,
					name: `${user.firstName} ${user.lastName}`,
					eventName: event.name,
					eventStart: event.eventStartDate,
					ticketId: registration.ticketId,
					qrCodeText: registration.ticketId,
				});
			} catch (emailError) {
				console.error("Email sending error:", emailError);
				// Continue even if email fails
			}
		}

		// Customize response message based on status
		const responseMessage =
			registration.status === "pending"
				? "Order placed! Please upload payment proof to complete your purchase."
				: "Registration successful! Check your email for the ticket.";

		res.status(201).json({
			success: true,
			message: responseMessage,
			data: registration,
		});
	} catch (error) {
		console.error("Register for event error:", error);
		res.status(500).json({
			success: false,
			message: "Error registering for event",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

/**
 * @desc    Cancel registration
 * @route   DELETE /api/participant/registrations/:id
 * @access  Private (Participant only)
 */
const cancelRegistration = async (req, res) => {
	try {
		const participantId = req.user.id;
		const registrationId = req.params.id;

		const registration = await Registration.findOne({
			_id: registrationId,
			participant: participantId,
		}).populate("event");

		if (!registration) {
			return res.status(404).json({
				success: false,
				message: "Registration not found",
			});
		}

		if (!registration.canBeCancelled()) {
			return res.status(400).json({
				success: false,
				message: "This registration cannot be cancelled",
			});
		}

		registration.status = "cancelled";
		registration.cancelledAt = new Date();
		await registration.save();

		// Restore event capacity
		const event = registration.event;
		if (event) {
			event.currentRegistrations = Math.max(0, event.currentRegistrations - 1);

			// Restore merchandise stock if applicable
			if (
				event.eventType === "merchandise" &&
				registration.merchandiseDetails?.variantId
			) {
				const variant = event.merchandise.variants.id(
					registration.merchandiseDetails.variantId,
				);
				if (variant) {
					variant.stock += registration.merchandiseDetails.quantity;
				}
			}

			await event.save();
		}

		res.status(200).json({
			success: true,
			message: "Registration cancelled successfully",
		});
	} catch (error) {
		console.error("Cancel registration error:", error);
		res.status(500).json({
			success: false,
			message: "Error cancelling registration",
		});
	}
};

/**
 * @desc    Get participant's registrations (My Events)
 * @route   GET /api/participant/registrations
 * @access  Private (Participant only)
 */
const getMyRegistrations = async (req, res) => {
	try {
		const participantId = req.user.id;
		const { status, eventType } = req.query;

		let query = { participant: participantId };

		if (status) {
			query.status = status;
		}

		const registrations = await Registration.find(query)
			.populate({
				path: "event",
				populate: { path: "organizer", select: "name category" },
			})
			.sort({ createdAt: -1 });

		// Filter by event type if specified
		let filteredRegistrations = registrations;
		if (eventType) {
			filteredRegistrations = registrations.filter(
				(reg) => reg.event?.eventType === eventType,
			);
		}

		// Categorize registrations
		const now = new Date();
		const upcoming = [];
		const completed = [];
		const cancelled = [];

		filteredRegistrations.forEach((reg) => {
			if (reg.status === "cancelled" || reg.status === "rejected") {
				cancelled.push(reg);
			} else if (reg.event && reg.event.eventEndDate < now) {
				completed.push(reg);
			} else {
				upcoming.push(reg);
			}
		});

		res.status(200).json({
			success: true,
			data: {
				upcoming,
				completed,
				cancelled,
				all: filteredRegistrations,
			},
		});
	} catch (error) {
		console.error("Get my registrations error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching registrations",
		});
	}
};

/**
 * @desc    Get all organizers (clubs/councils)
 * @route   GET /api/participant/organizers
 * @access  Private (Participant only)
 */
const getAllOrganizers = async (req, res) => {
	try {
		const { category } = req.query;
		const user = await User.findById(req.user.id);

		let query = { isActive: true };

		if (category) {
			query.category = category;
		}

		const organizers = await Organizer.find(query)
			.select("-password")
			.sort({ name: 1 });

		// Get event counts and follow status for each organizer
		const organizersWithCounts = await Promise.all(
			organizers.map(async (organizer) => {
				const upcomingCount = await Event.countDocuments({
					organizer: organizer._id,
					status: "published",
					eventStartDate: { $gte: new Date() },
				});

				const pastCount = await Event.countDocuments({
					organizer: organizer._id,
					status: { $in: ["published", "completed"] },
					eventEndDate: { $lt: new Date() },
				});

				return {
					...organizer.toObject(),
					upcomingEventsCount: upcomingCount,
					pastEventsCount: pastCount,
					isFollowing: user.followedOrganizers.some(
						(id) => id.toString() === organizer._id.toString(),
					),
				};
			}),
		);

		res.status(200).json({
			success: true,
			count: organizersWithCounts.length,
			data: organizersWithCounts,
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
 * @desc    Get organizer details with events
 * @route   GET /api/participant/organizers/:id
 * @access  Private (Participant only)
 */
const getOrganizerDetails = async (req, res) => {
	try {
		const organizer = await Organizer.findOne({
			_id: req.params.id,
			isActive: true,
		}).select("-password");

		if (!organizer) {
			return res.status(404).json({
				success: false,
				message: "Organizer not found",
			});
		}

		// Get upcoming events
		const upcomingEvents = await Event.find({
			organizer: organizer._id,
			status: "published",
			eventStartDate: { $gte: new Date() },
		})
			.sort({ eventStartDate: 1 })
			.limit(10);

		// Get past events
		const pastEvents = await Event.find({
			organizer: organizer._id,
			status: { $in: ["published", "completed"] },
			eventEndDate: { $lt: new Date() },
		})
			.sort({ eventEndDate: -1 })
			.limit(10);

		const user = await User.findById(req.user.id);
		const isFollowing = user.followedOrganizers.some(
			(id) => id.toString() === organizer._id.toString(),
		);

		res.status(200).json({
			success: true,
			data: {
				organizer,
				upcomingEvents,
				pastEvents,
				isFollowing,
			},
		});
	} catch (error) {
		console.error("Get organizer details error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching organizer details",
		});
	}
};

/**
 * @desc    Submit anonymous feedback for attended event
 * @route   POST /api/participant/events/:id/feedback
 * @access  Private (Participant only)
 */
const submitFeedback = async (req, res) => {
	try {
		const participantId = req.user.id;
		const eventId = req.params.id;
		const { rating, comment } = req.body;
		const Feedback = require("../models/Feedback");

		// Verify event exists
		const event = await Event.findById(eventId);
		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found",
			});
		}

		// Verify participant attended this event
		const registration = await Registration.findOne({
			event: eventId,
			participant: participantId,
			attended: true,
		});

		if (!registration) {
			return res.status(400).json({
				success: false,
				message: "You can only submit feedback for events you have attended",
			});
		}

		// Check if feedback already submitted
		const existingFeedback = await Feedback.findOne({
			event: eventId,
			participant: participantId,
		});

		if (existingFeedback) {
			return res.status(400).json({
				success: false,
				message: "You have already submitted feedback for this event",
			});
		}

		// Create feedback
		const feedback = await Feedback.create({
			event: eventId,
			participant: participantId,
			rating,
			comment,
			isAnonymous: true,
		});

		res.status(201).json({
			success: true,
			message: "Feedback submitted successfully",
			data: feedback,
		});
	} catch (error) {
		console.error("Submit feedback error:", error);
		res.status(500).json({
			success: false,
			message: "Error submitting feedback",
		});
	}
};

/**
 * @desc    Generate calendar file (ICS) for event
 * @route   GET /api/participant/events/:id/calendar
 * @access  Private (Participant only)
 */
const getCalendarFile = async (req, res) => {
	try {
		const eventId = req.params.id;

		const event = await Event.findById(eventId).populate("organizer", "name");
		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found",
			});
		}

		// Generate ICS file content
		const formatICSDate = (date) => {
			return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
		};

		const uid = `${event._id}@felicity.iiit.ac.in`;
		const now = new Date();

		const icsContent = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Felicity//Event Management//EN",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
			"BEGIN:VEVENT",
			`UID:${uid}`,
			`DTSTAMP:${formatICSDate(now)}`,
			`DTSTART:${formatICSDate(new Date(event.eventStartDate))}`,
			`DTEND:${formatICSDate(new Date(event.eventEndDate))}`,
			`SUMMARY:${event.name}`,
			`DESCRIPTION:${event.description?.replace(/\n/g, "\\n").substring(0, 500) || ""}`,
			event.venue ? `LOCATION:${event.venue}` : "",
			`ORGANIZER:${event.organizer?.name || "Felicity"}`,
			"STATUS:CONFIRMED",
			"BEGIN:VALARM",
			"TRIGGER:-PT1H",
			"ACTION:DISPLAY",
			"DESCRIPTION:Event reminder",
			"END:VALARM",
			"END:VEVENT",
			"END:VCALENDAR",
		]
			.filter(Boolean)
			.join("\r\n");

		res.setHeader("Content-Type", "text/calendar; charset=utf-8");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${event.name.replace(/[^a-z0-9]/gi, "_")}.ics"`,
		);
		res.send(icsContent);
	} catch (error) {
		console.error("Get calendar file error:", error);
		res.status(500).json({
			success: false,
			message: "Error generating calendar file",
		});
	}
};

/**
 * @desc    Upload payment proof for merchandise
 * @route   POST /api/participant/registrations/:id/payment-proof
 * @access  Private (Participant only)
 */
const uploadPaymentProof = async (req, res) => {
	try {
		const participantId = req.user.id;
		const registrationId = req.params.id;
		const { imageUrl, note } = req.body;

		const registration = await Registration.findOne({
			_id: registrationId,
			participant: participantId,
		}).populate("event");

		if (!registration) {
			return res.status(404).json({
				success: false,
				message: "Registration not found",
			});
		}

		if (registration.event.eventType !== "merchandise") {
			return res.status(400).json({
				success: false,
				message: "Payment proof only required for merchandise events",
			});
		}

		if (registration.paymentStatus === "completed") {
			return res.status(400).json({
				success: false,
				message: "Payment already approved",
			});
		}

		registration.paymentProof = {
			imageUrl,
			uploadedAt: new Date(),
			note,
		};
		registration.paymentStatus = "awaiting_approval";
		registration.paymentApproval = {
			status: "pending",
		};
		await registration.save();

		res.status(200).json({
			success: true,
			message: "Payment proof uploaded successfully. Awaiting approval.",
			data: registration,
		});
	} catch (error) {
		console.error("Upload payment proof error:", error);
		res.status(500).json({
			success: false,
			message: "Error uploading payment proof",
		});
	}
};

/**
 * @desc    Get Google Calendar link for event
 * @route   GET /api/participant/events/:id/google-calendar
 * @access  Private (Participant only)
 */
const getGoogleCalendarLink = async (req, res) => {
	try {
		const eventId = req.params.id;

		const event = await Event.findById(eventId).populate("organizer", "name");
		if (!event) {
			return res.status(404).json({
				success: false,
				message: "Event not found",
			});
		}

		// Format dates for Google Calendar
		const formatGoogleDate = (date) => {
			return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
		};

		const startDate = formatGoogleDate(new Date(event.eventStartDate));
		const endDate = formatGoogleDate(new Date(event.eventEndDate));

		const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description?.substring(0, 500) || "")}&location=${encodeURIComponent(event.venue || "")}&sf=true&output=xml`;

		res.status(200).json({
			success: true,
			data: {
				googleCalendarUrl,
				outlookUrl: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.name)}&startdt=${new Date(event.eventStartDate).toISOString()}&enddt=${new Date(event.eventEndDate).toISOString()}&body=${encodeURIComponent(event.description?.substring(0, 500) || "")}&location=${encodeURIComponent(event.venue || "")}`,
			},
		});
	} catch (error) {
		console.error("Get Google Calendar link error:", error);
		res.status(500).json({
			success: false,
			message: "Error generating calendar link",
		});
	}
};

module.exports = {
	browseEvents,
	getTrendingEvents,
	getEventDetails,
	registerForEvent,
	cancelRegistration,
	getMyRegistrations,
	getAllOrganizers,
	getOrganizerDetails,
	submitFeedback,
	getCalendarFile,
	uploadPaymentProof,
	getGoogleCalendarLink,
};
