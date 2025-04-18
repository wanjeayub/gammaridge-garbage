import axios from "axios";

const API_URL = "https://tester-server.vercel.app/api/payments";

// Get payments by plot
const getPaymentsByPlot = async (plotId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(`${API_URL}/plot/${plotId}`, config);
  return response.data;
};

// Create payment
const createPayment = async (paymentData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL, paymentData, config);
  return response.data;
};

// Update payment
const updatePayment = async (paymentId, paymentData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(
    `${API_URL}/${paymentId}`,
    paymentData,
    config
  );
  return response.data;
};

// Delete payment
const deletePayment = async (paymentId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.delete(`${API_URL}/${paymentId}`, config);
  return response.data;
};

// Transfer payments
const transferPayments = async (plotId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(
    `${API_URL}/transfer/${plotId}`,
    {},
    config
  );
  return response.data;
};

// Get monthly summary
const getMonthlySummary = async (month, year, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(
    `${API_URL}/summary/${month}/${year}`,
    config
  );
  return response.data;
};

const paymentService = {
  getPaymentsByPlot,
  createPayment,
  updatePayment,
  deletePayment,
  transferPayments,
  getMonthlySummary,
};

export default paymentService;
