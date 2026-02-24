import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navbar, Loading } from "../../components/common";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const AdminDashboard = () => {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({
		totalOrganizers: 0,
		activeOrganizers: 0,
		pendingPasswordRequests: 0,
		totalEvents: 0,
		totalRegistrations: 0,
	});
	const [recentOrganizers, setRecentOrganizers] = useState([]);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			const [statsRes, organizersRes] = await Promise.all([
				adminAPI.getDashboardStats().catch(() => ({ data: { data: {} } })),
				adminAPI
					.getOrganizers({ limit: 5 })
					.catch(() => ({ data: { data: [] } })),
			]);

			if (statsRes.data.data) {
				setStats((prev) => ({ ...prev, ...statsRes.data.data }));
			}
			setRecentOrganizers(organizersRes.data.data || []);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <Loading />;

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Welcome Section */}
					<div className='card mb-6'>
						<h1 className='text-3xl font-bold text-white'>Admin Dashboard</h1>
						<p className='mt-2 text-gray-400'>
							Manage clubs, organizers, and system settings.
						</p>
					</div>

					{/* Quick Actions */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
						<Link
							to='/admin/organizers'
							className='card hover:bg-gray-700 transition-colors'>
							<h3 className='text-lg font-medium text-primary-400'>
								Manage Clubs
							</h3>
							<p className='text-gray-400 mt-2'>
								View, add, or remove clubs and organizers
							</p>
						</Link>
						<Link
							to='/admin/organizers?action=new'
							className='card hover:bg-gray-700 transition-colors'>
							<h3 className='text-lg font-medium text-green-400'>
								Add New Club
							</h3>
							<p className='text-gray-400 mt-2'>
								Create a new club/organizer account
							</p>
						</Link>
						<Link
							to='/admin/password-requests'
							className='card hover:bg-gray-700 transition-colors'>
							<h3 className='text-lg font-medium text-yellow-400'>
								Password Requests
							</h3>
							<p className='text-gray-400 mt-2'>
								Handle organizer password reset requests
							</p>
						</Link>
					</div>

					{/* System Overview */}
					<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>Total Clubs</h3>
							<p className='text-3xl font-bold text-white mt-2'>
								{stats.totalOrganizers}
							</p>
						</div>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Active Clubs
							</h3>
							<p className='text-3xl font-bold text-green-400 mt-2'>
								{stats.activeOrganizers}
							</p>
						</div>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Total Events
							</h3>
							<p className='text-3xl font-bold text-blue-400 mt-2'>
								{stats.totalEvents}
							</p>
						</div>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Password Requests
							</h3>
							<p className='text-3xl font-bold text-yellow-400 mt-2'>
								{stats.pendingPasswordRequests}
							</p>
						</div>
					</div>

					{/* Recent Organizers */}
					<div className='card'>
						<div className='flex justify-between items-center mb-4'>
							<h2 className='text-xl font-semibold text-white'>
								Recent Organizers
							</h2>
							<Link
								to='/admin/organizers'
								className='text-primary-400 hover:text-primary-300'>
								View All →
							</Link>
						</div>
						{recentOrganizers.length > 0 ? (
							<div className='space-y-3'>
								{recentOrganizers.map((org) => (
									<div
										key={org._id}
										className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'>
										<div>
											<p className='text-white font-medium'>{org.name}</p>
											<p className='text-gray-400 text-sm'>{org.loginEmail}</p>
										</div>
										<span
											className={`px-2 py-1 rounded text-xs ${
												org.isActive
													? "bg-green-500/10 text-green-400"
													: "bg-red-500/10 text-red-400"
											}`}>
											{org.isActive ? "Active" : "Inactive"}
										</span>
									</div>
								))}
							</div>
						) : (
							<p className='text-gray-500 text-center py-4'>
								No organizers found
							</p>
						)}
					</div>
				</div>
			</main>
		</div>
	);
};

export default AdminDashboard;
