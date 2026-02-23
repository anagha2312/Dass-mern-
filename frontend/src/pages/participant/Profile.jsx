import { useState, useEffect } from "react";
import { Navbar } from "../../components/common";
import { participantAPI, authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Profile = () => {
	const { user, checkAuth } = useAuth();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [profile, setProfile] = useState(null);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		contactNumber: "",
		collegeName: "",
		interests: [],
	});

	// Password change state
	const [showPasswordChange, setShowPasswordChange] = useState(false);
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [changingPassword, setChangingPassword] = useState(false);

	const availableInterests = [
		"Technical",
		"Cultural",
		"Sports",
		"Literary",
		"Gaming",
		"Music",
		"Dance",
		"Drama",
		"Art",
		"Photography",
		"Entrepreneurship",
		"Social Work",
	];

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			setLoading(true);
			const response = await participantAPI.getProfile();
			if (response.data.success) {
				const profileData = response.data.data;
				setProfile(profileData);
				setFormData({
					firstName: profileData.firstName || "",
					lastName: profileData.lastName || "",
					contactNumber: profileData.contactNumber || "",
					collegeName: profileData.collegeName || "",
					interests: profileData.interests || [],
				});
			}
		} catch (error) {
			console.error("Error fetching profile:", error);
			toast.error("Failed to fetch profile");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const toggleInterest = (interest) => {
		setFormData((prev) => ({
			...prev,
			interests: prev.interests.includes(interest)
				? prev.interests.filter((i) => i !== interest)
				: [...prev.interests, interest],
		}));
	};

	const handlePasswordChange = (e) => {
		const { name, value } = e.target;
		setPasswordData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error("New passwords do not match");
			return;
		}

		if (passwordData.newPassword.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}

		try {
			setChangingPassword(true);
			const response = await authAPI.changePassword({
				currentPassword: passwordData.currentPassword,
				newPassword: passwordData.newPassword,
			});

			if (response.data.success) {
				toast.success("Password changed successfully!");
				setPasswordData({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
				setShowPasswordChange(false);
			}
		} catch (error) {
			console.error("Error changing password:", error);
			toast.error(error.response?.data?.message || "Failed to change password");
		} finally {
			setChangingPassword(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			setSaving(true);
			const response = await participantAPI.updateProfile(formData);

			if (response.data.success) {
				toast.success("Profile updated successfully!");
				await checkAuth(); // Refresh user data
				await fetchProfile();
			}
		} catch (error) {
			console.error("Error updating profile:", error);
			toast.error(error.response?.data?.message || "Failed to update profile");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-900'>
				<Navbar />
				<div className='max-w-3xl mx-auto py-12 text-center'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500'></div>
					<p className='mt-4 text-gray-400'>Loading profile...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-3xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Header */}
					<div className='mb-6'>
						<h1 className='text-3xl font-bold text-white'>My Profile</h1>
						<p className='mt-2 text-gray-400'>
							Manage your account information
						</p>
					</div>

					<form onSubmit={handleSubmit} className='space-y-6'>
						{/* Basic Information */}
						<div className='card'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Basic Information
							</h2>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										First Name <span className='text-red-500'>*</span>
									</label>
									<input
										type='text'
										name='firstName'
										value={formData.firstName}
										onChange={handleChange}
										required
										className='input-field'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Last Name <span className='text-red-500'>*</span>
									</label>
									<input
										type='text'
										name='lastName'
										value={formData.lastName}
										onChange={handleChange}
										required
										className='input-field'
									/>
								</div>
							</div>

							<div className='mt-4'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Email Address
								</label>
								<input
									type='email'
									value={profile?.email}
									disabled
									className='input-field bg-gray-800 cursor-not-allowed'
								/>
								<p className='text-sm text-gray-500 mt-1'>
									Email cannot be changed
								</p>
							</div>

							<div className='mt-4'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Contact Number
								</label>
								<input
									type='tel'
									name='contactNumber'
									value={formData.contactNumber}
									onChange={handleChange}
									placeholder='+91 XXXXXXXXXX'
									className='input-field'
								/>
							</div>

							<div className='mt-4'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									College/Organization
								</label>
								<input
									type='text'
									name='collegeName'
									value={formData.collegeName}
									onChange={handleChange}
									disabled={profile?.participantType === "iiit"}
									className={`input-field ${profile?.participantType === "iiit" ? "bg-gray-800 cursor-not-allowed" : ""}`}
								/>
								{profile?.participantType === "iiit" && (
									<p className='text-sm text-gray-500 mt-1'>
										IIIT students cannot change college name
									</p>
								)}
							</div>

							<div className='mt-4'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Participant Type
								</label>
								<input
									type='text'
									value={
										profile?.participantType === "iiit"
											? "IIIT Student"
											: "Non-IIIT Participant"
									}
									disabled
									className='input-field bg-gray-800 cursor-not-allowed'
								/>
							</div>
						</div>

						{/* Interests */}
						<div className='card'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Areas of Interest
							</h2>
							<p className='text-sm text-gray-400 mb-4'>
								Select your interests to get personalized event recommendations
							</p>

							<div className='flex flex-wrap gap-2'>
								{availableInterests.map((interest) => (
									<button
										key={interest}
										type='button'
										onClick={() => toggleInterest(interest)}
										className={`px-4 py-2 rounded-lg font-medium transition ${
											formData.interests.includes(interest)
												? "bg-primary-500 text-white"
												: "bg-gray-800 text-gray-300 hover:bg-gray-700"
										}`}>
										{interest}
									</button>
								))}
							</div>
						</div>

						{/* Followed Clubs */}
						{profile?.followedOrganizers &&
							profile.followedOrganizers.length > 0 && (
								<div className='card'>
									<h2 className='text-xl font-semibold text-white mb-4'>
										Followed Clubs
									</h2>
									<div className='space-y-2'>
										{profile.followedOrganizers.map((org) => (
											<div
												key={org._id}
												className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'>
												<div>
													<p className='text-white font-medium'>{org.name}</p>
													<p className='text-sm text-gray-400 capitalize'>
														{org.category}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

						{/* Security Settings */}
						<div className='card'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Security Settings
							</h2>

							{!showPasswordChange ? (
								<button
									type='button'
									onClick={() => setShowPasswordChange(true)}
									className='btn-secondary'>
									Change Password
								</button>
							) : (
								<div className='space-y-4'>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											Current Password <span className='text-red-500'>*</span>
										</label>
										<input
											type='password'
											name='currentPassword'
											value={passwordData.currentPassword}
											onChange={handlePasswordChange}
											className='input-field'
											placeholder='Enter current password'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											New Password <span className='text-red-500'>*</span>
										</label>
										<input
											type='password'
											name='newPassword'
											value={passwordData.newPassword}
											onChange={handlePasswordChange}
											className='input-field'
											placeholder='Enter new password (min 6 characters)'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											Confirm New Password{" "}
											<span className='text-red-500'>*</span>
										</label>
										<input
											type='password'
											name='confirmPassword'
											value={passwordData.confirmPassword}
											onChange={handlePasswordChange}
											className='input-field'
											placeholder='Confirm new password'
										/>
									</div>

									<div className='flex gap-3'>
										<button
											type='button'
											onClick={handlePasswordSubmit}
											disabled={changingPassword}
											className='btn-primary'>
											{changingPassword ? "Changing..." : "Change Password"}
										</button>
										<button
											type='button'
											onClick={() => {
												setShowPasswordChange(false);
												setPasswordData({
													currentPassword: "",
													newPassword: "",
													confirmPassword: "",
												});
											}}
											className='btn-secondary'>
											Cancel
										</button>
									</div>
								</div>
							)}
						</div>

						{/* Save Button */}
						<div className='flex justify-end'>
							<button
								type='submit'
								disabled={saving}
								className='btn-primary px-8 py-3'>
								{saving ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
};

export default Profile;
