import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Route for pages that should only be accessible to non-authenticated users
// (like login and register pages)
const PublicRoute = ({ children }) => {
	const { isAuthenticated, loading, getDashboardRoute } = useAuth();

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-900'>
				<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500'></div>
			</div>
		);
	}

	// If authenticated, redirect to appropriate dashboard
	if (isAuthenticated) {
		return <Navigate to={getDashboardRoute()} replace />;
	}

	return children;
};

export default PublicRoute;
