import { useState, useEffect, useCallback } from "react";
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
  FaSearch,
  FaFilter,
  FaTimes,
  FaChartBar,
  FaUserPlus,
  FaUserMinus,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

Modal.setAppElement("#root");

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    border: "none",
    borderRadius: "12px",
    padding: "0",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    maxHeight: "90vh",
    width: "90%",
    maxWidth: "1200px",
  },
};

function PlotDebug() {
  const dispatch = useDispatch();
  const { plots, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.plots
  );
  const { locations } = useSelector((state) => state.locations);
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [assignModalIsOpen, setAssignModalIsOpen] = useState(false);
  const [userModalIsOpen, setUserModalIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState(null);
  const [currentPlot, setCurrentPlot] = useState({
    _id: "",
    plotNumber: "",
    bagsRequired: "",
    location: "",
  });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
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

  // Filter plots based on search and location filter
  const filteredPlots = plots.filter((plot) => {
    const matchesSearch = plot.plotNumber
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter
      ? plot.location?._id === locationFilter.value
      : true;
    return matchesSearch && matchesLocation;
  });

  // Get all assigned user IDs across all plots
  const assignedUserIds = plots.reduce((acc, plot) => {
    if (plot.users && plot.users.length > 0) {
      return [
        ...acc,
        ...plot.users.map((user) =>
          typeof user === "object" ? user._id : user
        ),
      ];
    }
    return acc;
  }, []);

  // Available users are those not assigned to any plot
  const availableUsers = users.filter((user) => {
    return (
      !assignedUserIds.includes(user._id) &&
      user.role !== "admin" &&
      user._id !== currentUser?._id
    );
  });

  // Location options for filter dropdown
  const locationOptions = locations.map((location) => ({
    value: location._id,
    label: location.name,
  }));

  // Summary statistics
  const summaryStats = {
    totalPlots: plots.length,
    assignedPlots: plots.filter((plot) => plot.users?.length > 0).length,
    unassignedPlots: plots.filter(
      (plot) => !plot.users || plot.users.length === 0
    ).length,
    totalUsers: users.length,
    assignedUsers: new Set(assignedUserIds).size,
    locations: locations.length,
    totalBags: plots.reduce((sum, plot) => sum + (plot.bagsRequired || 0), 0),
  };

  // Open modal for plot editing/creation
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

  // Open modal for user assignment
  const openAssignModal = (plot) => {
    setCurrentPlot({
      _id: plot._id,
      plotNumber: plot.plotNumber,
      users: plot.users || [],
    });
    setAssignModalIsOpen(true);
  };

  // Open modal for new user creation
  const openUserModal = (plot) => {
    setCurrentPlot({
      _id: plot._id,
      plotNumber: plot.plotNumber,
    });
    setNewUser({
      name: "",
      email: "",
      mobile: "",
    });
    setUserModalIsOpen(true);
  };

  // Close all modals
  const closeModal = () => setModalIsOpen(false);
  const closeAssignModal = () => setAssignModalIsOpen(false);
  const closeUserModal = () => setUserModalIsOpen(false);

  // Handle form changes
  const handleChange = (e) => {
    setCurrentPlot({
      ...currentPlot,
      [e.target.name]: e.target.value,
    });
  };

  const handleUserChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value,
    });
  };

  // Submit plot form
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

  // Delete a plot
  const handleDelete = (plotId) => {
    toast.custom((t) => (
      <div
        className={`bg-white rounded-lg shadow-lg p-4 ${
          t.visible ? "animate-enter" : "animate-leave"
        }`}
      >
        <h3 className="font-medium text-lg">Confirm Deletion</h3>
        <p className="text-gray-600 mt-2">
          Are you sure you want to delete this plot?
        </p>
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              dispatch(deletePlot(plotId))
                .then(() => {
                  dispatch(getPlots());
                  toast.success("Plot deleted successfully");
                  toast.dismiss(t.id);
                })
                .catch((error) => {
                  toast.error(error.message || "Failed to delete plot");
                  toast.dismiss(t.id);
                });
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  // Remove user from plot
  const removeUserFromPlot = (plotId, userId) => {
    const plot = plots.find((p) => p._id === plotId);
    if (!plot) return;

    const updatedUsers = plot.users.filter(
      (user) => (typeof user === "object" ? user._id : user) !== userId
    );

    dispatch(
      updatePlot({
        plotId,
        plotData: { users: updatedUsers },
      })
    ).then(() => {
      toast.success("User removed from plot successfully");
      dispatch(getPlots());
    });
  };

  // Add new user to plot
  const addNewUserToPlot = (e) => {
    e.preventDefault();

    // In a real app, you would dispatch an action to create the user first
    // Then add them to the plot. Here we'll simulate it by adding to local state

    const newUserId = `temp-${Date.now()}`;
    const updatedUsers = [
      ...(currentPlot.users || []),
      {
        _id: newUserId,
        ...newUser,
      },
    ];

    dispatch(
      updatePlot({
        plotId: currentPlot._id,
        plotData: { users: updatedUsers },
      })
    ).then(() => {
      toast.success("New user added to plot successfully");
      dispatch(getPlots());
      closeUserModal();
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Plot Debug Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Detailed view and management of all plots
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search plots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <Select
            options={[
              { value: "", label: "All Locations" },
              ...locationOptions,
            ]}
            placeholder="Filter by location"
            isClearable
            className="w-full md:w-48"
            onChange={(selected) => setLocationFilter(selected)}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "42px",
                borderColor: "#d1d5db",
                "&:hover": {
                  borderColor: "#d1d5db",
                },
              }),
            }}
          />

          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
          >
            <FaPlus className="mr-2" /> Add Plot
          </button>
        </div>
      </div>

      <Tabs>
        <TabList className="flex border-b border-gray-200">
          <Tab className="px-4 py-2 font-medium text-sm cursor-pointer focus:outline-none border-b-2 border-transparent data-[selected=true]:border-blue-500 data-[selected=true]:text-blue-600">
            Detailed View
          </Tab>
          <Tab className="px-4 py-2 font-medium text-sm cursor-pointer focus:outline-none border-b-2 border-transparent data-[selected=true]:border-blue-500 data-[selected=true]:text-blue-600">
            Summary Statistics
          </Tab>
        </TabList>

        <TabPanel>
          {filteredPlots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-white rounded-lg shadow-sm"
            >
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaSearch className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No plots found
              </h3>
              <p className="mt-1 text-gray-500">
                {searchTerm === "" && locationFilter === null
                  ? "There are no plots in the system."
                  : "Try adjusting your search or filters."}
              </p>
              {searchTerm !== "" || locationFilter !== null ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setLocationFilter(null);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plot Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Users
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {filteredPlots.map((plot) => (
                        <motion.tr
                          key={plot._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {plot.plotNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              Bags: {plot.bagsRequired}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Created:{" "}
                              {new Date(plot.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {plot.location?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {plot.location?._id}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {plot.users?.length > 0 ? (
                                plot.users.map((user) => {
                                  const userObj =
                                    typeof user === "object"
                                      ? user
                                      : users.find((u) => u._id === user);

                                  if (!userObj) return null;

                                  return (
                                    <div
                                      key={
                                        typeof user === "object"
                                          ? user._id
                                          : user
                                      }
                                      className="flex items-center justify-between group"
                                    >
                                      <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                                        <span className="font-medium">
                                          {userObj.name}
                                        </span>
                                        <span className="ml-2 text-blue-500">
                                          {userObj.mobile}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          removeUserFromPlot(
                                            plot._id,
                                            typeof user === "object"
                                              ? user._id
                                              : user
                                          )
                                        }
                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-2 transition-opacity"
                                        title="Remove user"
                                      >
                                        <FaUserMinus size={12} />
                                      </button>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  No users assigned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => openModal(plot)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openAssignModal(plot)}
                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50"
                                title="Assign Users"
                              >
                                <FaUsers />
                              </button>
                              <button
                                onClick={() => openUserModal(plot)}
                                className="text-green-600 hover:text-green-900 p-2 rounded-full hover:bg-green-50"
                                title="Add New User"
                              >
                                <FaUserPlus />
                              </button>
                              <button
                                onClick={() => handleDelete(plot._id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </TabPanel>

        <TabPanel>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaChartBar className="mr-2 text-blue-500" />
              Plot Statistics Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800">
                  Total Plots
                </h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {summaryStats.totalPlots}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-medium text-green-800">
                  Assigned Plots
                </h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {summaryStats.assignedPlots}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {(
                    (summaryStats.assignedPlots / summaryStats.totalPlots) *
                      100 || 0
                  ).toFixed(1)}
                  % of total
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-sm font-medium text-purple-800">
                  Unassigned Plots
                </h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {summaryStats.unassignedPlots}
                </p>
                <p className="text-xs text-purple-500 mt-1">
                  {(
                    (summaryStats.unassignedPlots / summaryStats.totalPlots) *
                      100 || 0
                  ).toFixed(1)}
                  % of total
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h3 className="text-sm font-medium text-yellow-800">
                  Total Users
                </h3>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {summaryStats.totalUsers}
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h3 className="text-sm font-medium text-indigo-800">
                  Assigned Users
                </h3>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {summaryStats.assignedUsers}
                </p>
                <p className="text-xs text-indigo-500 mt-1">
                  {(
                    (summaryStats.assignedUsers / summaryStats.totalUsers) *
                      100 || 0
                  ).toFixed(1)}
                  % of total
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 className="text-sm font-medium text-red-800">
                  Total Bags Required
                </h3>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {summaryStats.totalBags}
                </p>
              </div>
            </div>

            <h3 className="text-lg font-medium mb-3">Locations Summary</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Plots
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Plots
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bags Required
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => {
                    const locationPlots = plots.filter(
                      (plot) => plot.location?._id === location._id
                    );
                    const assignedPlots = locationPlots.filter(
                      (plot) => plot.users?.length > 0
                    );
                    const totalBags = locationPlots.reduce(
                      (sum, plot) => sum + (plot.bagsRequired || 0),
                      0
                    );

                    return (
                      <tr key={location._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {location.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {locationPlots.length}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {assignedPlots.length}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {totalBags}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabPanel>
      </Tabs>

      {/* Plot Form Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Plot Modal"
        style={customStyles}
        closeTimeoutMS={200}
      >
        <div className="w-full max-w-md">
          <div className="bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? "Edit Plot" : "Add Plot"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plot Number
                  </label>
                  <input
                    type="text"
                    name="plotNumber"
                    value={currentPlot.plotNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bags Required
                  </label>
                  <input
                    type="number"
                    name="bagsRequired"
                    value={currentPlot.bagsRequired}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    name="location"
                    value={currentPlot.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {locations.map((location) => (
                      <option key={location._id} value={location._id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* Assign Users Modal */}
      <Modal
        isOpen={assignModalIsOpen}
        onRequestClose={closeAssignModal}
        contentLabel="Assign Users Modal"
        style={customStyles}
        closeTimeoutMS={200}
      >
        <div className="w-full max-w-md">
          <div className="bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Assign Users to Plot {currentPlot.plotNumber}
              </h2>
              <button
                onClick={closeAssignModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>

            {availableUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FaUsers className="text-gray-400 text-xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  No available users
                </h3>
                <p className="mt-1 text-gray-500">
                  All eligible users are already assigned to plots.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Users ({availableUsers.length})
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {availableUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                          currentPlot.users?.some(
                            (u) =>
                              (typeof u === "object" ? u._id : u) === user._id
                          )
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          const isAssigned = currentPlot.users?.some(
                            (u) =>
                              (typeof u === "object" ? u._id : u) === user._id
                          );
                          const updatedUsers = isAssigned
                            ? currentPlot.users.filter(
                                (u) =>
                                  (typeof u === "object" ? u._id : u) !==
                                  user._id
                              )
                            : [...(currentPlot.users || []), user._id];
                          setCurrentPlot({
                            ...currentPlot,
                            users: updatedUsers,
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`user-${user._id}`}
                          checked={currentPlot.users?.some(
                            (u) =>
                              (typeof u === "object" ? u._id : u) === user._id
                          )}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`user-${user._id}`}
                          className="ml-3 block"
                        >
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.mobile}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(
                        updatePlot({
                          plotId: currentPlot._id,
                          plotData: {
                            users: currentPlot.users?.map((u) =>
                              typeof u === "object" ? u._id : u
                            ),
                          },
                        })
                      ).then(() => {
                        toast.success("Users assigned successfully");
                        closeAssignModal();
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Assignments
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Add New User Modal */}
      <Modal
        isOpen={userModalIsOpen}
        onRequestClose={closeUserModal}
        contentLabel="Add New User Modal"
        style={customStyles}
        closeTimeoutMS={200}
      >
        <div className="w-full max-w-md">
          <div className="bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New User to Plot {currentPlot.plotNumber}
              </h2>
              <button
                onClick={closeUserModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={addNewUserToPlot}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleUserChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleUserChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={newUser.mobile}
                    onChange={handleUserChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PlotDebug;
