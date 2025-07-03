import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "https://tester-server.vercel.app/api/expenses";

// Create new expense
const createExpense = async (expenseData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.post(API_URL, expenseData, config);

    if (response.data) {
      toast.success("Expense added successfully");
      return response.data;
    }
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Error adding expense";
    toast.error(message);
    throw new Error(message);
  }
};

// Get all expenses
const getExpenses = async (filters, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: filters,
    };

    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error getting expenses";
    throw new Error(message);
  }
};

// Get expenses by month
const getExpensesByMonth = async (month, year, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.get(
      `${API_URL}?month=${month}&year=${year}`,
      config
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error getting monthly expenses";
    throw new Error(message);
  }
};

// Get expense summary
const getExpenseSummary = async (month, year, token) => {
  try {
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
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error getting expense summary";
    throw new Error(message);
  }
};

// Update expense
const updateExpense = async (expenseId, expenseData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.put(
      `${API_URL}/${expenseId}`,
      expenseData,
      config
    );

    if (response.data) {
      toast.success("Expense updated successfully");
      return response.data;
    }
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error updating expense";
    toast.error(message);
    throw new Error(message);
  }
};

// Delete expense
const deleteExpense = async (expenseId, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.delete(`${API_URL}/${expenseId}`, config);

    if (response.data) {
      toast.success("Expense deleted successfully");
      return response.data;
    }
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error deleting expense";
    toast.error(message);
    throw new Error(message);
  }
};

// Export expenses
const exportExpenses = async (format, filters, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: filters,
      responseType: "blob", // Important for file downloads
    };

    const response = await axios.get(`${API_URL}/export/${format}`, config);

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Set filename based on content-disposition header or default
    let filename = "expenses";
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return true;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error exporting expenses";
    toast.error(message);
    throw new Error(message);
  }
};

const expenseService = {
  createExpense,
  getExpenses,
  getExpensesByMonth,
  getExpenseSummary,
  updateExpense,
  deleteExpense,
  exportExpenses,
};

export default expenseService;
