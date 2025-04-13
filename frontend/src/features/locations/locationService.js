import axios from "axios";

const API_URL = "http://localhost:5000/api/locations";

// Get all locations
const getLocations = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

// Create location
const createLocation = async (locationData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL, locationData, config);
  return response.data;
};

// Update location
const updateLocation = async (locationId, locationData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(
    `${API_URL}/${locationId}`,
    locationData,
    config
  );
  return response.data;
};

// Delete location
const deleteLocation = async (locationId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.delete(`${API_URL}/${locationId}`, config);
  return response.data;
};

const locationService = {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};

export default locationService;
