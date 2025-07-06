import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import expenseService from "./expenseService";
import moment from "moment";

const getToken = (thunkAPI) => {
  return thunkAPI.getState().auth.user.token;
};

export const createExpense = createAsyncThunk(
  "expense/create",
  async (expenseData, thunkAPI) => {
    try {
      const token = getToken(thunkAPI);
      return await expenseService.createExpense(expenseData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getExpensesByMonth = createAsyncThunk(
  "expense/getByMonth",
  async ({ month, year }, thunkAPI) => {
    try {
      const token = getToken(thunkAPI);
      return await expenseService.getExpensesByMonth(month, year, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getExpenseSummary = createAsyncThunk(
  "expense/getSummary",
  async ({ month, year, compare = false }, thunkAPI) => {
    try {
      const token = getToken(thunkAPI);
      return await expenseService.getExpenseSummary(
        month,
        year,
        compare,
        token
      );
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getAvailableMonths = createAsyncThunk(
  "expense/getAvailableMonths",
  async (_, thunkAPI) => {
    try {
      const token = getToken(thunkAPI);
      return await expenseService.getAvailableMonths(token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateExpense = createAsyncThunk(
  "expense/update",
  async ({ id, expenseData }, thunkAPI) => {
    try {
      const token = getToken(thunkAPI);
      return await expenseService.updateExpense(id, expenseData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  "expense/delete",
  async (id, thunkAPI) => {
    try {
      const token = getToken(thunkAPI);
      return await expenseService.deleteExpense(id, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const exportExpenses = createAsyncThunk(
  "expense/export",
  async ({ format, month, year }, thunkAPI) => {
    try {
      const token = getToken(thunkAPI);
      return await expenseService.exportExpenses(format, month, year, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  expenses: [],
  summary: null,
  availableMonths: [],
  currentMonth: moment().format("MMMM"),
  currentYear: moment().format("YYYY"),
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    setCurrentMonth: (state, action) => {
      state.currentMonth = action.payload.month;
      state.currentYear = action.payload.year;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses.unshift(action.payload.data);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getExpensesByMonth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getExpensesByMonth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses = action.payload.data;
      })
      .addCase(getExpensesByMonth.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getExpenseSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getExpenseSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.summary = action.payload.data;
      })
      .addCase(getExpenseSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAvailableMonths.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAvailableMonths.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.availableMonths = action.payload.data;
      })
      .addCase(getAvailableMonths.rejected, (state, action) => {
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
          expense._id === action.payload.data._id
            ? action.payload.data
            : expense
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
          (expense) => expense._id !== action.payload.data.id
        );
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setCurrentMonth } = expenseSlice.actions;
export default expenseSlice.reducer;
