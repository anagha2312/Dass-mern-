import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import toast from "react-hot-toast";

const Login = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [errors, setErrors] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showForgotPassword, setShowForgotPassword] = useState(false);
	const [forgotEmail, setForgotEmail] = useState("");
	const [forgotReason, setForgotReason] = useState("");
	const [submittingReset, setSubmittingReset] = useState(false);
	const { login, getDashboardRoute } = useAuth();
	const navigate = useNavigate();

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

		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Please enter a valid email";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validate()) return;

		setIsSubmitting(true);

		const result = await login(formData);

		if (result.success) {
			// Navigate to appropriate dashboard based on role
			const dashboardRoute = getDashboardRoute();
			navigate(dashboardRoute);
		}

		setIsSubmitting(false);
	};

	const handleForgotPasswordSubmit = async (e) => {
		e.preventDefault();
		if (!forgotEmail) {
			toast.error("Please enter your email");
			return;
		}

		setSubmittingReset(true);
		try {
			const response = await authAPI.requestPasswordReset({
				email: forgotEmail,
				reason: forgotReason || "Password forgotten",
			});
			toast.success(response.data.message);
			setShowForgotPassword(false);
			setForgotEmail("");
			setForgotReason("");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to submit request");
		} finally {
			setSubmittingReset(false);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
			{/* Forgot Password Modal */}
			{showForgotPassword && (
				<div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-xl max-w-md w-full p-6'>
						<h3 className='text-xl font-bold text-white mb-4'>
							Request Password Reset
						</h3>
						<p className='text-gray-400 text-sm mb-4'>
							This is for organizers only. Enter your organizer email and the
							admin will reset your password.
						</p>
						<form onSubmit={handleForgotPasswordSubmit} className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Email Address
								</label>
								<input
									type='email'
									value={forgotEmail}
									onChange={(e) => setForgotEmail(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
									placeholder='Enter your organizer email'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Reason (optional)
								</label>
								<textarea
									value={forgotReason}
									onChange={(e) => setForgotReason(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
									placeholder='Why do you need a password reset?'
									rows={2}
								/>
							</div>
							<div className='flex gap-3'>
								<button
									type='button'
									onClick={() => setShowForgotPassword(false)}
									className='flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600'>
									Cancel
								</button>
								<button
									type='submit'
									disabled={submittingReset}
									className='flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50'>
									{submittingReset ? "Submitting..." : "Submit Request"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<div className='max-w-md w-full space-y-8'>
				{/* Header */}
				<div className='text-center'>
					<h1 className='text-4xl font-bold text-primary-500'>Felicity</h1>
					<h2 className='mt-4 text-2xl font-semibold text-white'>
						Welcome Back
					</h2>
					<p className='mt-2 text-gray-400'>Sign in to your account</p>
				</div>

				{/* Login Form */}
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
								autoComplete='current-password'
								value={formData.password}
								onChange={handleChange}
								className={`input-field ${errors.password ? "border-red-500" : ""}`}
								placeholder='Enter your password'
							/>
							{errors.password && (
								<p className='mt-1 text-sm text-red-500'>{errors.password}</p>
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
								Signing in...
							</span>
						) : (
							"Sign In"
						)}
					</button>

					{/* Register Link */}
					<p className='text-center text-gray-400'>
						Don't have an account?{" "}
						<Link
							to='/register'
							className='text-primary-500 hover:text-primary-400'>
							Register here
						</Link>
					</p>

					{/* Forgot Password for Organizers */}
					<p className='text-center text-gray-500 text-sm'>
						Organizer?{" "}
						<button
							type='button'
							onClick={() => setShowForgotPassword(true)}
							className='text-primary-500 hover:text-primary-400 underline'>
							Forgot Password?
						</button>
					</p>
				</form>

				{/* Info Note */}
				<div className='text-center text-sm text-gray-500'>
					<p>Organizers: Login with credentials provided by Admin</p>
				</div>
			</div>
		</div>
	);
};

export default Login;
