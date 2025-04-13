import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  reset,
} from "../../features/locations/locationSlice";
import Modal from "react-modal";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

Modal.setAppElement("#root");

function Locations() {
  const dispatch = useDispatch();
  const { locations, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.locations
  );

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    _id: "",
    name: "",
  });

  useEffect(() => {
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

  const openModal = (location = null) => {
    if (location) {
      setIsEdit(true);
      setCurrentLocation({
        _id: location._id,
        name: location.name,
      });
    } else {
      setIsEdit(false);
      setCurrentLocation({
        _id: "",
        name: "",
      });
    }
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleChange = (e) => {
    setCurrentLocation({
      ...currentLocation,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEdit) {
      dispatch(
        updateLocation({
          locationId: currentLocation._id,
          locationData: currentLocation,
        })
      );
    } else {
      dispatch(createLocation(currentLocation));
    }
  };

  const handleDelete = (locationId) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      dispatch(deleteLocation(locationId));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Location Management
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> Add Location
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((location) => (
              <tr key={location._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {location.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openModal(location)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(location._id)}
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
        contentLabel="Location Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {isEdit ? "Edit Location" : "Add Location"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={currentLocation.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
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

export default Locations;
