import axios from "axios";

const API_URL = "https://tester-server.vercel.app/api/expenses";

const api = axios.create({
  baseURL: API_URL,
});

const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

const expenseService = {
  setAuthToken,

  createExpense: async (expenseData, token) => {
    try {
      setAuthToken(token);
      const response = await api.post("/", expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getExpensesByMonth: async (month, year, token) => {
    try {
      setAuthToken(token);
      const response = await api.get(`/?month=${month}&year=${year}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getExpenseSummary: async (month, year, compare = false, token) => {
    try {
      setAuthToken(token);
      const response = await api.get(
        `/summary/${month}/${year}?compareWithPrevious=${compare}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAvailableMonths: async (token) => {
    try {
      setAuthToken(token);
      const response = await api.get("/available-months");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateExpense: async (id, expenseData, token) => {
    try {
      setAuthToken(token);
      const response = await api.put(`/${id}`, expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteExpense: async (id, token) => {
    try {
      setAuthToken(token);
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  exportExpenses: async (format, month, year, token) => {
    try {
      setAuthToken(token);
      window.open(
        `${API_URL}/export/${format}?month=${month}&year=${year}`,
        "_blank"
      );
      return { success: true };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default expenseService;
