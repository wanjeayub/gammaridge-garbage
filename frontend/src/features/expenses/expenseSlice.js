import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-hot-toast";

export const createExpense = createAsyncThunk(
  "expenses/create",
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/expenses", expenseData);
      toast.success("Expense added successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding expense");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getExpensesByMonth = createAsyncThunk(
  "expenses/getByMonth",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/api/expenses?month=${month}&year=${year}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getExpenseSummary = createAsyncThunk(
  "expenses/summary",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/api/expenses/summary/${month}/${year}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateExpense = createAsyncThunk(
  "expenses/update",
  async ({ id, expenseData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/expenses/${id}`, expenseData);
      toast.success("Expense updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating expense");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  "expenses/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/expenses/${id}`);
      toast.success("Expense deleted successfully");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting expense");
      return rejectWithValue(error.response?.data);
    }
  }
);

const expenseSlice = createSlice({
  name: "expenses",
  initialState: {
    expenses: [],
    summary: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses.push(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getExpensesByMonth.pending, (state) => {
        state.loading = true;
      })
      .addCase(getExpensesByMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(getExpensesByMonth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getExpenseSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(getExpenseSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(getExpenseSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = state.expenses.map((expense) =>
          expense._id === action.payload._id ? action.payload : expense
        );
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = state.expenses.filter(
          (expense) => expense._id !== action.payload
        );
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default expenseSlice.reducer;
