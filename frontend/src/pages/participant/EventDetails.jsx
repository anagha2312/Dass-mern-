import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar, DiscussionForum } from "../../components/common";
import { participantAPI } from "../../services/api";
import toast from "react-hot-toast";

const EventDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [event, setEvent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [registering, setRegistering] = useState(false);
	const [formData, setFormData] = useState({});
	const [selectedVariant, setSelectedVariant] = useState("");
	const [quantity, setQuantity] = useState(1);

	// Calendar & Feedback states
	const [showFeedbackModal, setShowFeedbackModal] = useState(false);
	const [feedbackRating, setFeedbackRating] = useState(0);
	const [feedbackComment, setFeedbackComment] = useState("");
	const [submittingFeedback, setSubmittingFeedback] = useState(false);

	useEffect(() => {
		fetchEventDetails();
	}, [id]);

	const fetchEventDetails = async () => {
		try {
			setLoading(true);
			const response = await participantAPI.getEventDetails(id);
			if (response.data.success) {
				setEvent(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching event:", error);
			toast.error("Failed to fetch event details");
			navigate("/events");
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = async () => {
		try {
			setRegistering(true);

			let registrationData = {};

			if (event.eventType === "normal") {
				// Validate custom form
				const responses = {};
				event.customForm?.forEach((field) => {
					if (field.required && !formData[field.label]) {
						throw new Error(`${field.label} is required`);
					}
					responses[field.label] = formData[field.label] || "";
				});
				registrationData.formResponses = responses;
			} else if (event.eventType === "merchandise") {
				if (!selectedVariant) {
					toast.error("Please select a variant");
					return;
				}
				registrationData.variantId = selectedVariant;
				registrationData.quantity = quantity;
			}

			const response = await participantAPI.registerForEvent(
				id,
				registrationData,
			);

			if (response.data.success) {
				toast.success(
					"Registration successful! Check your email for the ticket.",
				);
				navigate("/dashboard");
			}
		} catch (error) {
			console.error("Registration error:", error);
			toast.error(
				error.response?.data?.message || error.message || "Registration failed",
			);
		} finally {
			setRegistering(false);
		}
	};

	// Calendar Integration
	const handleDownloadICS = async () => {
		try {
			const response = await participantAPI.getCalendarFile(id);
			const blob = new Blob([response.data], { type: "text/calendar" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${event.name.replace(/[^a-z0-9]/gi, "_")}.ics`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success("Calendar file downloaded");
		} catch (error) {
			toast.error("Failed to download calendar file");
		}
	};

	const handleGoogleCalendar = async () => {
		try {
			const response = await participantAPI.getGoogleCalendarLink(id);
			window.open(response.data.data.googleCalendarUrl, "_blank");
		} catch (error) {
			toast.error("Failed to open Google Calendar");
		}
	};

	const handleOutlookCalendar = async () => {
		try {
			const response = await participantAPI.getGoogleCalendarLink(id);
			window.open(response.data.data.outlookUrl, "_blank");
		} catch (error) {
			toast.error("Failed to open Outlook Calendar");
		}
	};

	// Feedback
	const handleSubmitFeedback = async () => {
		if (feedbackRating === 0) {
			toast.error("Please select a rating");
			return;
		}

		setSubmittingFeedback(true);
		try {
			await participantAPI.submitFeedback(id, {
				rating: feedbackRating,
				comment: feedbackComment,
			});
			toast.success("Thank you for your feedback!");
			setShowFeedbackModal(false);
			setFeedbackRating(0);
			setFeedbackComment("");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to submit feedback");
		} finally {
			setSubmittingFeedback(false);
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-900'>
				<Navbar />
				<div className='max-w-7xl mx-auto py-12 text-center'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500'></div>
					<p className='mt-4 text-gray-400'>Loading event details...</p>
				</div>
			</div>
		);
	}

	if (!event) {
		return null;
	}

	const canRegister =
		!event.isRegistered &&
		event.isRegistrationOpen &&
		event.isEligible &&
		event.status === "published";

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-4xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Back Button */}
					<button
						onClick={() => navigate(-1)}
						className='mb-4 text-primary-400 hover:text-primary-300 flex items-center'>
						<svg
							className='w-5 h-5 mr-1'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M15 19l-7-7 7-7'
							/>
						</svg>
						Back
					</button>

					{/* Event Header */}
					<div className='card mb-6'>
						<div className='flex justify-between items-start mb-4'>
							<div>
								<h1 className='text-3xl font-bold text-white'>{event.name}</h1>
								<p className='text-gray-400 mt-2'>
									by {event.organizer?.name} ({event.organizer?.category})
								</p>
							</div>
							<span
								className={`px-3 py-1 text-sm rounded ${event.eventType === "merchandise" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
								{event.eventType === "merchandise" ? "Merchandise" : "Event"}
							</span>
						</div>

						<p className='text-gray-300 whitespace-pre-wrap'>
							{event.description}
						</p>
					</div>

					{/* Event Details */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
						<div className='card'>
							<h3 className='text-lg font-semibold text-white mb-4'>
								Event Information
							</h3>
							<div className='space-y-3'>
								<div>
									<p className='text-gray-400 text-sm'>Start Date</p>
									<p className='text-white'>
										{new Date(event.eventStartDate).toLocaleString()}
									</p>
								</div>
								<div>
									<p className='text-gray-400 text-sm'>End Date</p>
									<p className='text-white'>
										{new Date(event.eventEndDate).toLocaleString()}
									</p>
								</div>
								<div>
									<p className='text-gray-400 text-sm'>Registration Deadline</p>
									<p className='text-white'>
										{new Date(event.registrationDeadline).toLocaleString()}
									</p>
								</div>
								{event.venue && (
									<div>
										<p className='text-gray-400 text-sm'>Venue</p>
										<p className='text-white'>{event.venue}</p>
									</div>
								)}
							</div>
						</div>

						<div className='card'>
							<h3 className='text-lg font-semibold text-white mb-4'>
								Registration Details
							</h3>
							<div className='space-y-3'>
								<div>
									<p className='text-gray-400 text-sm'>Fee</p>
									<p className='text-white text-xl font-semibold'>
										{event.registrationFee > 0
											? `₹${event.registrationFee}`
											: "Free"}
									</p>
								</div>
								<div>
									<p className='text-gray-400 text-sm'>Eligibility</p>
									<p className='text-white capitalize'>
										{event.eligibility.replace("-", " ")}
									</p>
								</div>
								{event.registrationLimit && (
									<div>
										<p className='text-gray-400 text-sm'>
											Registrations ({event.currentRegistrations} /{" "}
											{event.registrationLimit})
										</p>
										<div className='w-full bg-gray-700 rounded-full h-2 mt-1'>
											<div
												className='bg-primary-500 h-2 rounded-full'
												style={{
													width: `${(event.currentRegistrations / event.registrationLimit) * 100}%`,
												}}></div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Merchandise Variants */}
					{event.eventType === "merchandise" && event.merchandise?.variants && (
						<div className='card mb-6'>
							<h3 className='text-lg font-semibold text-white mb-4'>
								Select Variant
							</h3>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
								{event.merchandise.variants.map((variant) => (
									<label
										key={variant._id}
										className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition ${
											selectedVariant === variant._id
												? "border-primary-500 bg-primary-500/10"
												: "border-gray-700 hover:border-gray-600"
										} ${variant.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
										<input
											type='radio'
											name='variant'
											value={variant._id}
											checked={selectedVariant === variant._id}
											onChange={() => setSelectedVariant(variant._id)}
											disabled={variant.stock === 0}
											className='mr-3'
										/>
										<div className='flex-1'>
											<p className='text-white font-medium'>{variant.name}</p>
											<p className='text-sm text-gray-400'>
												Stock: {variant.stock}
											</p>
										</div>
										{variant.priceModifier !== 0 && (
											<span className='text-primary-400 font-semibold'>
												+₹{variant.priceModifier}
											</span>
										)}
									</label>
								))}
							</div>

							{selectedVariant && (
								<div className='mt-4'>
									<label className='block text-sm font-medium text-gray-300 mb-2'>
										Quantity (Max: {event.merchandise.purchaseLimit})
									</label>
									<input
										type='number'
										min='1'
										max={event.merchandise.purchaseLimit}
										value={quantity}
										onChange={(e) =>
											setQuantity(
												Math.min(
													event.merchandise.purchaseLimit,
													Math.max(1, parseInt(e.target.value) || 1),
												),
											)
										}
										className='input-field max-w-xs'
									/>
								</div>
							)}
						</div>
					)}

					{/* Custom Form */}
					{event.eventType === "normal" &&
						event.customForm &&
						event.customForm.length > 0 && (
							<div className='card mb-6'>
								<h3 className='text-lg font-semibold text-white mb-4'>
									Registration Form
								</h3>
								<div className='space-y-4'>
									{event.customForm.map((field, index) => (
										<div key={index}>
											<label className='block text-sm font-medium text-gray-300 mb-1'>
												{field.label}{" "}
												{field.required && (
													<span className='text-red-500'>*</span>
												)}
											</label>
											{field.fieldType === "textarea" ? (
												<textarea
													value={formData[field.label] || ""}
													onChange={(e) =>
														setFormData({
															...formData,
															[field.label]: e.target.value,
														})
													}
													placeholder={field.placeholder}
													required={field.required}
													className='input-field'
													rows='4'
												/>
											) : field.fieldType === "select" ? (
												<select
													value={formData[field.label] || ""}
													onChange={(e) =>
														setFormData({
															...formData,
															[field.label]: e.target.value,
														})
													}
													required={field.required}
													className='input-field'>
													<option value=''>Select...</option>
													{field.options?.map((option, i) => (
														<option key={i} value={option}>
															{option}
														</option>
													))}
												</select>
											) : (
												<input
													type={field.fieldType}
													value={formData[field.label] || ""}
													onChange={(e) =>
														setFormData({
															...formData,
															[field.label]: e.target.value,
														})
													}
													placeholder={field.placeholder}
													required={field.required}
													className='input-field'
												/>
											)}
										</div>
									))}
								</div>
							</div>
						)}

					{/* Registration Status/Button */}
					<div className='card'>
						{event.isRegistered ? (
							<div className='text-center py-4'>
								<p className='text-green-400 font-semibold text-lg'>
									✓ You are registered for this event
								</p>
								<p className='text-gray-400 mt-2'>
									Check your email for the ticket
								</p>

								{/* Add to Calendar Buttons */}
								<div className='mt-6 border-t border-gray-700 pt-4'>
									<p className='text-gray-400 text-sm mb-3'>Add to Calendar</p>
									<div className='flex flex-wrap justify-center gap-2'>
										<button
											onClick={handleGoogleCalendar}
											className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2'>
											<svg
												className='w-4 h-4'
												viewBox='0 0 24 24'
												fill='currentColor'>
												<path d='M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z' />
											</svg>
											Google
										</button>
										<button
											onClick={handleOutlookCalendar}
											className='px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 text-sm flex items-center gap-2'>
											<svg
												className='w-4 h-4'
												viewBox='0 0 24 24'
												fill='currentColor'>
												<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
											</svg>
											Outlook
										</button>
										<button
											onClick={handleDownloadICS}
											className='px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm flex items-center gap-2'>
											<svg
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
												/>
											</svg>
											Download .ics
										</button>
									</div>
								</div>

								{/* Feedback Button - only show for past events */}
								{new Date(event.eventEndDate) < new Date() && (
									<div className='mt-4 border-t border-gray-700 pt-4'>
										<button
											onClick={() => setShowFeedbackModal(true)}
											className='px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700'>
											📝 Submit Feedback
										</button>
									</div>
								)}
							</div>
						) : !event.isEligible ? (
							<div className='text-center py-4'>
								<p className='text-red-400 font-semibold'>
									You are not eligible for this event
								</p>
							</div>
						) : !event.isRegistrationOpen ? (
							<div className='text-center py-4'>
								<p className='text-yellow-400 font-semibold'>
									Registration is closed for this event
								</p>
							</div>
						) : (
							<button
								onClick={handleRegister}
								disabled={registering || !canRegister}
								className='w-full btn-primary py-3 text-lg'>
								{registering ? "Registering..." : "Register Now"}
							</button>
						)}
					</div>

					{/* Discussion Forum - Only for published events */}
					{event.status === "published" && (
						<DiscussionForum
							eventId={id}
							isRegistered={event.isRegistered}
							isOrganizer={false}
						/>
					)}
				</div>
			</main>

			{/* Feedback Modal */}
			{showFeedbackModal && (
				<div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-xl max-w-md w-full p-6'>
						<h3 className='text-xl font-bold text-white mb-4'>
							Submit Anonymous Feedback
						</h3>
						<p className='text-gray-400 text-sm mb-4'>
							Your feedback is anonymous and helps organizers improve future
							events.
						</p>

						{/* Star Rating */}
						<div className='mb-4'>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Rating
							</label>
							<div className='flex gap-2'>
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type='button'
										onClick={() => setFeedbackRating(star)}
										className={`text-3xl transition ${
											star <= feedbackRating
												? "text-yellow-500"
												: "text-gray-600 hover:text-yellow-400"
										}`}>
										★
									</button>
								))}
							</div>
						</div>

						{/* Comment */}
						<div className='mb-4'>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Comment (optional)
							</label>
							<textarea
								value={feedbackComment}
								onChange={(e) => setFeedbackComment(e.target.value)}
								className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500'
								placeholder='Share your experience...'
								rows={3}
							/>
						</div>

						<div className='flex gap-3'>
							<button
								type='button'
								onClick={() => setShowFeedbackModal(false)}
								className='flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600'>
								Cancel
							</button>
							<button
								onClick={handleSubmitFeedback}
								disabled={submittingFeedback || feedbackRating === 0}
								className='flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50'>
								{submittingFeedback ? "Submitting..." : "Submit Feedback"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default EventDetails;
