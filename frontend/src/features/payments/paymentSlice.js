import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import paymentService from "./paymentService";

const initialState = {
  payments: [],
  summary: null,
  monthlyPayments: [], // Add this line
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
export const getPaymentsByPlot = createAsyncThunk(
  "payments/getByPlot",
  async (plotId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await paymentService.getPaymentsByPlot(plotId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const createPayment = createAsyncThunk(
  "payments/create",
  async (paymentData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await paymentService.createPayment(paymentData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const updatePayment = createAsyncThunk(
  "payments/update",
  async ({ paymentId, paymentData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await paymentService.updatePayment(
        { paymentId, paymentData },
        token
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const deletePayment = createAsyncThunk(
  "payments/delete",
  async (paymentId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await paymentService.deletePayment(paymentId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const transferPayments = createAsyncThunk(
  "payments/transfer",
  async (plotId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await paymentService.transferPayments(plotId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getMonthlySummary = createAsyncThunk(
  "payments/getSummary",
  async ({ month, year }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await paymentService.getMonthlySummary(month, year, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getAllPayments = createAsyncThunk(
  "payments/getAll",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await paymentService.getAllPayments(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

// Selectors
export const selectAllPayments = (state) => state.payments.payments;
export const selectPaymentStatus = (state) => ({
  isLoading: state.payments.isLoading,
  isError: state.payments.isError,
  message: state.payments.message,
  summaryLoading: state.payments.summaryLoading,
  summaryError: state.payments.summaryError,
});

export const selectPaymentsByPlot = createSelector(
  [selectAllPayments, (_, plotId) => plotId],
  (payments, plotId) => payments.filter((payment) => payment.plot === plotId)
);

export const selectSummaryData = (state) => ({
  summary: state.payments.summary,
  isLoading: state.payments.summaryLoading,
  error: state.payments.summaryError,
});

export const getPaymentsByMonth = createAsyncThunk(
  "payments/getByMonth",
  async ({ month, year }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await paymentService.getPaymentsByMonth(month, year, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleAsyncError(error));
    }
  }
);

export const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    reset: (state) => initialState,
    clearPaymentErrors: (state) => {
      state.isError = false;
      state.message = "";
      state.summaryError = null;
    },
  },
  extraReducers: (builder) => {
    // First handle all specific cases
    builder
      .addCase(getAllPayments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = action.payload;
      })
      .addCase(getAllPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getPaymentsByPlot.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPaymentsByPlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = action.payload;
      })
      .addCase(getPaymentsByPlot.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments.push(action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updatePayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = state.payments.map((payment) =>
          payment._id === action.payload._id ? action.payload : payment
        );
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deletePayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = state.payments.filter(
          (payment) => payment._id !== action.payload.id
        );
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(transferPayments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(transferPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = [...state.payments, ...action.payload];
      })
      .addCase(transferPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getPaymentsByMonth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPaymentsByMonth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.monthlyPayments = action.payload;
      })
      .addCase(getPaymentsByMonth.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getMonthlySummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(getMonthlySummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(getMonthlySummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      });

    // Then add matchers if needed
    // builder.addMatcher(...)
  },
});

export const { reset, clearPaymentErrors } = paymentSlice.actions;
export default paymentSlice.reducer;
