import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMonthlySummary } from "../../features/payments/paymentSlice";
import { getPlots } from "../../features/plots/plotSlice";
import { getUsers } from "../../features/users/userSlice";
import { getLocations } from "../../features/locations/locationSlice";
import { logout, checkTokenExpiry } from "../../features/auth/authSlice";
import { toast } from "react-hot-toast";

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { summary } = useSelector((state) => state.payments);
  const { plots } = useSelector((state) => state.plots);
  const { users } = useSelector((state) => state.users);
  const { locations } = useSelector((state) => state.locations);
  const { user, isError, errorMessage } = useSelector((state) => state.auth);

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Check token expiry periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(checkTokenExpiry());
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [dispatch]);

  // Redirect if not authenticated or token expired
  useEffect(() => {
    if (isError && errorMessage.includes("expired")) {
      toast.error("Session expired. Please login again.");
      dispatch(logout());
      navigate("/login");
    }
  }, [isError, errorMessage, dispatch, navigate]);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      const currentDate = new Date();
      const month = currentDate.toLocaleString("default", { month: "long" });
      const year = currentDate.getFullYear();

      dispatch(getMonthlySummary({ month, year }))
        .unwrap()
        .catch((err) => toast.error(err.message));
      dispatch(getPlots()).catch((err) => toast.error(err.message));
      dispatch(getUsers()).catch((err) => toast.error(err.message));
      dispatch(getLocations()).catch((err) => toast.error(err.message));
    }
  }, [dispatch, user]);

  // Show loading state if user data is not yet available
  if (!user) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        {/* <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {user.name || user.email}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            Logout
          </button>
        </div> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-primary-600">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Locations
          </h3>
          <p className="text-3xl font-bold text-primary-600">
            {locations.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Plots
          </h3>
          <p className="text-3xl font-bold text-primary-600">{plots.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Active Payments
          </h3>
          <p className="text-3xl font-bold text-primary-600">
            {summary?.paymentCount || 0}
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Monthly Summary
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Expected Amount</p>
                <p className="text-2xl font-bold">
                  Ksh {summary.totalExpected}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid Amount</p>
                <p className="text-2xl font-bold">Ksh {summary.totalPaid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Completion</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        (summary.paidCount / summary.paymentCount) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {summary.paidCount} of {summary.paymentCount} payments
                  completed
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Recent Activities
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    New user registered
                  </p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Payment received
                  </p>
                  <p className="text-sm text-gray-500">5 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
