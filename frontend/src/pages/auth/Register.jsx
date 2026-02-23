import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
		firstName: "",
		lastName: "",
		contactNumber: "",
		collegeName: "",
	});
	const [errors, setErrors] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { register, getDashboardRoute } = useAuth();
	const navigate = useNavigate();

	// Check if email is IIIT email
	const isIIITEmail = (email) => {
		const iiitDomains = [
			"iiit.ac.in",
			"students.iiit.ac.in",
			"research.iiit.ac.in",
		];
		const domain = email.split("@")[1];
		return iiitDomains.includes(domain);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error when user starts typing
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	const validate = () => {
		const newErrors = {};

		// Email validation
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Please enter a valid email";
		}

		// Password validation
		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		// Confirm password
		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		// First name
		if (!formData.firstName.trim()) {
			newErrors.firstName = "First name is required";
		}

		// Last name
		if (!formData.lastName.trim()) {
			newErrors.lastName = "Last name is required";
		}

		// Contact number (optional but validate format if provided)
		if (formData.contactNumber && !/^[0-9]{10}$/.test(formData.contactNumber)) {
			newErrors.contactNumber = "Please enter a valid 10-digit number";
		}

		// College name (required for non-IIIT)
		if (!isIIITEmail(formData.email) && !formData.collegeName.trim()) {
			newErrors.collegeName =
				"College/Organization name is required for non-IIIT participants";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validate()) return;

		setIsSubmitting(true);

		const result = await register({
			email: formData.email,
			password: formData.password,
			firstName: formData.firstName,
			lastName: formData.lastName,
			contactNumber: formData.contactNumber,
			collegeName: formData.collegeName,
		});

		if (result.success) {
			// Navigate to onboarding or dashboard
			navigate("/onboarding");
		}

		setIsSubmitting(false);
	};

	const isIIIT = isIIITEmail(formData.email);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full space-y-8'>
				{/* Header */}
				<div className='text-center'>
					<h1 className='text-4xl font-bold text-primary-500'>Felicity</h1>
					<h2 className='mt-4 text-2xl font-semibold text-white'>
						Create Account
					</h2>
					<p className='mt-2 text-gray-400'>Register as a participant</p>
				</div>

				{/* Registration Form */}
				<form className='mt-8 space-y-6 card' onSubmit={handleSubmit}>
					<div className='space-y-4'>
						{/* Email */}
						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-300 mb-1'>
								Email Address
							</label>
							<input
								id='email'
								name='email'
								type='email'
								autoComplete='email'
								value={formData.email}
								onChange={handleChange}
								className={`input-field ${errors.email ? "border-red-500" : ""}`}
								placeholder='Enter your email'
							/>
							{errors.email && (
								<p className='mt-1 text-sm text-red-500'>{errors.email}</p>
							)}
							{formData.email && (
								<p
									className={`mt-1 text-sm ${isIIIT ? "text-green-500" : "text-yellow-500"}`}>
									{isIIIT
										? "✓ IIIT Student Email Detected"
										: "⚠ Non-IIIT Email - College name required"}
								</p>
							)}
						</div>

						{/* Name Fields */}
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label
									htmlFor='firstName'
									className='block text-sm font-medium text-gray-300 mb-1'>
									First Name
								</label>
								<input
									id='firstName'
									name='firstName'
									type='text'
									value={formData.firstName}
									onChange={handleChange}
									className={`input-field ${errors.firstName ? "border-red-500" : ""}`}
									placeholder='First name'
								/>
								{errors.firstName && (
									<p className='mt-1 text-sm text-red-500'>
										{errors.firstName}
									</p>
								)}
							</div>
							<div>
								<label
									htmlFor='lastName'
									className='block text-sm font-medium text-gray-300 mb-1'>
									Last Name
								</label>
								<input
									id='lastName'
									name='lastName'
									type='text'
									value={formData.lastName}
									onChange={handleChange}
									className={`input-field ${errors.lastName ? "border-red-500" : ""}`}
									placeholder='Last name'
								/>
								{errors.lastName && (
									<p className='mt-1 text-sm text-red-500'>{errors.lastName}</p>
								)}
							</div>
						</div>

						{/* Contact Number */}
						<div>
							<label
								htmlFor='contactNumber'
								className='block text-sm font-medium text-gray-300 mb-1'>
								Contact Number <span className='text-gray-500'>(Optional)</span>
							</label>
							<input
								id='contactNumber'
								name='contactNumber'
								type='tel'
								value={formData.contactNumber}
								onChange={handleChange}
								className={`input-field ${errors.contactNumber ? "border-red-500" : ""}`}
								placeholder='10-digit mobile number'
							/>
							{errors.contactNumber && (
								<p className='mt-1 text-sm text-red-500'>
									{errors.contactNumber}
								</p>
							)}
						</div>

						{/* College Name - Required for non-IIIT */}
						<div>
							<label
								htmlFor='collegeName'
								className='block text-sm font-medium text-gray-300 mb-1'>
								College/Organization{" "}
								{!isIIIT && <span className='text-red-400'>*</span>}
							</label>
							<input
								id='collegeName'
								name='collegeName'
								type='text'
								value={isIIIT ? "IIIT Hyderabad" : formData.collegeName}
								onChange={handleChange}
								disabled={isIIIT}
								className={`input-field ${errors.collegeName ? "border-red-500" : ""} ${isIIIT ? "bg-gray-600 cursor-not-allowed" : ""}`}
								placeholder='Your college or organization'
							/>
							{errors.collegeName && (
								<p className='mt-1 text-sm text-red-500'>
									{errors.collegeName}
								</p>
							)}
						</div>

						{/* Password */}
						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-300 mb-1'>
								Password
							</label>
							<input
								id='password'
								name='password'
								type='password'
								value={formData.password}
								onChange={handleChange}
								className={`input-field ${errors.password ? "border-red-500" : ""}`}
								placeholder='At least 6 characters'
							/>
							{errors.password && (
								<p className='mt-1 text-sm text-red-500'>{errors.password}</p>
							)}
						</div>

						{/* Confirm Password */}
						<div>
							<label
								htmlFor='confirmPassword'
								className='block text-sm font-medium text-gray-300 mb-1'>
								Confirm Password
							</label>
							<input
								id='confirmPassword'
								name='confirmPassword'
								type='password'
								value={formData.confirmPassword}
								onChange={handleChange}
								className={`input-field ${errors.confirmPassword ? "border-red-500" : ""}`}
								placeholder='Confirm your password'
							/>
							{errors.confirmPassword && (
								<p className='mt-1 text-sm text-red-500'>
									{errors.confirmPassword}
								</p>
							)}
						</div>
					</div>

					{/* Submit Button */}
					<button
						type='submit'
						disabled={isSubmitting}
						className='w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed'>
						{isSubmitting ? (
							<span className='flex items-center justify-center'>
								<svg
									className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
									xmlns='http://www.w3.org/2000/svg'
									fill='none'
									viewBox='0 0 24 24'>
									<circle
										className='opacity-25'
										cx='12'
										cy='12'
										r='10'
										stroke='currentColor'
										strokeWidth='4'></circle>
									<path
										className='opacity-75'
										fill='currentColor'
										d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
								</svg>
								Creating Account...
							</span>
						) : (
							"Create Account"
						)}
					</button>

					{/* Login Link */}
					<p className='text-center text-gray-400'>
						Already have an account?{" "}
						<Link
							to='/login'
							className='text-primary-500 hover:text-primary-400'>
							Sign in
						</Link>
					</p>
				</form>

				{/* Note */}
				<div className='text-center text-sm text-gray-500'>
					<p>Organizers cannot self-register. Contact Admin for access.</p>
				</div>
			</div>
		</div>
	);
};

export default Register;
