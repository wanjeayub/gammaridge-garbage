import { useEffect } from "react";
import { useSelector } from "react-redux";

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const { plots } = useSelector((state) => state.plots);

  // Filter plots assigned to the current user
  const userPlots = plots.filter((plot) =>
    plot.users.some((plotUser) => plotUser._id === user._id)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">User Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            My Information
          </h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Name:</span> {user.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-medium">Mobile:</span> {user.mobile}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">My Plots</h3>
          {userPlots.length > 0 ? (
            <ul className="space-y-2">
              {userPlots.map((plot) => (
                <li key={plot._id} className="border-b pb-2">
                  <p className="font-medium">Plot #{plot.plotNumber}</p>
                  <p className="text-sm text-gray-600">
                    Location: {plot.location?.name} | Bags: {plot.bagsRequired}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No plots assigned to you yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-primary-100 text-primary-700 p-4 rounded-lg hover:bg-primary-200 transition">
            View Payment History
          </button>
          <button className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition">
            Update Profile
          </button>
          <button className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
