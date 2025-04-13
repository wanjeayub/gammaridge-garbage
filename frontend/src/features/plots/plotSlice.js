import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import plotService from "./plotService";

const initialState = {
  plots: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Get all plots
export const getPlots = createAsyncThunk(
  "plots/getAll",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.getPlots(token);
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

// Create plot
export const createPlot = createAsyncThunk(
  "plots/create",
  async (plotData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.createPlot(plotData, token);
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

// Update plot
export const updatePlot = createAsyncThunk(
  "plots/update",
  async ({ plotId, plotData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.updatePlot(plotId, plotData, token);
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

// Delete plot
export const deletePlot = createAsyncThunk(
  "plots/delete",
  async (plotId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.deletePlot(plotId, token);
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

// Assign users to plot
export const assignUsersToPlot = createAsyncThunk(
  "plots/assignUsers",
  async ({ plotId, userIds }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.assignUsersToPlot(plotId, userIds, token);
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

export const plotSlice = createSlice({
  name: "plots",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPlots.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = action.payload;
      })
      .addCase(getPlots.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createPlot.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots.push(action.payload);
      })
      .addCase(createPlot.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updatePlot.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = state.plots.map((plot) =>
          plot._id === action.payload._id ? action.payload : plot
        );
      })
      .addCase(updatePlot.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deletePlot.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deletePlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = state.plots.filter(
          (plot) => plot._id !== action.payload.id
        );
      })
      .addCase(deletePlot.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(assignUsersToPlot.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(assignUsersToPlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Update the plot with new users
        state.plots = state.plots.map((plot) =>
          plot._id === action.payload._id ? action.payload : plot
        );
      })
      .addCase(assignUsersToPlot.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = plotSlice.actions;
export default plotSlice.reducer;
