import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

function Home() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Waste Management System
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          Efficient waste collection management for communities and
          administrators
        </p>

        <div className="flex justify-center space-x-4">
          {user ? (
            <Link
              to={user.role === "admin" ? "/admin" : "/user"}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
