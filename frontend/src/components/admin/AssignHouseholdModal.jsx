import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { assignUsersToPlot } from "../../features/plots/plotSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import Modal from "react-modal";

Modal.setAppElement("#root");

function AssignHouseholdModal({ isOpen, onRequestClose, plot }) {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Add null checks for plot
  const plotNumber = plot?.plotNumber || "N/A";
  const plotId = plot?._id;

  useEffect(() => {
    if (isOpen) {
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if plotId exists
    if (!plotId) {
      toast.error("No plot selected");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    dispatch(assignUsersToPlot({ plotId, userIds: selectedUsers }))
      .unwrap()
      .then(() => {
        toast.success("Users assigned successfully");
        onRequestClose();
      })
      .catch((error) => {
        toast.error(error.message || "Failed to assign users");
      });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Assign Household Modal"
      className="modal"
      overlayClassName="modal-overlay"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Assign Users to Plot #{plotNumber}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 max-h-96 overflow-y-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Users
            </label>
            {users?.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`user-${user._id}`}
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleUserSelect(user._id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`user-${user._id}`}
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {user.name} ({user.email})
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No users available</p>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onRequestClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Assign Users
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default AssignHouseholdModal;
