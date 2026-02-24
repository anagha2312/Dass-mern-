const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
	{
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
		// Star rating 1-5
		rating: {
			type: Number,
			required: [true, "Rating is required"],
			min: 1,
			max: 5,
		},
		// Text-based comments
		comment: {
			type: String,
			trim: true,
			maxlength: [1000, "Comment cannot exceed 1000 characters"],
		},
		// Anonymous - participant identity hidden from organizers
		isAnonymous: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
);

// Compound index to ensure one feedback per participant per event
feedbackSchema.index({ event: 1, participant: 1 }, { unique: true });

// Index for event queries
feedbackSchema.index({ event: 1, rating: 1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
