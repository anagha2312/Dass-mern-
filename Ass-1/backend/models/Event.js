const mongoose = require("mongoose");

const formFieldSchema = new mongoose.Schema(
	{
		label: {
			type: String,
			required: true,
			trim: true,
		},
		fieldType: {
			type: String,
			enum: [
				"text",
				"email",
				"number",
				"textarea",
				"select",
				"radio",
				"checkbox",
			],
			required: true,
		},
		placeholder: String,
		options: [String], // For select, radio, checkbox
		required: {
			type: Boolean,
			default: false,
		},
		validation: {
			min: Number,
			max: Number,
			pattern: String,
		},
	},
	{ _id: true },
);

const merchandiseVariantSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true, // e.g., "Small - Black", "Medium - Red"
		},
		size: String,
		color: String,
		additionalInfo: String,
		stock: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		priceModifier: {
			type: Number,
			default: 0, // Additional cost for this variant
		},
	},
	{ _id: true },
);

const eventSchema = new mongoose.Schema(
	{
		// Basic Info
		name: {
			type: String,
			required: [true, "Event name is required"],
			trim: true,
			maxlength: [200, "Event name cannot exceed 200 characters"],
		},
		description: {
			type: String,
			required: [true, "Event description is required"],
			trim: true,
			maxlength: [5000, "Description cannot exceed 5000 characters"],
		},
		eventType: {
			type: String,
			enum: ["normal", "merchandise"],
			required: [true, "Event type is required"],
		},

		// Organizer
		organizer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Organizer",
			required: [true, "Organizer is required"],
		},

		// Eligibility
		eligibility: {
			type: String,
			enum: ["all", "iiit-only", "non-iiit-only"],
			default: "all",
		},

		// Dates (not required at schema level — controller validates on publish)
		registrationDeadline: {
			type: Date,
		},
		eventStartDate: {
			type: Date,
		},
		eventEndDate: {
			type: Date,
		},

		// Registration Limits
		registrationLimit: {
			type: Number,
			min: [1, "Registration limit must be at least 1"],
		},
		currentRegistrations: {
			type: Number,
			default: 0,
			min: 0,
		},

		// Fee
		registrationFee: {
			type: Number,
			default: 0,
			min: [0, "Registration fee cannot be negative"],
		},

		// Tags
		tags: [
			{
				type: String,
				trim: true,
			},
		],

		// Event-specific fields
		customForm: {
			type: [formFieldSchema],
			default: [],
		}, // For normal events

		// Merchandise-specific fields
		merchandise: {
			itemDetails: String,
			variants: [merchandiseVariantSchema],
			totalStock: {
				type: Number,
				min: 0,
			},
			purchaseLimit: {
				type: Number,
				default: 1,
				min: 1,
			},
		},

		// Status
		status: {
			type: String,
			enum: ["draft", "published", "cancelled", "completed"],
			default: "draft",
		},

		// Additional Info
		venue: String,
		imageUrl: String,
		externalLinks: [String],

		// View count for trending
		viewCount: {
			type: Number,
			default: 0,
		},
		last24hViews: {
			type: Number,
			default: 0,
		},
		lastViewReset: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// Virtual for checking if registration is open
eventSchema.virtual("isRegistrationOpen").get(function () {
	const now = new Date();
	return (
		this.status === "published" &&
		this.registrationDeadline > now &&
		(!this.registrationLimit ||
			this.currentRegistrations < this.registrationLimit)
	);
});

// Virtual for checking if event has capacity
eventSchema.virtual("hasCapacity").get(function () {
	if (!this.registrationLimit) return true;
	return this.currentRegistrations < this.registrationLimit;
});

// Virtual for merchandise stock check
eventSchema.virtual("hasMerchandiseStock").get(function () {
	if (this.eventType !== "merchandise") return null;
	return this.merchandise.totalStock > 0;
});

// Indexes for better query performance
eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ eventStartDate: 1, status: 1 });
eventSchema.index({ registrationDeadline: 1, status: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ name: "text", description: "text" }); // Text search
eventSchema.index({ last24hViews: -1 }); // For trending

// Method to increment view count
eventSchema.methods.incrementViewCount = async function () {
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	// Reset 24h counter if last reset was more than 24h ago
	if (this.lastViewReset < oneDayAgo) {
		this.last24hViews = 1;
		this.lastViewReset = now;
	} else {
		this.last24hViews += 1;
	}

	this.viewCount += 1;
	return this.save();
};

// Method to check eligibility
eventSchema.methods.checkEligibility = function (participantType) {
	if (this.eligibility === "all") return true;
	if (this.eligibility === "iiit-only" && participantType === "iiit")
		return true;
	if (this.eligibility === "non-iiit-only" && participantType === "non-iiit")
		return true;
	return false;
};

// Pre-save hook to calculate total merchandise stock
eventSchema.pre("save", function () {
	if (
		this.eventType === "merchandise" &&
		this.merchandise &&
		this.merchandise.variants
	) {
		this.merchandise.totalStock = this.merchandise.variants.reduce(
			(sum, variant) => sum + variant.stock,
			0,
		);
	}
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
