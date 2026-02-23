import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
	const { user, isAuthenticated, loading } = useAuth();
	const location = useLocation();

	// Show loading spinner while checking auth
	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-900'>
				<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500'></div>
			</div>
		);
	}

	// If not authenticated, redirect to login
	if (!isAuthenticated) {
		return <Navigate to='/login' state={{ from: location }} replace />;
	}

	// If roles are specified, check if user has required role
	if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
		// Redirect to appropriate dashboard based on role
		let redirectPath = "/login";

		switch (user?.role) {
			case "admin":
				redirectPath = "/admin/dashboard";
				break;
			case "organizer":
				redirectPath = "/organizer/dashboard";
				break;
			case "participant":
				redirectPath = "/dashboard";
				break;
			default:
				redirectPath = "/login";
		}

		return <Navigate to={redirectPath} replace />;
	}

	return children;
};

export default ProtectedRoute;
