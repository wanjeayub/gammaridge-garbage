import axios from "axios";

const API_URL = "https://tester-server.vercel.app/api/plots";

// Get all plots
const getPlots = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

// Create plot
const createPlot = async (plotData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL, plotData, config);
  return response.data;
};

// Update plot
const updatePlot = async (plotId, plotData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(`${API_URL}/${plotId}`, plotData, config);
  return response.data;
};

// Delete plot
const deletePlot = async (plotId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.delete(`${API_URL}/${plotId}`, config);
    return response.data;
  } catch (error) {
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      throw new Error(
        error.response.data.message ||
          `Failed to delete plot: ${error.response.status}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error("No response received from server");
    } else {
      // Something happened in setting up the request
      throw new Error("Error setting up delete request");
    }
  }
};

// Add users to plot (incremental)
const addUsersToPlot = async (plotId, userIds, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(
    `${API_URL}/${plotId}/add-users`,
    { userIds },
    config
  );
  return response.data;
};

// Assign users to plot
const assignUsersToPlot = async (plotId, userIds, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(
    `${API_URL}/${plotId}/assign`,
    { userIds },
    config
  );
  return response.data;
};

// Remove user from plot
const removeUserFromPlot = async (plotId, userId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(
    `${API_URL}/${plotId}/remove-user`,
    { userId },
    config
  );
  return response.data;
};

const plotService = {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  addUsersToPlot,
  assignUsersToPlot,
  removeUserFromPlot,
};

export default plotService;
