import axios from "axios";

const API_URL = "https://tester-server.vercel.app/api/payments";

// Request cache
const requestCache = new Map();

const createAuthConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const paymentService = {
  getPaymentsByPlot: async (plotId, token) => {
    const cacheKey = `plot-${plotId}`;
    try {
      if (requestCache.has(cacheKey)) {
        return requestCache.get(cacheKey);
      }
      const response = await axios.get(
        `${API_URL}/plot/${plotId}`,
        createAuthConfig(token)
      );
      requestCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`[PaymentService] Get payments by plot error:`, error);
      throw error;
    }
  },

  createPayment: async (paymentData, token) => {
    try {
      const response = await axios.post(
        API_URL,
        paymentData,
        createAuthConfig(token)
      );
      // Clear relevant caches
      requestCache.delete(`plot-${paymentData.plot}`);
      return response.data;
    } catch (error) {
      console.error("[PaymentService] Create payment error:", error);
      throw error;
    }
  },

  updatePayment: async ({ paymentId, paymentData }, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/${paymentId}`,
        paymentData,
        createAuthConfig(token)
      );
      // Clear relevant caches
      requestCache.delete(`plot-${paymentData.plot}`);
      return response.data;
    } catch (error) {
      console.error("[PaymentService] Update payment error:", error);
      throw error;
    }
  },

  deletePayment: async (paymentId, token) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${paymentId}`,
        createAuthConfig(token)
      );
      return response.data;
    } catch (error) {
      console.error("[PaymentService] Delete payment error:", error);
      throw error;
    }
  },

  transferPayments: async (plotId, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/transfer/${plotId}`,
        {},
        createAuthConfig(token)
      );
      // Clear relevant caches
      requestCache.delete(`plot-${plotId}`);
      return response.data;
    } catch (error) {
      console.error("[PaymentService] Transfer payments error:", error);
      throw error;
    }
  },

  getMonthlySummary: async (month, year, token) => {
    const cacheKey = `summary-${month}-${year}`;
    try {
      if (requestCache.has(cacheKey)) {
        return requestCache.get(cacheKey);
      }
      // Convert month name to number if needed
      const monthNum = isNaN(month)
        ? new Date(`${month} 1, 2020`).getMonth() + 1
        : parseInt(month);

      const response = await axios.get(
        `${API_URL}/summary/${monthNum}/${year}`,
        createAuthConfig(token)
      );
      requestCache.set(cacheKey, response.data);
      console.log("Monthly summary response:", response.data);
      return response.data;
    } catch (error) {
      console.error("[PaymentService] Get monthly summary error:", error);
      throw error;
    }
  },

  getPaymentsByMonth: async (month, year, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.get(
      `${API_URL}/month/${month}/${year}`,
      config
    );

    return response.data;
  },

  getAllPayments: async (token) => {
    const cacheKey = "all-payments";
    try {
      if (requestCache.has(cacheKey)) {
        return requestCache.get(cacheKey);
      }
      const response = await axios.get(
        `${API_URL}/all`,
        createAuthConfig(token)
      );
      requestCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error("[PaymentService] Get all payments error:", error);
      throw error;
    }
  },

  // Clear cache for specific plot
  clearPlotCache: (plotId) => {
    requestCache.delete(`plot-${plotId}`);
  },

  // Clear entire cache
  clearCache: () => {
    requestCache.clear();
  },
};

export default paymentService;
