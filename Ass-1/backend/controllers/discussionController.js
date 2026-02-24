const DiscussionMessage = require("../models/Discussion");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

// Get discussion messages for an event
const getDiscussionMessages = async (req, res) => {
	try {
		const { eventId } = req.params;
		const { parentId, page = 1, limit = 50 } = req.query;

		// Check if event exists
		const event = await Event.findById(eventId);
		if (!event) {
			return res.status(404).json({ message: "Event not found" });
		}

		// Build query
		const query = {
			event: eventId,
			isDeleted: false,
		};

		// If parentId is provided, get replies, otherwise get top-level messages
		if (parentId) {
			query.parentMessage = parentId;
		} else {
			query.parentMessage = null;
		}

		// Get messages with pagination
		const messages = await DiscussionMessage.find(query)
			.sort({ isPinned: -1, createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit))
			.populate("replyCount")
			.lean();

		// Add user's reaction to each message
		const userId = req.user.id;
		messages.forEach((msg) => {
			const userReaction = msg.reactions?.find(
				(r) => r.user.toString() === userId.toString(),
			);
			msg.userReaction = userReaction?.emoji || null;
			msg.reactionCounts = {};
			msg.reactions?.forEach((r) => {
				msg.reactionCounts[r.emoji] = (msg.reactionCounts[r.emoji] || 0) + 1;
			});
			delete msg.reactions; // Don't expose all reactions data
		});

		const total = await DiscussionMessage.countDocuments(query);

		res.json({
			messages,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error getting discussion messages:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Post a new message
const postMessage = async (req, res) => {
	try {
		const { eventId } = req.params;
		const { content, parentMessage, messageType = "message" } = req.body;
		const userId = req.user.id;

		// Check if event exists
		const event = await Event.findById(eventId);
		if (!event) {
			return res.status(404).json({ message: "Event not found" });
		}

		// Check if user is registered for the event (participants only)
		if (req.user.role === "participant") {
			const registration = await Registration.findOne({
				event: eventId,
				participant: userId,
				status: { $in: ["confirmed", "pending"] },
			});

			if (!registration) {
				return res.status(403).json({
					message:
						"You must be registered for this event to participate in discussions",
				});
			}
		}

		// If replying, check parent exists
		if (parentMessage) {
			const parent = await DiscussionMessage.findById(parentMessage);
			if (!parent || parent.isDeleted) {
				return res.status(404).json({ message: "Parent message not found" });
			}
			if (parent.parentMessage) {
				return res.status(400).json({
					message:
						"Cannot reply to a reply. Reply to the parent message instead.",
				});
			}
		}

		// Determine author info
		const isOrganizer = req.user.role === "organizer";
		let authorName;
		if (isOrganizer) {
			authorName = req.user.clubName || req.user.email;
		} else {
			authorName = req.user.name || req.user.email;
		}

		const message = new DiscussionMessage({
			event: eventId,
			author: userId,
			authorModel: isOrganizer ? "Organizer" : "User",
			authorName,
			isOrganizer,
			content,
			parentMessage: parentMessage || null,
			messageType: isOrganizer ? messageType : "message", // Only organizers can post announcements
		});

		await message.save();

		// Get the message with virtual fields
		const savedMessage = await DiscussionMessage.findById(message._id)
			.populate("replyCount")
			.lean();

		savedMessage.userReaction = null;
		savedMessage.reactionCounts = {};

		// Emit socket event for real-time update
		const io = req.app.get("io");
		if (io) {
			io.to(`event:${eventId}`).emit("new_message", {
				message: savedMessage,
				parentMessage: parentMessage || null,
			});
		}

		res.status(201).json({
			message: "Message posted successfully",
			data: savedMessage,
		});
	} catch (error) {
		console.error("Error posting message:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Edit a message (only by author within 5 minutes)
const editMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { content } = req.body;
		const userId = req.user.id;

		const message = await DiscussionMessage.findById(messageId);
		if (!message || message.isDeleted) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Check ownership
		if (message.author.toString() !== userId.toString()) {
			return res
				.status(403)
				.json({ message: "You can only edit your own messages" });
		}

		// Check time limit (5 minutes)
		const fiveMinutes = 5 * 60 * 1000;
		if (Date.now() - message.createdAt > fiveMinutes) {
			return res.status(400).json({
				message: "Messages can only be edited within 5 minutes of posting",
			});
		}

		message.content = content;
		await message.save();

		// Emit socket event
		const io = req.app.get("io");
		if (io) {
			io.to(`event:${message.event}`).emit("message_updated", {
				messageId: message._id,
				content: message.content,
			});
		}

		res.json({ message: "Message updated successfully", data: message });
	} catch (error) {
		console.error("Error editing message:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Delete a message (author or organizer)
const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user.id;
		const isOrganizer = req.user.role === "organizer";

		const message = await DiscussionMessage.findById(messageId);
		if (!message || message.isDeleted) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Check if user can delete (author or event organizer)
		const isAuthor = message.author.toString() === userId.toString();
		let canDelete = isAuthor;

		if (!canDelete && isOrganizer) {
			// Check if this organizer owns the event
			const event = await Event.findById(message.event);
			if (event && event.organizer.toString() === userId.toString()) {
				canDelete = true;
			}
		}

		if (!canDelete) {
			return res.status(403).json({
				message:
					"You can only delete your own messages or messages in your events",
			});
		}

		// Soft delete
		message.isDeleted = true;
		message.deletedAt = new Date();
		message.deletedBy = userId;
		message.deletedByModel = isOrganizer ? "Organizer" : "User";
		await message.save();

		// Emit socket event
		const io = req.app.get("io");
		if (io) {
			io.to(`event:${message.event}`).emit("message_deleted", {
				messageId: message._id,
			});
		}

		res.json({ message: "Message deleted successfully" });
	} catch (error) {
		console.error("Error deleting message:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Toggle reaction on a message
const toggleReaction = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { emoji } = req.body;
		const userId = req.user.id;

		const validEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉"];
		if (!validEmojis.includes(emoji)) {
			return res.status(400).json({ message: "Invalid emoji" });
		}

		const message = await DiscussionMessage.findById(messageId);
		if (!message || message.isDeleted) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Check if user already reacted with same emoji
		const existingReaction = message.reactions.find(
			(r) => r.user.toString() === userId.toString() && r.emoji === emoji,
		);

		if (existingReaction) {
			// Remove reaction
			await message.removeReaction(userId);
		} else {
			// Add or update reaction
			await message.addReaction(userId, emoji);
		}

		// Get updated reaction counts
		const updatedMessage = await DiscussionMessage.findById(messageId).lean();
		const reactionCounts = {};
		updatedMessage.reactions.forEach((r) => {
			reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
		});

		const userReaction = updatedMessage.reactions.find(
			(r) => r.user.toString() === userId.toString(),
		);

		// Emit socket event
		const io = req.app.get("io");
		if (io) {
			io.to(`event:${message.event}`).emit("reaction_updated", {
				messageId: message._id,
				reactionCounts,
			});
		}

		res.json({
			message: existingReaction ? "Reaction removed" : "Reaction added",
			reactionCounts,
			userReaction: userReaction?.emoji || null,
		});
	} catch (error) {
		console.error("Error toggling reaction:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Pin/unpin a message (organizer only)
const togglePinMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user.id;

		const message = await DiscussionMessage.findById(messageId);
		if (!message || message.isDeleted) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Check if organizer owns the event
		const event = await Event.findById(message.event);
		if (!event || event.organizer.toString() !== userId.toString()) {
			return res.status(403).json({
				message: "Only the event organizer can pin messages",
			});
		}

		// Toggle pin
		message.isPinned = !message.isPinned;
		if (message.isPinned) {
			message.pinnedAt = new Date();
			message.pinnedBy = userId;
		} else {
			message.pinnedAt = null;
			message.pinnedBy = null;
		}
		await message.save();

		// Emit socket event
		const io = req.app.get("io");
		if (io) {
			io.to(`event:${message.event}`).emit("message_pinned", {
				messageId: message._id,
				isPinned: message.isPinned,
			});
		}

		res.json({
			message: message.isPinned ? "Message pinned" : "Message unpinned",
			isPinned: message.isPinned,
		});
	} catch (error) {
		console.error("Error toggling pin:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	getDiscussionMessages,
	postMessage,
	editMessage,
	deleteMessage,
	toggleReaction,
	togglePinMessage,
};
