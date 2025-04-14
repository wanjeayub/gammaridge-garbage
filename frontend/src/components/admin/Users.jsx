import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  reset,
} from "../../features/users/userSlice";
import Modal from "react-modal";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUserShield,
  FaUserCog,
  FaUser,
} from "react-icons/fa";

Modal.setAppElement("#root");

function Users() {
  const dispatch = useDispatch();
  const { users, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.users
  );
  const { user: currentUser } = useSelector((state) => state.auth);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentUserData, setCurrentUserData] = useState({
    _id: "",
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success(message || "Operation successful");
      closeModal();
    }

    dispatch(reset());
  }, [isError, isSuccess, message, dispatch]);

  const canEditUser = (targetUser) => {
    if (currentUser.role === "superadmin") return true;
    if (currentUser.role === "admin") {
      return targetUser.role !== "superadmin";
    }
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (targetUser._id === currentUser._id) return false;
    if (currentUser.role === "superadmin") return true;
    if (currentUser.role === "admin") {
      return targetUser.role === "user";
    }
    return false;
  };

  const openModal = (user = null) => {
    if (user) {
      setIsEdit(true);
      setCurrentUserData({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        password: "",
        role: user.role,
      });
    } else {
      setIsEdit(false);
      setCurrentUserData({
        _id: "",
        name: "",
        email: "",
        mobile: "",
        password: "",
        role: "user",
      });
    }
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleChange = (e) => {
    setCurrentUserData({
      ...currentUserData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      dispatch(
        updateUser({ userId: currentUserData._id, userData: currentUserData })
      );
    } else {
      dispatch(createUser(currentUserData));
    }
  };

  const handleDelete = (userId, userRole) => {
    if (!canDeleteUser({ _id: userId, role: userRole })) {
      toast.error("You don't have permission to delete this user");
      return;
    }

    if (window.confirm(`Are you sure you want to delete this ${userRole}?`)) {
      dispatch(deleteUser(userId))
        .unwrap()
        .then(() => {
          dispatch(getUsers());
          toast.success("User deleted successfully");
        })
        .catch((error) => {
          toast.error(error.message || "Deletion failed");
        });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "superadmin":
        return <FaUserShield className="mr-1" />;
      case "admin":
        return <FaUserCog className="mr-1" />;
      default:
        return <FaUser className="mr-1" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        {currentUser.role !== "user" && (
          <button
            onClick={() => openModal()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaPlus className="mr-2" /> Add User
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.mobile}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {getRoleIcon(user.role)}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openModal(user)}
                    className={`mr-4 ${
                      canEditUser(user)
                        ? "text-indigo-600 hover:text-indigo-900"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!canEditUser(user)}
                    title={
                      !canEditUser(user) ? "Editing not permitted" : "Edit user"
                    }
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(user._id, user.role)}
                    className={
                      canDeleteUser(user)
                        ? "text-red-600 hover:text-red-900"
                        : "text-gray-400 cursor-not-allowed"
                    }
                    disabled={!canDeleteUser(user)}
                    title={
                      !canDeleteUser(user)
                        ? "Deletion not permitted"
                        : "Delete user"
                    }
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="User Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {isEdit ? "Edit User" : "Add User"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={currentUserData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={currentUserData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="mobile"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mobile
              </label>
              <input
                type="text"
                id="mobile"
                name="mobile"
                value={currentUserData.mobile}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={currentUserData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={currentUser.role !== "superadmin" && isEdit}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                {currentUser.role === "superadmin" && (
                  <option value="superadmin">Superadmin</option>
                )}
              </select>
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={currentUserData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required={!isEdit}
                placeholder={isEdit ? "Leave blank to keep current" : ""}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default Users;
