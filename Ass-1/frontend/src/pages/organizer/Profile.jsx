import { useState, useEffect } from "react";
import { Navbar, Loading } from "../../components/common";
import { organizerAPI } from "../../services/api";
import toast from "react-hot-toast";

const Profile = () => {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [profile, setProfile] = useState({
		name: "",
		category: "",
		description: "",
		contactEmail: "",
		contactNumber: "",
		discordWebhook: "",
	});
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [changingPassword, setChangingPassword] = useState(false);

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			setLoading(true);
			const response = await organizerAPI.getProfile();
			const data = response.data.data;
			setProfile({
				name: data.name || "",
				category: data.category || "",
				description: data.description || "",
				contactEmail: data.contactEmail || "",
				contactNumber: data.contactNumber || "",
				discordWebhook: data.discordWebhook || "",
			});
		} catch (error) {
			console.error("Error fetching profile:", error);
			toast.error("Failed to load profile");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setProfile((prev) => ({ ...prev, [name]: value }));
	};

	const handlePasswordChange = (e) => {
		const { name, value } = e.target;
		setPasswordData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);
			await organizerAPI.updateProfile(profile);
			toast.success("Profile updated successfully");
		} catch (error) {
			console.error("Error updating profile:", error);
			toast.error(error.response?.data?.message || "Failed to update profile");
		} finally {
			setSaving(false);
		}
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		if (passwordData.newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		try {
			setChangingPassword(true);
			await organizerAPI.changePassword({
				currentPassword: passwordData.currentPassword,
				newPassword: passwordData.newPassword,
			});
			toast.success("Password changed successfully");
			setPasswordData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (error) {
			console.error("Error changing password:", error);
			toast.error(error.response?.data?.message || "Failed to change password");
		} finally {
			setChangingPassword(false);
		}
	};

	const testDiscordWebhook = async () => {
		if (!profile.discordWebhook) {
			toast.error("Please enter a Discord webhook URL");
			return;
		}

		try {
			// Send a test message to the webhook
			await fetch(profile.discordWebhook, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					content:
						"🎉 **Test Message from Felicity Event Management System**\n\nYour Discord webhook is configured correctly!",
				}),
			});
			toast.success("Test message sent to Discord!");
		} catch (error) {
			console.error("Error testing webhook:", error);
			toast.error("Failed to send test message. Check your webhook URL.");
		}
	};

	if (loading) return <Loading />;

	const categories = [
		{ value: "technical", label: "Technical Club" },
		{ value: "cultural", label: "Cultural Club" },
		{ value: "sports", label: "Sports Club" },
		{ value: "council", label: "Student Council" },
		{ value: "other", label: "Other" },
	];

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-4xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Header */}
					<div className='mb-6'>
						<h1 className='text-3xl font-bold text-white'>
							Organization Profile
						</h1>
						<p className='mt-2 text-gray-400'>
							Manage your organization's information and settings
						</p>
					</div>

					{/* Profile Form */}
					<form onSubmit={handleSubmit} className='card mb-6'>
						<h2 className='text-xl font-semibold text-white mb-6'>
							Organization Details
						</h2>

						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Organization Name <span className='text-red-500'>*</span>
								</label>
								<input
									type='text'
									name='name'
									value={profile.name}
									onChange={handleChange}
									className='input-field'
									required
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Category <span className='text-red-500'>*</span>
								</label>
								<select
									name='category'
									value={profile.category}
									onChange={handleChange}
									className='input-field'
									required>
									<option value=''>Select a category</option>
									{categories.map((cat) => (
										<option key={cat.value} value={cat.value}>
											{cat.label}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Description
								</label>
								<textarea
									name='description'
									value={profile.description}
									onChange={handleChange}
									rows={4}
									placeholder='Describe your organization...'
									className='input-field'
								/>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Contact Email
									</label>
									<input
										type='email'
										name='contactEmail'
										value={profile.contactEmail}
										onChange={handleChange}
										placeholder='contact@club.com'
										className='input-field'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Contact Number
									</label>
									<input
										type='tel'
										name='contactNumber'
										value={profile.contactNumber}
										onChange={handleChange}
										placeholder='+91 XXXXXXXXXX'
										className='input-field'
									/>
								</div>
							</div>
						</div>

						<div className='mt-6'>
							<button type='submit' disabled={saving} className='btn-primary'>
								{saving ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</form>

					{/* Discord Integration */}
					<div className='card mb-6'>
						<h2 className='text-xl font-semibold text-white mb-4'>
							Discord Integration
						</h2>
						<p className='text-gray-400 text-sm mb-4'>
							Configure a Discord webhook to automatically post announcements
							when you create new events.
						</p>

						<div>
							<label className='block text-sm font-medium text-gray-300 mb-1'>
								Discord Webhook URL
							</label>
							<div className='flex gap-3'>
								<input
									type='url'
									name='discordWebhook'
									value={profile.discordWebhook}
									onChange={handleChange}
									placeholder='https://discord.com/api/webhooks/...'
									className='input-field flex-1'
								/>
								<button
									type='button'
									onClick={testDiscordWebhook}
									className='btn-secondary whitespace-nowrap'>
									Test Webhook
								</button>
							</div>
							<p className='text-gray-500 text-xs mt-2'>
								To get a webhook URL, go to your Discord server → Server
								Settings → Integrations → Webhooks
							</p>
						</div>

						<div className='mt-4'>
							<button
								type='button'
								onClick={handleSubmit}
								disabled={saving}
								className='btn-primary'>
								{saving ? "Saving..." : "Save Webhook Settings"}
							</button>
						</div>
					</div>

					{/* Change Password */}
					<form onSubmit={handlePasswordSubmit} className='card'>
						<h2 className='text-xl font-semibold text-white mb-4'>
							Change Password
						</h2>
						<p className='text-gray-400 text-sm mb-4'>
							Update your organization login password.
						</p>

						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Current Password
								</label>
								<input
									type='password'
									name='currentPassword'
									value={passwordData.currentPassword}
									onChange={handlePasswordChange}
									className='input-field'
									required
								/>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										New Password
									</label>
									<input
										type='password'
										name='newPassword'
										value={passwordData.newPassword}
										onChange={handlePasswordChange}
										className='input-field'
										minLength={8}
										required
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Confirm New Password
									</label>
									<input
										type='password'
										name='confirmPassword'
										value={passwordData.confirmPassword}
										onChange={handlePasswordChange}
										className='input-field'
										required
									/>
								</div>
							</div>
						</div>

						<div className='mt-6'>
							<button
								type='submit'
								disabled={changingPassword}
								className='btn-primary'>
								{changingPassword ? "Changing Password..." : "Change Password"}
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
};

export default Profile;
