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
  const response = await axios.delete(`${API_URL}/${plotId}`, config);
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

const plotService = {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  assignUsersToPlot,
};

export default plotService;
