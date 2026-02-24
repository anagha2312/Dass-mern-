import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";

const INTEREST_OPTIONS = [
	"Technology",
	"Cultural",
	"Sports",
	"Literary",
	"Gaming",
	"Music",
	"Art & Design",
	"Photography",
	"Entrepreneurship",
	"Social Work",
];

const Onboarding = () => {
	const { user, updateUser } = useAuth();
	const navigate = useNavigate();
	const [selectedInterests, setSelectedInterests] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const toggleInterest = (interest) => {
		setSelectedInterests((prev) =>
			prev.includes(interest)
				? prev.filter((i) => i !== interest)
				: [...prev, interest],
		);
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			const response = await api.put("/participant/preferences", {
				interests: selectedInterests,
				onboardingCompleted: true,
			});

			if (response.data.success) {
				updateUser({
					interests: selectedInterests,
					onboardingCompleted: true,
				});
				toast.success("Preferences saved!");
				navigate("/dashboard");
			}
		} catch (error) {
			toast.error("Failed to save preferences");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSkip = async () => {
		setIsSubmitting(true);
		try {
			await api.put("/participant/preferences", {
				onboardingCompleted: true,
			});
			updateUser({ onboardingCompleted: true });
			navigate("/dashboard");
		} catch (error) {
			// Even if API fails, let them proceed
			navigate("/dashboard");
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4'>
			<div className='max-w-2xl w-full space-y-8'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold text-primary-500'>
						Welcome to Felicity!
					</h1>
					<p className='mt-4 text-xl text-gray-300'>
						Hey {user?.firstName}, tell us what you're interested in
					</p>
					<p className='mt-2 text-gray-500'>
						This helps us recommend relevant events for you
					</p>
				</div>

				<div className='card'>
					<h2 className='text-xl font-semibold text-white mb-4'>
						Select your interests
					</h2>

					<div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
						{INTEREST_OPTIONS.map((interest) => (
							<button
								key={interest}
								onClick={() => toggleInterest(interest)}
								className={`p-3 rounded-lg border-2 transition-all ${
									selectedInterests.includes(interest)
										? "border-primary-500 bg-primary-900/50 text-white"
										: "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
								}`}>
								{interest}
							</button>
						))}
					</div>

					<div className='mt-6 flex justify-between'>
						<button
							onClick={handleSkip}
							disabled={isSubmitting}
							className='px-6 py-2 text-gray-400 hover:text-white transition-colors'>
							Skip for now
						</button>
						<button
							onClick={handleSubmit}
							disabled={isSubmitting}
							className='btn-primary'>
							{isSubmitting ? "Saving..." : "Continue"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Onboarding;
