import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import expenseService from "./expenseService";

const initialState = {
  expenses: [],
  summary: {
    totalAmount: 0,
    count: 0,
    byCategory: [],
  },
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
  summaryLoading: false,
  summaryError: null,
};

// Helper function for consistent error handling
const handleAsyncError = (error) => {
  return (
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred"
  );
};

// Async Thunks
export const getExpensesByMonth = createAsyncThunk(
  "expenses/getByMonth",
  async ({ month, year }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await expenseService.getExpensesByMonth(month, year, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getExpenseSummary = createAsyncThunk(
  "expenses/getSummary",
  async ({ month, year }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await expenseService.getExpenseSummary(month, year, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const createExpense = createAsyncThunk(
  "expenses/create",
  async (expenseData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await expenseService.createExpense(expenseData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const updateExpense = createAsyncThunk(
  "expenses/update",
  async ({ expenseId, expenseData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await expenseService.updateExpense(
        { expenseId, expenseData },
        token
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const deleteExpense = createAsyncThunk(
  "expenses/delete",
  async (expenseId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await expenseService.deleteExpense(expenseId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const exportExpenses = createAsyncThunk(
  "expenses/export",
  async ({ format, filters }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await expenseService.exportExpenses(format, filters, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

// Selectors
export const selectAllExpenses = (state) => state.expenses.expenses;
export const selectExpenseStatus = (state) => ({
  isLoading: state.expenses.isLoading,
  isError: state.expenses.isError,
  message: state.expenses.message,
  summaryLoading: state.expenses.summaryLoading,
  summaryError: state.expenses.summaryError,
});

export const selectExpensesByCategory = createSelector(
  [selectAllExpenses, (_, category) => category],
  (expenses, category) =>
    expenses.filter((expense) => expense.category === category)
);

export const selectSummaryData = (state) => ({
  summary: state.expenses.summary,
  isLoading: state.expenses.summaryLoading,
  error: state.expenses.summaryError,
});

export const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    reset: (state) => initialState,
    clearExpenseErrors: (state) => {
      state.isError = false;
      state.message = "";
      state.summaryError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getExpensesByMonth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getExpensesByMonth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses = action.payload;
      })
      .addCase(getExpensesByMonth.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getExpenseSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(getExpenseSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(getExpenseSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      })
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses.push(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses = state.expenses.map((expense) =>
          expense._id === action.payload._id ? action.payload : expense
        );
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses = state.expenses.filter(
          (expense) => expense._id !== action.payload.id
        );
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(exportExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(exportExpenses.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(exportExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearExpenseErrors } = expenseSlice.actions;
export default expenseSlice.reducer;
