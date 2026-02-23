import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import { Loading } from "../../components/common";
import toast from "react-hot-toast";

const EditEvent = () => {
	const { eventId } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [event, setEvent] = useState(null);

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		eventType: "normal",
		eligibility: "all",
		registrationDeadline: "",
		eventStartDate: "",
		eventEndDate: "",
		registrationLimit: "",
		registrationFee: 0,
		venue: "",
		tags: "",
		imageUrl: "",
		status: "draft",
	});

	const [customForm, setCustomForm] = useState([]);
	const [merchandiseVariants, setMerchandiseVariants] = useState([]);
	const [purchaseLimit, setPurchaseLimit] = useState(1);
	const [itemDetails, setItemDetails] = useState("");

	useEffect(() => {
		fetchEvent();
	}, [eventId]);

	const fetchEvent = async () => {
		try {
			const response = await organizerAPI.getEvent(eventId);
			const eventData = response.data.data;
			setEvent(eventData);

			// Populate form data
			setFormData({
				name: eventData.name || "",
				description: eventData.description || "",
				eventType: eventData.eventType || "normal",
				eligibility: eventData.eligibility || "all",
				registrationDeadline: formatDateForInput(
					eventData.registrationDeadline,
				),
				eventStartDate: formatDateForInput(eventData.eventStartDate),
				eventEndDate: formatDateForInput(eventData.eventEndDate),
				registrationLimit: eventData.registrationLimit || "",
				registrationFee: eventData.registrationFee || 0,
				venue: eventData.venue || "",
				tags: eventData.tags?.join(", ") || "",
				imageUrl: eventData.imageUrl || "",
				status: eventData.status || "draft",
			});

			// Populate custom form
			if (eventData.customForm) {
				setCustomForm(eventData.customForm);
			}

			// Populate merchandise data
			if (eventData.merchandise) {
				setMerchandiseVariants(eventData.merchandise.variants || []);
				setPurchaseLimit(eventData.merchandise.purchaseLimit || 1);
				setItemDetails(eventData.merchandise.itemDetails || "");
			}
		} catch (error) {
			toast.error("Failed to load event");
			navigate("/organizer/events/ongoing");
		} finally {
			setLoading(false);
		}
	};

	const formatDateForInput = (dateString) => {
		if (!dateString) return "";
		return new Date(dateString).toISOString().slice(0, 16);
	};

	const handleChange = (e) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "number" ? (value ? parseFloat(value) : "") : value,
		}));
	};

	// Custom form field management
	const addFormField = () => {
		setCustomForm([
			...customForm,
			{
				label: "",
				fieldType: "text",
				placeholder: "",
				required: false,
				options: [],
			},
		]);
	};

	const updateFormField = (index, field, value) => {
		const updated = [...customForm];
		updated[index][field] = value;
		setCustomForm(updated);
	};

	const removeFormField = (index) => {
		setCustomForm(customForm.filter((_, i) => i !== index));
	};

	// Merchandise variant management
	const addVariant = () => {
		setMerchandiseVariants([
			...merchandiseVariants,
			{
				name: "",
				size: "",
				color: "",
				stock: 0,
				priceModifier: 0,
			},
		]);
	};

	const updateVariant = (index, field, value) => {
		const updated = [...merchandiseVariants];
		updated[index][field] = value;
		setMerchandiseVariants(updated);
	};

	const removeVariant = (index) => {
		setMerchandiseVariants(merchandiseVariants.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);

		try {
			const data = {
				...formData,
				tags: formData.tags
					? formData.tags.split(",").map((t) => t.trim())
					: [],
			};

			if (formData.eventType === "normal") {
				data.customForm = customForm;
			} else {
				data.merchandise = {
					itemDetails,
					purchaseLimit,
					variants: merchandiseVariants,
				};
			}

			await organizerAPI.updateEvent(eventId, data);
			toast.success("Event updated successfully");
			navigate(`/organizer/events/${eventId}`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update event");
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <Loading />;

	return (
		<div className='min-h-screen bg-gray-900 py-8'>
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
				{/* Header */}
				<div className='flex items-center justify-between mb-8'>
					<div>
						<button
							onClick={() => navigate(-1)}
							className='text-gray-400 hover:text-white flex items-center gap-2 mb-2'>
							<svg
								className='w-5 h-5'
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
						<h1 className='text-3xl font-bold text-white'>Edit Event</h1>
						<p className='text-gray-400 mt-1'>Update your event details</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='space-y-8'>
					{/* Basic Information */}
					<div className='bg-gray-800 rounded-lg p-6'>
						<h2 className='text-xl font-semibold text-white mb-6'>
							Basic Information
						</h2>

						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									Event Name *
								</label>
								<input
									type='text'
									name='name'
									value={formData.name}
									onChange={handleChange}
									required
									className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									Description *
								</label>
								<textarea
									name='description'
									value={formData.description}
									onChange={handleChange}
									required
									rows={4}
									className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
								/>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>
										Event Type
									</label>
									<select
										name='eventType'
										value={formData.eventType}
										onChange={handleChange}
										disabled={event?.currentRegistrations > 0}
										className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50'>
										<option value='normal'>Normal Event</option>
										<option value='merchandise'>Merchandise</option>
									</select>
									{event?.currentRegistrations > 0 && (
										<p className='text-xs text-yellow-400 mt-1'>
											Cannot change event type after registrations
										</p>
									)}
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>
										Eligibility
									</label>
									<select
										name='eligibility'
										value={formData.eligibility}
										onChange={handleChange}
										className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'>
										<option value='all'>All Participants</option>
										<option value='iiit-only'>IIIT Students Only</option>
										<option value='non-iiit-only'>Non-IIIT Only</option>
									</select>
								</div>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>
										Status
									</label>
									<select
										name='status'
										value={formData.status}
										onChange={handleChange}
										className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'>
										<option value='draft'>Draft</option>
										<option value='published'>Published</option>
										<option value='cancelled'>Cancelled</option>
										<option value='completed'>Completed</option>
									</select>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>
										Venue
									</label>
									<input
										type='text'
										name='venue'
										value={formData.venue}
										onChange={handleChange}
										className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Dates */}
					<div className='bg-gray-800 rounded-lg p-6'>
						<h2 className='text-xl font-semibold text-white mb-6'>
							Dates & Times
						</h2>

						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									Registration Deadline *
								</label>
								<input
									type='datetime-local'
									name='registrationDeadline'
									value={formData.registrationDeadline}
									onChange={handleChange}
									required
									className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									Event Start *
								</label>
								<input
									type='datetime-local'
									name='eventStartDate'
									value={formData.eventStartDate}
									onChange={handleChange}
									required
									className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									Event End *
								</label>
								<input
									type='datetime-local'
									name='eventEndDate'
									value={formData.eventEndDate}
									onChange={handleChange}
									required
									className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
								/>
							</div>
						</div>
					</div>

					{/* Registration Settings */}
					<div className='bg-gray-800 rounded-lg p-6'>
						<h2 className='text-xl font-semibold text-white mb-6'>
							Registration Settings
						</h2>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									Registration Limit
								</label>
								<input
									type='number'
									name='registrationLimit'
									value={formData.registrationLimit}
									onChange={handleChange}
									min={event?.currentRegistrations || 1}
									placeholder='Unlimited'
									className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
								/>
								{event?.currentRegistrations > 0 && (
									<p className='text-xs text-gray-400 mt-1'>
										Current registrations: {event.currentRegistrations}
									</p>
								)}
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-2'>
									Registration Fee (₹)
								</label>
								<input
									type='number'
									name='registrationFee'
									value={formData.registrationFee}
									onChange={handleChange}
									min='0'
									className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
								/>
							</div>
						</div>

						<div className='mt-4'>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Tags (comma separated)
							</label>
							<input
								type='text'
								name='tags'
								value={formData.tags}
								onChange={handleChange}
								placeholder='e.g., workshop, coding, AI'
								className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
							/>
						</div>

						<div className='mt-4'>
							<label className='block text-sm font-medium text-gray-300 mb-2'>
								Banner Image URL
							</label>
							<input
								type='url'
								name='imageUrl'
								value={formData.imageUrl}
								onChange={handleChange}
								placeholder='https://example.com/image.jpg'
								className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
							/>
						</div>
					</div>

					{/* Custom Form Fields (Normal Events) */}
					{formData.eventType === "normal" && (
						<div className='bg-gray-800 rounded-lg p-6'>
							<div className='flex justify-between items-center mb-6'>
								<h2 className='text-xl font-semibold text-white'>
									Custom Registration Form
								</h2>
								<button
									type='button'
									onClick={addFormField}
									className='px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm'>
									+ Add Field
								</button>
							</div>

							{customForm.length === 0 ? (
								<p className='text-gray-400 text-center py-4'>
									No custom form fields. Click "Add Field" to add one.
								</p>
							) : (
								<div className='space-y-4'>
									{customForm.map((field, index) => (
										<div
											key={index}
											className='bg-gray-700/50 rounded-lg p-4 space-y-3'>
											<div className='flex justify-between items-start'>
												<span className='text-sm text-gray-400'>
													Field {index + 1}
												</span>
												<button
													type='button'
													onClick={() => removeFormField(index)}
													className='text-red-400 hover:text-red-300'>
													Remove
												</button>
											</div>

											<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
												<input
													type='text'
													value={field.label}
													onChange={(e) =>
														updateFormField(index, "label", e.target.value)
													}
													placeholder='Field Label'
													className='px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white'
												/>
												<select
													value={field.fieldType}
													onChange={(e) =>
														updateFormField(index, "fieldType", e.target.value)
													}
													className='px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white'>
													<option value='text'>Text</option>
													<option value='email'>Email</option>
													<option value='number'>Number</option>
													<option value='textarea'>Textarea</option>
													<option value='select'>Select</option>
													<option value='radio'>Radio</option>
													<option value='checkbox'>Checkbox</option>
												</select>
											</div>

											<div className='flex items-center gap-4'>
												<label className='flex items-center gap-2 text-sm text-gray-300'>
													<input
														type='checkbox'
														checked={field.required}
														onChange={(e) =>
															updateFormField(
																index,
																"required",
																e.target.checked,
															)
														}
														className='rounded border-gray-600'
													/>
													Required
												</label>
												<input
													type='text'
													value={field.placeholder}
													onChange={(e) =>
														updateFormField(
															index,
															"placeholder",
															e.target.value,
														)
													}
													placeholder='Placeholder text'
													className='flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm'
												/>
											</div>

											{["select", "radio", "checkbox"].includes(
												field.fieldType,
											) && (
												<input
													type='text'
													value={field.options?.join(", ") || ""}
													onChange={(e) =>
														updateFormField(
															index,
															"options",
															e.target.value.split(",").map((o) => o.trim()),
														)
													}
													placeholder='Options (comma separated)'
													className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm'
												/>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Merchandise Variants */}
					{formData.eventType === "merchandise" && (
						<div className='bg-gray-800 rounded-lg p-6'>
							<div className='flex justify-between items-center mb-6'>
								<h2 className='text-xl font-semibold text-white'>
									Merchandise Details
								</h2>
								<button
									type='button'
									onClick={addVariant}
									className='px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm'>
									+ Add Variant
								</button>
							</div>

							<div className='space-y-4 mb-6'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>
										Item Description
									</label>
									<textarea
										value={itemDetails}
										onChange={(e) => setItemDetails(e.target.value)}
										rows={2}
										className='w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>
										Purchase Limit per Person
									</label>
									<input
										type='number'
										value={purchaseLimit}
										onChange={(e) =>
											setPurchaseLimit(parseInt(e.target.value) || 1)
										}
										min='1'
										className='w-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white'
									/>
								</div>
							</div>

							{merchandiseVariants.length === 0 ? (
								<p className='text-gray-400 text-center py-4'>
									No variants. Click "Add Variant" to add one.
								</p>
							) : (
								<div className='space-y-4'>
									{merchandiseVariants.map((variant, index) => (
										<div
											key={index}
											className='bg-gray-700/50 rounded-lg p-4 space-y-3'>
											<div className='flex justify-between items-start'>
												<span className='text-sm text-gray-400'>
													Variant {index + 1}
												</span>
												<button
													type='button'
													onClick={() => removeVariant(index)}
													className='text-red-400 hover:text-red-300'>
													Remove
												</button>
											</div>

											<div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
												<input
													type='text'
													value={variant.name}
													onChange={(e) =>
														updateVariant(index, "name", e.target.value)
													}
													placeholder='Name'
													className='px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white'
												/>
												<input
													type='text'
													value={variant.size}
													onChange={(e) =>
														updateVariant(index, "size", e.target.value)
													}
													placeholder='Size'
													className='px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white'
												/>
												<input
													type='text'
													value={variant.color}
													onChange={(e) =>
														updateVariant(index, "color", e.target.value)
													}
													placeholder='Color'
													className='px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white'
												/>
												<input
													type='number'
													value={variant.stock}
													onChange={(e) =>
														updateVariant(
															index,
															"stock",
															parseInt(e.target.value) || 0,
														)
													}
													placeholder='Stock'
													min='0'
													className='px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white'
												/>
												<input
													type='number'
													value={variant.priceModifier}
													onChange={(e) =>
														updateVariant(
															index,
															"priceModifier",
															parseFloat(e.target.value) || 0,
														)
													}
													placeholder='+Price'
													className='px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white'
												/>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Submit Buttons */}
					<div className='flex justify-end gap-4'>
						<button
							type='button'
							onClick={() => navigate(-1)}
							className='px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={saving}
							className='px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
							{saving ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditEvent;
