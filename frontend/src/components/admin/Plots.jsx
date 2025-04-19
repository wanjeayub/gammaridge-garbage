import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  reset,
} from "../../features/plots/plotSlice";
import { getLocations } from "../../features/locations/locationSlice";
import { getUsers } from "../../features/users/userSlice";
import Modal from "react-modal";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUsers,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

Modal.setAppElement("#root");

function Plots() {
  const dispatch = useDispatch();
  const { plots, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.plots
  );
  const { locations } = useSelector((state) => state.locations);
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [assignModalIsOpen, setAssignModalIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showAssigned, setShowAssigned] = useState(false);
  const [currentPlot, setCurrentPlot] = useState({
    _id: "",
    plotNumber: "",
    bagsRequired: "",
    location: "",
  });

  useEffect(() => {
    dispatch(getPlots());
    dispatch(getLocations());
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

  // Filter plots based on assignment status
  const filteredPlots = showAssigned
    ? plots
    : plots.filter((plot) => !plot.users || plot.users.length === 0);

  // Get all user IDs that are already assigned to any plot
  const assignedUserIds = plots.reduce((acc, plot) => {
    if (plot.users && plot.users.length > 0) {
      return [...acc, ...plot.users];
    }
    return acc;
  }, []);

  // Filter available users:
  // 1. Not already assigned to any plot
  // 2. Not an admin user
  // 3. Not the current user (if current user is admin)
  const availableUsers = users.filter((user) => {
    return (
      !assignedUserIds.includes(user._id) &&
      user.role !== "admin" &&
      user._id !== currentUser?._id
    );
  });

  const openModal = (plot = null) => {
    if (plot) {
      setIsEdit(true);
      setCurrentPlot({
        _id: plot._id,
        plotNumber: plot.plotNumber,
        bagsRequired: plot.bagsRequired,
        location: plot.location?._id || "",
      });
    } else {
      setIsEdit(false);
      setCurrentPlot({
        _id: "",
        plotNumber: "",
        bagsRequired: "",
        location: locations.length > 0 ? locations[0]._id : "",
      });
    }
    setModalIsOpen(true);
  };

  const openAssignModal = (plot) => {
    setCurrentPlot({
      _id: plot._id,
      plotNumber: plot.plotNumber,
      users: plot.users || [],
    });
    setAssignModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const closeAssignModal = () => {
    setAssignModalIsOpen(false);
    dispatch(getPlots()); // Refresh plot data
  };

  const handleChange = (e) => {
    setCurrentPlot({
      ...currentPlot,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const plotData = {
      plotNumber: currentPlot.plotNumber,
      bagsRequired: currentPlot.bagsRequired,
      location: currentPlot.location,
    };

    if (isEdit) {
      dispatch(updatePlot({ plotId: currentPlot._id, plotData }));
    } else {
      dispatch(createPlot(plotData));
    }
  };

  const handleDelete = (plotId) => {
    if (window.confirm("Are you sure you want to delete this plot?")) {
      dispatch(deletePlot(plotId))
        .then(() => {
          dispatch(getPlots());
          toast.success("Plot deleted successfully");
        })
        .catch((error) => {
          toast.error(error.message || "Failed to delete plot");
        });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Plot Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAssigned(!showAssigned)}
            className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            {showAssigned ? (
              <FaEyeSlash className="mr-2" />
            ) : (
              <FaEye className="mr-2" />
            )}
            {showAssigned ? "Hide Assigned" : "Show Assigned"}
          </button>
          <button
            onClick={() => openModal()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaPlus className="mr-2" /> Add Plot
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plot Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bags Required
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPlots.map((plot) => (
              <tr key={plot._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {plot.plotNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {plot.bagsRequired}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {plot.location?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {plot.users?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openModal(plot)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => openAssignModal(plot)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <FaUsers />
                  </button>
                  <button
                    onClick={() => handleDelete(plot._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plot Form Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Plot Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {isEdit ? "Edit Plot" : "Add Plot"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Number
              </label>
              <input
                type="text"
                name="plotNumber"
                value={currentPlot.plotNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bags Required
              </label>
              <input
                type="number"
                name="bagsRequired"
                value={currentPlot.bagsRequired}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                min="1"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                name="location"
                value={currentPlot.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
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
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Assign Users Modal */}
      <Modal
        isOpen={assignModalIsOpen}
        onRequestClose={closeAssignModal}
        contentLabel="Assign Users Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            Assign Users to Plot {currentPlot.plotNumber}
          </h2>

          {availableUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No available users to assign. All eligible users are already
              assigned to plots.
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Users ({availableUsers.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div key={user._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`user-${user._id}`}
                        checked={currentPlot.users?.includes(user._id)}
                        onChange={() => {
                          const updatedUsers = currentPlot.users?.includes(
                            user._id
                          )
                            ? currentPlot.users.filter((id) => id !== user._id)
                            : [...(currentPlot.users || []), user._id];
                          setCurrentPlot({
                            ...currentPlot,
                            users: updatedUsers,
                          });
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`user-${user._id}`}
                        className="ml-2 block text-sm text-gray-900"
                      >
                        {user.name} ({user.mobile})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(
                      updatePlot({
                        plotId: currentPlot._id,
                        plotData: { users: currentPlot.users },
                      })
                    ).then(() => {
                      toast.success("Users assigned successfully");
                      closeAssignModal();
                    });
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Save Assignments
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Plots;
