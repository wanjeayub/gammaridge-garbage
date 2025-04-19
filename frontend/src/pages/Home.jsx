import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { logout } from "../features/auth/authSlice"; // 🔁 Adjust path as needed

function Home() {
  const { user, loading } = useSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsCheckingAuth(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const getDashboardRoute = (role) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "shop_owner":
        return "/shop";
      case "super_admin":
        return "/super-admin";
      default:
        return "/user";
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (isCheckingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Waste Management System
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Efficient waste collection management for communities and
          administrators.
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          {user ? (
            <>
              <Link
                to={getDashboardRoute(user.role)}
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg shadow hover:bg-primary-700 transition"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-3 border border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg shadow hover:bg-primary-700 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-100 transition"
              >
                Register
              </Link>
              <Link
                to="/auth/google"
                className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg shadow hover:bg-red-600 transition"
              >
                Sign in with Google
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default Home;
