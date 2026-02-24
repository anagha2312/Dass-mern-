import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
	const { user, isAuthenticated, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	// Get navigation links based on user role
	const getNavLinks = () => {
		if (!user) return [];

		switch (user.role) {
			case "participant":
				return [
					{ label: "Dashboard", path: "/dashboard" },
					{ label: "Browse Events", path: "/events" },
					{ label: "Clubs", path: "/clubs" },
					{ label: "Profile", path: "/profile" },
				];
			case "organizer":
				return [
					{ label: "Dashboard", path: "/organizer/dashboard" },
					{ label: "Create Event", path: "/organizer/events/new" },
					{ label: "Ongoing Events", path: "/organizer/events/ongoing" },
					{ label: "Profile", path: "/organizer/profile" },
				];
			case "admin":
				return [
					{ label: "Dashboard", path: "/admin/dashboard" },
					{ label: "Manage Clubs", path: "/admin/organizers" },
					{ label: "Password Requests", path: "/admin/password-requests" },
				];
			default:
				return [];
		}
	};

	const isActive = (path) => location.pathname === path;

	if (!isAuthenticated) {
		return null;
	}

	return (
		<nav className='bg-gray-800 border-b border-gray-700'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					{/* Logo */}
					<div className='flex items-center'>
						<Link
							to={
								user?.role === "admin"
									? "/admin/dashboard"
									: user?.role === "organizer"
										? "/organizer/dashboard"
										: "/dashboard"
							}
							className='flex items-center'>
							<span className='text-2xl font-bold text-primary-500'>
								Felicity
							</span>
						</Link>
					</div>

					{/* Navigation Links */}
					<div className='hidden md:block'>
						<div className='ml-10 flex items-baseline space-x-4'>
							{getNavLinks().map((link) => (
								<Link
									key={link.path}
									to={link.path}
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive(link.path)
											? "bg-gray-900 text-white"
											: "text-gray-300 hover:bg-gray-700 hover:text-white"
									}`}>
									{link.label}
								</Link>
							))}
						</div>
					</div>

					{/* User Menu */}
					<div className='flex items-center space-x-4'>
						<div className='text-sm'>
							<span className='text-gray-400'>
								{user?.role === "organizer"
									? user?.name
									: `${user?.firstName || ""} ${user?.lastName || ""}`}
							</span>
							<span className='ml-2 px-2 py-1 text-xs rounded-full bg-primary-900 text-primary-300 capitalize'>
								{user?.role}
							</span>
						</div>
						<button
							onClick={handleLogout}
							className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors'>
							Logout
						</button>
					</div>

					{/* Mobile menu button */}
					<div className='md:hidden'>
						<button
							type='button'
							className='bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none'
							aria-controls='mobile-menu'
							aria-expanded='false'>
							<span className='sr-only'>Open main menu</span>
							<svg
								className='block h-6 w-6'
								xmlns='http://www.w3.org/2000/svg'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									d='M4 6h16M4 12h16M4 18h16'
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			<div className='md:hidden' id='mobile-menu'>
				<div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
					{getNavLinks().map((link) => (
						<Link
							key={link.path}
							to={link.path}
							className={`block px-3 py-2 rounded-md text-base font-medium ${
								isActive(link.path)
									? "bg-gray-900 text-white"
									: "text-gray-300 hover:bg-gray-700 hover:text-white"
							}`}>
							{link.label}
						</Link>
					))}
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
