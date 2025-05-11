import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import plotService from "./plotService";

const initialState = {
  plots: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Async Thunks
export const getPlots = createAsyncThunk(
  "plots/getAll",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.getPlots(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createPlot = createAsyncThunk(
  "plots/create",
  async (plotData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      if (!token) {
        throw new Error("No authentication token found");
      }
      console.log("Creating plot with data:", plotData); // Add this
      const response = await plotService.createPlot(plotData, token);
      console.log("Plot created successfully:", response); // Add this
      return response;
    } catch (error) {
      console.error("Error creating plot:", error); // Add this
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updatePlot = createAsyncThunk(
  "plots/update",
  async ({ plotId, plotData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.updatePlot(plotId, plotData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deletePlot = createAsyncThunk(
  "plots/delete",
  async (plotId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.deletePlot(plotId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const assignUsersToPlot = createAsyncThunk(
  "plots/assignUsers",
  async ({ plotId, userIds }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.assignUsersToPlot(plotId, userIds, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const removeUserFromPlot = createAsyncThunk(
  "plots/removeUser",
  async ({ plotId, userId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.removeUserFromPlot(plotId, userId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addUsersToPlot = createAsyncThunk(
  "plots/addUsers",
  async ({ plotId, userIds }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await plotService.addUsersToPlot(plotId, userIds, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to add users to plot"
      );
    }
  }
);

// Helper function for error messages
const getErrorMessage = (error) => {
  return (
    (error.response && error.response.data && error.response.data.message) ||
    error.message ||
    error.toString()
  );
};

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

      // Specific cases
      .addCase(getPlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = action.payload;
      })
      .addCase(createPlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots.push(action.payload);
      })
      .addCase(updatePlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = state.plots.map((plot) =>
          plot._id === action.payload._id ? action.payload : plot
        );
      })
      .addCase(deletePlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = state.plots.filter(
          (plot) => plot._id !== action.payload.id
        );
      })
      .addCase(addUsersToPlot.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
      })
      .addCase(addUsersToPlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = state.plots.map((plot) =>
          plot._id === action.payload._id ? action.payload : plot
        );
        state.message = "Users added to plot successfully";
      })
      .addCase(addUsersToPlot.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(assignUsersToPlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = state.plots.map((plot) =>
          plot._id === action.payload._id ? action.payload : plot
        );
      })
      .addCase(removeUserFromPlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.plots = state.plots.map((plot) =>
          plot._id === action.payload._id ? action.payload : plot
        );
      }) // Common cases for all async thunks
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
        }
      );
  },
});

export const { reset } = plotSlice.actions;
export default plotSlice.reducer;
