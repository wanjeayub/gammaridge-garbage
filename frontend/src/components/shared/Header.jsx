import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

function Header({ onMenuToggle, isSidebarOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          {/* Mobile menu button - only visible on small screens */}
          <button
            className="md:hidden mr-4 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Waste Management System
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
