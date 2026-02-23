const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		emoji: {
			type: String,
			required: true,
			enum: ["👍", "❤️", "😂", "😮", "😢", "🎉"],
		},
	},
	{ _id: false },
);

const discussionMessageSchema = new mongoose.Schema(
	{
		event: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
			index: true,
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			refPath: "authorModel",
			required: true,
		},
		authorModel: {
			type: String,
			required: true,
			enum: ["User", "Organizer"],
		},
		authorName: {
			type: String,
			required: true,
		},
		isOrganizer: {
			type: Boolean,
			default: false,
		},
		content: {
			type: String,
			required: [true, "Message content is required"],
			maxlength: [2000, "Message cannot exceed 2000 characters"],
			trim: true,
		},
		// For threaded replies
		parentMessage: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "DiscussionMessage",
			default: null,
		},
		// Reactions
		reactions: [reactionSchema],
		// Message type
		messageType: {
			type: String,
			enum: ["message", "announcement", "question"],
			default: "message",
		},
		// Pinned by organizer
		isPinned: {
			type: Boolean,
			default: false,
		},
		pinnedAt: Date,
		pinnedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Organizer",
		},
		// Soft delete
		isDeleted: {
			type: Boolean,
			default: false,
		},
		deletedAt: Date,
		deletedBy: {
			type: mongoose.Schema.Types.ObjectId,
			refPath: "deletedByModel",
		},
		deletedByModel: {
			type: String,
			enum: ["User", "Organizer"],
		},
	},
	{
		timestamps: true,
	},
);

// Indexes for efficient queries
discussionMessageSchema.index({ event: 1, createdAt: -1 });
discussionMessageSchema.index({ event: 1, isPinned: -1, createdAt: -1 });
discussionMessageSchema.index({ parentMessage: 1 });

// Virtual for reply count
discussionMessageSchema.virtual("replyCount", {
	ref: "DiscussionMessage",
	localField: "_id",
	foreignField: "parentMessage",
	count: true,
});

// Method to add reaction
discussionMessageSchema.methods.addReaction = function (userId, emoji) {
	// Remove existing reaction from this user
	this.reactions = this.reactions.filter(
		(r) => r.user.toString() !== userId.toString(),
	);
	// Add new reaction
	this.reactions.push({ user: userId, emoji });
	return this.save();
};

// Method to remove reaction
discussionMessageSchema.methods.removeReaction = function (userId) {
	this.reactions = this.reactions.filter(
		(r) => r.user.toString() !== userId.toString(),
	);
	return this.save();
};

const DiscussionMessage = mongoose.model(
	"DiscussionMessage",
	discussionMessageSchema,
);

module.exports = DiscussionMessage;
