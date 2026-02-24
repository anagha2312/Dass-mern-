import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar, Loading } from "../../components/common";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const OrganizerManagement = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [organizers, setOrganizers] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Modal states
	const [showCreateModal, setShowCreateModal] = useState(
		searchParams.get("action") === "new",
	);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showResetModal, setShowResetModal] = useState(false);
	const [selectedOrganizer, setSelectedOrganizer] = useState(null);
	const [saving, setSaving] = useState(false);
	const [createdCredentials, setCreatedCredentials] = useState(null);

	// Form data
	const [formData, setFormData] = useState({
		name: "",
		category: "",
		description: "",
		contactEmail: "",
		contactNumber: "",
	});

	const [resetPassword, setResetPassword] = useState("");

	useEffect(() => {
		fetchOrganizers();
	}, []);

	useEffect(() => {
		if (searchParams.get("action") === "new") {
			setShowCreateModal(true);
			setSearchParams({});
		}
	}, [searchParams]);

	const fetchOrganizers = async () => {
		try {
			setLoading(true);
			const response = await adminAPI.getOrganizers();
			setOrganizers(response.data.data || []);
		} catch (error) {
			console.error("Error fetching organizers:", error);
			toast.error("Failed to load organizers");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleCreateOrganizer = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);
			const response = await adminAPI.createOrganizer(formData);
			toast.success("Organizer created successfully");
			setShowCreateModal(false);
			setCreatedCredentials(response.data.data);
			resetForm();
			fetchOrganizers();
		} catch (error) {
			console.error("Error creating organizer:", error);
			toast.error(
				error.response?.data?.message || "Failed to create organizer",
			);
		} finally {
			setSaving(false);
		}
	};

	const handleEditOrganizer = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);
			const { password, ...updateData } = formData;
			await adminAPI.updateOrganizer(selectedOrganizer._id, updateData);
			toast.success("Organizer updated successfully");
			setShowEditModal(false);
			resetForm();
			fetchOrganizers();
		} catch (error) {
			console.error("Error updating organizer:", error);
			toast.error(
				error.response?.data?.message || "Failed to update organizer",
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteOrganizer = async (permanent = false) => {
		try {
			setSaving(true);
			await adminAPI.deleteOrganizer(selectedOrganizer._id, permanent);
			toast.success(
				permanent ? "Organizer deleted permanently" : "Organizer deactivated",
			);
			setShowDeleteModal(false);
			setSelectedOrganizer(null);
			fetchOrganizers();
		} catch (error) {
			console.error("Error deleting organizer:", error);
			toast.error(
				error.response?.data?.message || "Failed to delete organizer",
			);
		} finally {
			setSaving(false);
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		if (resetPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}
		try {
			setSaving(true);
			await adminAPI.resetOrganizerPassword(selectedOrganizer._id, {
				password: resetPassword,
			});
			toast.success("Password reset successfully");
			setShowResetModal(false);
			setResetPassword("");
			setSelectedOrganizer(null);
		} catch (error) {
			console.error("Error resetting password:", error);
			toast.error(error.response?.data?.message || "Failed to reset password");
		} finally {
			setSaving(false);
		}
	};

	const handleToggleStatus = async (organizer) => {
		try {
			await adminAPI.updateOrganizer(organizer._id, {
				isActive: !organizer.isActive,
			});
			toast.success(
				`Organizer ${organizer.isActive ? "deactivated" : "activated"}`,
			);
			fetchOrganizers();
		} catch (error) {
			console.error("Error toggling status:", error);
			toast.error("Failed to update organizer status");
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			category: "",
			description: "",
			contactEmail: "",
			contactNumber: "",
		});
		setSelectedOrganizer(null);
	};

	const openEditModal = (organizer) => {
		setSelectedOrganizer(organizer);
		setFormData({
			name: organizer.name || "",
			loginEmail: organizer.loginEmail || "",
			password: "",
			category: organizer.category || "",
			description: organizer.description || "",
			contactEmail: organizer.contactEmail || "",
			contactNumber: organizer.contactNumber || "",
		});
		setShowEditModal(true);
	};

	const openDeleteModal = (organizer) => {
		setSelectedOrganizer(organizer);
		setShowDeleteModal(true);
	};

	const openResetModal = (organizer) => {
		setSelectedOrganizer(organizer);
		setResetPassword("");
		setShowResetModal(true);
	};

	const filteredOrganizers = organizers.filter((org) => {
		const matchesSearch =
			org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			org.loginEmail?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus =
			statusFilter === "all" ||
			(statusFilter === "active" && org.isActive) ||
			(statusFilter === "inactive" && !org.isActive);

		return matchesSearch && matchesStatus;
	});

	const categories = [
		{ value: "technical", label: "Technical Club" },
		{ value: "cultural", label: "Cultural Club" },
		{ value: "sports", label: "Sports Club" },
		{ value: "literary", label: "Literary Club" },
		{ value: "gaming", label: "Gaming Club" },
		{ value: "other", label: "Other" },
	];

	if (loading) return <Loading />;

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Header */}
					<div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6'>
						<div>
							<h1 className='text-3xl font-bold text-white'>
								Organizer Management
							</h1>
							<p className='mt-2 text-gray-400'>Manage clubs and councils</p>
						</div>
						<button
							onClick={() => {
								resetForm();
								setShowCreateModal(true);
							}}
							className='mt-4 md:mt-0 btn-primary'>
							+ Add New Organizer
						</button>
					</div>

					{/* Filters */}
					<div className='card mb-6'>
						<div className='flex flex-col md:flex-row gap-4'>
							<input
								type='text'
								placeholder='Search by name or email...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='input-field flex-1'
							/>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className='input-field md:w-48'>
								<option value='all'>All Status</option>
								<option value='active'>Active</option>
								<option value='inactive'>Inactive</option>
							</select>
						</div>
					</div>

					{/* Organizers Table */}
					<div className='card overflow-x-auto'>
						<table className='min-w-full divide-y divide-gray-700'>
							<thead className='bg-gray-800'>
								<tr>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
										Organization
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
										Category
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
										Status
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
										Events
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-700'>
								{filteredOrganizers.map((org) => (
									<tr key={org._id} className='hover:bg-gray-800/50'>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='text-sm text-white font-medium'>
												{org.name}
											</div>
											<div className='text-sm text-gray-400'>
												{org.loginEmail}
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<span className='text-sm text-gray-300 capitalize'>
												{org.category?.replace("-", " ") || "N/A"}
											</span>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<button
												onClick={() => handleToggleStatus(org)}
												className={`px-3 py-1 rounded-full text-xs ${
													org.isActive
														? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
														: "bg-red-500/10 text-red-400 hover:bg-red-500/20"
												}`}>
												{org.isActive ? "Active" : "Inactive"}
											</button>
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
											{org.eventCount || 0}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm'>
											<div className='flex gap-3'>
												<button
													onClick={() => openEditModal(org)}
													className='text-primary-400 hover:text-primary-300'>
													Edit
												</button>
												<button
													onClick={() => openResetModal(org)}
													className='text-yellow-400 hover:text-yellow-300'>
													Reset Password
												</button>
												<button
													onClick={() => openDeleteModal(org)}
													className='text-red-400 hover:text-red-300'>
													Delete
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{filteredOrganizers.length === 0 && (
							<div className='text-center py-12 text-gray-500'>
								No organizers found
							</div>
						)}
					</div>
				</div>
			</main>

			{/* Create Modal */}
			{showCreateModal && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
						<div className='p-6'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Create New Organizer
							</h2>
							<form onSubmit={handleCreateOrganizer} className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											Organization Name <span className='text-red-500'>*</span>
										</label>
										<input
											type='text'
											name='name'
											value={formData.name}
											onChange={handleChange}
											required
											className='input-field'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											Category <span className='text-red-500'>*</span>
										</label>
										<select
											name='category'
											value={formData.category}
											onChange={handleChange}
											required
											className='input-field'>
											<option value=''>Select category</option>
											{categories.map((cat) => (
												<option key={cat.value} value={cat.value}>
													{cat.label}
												</option>
											))}
										</select>
									</div>
								</div>

								<p className='text-sm text-gray-400 bg-gray-900/50 p-3 rounded-lg'>
									📧 Login email and password will be <strong className='text-primary-400'>auto-generated</strong> and shown after creation.
								</p>


								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Description
									</label>
									<textarea
										name='description'
										value={formData.description}
										onChange={handleChange}
										rows={3}
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
											value={formData.contactEmail}
											onChange={handleChange}
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
											value={formData.contactNumber}
											onChange={handleChange}
											className='input-field'
										/>
									</div>
								</div>

								<div className='flex justify-end gap-3 pt-4'>
									<button
										type='button'
										onClick={() => {
											setShowCreateModal(false);
											resetForm();
										}}
										className='btn-secondary'>
										Cancel
									</button>
									<button
										type='submit'
										disabled={saving}
										className='btn-primary'>
										{saving ? "Creating..." : "Create Organizer"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Edit Modal */}
			{showEditModal && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
						<div className='p-6'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Edit Organizer
							</h2>
							<form onSubmit={handleEditOrganizer} className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											Organization Name <span className='text-red-500'>*</span>
										</label>
										<input
											type='text'
											name='name'
											value={formData.name}
											onChange={handleChange}
											required
											className='input-field'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-300 mb-1'>
											Category <span className='text-red-500'>*</span>
										</label>
										<select
											name='category'
											value={formData.category}
											onChange={handleChange}
											required
											className='input-field'>
											<option value=''>Select category</option>
											{categories.map((cat) => (
												<option key={cat.value} value={cat.value}>
													{cat.label}
												</option>
											))}
										</select>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Login Email (Read Only)
									</label>
									<input
										type='email'
										value={formData.loginEmail}
										disabled
										className='input-field opacity-50'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										Description
									</label>
									<textarea
										name='description'
										value={formData.description}
										onChange={handleChange}
										rows={3}
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
											value={formData.contactEmail}
											onChange={handleChange}
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
											value={formData.contactNumber}
											onChange={handleChange}
											className='input-field'
										/>
									</div>
								</div>

								<div className='flex justify-end gap-3 pt-4'>
									<button
										type='button'
										onClick={() => {
											setShowEditModal(false);
											resetForm();
										}}
										className='btn-secondary'>
										Cancel
									</button>
									<button
										type='submit'
										disabled={saving}
										className='btn-primary'>
										{saving ? "Saving..." : "Save Changes"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteModal && selectedOrganizer && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-lg w-full max-w-md'>
						<div className='p-6'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Delete Organizer
							</h2>
							<p className='text-gray-300 mb-6'>
								Are you sure you want to delete{" "}
								<strong>{selectedOrganizer.name}</strong>?
							</p>
							<div className='flex flex-col gap-3'>
								<button
									onClick={() => handleDeleteOrganizer(false)}
									disabled={saving}
									className='btn-secondary w-full'>
									{saving ? "Processing..." : "Deactivate (Soft Delete)"}
								</button>
								<button
									onClick={() => handleDeleteOrganizer(true)}
									disabled={saving}
									className='bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg w-full'>
									{saving ? "Processing..." : "Delete Permanently"}
								</button>
								<button
									onClick={() => {
										setShowDeleteModal(false);
										setSelectedOrganizer(null);
									}}
									className='text-gray-400 hover:text-white'>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Reset Password Modal */}
			{showResetModal && selectedOrganizer && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-lg w-full max-w-md'>
						<div className='p-6'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Reset Password
							</h2>
							<p className='text-gray-300 mb-4'>
								Reset password for <strong>{selectedOrganizer.name}</strong>
							</p>
							<form onSubmit={handleResetPassword}>
								<div className='mb-4'>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										New Password
									</label>
									<input
										type='password'
										value={resetPassword}
										onChange={(e) => setResetPassword(e.target.value)}
										required
										minLength={8}
										className='input-field'
										placeholder='Minimum 8 characters'
									/>
								</div>
								<div className='flex justify-end gap-3'>
									<button
										type='button'
										onClick={() => {
											setShowResetModal(false);
											setResetPassword("");
											setSelectedOrganizer(null);
										}}
										className='btn-secondary'>
										Cancel
									</button>
									<button
										type='submit'
										disabled={saving}
										className='btn-primary'>
										{saving ? "Resetting..." : "Reset Password"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Generated Credentials Modal */}
			{createdCredentials && (
				<div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-xl max-w-md w-full p-6'>
						<h3 className='text-xl font-bold text-green-400 mb-2'>
							✅ Organizer Created Successfully
						</h3>
						<p className='text-gray-400 text-sm mb-4'>
							Share these credentials with the organizer. The password cannot be retrieved later.
						</p>

						<div className='bg-gray-900 rounded-lg p-4 space-y-3'>
							<div>
								<label className='block text-xs text-gray-500 uppercase tracking-wide'>Name</label>
								<p className='text-white font-medium'>{createdCredentials.name}</p>
							</div>
							<div>
								<label className='block text-xs text-gray-500 uppercase tracking-wide'>Login Email</label>
								<p className='text-primary-400 font-mono text-lg'>{createdCredentials.loginEmail}</p>
							</div>
							<div>
								<label className='block text-xs text-gray-500 uppercase tracking-wide'>Temporary Password</label>
								<p className='text-yellow-400 font-mono text-lg'>{createdCredentials.temporaryPassword}</p>
							</div>
						</div>

						<button
							onClick={() => setCreatedCredentials(null)}
							className='w-full mt-4 btn-primary py-3'>
							Done
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default OrganizerManagement;

