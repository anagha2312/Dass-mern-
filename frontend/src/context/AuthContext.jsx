import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Check for existing session on mount
	const checkAuth = useCallback(async () => {
		const token = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");

		if (!token) {
			setLoading(false);
			return;
		}

		try {
			// Verify token with backend
			const response = await authAPI.getMe();
			if (response.data.success) {
				setUser(response.data.user);
				setIsAuthenticated(true);
				// Update stored user data
				localStorage.setItem("user", JSON.stringify(response.data.user));
			}
		} catch (error) {
			console.error("Auth check failed:", error);
			// Clear invalid session
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			setUser(null);
			setIsAuthenticated(false);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// Register function
	const register = async (userData) => {
		try {
			const response = await authAPI.register(userData);
			if (response.data.success) {
				const { token, user: newUser } = response.data;

				// Store token and user
				localStorage.setItem("token", token);
				localStorage.setItem("user", JSON.stringify(newUser));

				setUser(newUser);
				setIsAuthenticated(true);

				toast.success("Registration successful!");
				return { success: true, user: newUser };
			}
		} catch (error) {
			const message = error.response?.data?.message || "Registration failed";
			toast.error(message);
			return { success: false, error: message };
		}
	};

	// Login function
	const login = async (credentials) => {
		try {
			const response = await authAPI.login(credentials);
			if (response.data.success) {
				const { token, user: loggedInUser } = response.data;

				// Store token and user
				localStorage.setItem("token", token);
				localStorage.setItem("user", JSON.stringify(loggedInUser));

				setUser(loggedInUser);
				setIsAuthenticated(true);

				toast.success("Login successful!");
				return { success: true, user: loggedInUser };
			}
		} catch (error) {
			const message = error.response?.data?.message || "Login failed";
			toast.error(message);
			return { success: false, error: message };
		}
	};

	// Logout function
	const logout = async () => {
		try {
			await authAPI.logout();
		} catch (error) {
			console.error("Logout API error:", error);
		} finally {
			// Clear local storage and state regardless of API response
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			setUser(null);
			setIsAuthenticated(false);
			toast.success("Logged out successfully");
		}
	};

	// Update user data
	const updateUser = (updatedData) => {
		const newUser = { ...user, ...updatedData };
		setUser(newUser);
		localStorage.setItem("user", JSON.stringify(newUser));
	};

	// Change password
	const changePassword = async (passwordData) => {
		try {
			const response = await authAPI.changePassword(passwordData);
			if (response.data.success) {
				toast.success("Password changed successfully");
				return { success: true };
			}
		} catch (error) {
			const message =
				error.response?.data?.message || "Failed to change password";
			toast.error(message);
			return { success: false, error: message };
		}
	};

	// Get dashboard route based on role
	const getDashboardRoute = () => {
		if (!user) return "/login";

		switch (user.role) {
			case "admin":
				return "/admin/dashboard";
			case "organizer":
				return "/organizer/dashboard";
			case "participant":
			default:
				// Check if onboarding is needed
				if (!user.onboardingCompleted) {
					return "/onboarding";
				}
				return "/dashboard";
		}
	};

	const value = {
		user,
		loading,
		isAuthenticated,
		register,
		login,
		logout,
		updateUser,
		changePassword,
		getDashboardRoute,
		checkAuth,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
