import axios from "axios";

const API_URL = "https://tester-server.vercel.app/api/expenses";

// Request cache
const requestCache = new Map();

const createAuthConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const expenseService = {
  getExpensesByMonth: async (month, year, token) => {
    const cacheKey = `expenses-${month}-${year}`;
    try {
      if (requestCache.has(cacheKey)) {
        return requestCache.get(cacheKey);
      }
      const response = await axios.get(
        `${API_URL}/month/${month}/${year}`,
        createAuthConfig(token)
      );
      requestCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`[ExpenseService] Get expenses by month error:`, error);
      throw error;
    }
  },

  getExpenseSummary: async (month, year, token) => {
    const cacheKey = `summary-${month}-${year}`;
    try {
      if (requestCache.has(cacheKey)) {
        return requestCache.get(cacheKey);
      }
      const response = await axios.get(
        `${API_URL}/summary/${month}/${year}`,
        createAuthConfig(token)
      );
      // Ensure response has expected structure
      const summaryData = {
        totalAmount: response.data.totalAmount || 0,
        count: response.data.count || 0,
        byCategory: response.data.byCategory || [],
        ...response.data,
      };
      requestCache.set(cacheKey, summaryData);
      return summaryData;
    } catch (error) {
      console.error("[ExpenseService] Get expense summary error:", error);
      throw error;
    }
  },

  createExpense: async (expenseData, token) => {
    try {
      const response = await axios.post(
        API_URL,
        expenseData,
        createAuthConfig(token)
      );
      // Clear relevant caches
      requestCache.forEach((_, key) => {
        if (key.startsWith("expenses-") || key.startsWith("summary-")) {
          requestCache.delete(key);
        }
      });
      return response.data;
    } catch (error) {
      console.error("[ExpenseService] Create expense error:", error);
      throw error;
    }
  },

  updateExpense: async ({ expenseId, expenseData }, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/${expenseId}`,
        expenseData,
        createAuthConfig(token)
      );
      // Clear relevant caches
      requestCache.forEach((_, key) => {
        if (key.startsWith("expenses-") || key.startsWith("summary-")) {
          requestCache.delete(key);
        }
      });
      return response.data;
    } catch (error) {
      console.error("[ExpenseService] Update expense error:", error);
      throw error;
    }
  },

  deleteExpense: async (expenseId, token) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${expenseId}`,
        createAuthConfig(token)
      );
      // Clear relevant caches
      requestCache.forEach((_, key) => {
        if (key.startsWith("expenses-") || key.startsWith("summary-")) {
          requestCache.delete(key);
        }
      });
      return response.data;
    } catch (error) {
      console.error("[ExpenseService] Delete expense error:", error);
      throw error;
    }
  },

  exportExpenses: async (format, filters, token) => {
    try {
      const config = {
        ...createAuthConfig(token),
        params: filters,
        responseType: "blob",
      };

      const response = await axios.get(`${API_URL}/export/${format}`, config);
      return response.data;
    } catch (error) {
      console.error("[ExpenseService] Export expenses error:", error);
      throw error;
    }
  },

  // Clear cache for specific month/year
  clearExpenseCache: (month, year) => {
    requestCache.delete(`expenses-${month}-${year}`);
    requestCache.delete(`summary-${month}-${year}`);
  },

  // Clear entire cache
  clearCache: () => {
    requestCache.clear();
  },
};

export default expenseService;
