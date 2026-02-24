import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../../components/common";
import { organizerAPI } from "../../services/api";
import toast from "react-hot-toast";

const CreateEvent = () => {
	const navigate = useNavigate();
	const [saving, setSaving] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);

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
		tags: "",
		venue: "",
		status: "draft",
	});

	// Custom form fields for normal events
	const [customFields, setCustomFields] = useState([]);

	// Merchandise variants
	const [merchandiseData, setMerchandiseData] = useState({
		itemDetails: "",
		purchaseLimit: 1,
		variants: [],
	});

	const handleChange = (e) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
		}));
	};

	// Custom Form Field Functions
	const addCustomField = () => {
		setCustomFields((prev) => [
			...prev,
			{
				label: "",
				fieldType: "text",
				placeholder: "",
				required: false,
				options: [],
			},
		]);
	};

	const updateCustomField = (index, field, value) => {
		const updated = [...customFields];
		updated[index] = { ...updated[index], [field]: value };
		setCustomFields(updated);
	};

	const removeCustomField = (index) => {
		setCustomFields((prev) => prev.filter((_, i) => i !== index));
	};

	const moveField = (index, direction) => {
		if (
			(direction === "up" && index === 0) ||
			(direction === "down" && index === customFields.length - 1)
		)
			return;

		const newFields = [...customFields];
		const swapIndex = direction === "up" ? index - 1 : index + 1;
		[newFields[index], newFields[swapIndex]] = [
			newFields[swapIndex],
			newFields[index],
		];
		setCustomFields(newFields);
	};

	// Merchandise Variant Functions
	const addVariant = () => {
		setMerchandiseData((prev) => ({
			...prev,
			variants: [
				...prev.variants,
				{
					name: "",
					size: "",
					color: "",
					stock: 0,
					priceModifier: 0,
				},
			],
		}));
	};

	const updateVariant = (index, field, value) => {
		const updated = [...merchandiseData.variants];
		updated[index] = { ...updated[index], [field]: value };
		setMerchandiseData((prev) => ({ ...prev, variants: updated }));
	};

	const removeVariant = (index) => {
		setMerchandiseData((prev) => ({
			...prev,
			variants: prev.variants.filter((_, i) => i !== index),
		}));
	};

	const validateStep = (step) => {
		if (step === 1) {
			if (!formData.name || !formData.description || !formData.eventType) {
				toast.error("Please fill in all required fields");
				return false;
			}
		}
		if (step === 2) {
			if (
				!formData.registrationDeadline ||
				!formData.eventStartDate ||
				!formData.eventEndDate
			) {
				toast.error("Please fill in all date fields");
				return false;
			}
			const deadline = new Date(formData.registrationDeadline);
			const start = new Date(formData.eventStartDate);
			const end = new Date(formData.eventEndDate);

			if (deadline >= start) {
				toast.error("Registration deadline must be before event start date");
				return false;
			}
			if (start >= end) {
				toast.error("Event start date must be before end date");
				return false;
			}
		}
		return true;
	};

	const nextStep = () => {
		if (validateStep(currentStep)) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const prevStep = () => {
		setCurrentStep((prev) => prev - 1);
	};

	const handleSubmit = async (saveAsDraft = false) => {
		try {
			setSaving(true);

			const eventData = {
				...formData,
				tags: formData.tags
					? formData.tags
							.split(",")
							.map((t) => t.trim())
							.filter(Boolean)
					: [],
				registrationLimit: formData.registrationLimit || null,
				status: saveAsDraft ? "draft" : "published",
			};

			if (formData.eventType === "normal" && customFields.length > 0) {
				eventData.customForm = customFields;
			}

			if (formData.eventType === "merchandise") {
				eventData.merchandise = merchandiseData;
			}

			const response = await organizerAPI.createEvent(eventData);

			if (response.data.success) {
				toast.success(
					`Event ${saveAsDraft ? "saved as draft" : "published"} successfully!`,
				);
				navigate("/organizer/dashboard");
			}
		} catch (error) {
			console.error("Error creating event:", error);
			toast.error(error.response?.data?.message || "Failed to create event");
		} finally {
			setSaving(false);
		}
	};

	const fieldTypes = [
		{ value: "text", label: "Text" },
		{ value: "email", label: "Email" },
		{ value: "number", label: "Number" },
		{ value: "textarea", label: "Text Area" },
		{ value: "select", label: "Dropdown" },
		{ value: "radio", label: "Radio Buttons" },
		{ value: "checkbox", label: "Checkbox" },
	];

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-4xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Header */}
					<div className='mb-6'>
						<h1 className='text-3xl font-bold text-white'>Create New Event</h1>
						<p className='mt-2 text-gray-400'>
							Fill in the details to create a new event
						</p>
					</div>

					{/* Progress Steps */}
					<div className='flex items-center mb-8'>
						{[1, 2, 3].map((step) => (
							<div key={step} className='flex items-center'>
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
										currentStep >= step
											? "bg-primary-500 text-white"
											: "bg-gray-700 text-gray-400"
									}`}>
									{step}
								</div>
								{step < 3 && (
									<div
										className={`w-20 h-1 ${
											currentStep > step ? "bg-primary-500" : "bg-gray-700"
										}`}
									/>
								)}
							</div>
						))}
						<div className='ml-4 text-gray-400'>
							{currentStep === 1 && "Basic Information"}
							{currentStep === 2 && "Dates & Limits"}
							{currentStep === 3 &&
								(formData.eventType === "normal"
									? "Registration Form"
									: "Merchandise Details")}
						</div>
					</div>

					{/* Step 1: Basic Information */}
					{currentStep === 1 && (
						<div className='card space-y-4'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Basic Information
							</h2>

							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Event Name <span className='text-red-500'>*</span>
								</label>
								<input
									type='text'
									name='name'
									value={formData.name}
									onChange={handleChange}
									placeholder='Enter event name'
									className='input-field'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Description <span className='text-red-500'>*</span>
								</label>
								<textarea
									name='description'
									value={formData.description}
									onChange={handleChange}
									rows={4}
									placeholder='Describe your event...'
									className='input-field'
								/>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Event Type <span className='text-red-500'>*</span>
									</label>
									<select
										name='eventType'
										value={formData.eventType}
										onChange={handleChange}
										className='input-field'>
										<option value='normal'>Normal Event</option>
										<option value='merchandise'>Merchandise</option>
									</select>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Eligibility
									</label>
									<select
										name='eligibility'
										value={formData.eligibility}
										onChange={handleChange}
										className='input-field'>
										<option value='all'>Open to All</option>
										<option value='iiit-only'>IIIT Students Only</option>
										<option value='non-iiit-only'>Non-IIIT Only</option>
									</select>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Tags (comma-separated)
								</label>
								<input
									type='text'
									name='tags'
									value={formData.tags}
									onChange={handleChange}
									placeholder='e.g., workshop, coding, beginner'
									className='input-field'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Venue
								</label>
								<input
									type='text'
									name='venue'
									value={formData.venue}
									onChange={handleChange}
									placeholder='Event venue'
									className='input-field'
								/>
							</div>

							<div className='flex justify-end'>
								<button onClick={nextStep} className='btn-primary'>
									Next Step
								</button>
							</div>
						</div>
					)}

					{/* Step 2: Dates & Limits */}
					{currentStep === 2 && (
						<div className='card space-y-4'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Dates & Registration Limits
							</h2>

							<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Registration Deadline{" "}
										<span className='text-red-500'>*</span>
									</label>
									<input
										type='datetime-local'
										name='registrationDeadline'
										value={formData.registrationDeadline}
										onChange={handleChange}
										className='input-field'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Event Start Date <span className='text-red-500'>*</span>
									</label>
									<input
										type='datetime-local'
										name='eventStartDate'
										value={formData.eventStartDate}
										onChange={handleChange}
										className='input-field'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Event End Date <span className='text-red-500'>*</span>
									</label>
									<input
										type='datetime-local'
										name='eventEndDate'
										value={formData.eventEndDate}
										onChange={handleChange}
										className='input-field'
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Registration Limit
									</label>
									<input
										type='number'
										name='registrationLimit'
										value={formData.registrationLimit}
										onChange={handleChange}
										min='1'
										placeholder='Leave empty for unlimited'
										className='input-field'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Registration Fee (₹)
									</label>
									<input
										type='number'
										name='registrationFee'
										value={formData.registrationFee}
										onChange={handleChange}
										min='0'
										placeholder='0 for free'
										className='input-field'
									/>
								</div>
							</div>

							<div className='flex justify-between'>
								<button onClick={prevStep} className='btn-secondary'>
									Previous
								</button>
								<button onClick={nextStep} className='btn-primary'>
									Next Step
								</button>
							</div>
						</div>
					)}

					{/* Step 3: Custom Form / Merchandise */}
					{currentStep === 3 && (
						<div className='card space-y-4'>
							{formData.eventType === "normal" ? (
								<>
									<div className='flex justify-between items-center mb-4'>
										<h2 className='text-xl font-semibold text-white'>
											Custom Registration Form
										</h2>
										<button onClick={addCustomField} className='btn-secondary'>
											+ Add Field
										</button>
									</div>

									<p className='text-gray-400 text-sm mb-4'>
										Add custom fields to collect additional information from
										participants. Forms are locked after the first registration.
									</p>

									{customFields.length === 0 ? (
										<div className='text-center py-8 text-gray-500'>
											<p>No custom fields added</p>
											<p className='text-sm mt-2'>
												Click "Add Field" to create custom registration fields
											</p>
										</div>
									) : (
										<div className='space-y-4'>
											{customFields.map((field, index) => (
												<div
													key={index}
													className='border border-gray-700 rounded-lg p-4'>
													<div className='flex justify-between items-start mb-3'>
														<span className='text-gray-400 text-sm'>
															Field {index + 1}
														</span>
														<div className='flex gap-2'>
															<button
																onClick={() => moveField(index, "up")}
																disabled={index === 0}
																className='p-1 text-gray-400 hover:text-white disabled:opacity-50'>
																↑
															</button>
															<button
																onClick={() => moveField(index, "down")}
																disabled={index === customFields.length - 1}
																className='p-1 text-gray-400 hover:text-white disabled:opacity-50'>
																↓
															</button>
															<button
																onClick={() => removeCustomField(index)}
																className='p-1 text-red-400 hover:text-red-300'>
																×
															</button>
														</div>
													</div>

													<div className='grid grid-cols-2 gap-4'>
														<div>
															<label className='block text-sm text-gray-400 mb-1'>
																Label
															</label>
															<input
																type='text'
																value={field.label}
																onChange={(e) =>
																	updateCustomField(
																		index,
																		"label",
																		e.target.value,
																	)
																}
																placeholder='Field label'
																className='input-field'
															/>
														</div>
														<div>
															<label className='block text-sm text-gray-400 mb-1'>
																Field Type
															</label>
															<select
																value={field.fieldType}
																onChange={(e) =>
																	updateCustomField(
																		index,
																		"fieldType",
																		e.target.value,
																	)
																}
																className='input-field'>
																{fieldTypes.map((type) => (
																	<option key={type.value} value={type.value}>
																		{type.label}
																	</option>
																))}
															</select>
														</div>
													</div>

													{["select", "radio", "checkbox"].includes(
														field.fieldType,
													) && (
														<div className='mt-3'>
															<label className='block text-sm text-gray-400 mb-1'>
																Options (comma-separated)
															</label>
															<input
																type='text'
																value={field.options?.join(", ") || ""}
																onChange={(e) =>
																	updateCustomField(
																		index,
																		"options",
																		e.target.value
																			.split(",")
																			.map((o) => o.trim()),
																	)
																}
																placeholder='Option 1, Option 2, Option 3'
																className='input-field'
															/>
														</div>
													)}

													<div className='mt-3 flex items-center'>
														<input
															type='checkbox'
															checked={field.required}
															onChange={(e) =>
																updateCustomField(
																	index,
																	"required",
																	e.target.checked,
																)
															}
															className='mr-2'
														/>
														<label className='text-sm text-gray-400'>
															Required field
														</label>
													</div>
												</div>
											))}
										</div>
									)}
								</>
							) : (
								<>
									<h2 className='text-xl font-semibold text-white mb-4'>
										Merchandise Details
									</h2>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											Item Description
										</label>
										<textarea
											value={merchandiseData.itemDetails}
											onChange={(e) =>
												setMerchandiseData((prev) => ({
													...prev,
													itemDetails: e.target.value,
												}))
											}
											rows={3}
											placeholder='Describe the merchandise item...'
											className='input-field'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											Purchase Limit (per person)
										</label>
										<input
											type='number'
											value={merchandiseData.purchaseLimit}
											onChange={(e) =>
												setMerchandiseData((prev) => ({
													...prev,
													purchaseLimit: Number(e.target.value),
												}))
											}
											min='1'
											className='input-field max-w-xs'
										/>
									</div>

									<div className='flex justify-between items-center mt-4'>
										<h3 className='text-lg font-medium text-white'>Variants</h3>
										<button onClick={addVariant} className='btn-secondary'>
											+ Add Variant
										</button>
									</div>

									{merchandiseData.variants.length === 0 ? (
										<div className='text-center py-8 text-gray-500'>
											<p>No variants added</p>
											<p className='text-sm mt-2'>
												Add variants like size/color combinations
											</p>
										</div>
									) : (
										<div className='space-y-4'>
											{merchandiseData.variants.map((variant, index) => (
												<div
													key={index}
													className='border border-gray-700 rounded-lg p-4'>
													<div className='flex justify-between items-start mb-3'>
														<span className='text-gray-400 text-sm'>
															Variant {index + 1}
														</span>
														<button
															onClick={() => removeVariant(index)}
															className='text-red-400 hover:text-red-300'>
															Remove
														</button>
													</div>

													<div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
														<div className='col-span-2'>
															<label className='block text-sm text-gray-400 mb-1'>
																Name
															</label>
															<input
																type='text'
																value={variant.name}
																onChange={(e) =>
																	updateVariant(index, "name", e.target.value)
																}
																placeholder='e.g., Small - Black'
																className='input-field'
															/>
														</div>
														<div>
															<label className='block text-sm text-gray-400 mb-1'>
																Size
															</label>
															<input
																type='text'
																value={variant.size}
																onChange={(e) =>
																	updateVariant(index, "size", e.target.value)
																}
																placeholder='S, M, L...'
																className='input-field'
															/>
														</div>
														<div>
															<label className='block text-sm text-gray-400 mb-1'>
																Color
															</label>
															<input
																type='text'
																value={variant.color}
																onChange={(e) =>
																	updateVariant(index, "color", e.target.value)
																}
																placeholder='Color'
																className='input-field'
															/>
														</div>
														<div>
															<label className='block text-sm text-gray-400 mb-1'>
																Stock
															</label>
															<input
																type='number'
																value={variant.stock}
																onChange={(e) =>
																	updateVariant(
																		index,
																		"stock",
																		Number(e.target.value),
																	)
																}
																min='0'
																className='input-field'
															/>
														</div>
													</div>

													<div className='mt-3'>
														<label className='block text-sm text-gray-400 mb-1'>
															Price Modifier (₹)
														</label>
														<input
															type='number'
															value={variant.priceModifier}
															onChange={(e) =>
																updateVariant(
																	index,
																	"priceModifier",
																	Number(e.target.value),
																)
															}
															placeholder='Additional cost for this variant'
															className='input-field max-w-xs'
														/>
													</div>
												</div>
											))}
										</div>
									)}
								</>
							)}

							<div className='flex justify-between pt-4 border-t border-gray-700'>
								<button onClick={prevStep} className='btn-secondary'>
									Previous
								</button>
								<div className='flex gap-3'>
									<button
										onClick={() => handleSubmit(true)}
										disabled={saving}
										className='btn-secondary'>
										{saving ? "Saving..." : "Save as Draft"}
									</button>
									<button
										onClick={() => handleSubmit(false)}
										disabled={saving}
										className='btn-primary'>
										{saving ? "Publishing..." : "Publish Event"}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
};

export default CreateEvent;
