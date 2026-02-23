import { useState, useEffect } from "react";
import { Navbar, Loading } from "../../components/common";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const PasswordRequests = () => {
	const [loading, setLoading] = useState(true);
	const [requests, setRequests] = useState([]);
	const [showResetModal, setShowResetModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [newPassword, setNewPassword] = useState("");
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		fetchRequests();
	}, []);

	const fetchRequests = async () => {
		try {
			setLoading(true);
			const response = await adminAPI.getPasswordRequests();
			setRequests(response.data.data || []);
		} catch (error) {
			console.error("Error fetching password requests:", error);
			// If the endpoint doesn't exist, show empty state
			setRequests([]);
		} finally {
			setLoading(false);
		}
	};

	const handleApprove = (request) => {
		setSelectedRequest(request);
		setNewPassword("");
		setShowResetModal(true);
	};

	const handleReject = async (request) => {
		try {
			setProcessing(true);
			await adminAPI.handlePasswordRequest(request._id, { action: "reject" });
			toast.success("Request rejected");
			fetchRequests();
		} catch (error) {
			console.error("Error rejecting request:", error);
			toast.error("Failed to reject request");
		} finally {
			setProcessing(false);
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();

		if (newPassword.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}

		try {
			setProcessing(true);
			// Use handlePasswordRequest with newPassword - it will reset password and clear the request
			const response = await adminAPI.handlePasswordRequest(
				selectedRequest._id,
				{
					action: "approve",
					newPassword: newPassword,
				},
			);

			if (response.data.data?.newPassword) {
				toast.success(`Password reset to: ${response.data.data.newPassword}`);
			} else {
				toast.success("Password reset successfully");
			}

			setShowResetModal(false);
			setSelectedRequest(null);
			setNewPassword("");
			fetchRequests();
		} catch (error) {
			console.error("Error resetting password:", error);
			toast.error(error.response?.data?.message || "Failed to reset password");
		} finally {
			setProcessing(false);
		}
	};

	if (loading) return <Loading />;

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Header */}
					<div className='mb-6'>
						<h1 className='text-3xl font-bold text-white'>
							Password Reset Requests
						</h1>
						<p className='mt-2 text-gray-400'>
							Review and handle password reset requests from organizers
						</p>
					</div>

					{/* Requests List */}
					<div className='card'>
						{requests.length > 0 ? (
							<div className='space-y-4'>
								{requests.map((request) => (
									<div
										key={request._id}
										className='flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-800 rounded-lg'>
										<div>
											<h3 className='text-white font-medium'>
												{request.organizerName || "Unknown Organizer"}
											</h3>
											<p className='text-gray-400 text-sm'>
												{request.organizerEmail}
											</p>
											<p className='text-gray-500 text-xs mt-1'>
												Requested:{" "}
												{new Date(request.createdAt).toLocaleString()}
											</p>
											{request.reason && (
												<p className='text-gray-400 text-sm mt-2 italic'>
													"{request.reason}"
												</p>
											)}
										</div>
										<div className='mt-4 md:mt-0 flex gap-3'>
											<button
												onClick={() => handleApprove(request)}
												disabled={processing}
												className='btn-primary'>
												Approve & Reset
											</button>
											<button
												onClick={() => handleReject(request)}
												disabled={processing}
												className='btn-secondary text-red-400'>
												Reject
											</button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className='text-center py-12'>
								<div className='text-gray-500 text-5xl mb-4'>✓</div>
								<h3 className='text-xl font-medium text-gray-300'>
									No Pending Requests
								</h3>
								<p className='text-gray-500 mt-2'>
									All password reset requests have been handled
								</p>
							</div>
						)}
					</div>

					{/* Info Card */}
					<div className='card mt-6 bg-blue-900/20 border border-blue-800'>
						<h3 className='text-blue-400 font-medium mb-2'>
							How Password Reset Works
						</h3>
						<ul className='text-gray-400 text-sm space-y-1'>
							<li>
								• Organizers can request a password reset from their login page
							</li>
							<li>• Requests appear here for admin approval</li>
							<li>• When approved, you set a new temporary password</li>
							<li>
								• The organizer should change this password after logging in
							</li>
						</ul>
					</div>
				</div>
			</main>

			{/* Reset Password Modal */}
			{showResetModal && selectedRequest && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
					<div className='bg-gray-800 rounded-lg w-full max-w-md'>
						<div className='p-6'>
							<h2 className='text-xl font-semibold text-white mb-4'>
								Set New Password
							</h2>
							<p className='text-gray-300 mb-4'>
								Set a new password for{" "}
								<strong>{selectedRequest.organizerName}</strong>
							</p>
							<form onSubmit={handleResetPassword}>
								<div className='mb-4'>
									<label className='block text-sm font-medium text-gray-300 mb-1'>
										New Password
									</label>
									<input
										type='password'
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
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
											setSelectedRequest(null);
											setNewPassword("");
										}}
										className='btn-secondary'>
										Cancel
									</button>
									<button
										type='submit'
										disabled={processing}
										className='btn-primary'>
										{processing ? "Processing..." : "Reset Password"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PasswordRequests;
