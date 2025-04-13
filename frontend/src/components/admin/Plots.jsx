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
import Modal from "react-modal";
import { FaEdit, FaTrash, FaPlus, FaUsers } from "react-icons/fa";
import AssignHouseholdModal from "./AssignHouseholdModal";

Modal.setAppElement("#root");

function Plots() {
  const dispatch = useDispatch();
  const { plots, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.plots
  );
  const { locations } = useSelector((state) => state.locations);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [assignModalIsOpen, setAssignModalIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPlot, setCurrentPlot] = useState({
    _id: "",
    plotNumber: "",
    bagsRequired: "",
    location: "",
  });

  useEffect(() => {
    dispatch(getPlots());
    dispatch(getLocations());
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

  const openModal = (plot = null) => {
    if (plot) {
      setIsEdit(true);
      setCurrentPlot({
        _id: plot._id,
        plotNumber: plot.plotNumber,
        bagsRequired: plot.bagsRequired,
        location: plot.location._id,
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
    });
    setAssignModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const closeAssignModal = () => {
    setAssignModalIsOpen(false);
  };

  const handleChange = (e) => {
    setCurrentPlot({
      ...currentPlot,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEdit) {
      dispatch(updatePlot({ plotId: currentPlot._id, plotData: currentPlot }));
    } else {
      dispatch(createPlot(currentPlot));
    }
  };

  const handleDelete = (plotId) => {
    if (window.confirm("Are you sure you want to delete this plot?")) {
      dispatch(deletePlot(plotId))
        .unwrap()
        .then(() => {
          dispatch(getPlots()); // Re-fetch plots
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
        <button
          onClick={() => openModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> Add Plot
        </button>
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
            {plots.map((plot) => (
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
              <label
                htmlFor="plotNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Plot Number
              </label>
              <input
                type="text"
                id="plotNumber"
                name="plotNumber"
                value={currentPlot.plotNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="bagsRequired"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bags Required
              </label>
              <input
                type="number"
                id="bagsRequired"
                name="bagsRequired"
                value={currentPlot.bagsRequired}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                min="1"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location
              </label>
              <select
                id="location"
                name="location"
                value={currentPlot.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <AssignHouseholdModal
        isOpen={assignModalIsOpen}
        onRequestClose={closeAssignModal}
        plot={currentPlot}
      />
    </div>
  );
}

export default Plots;
