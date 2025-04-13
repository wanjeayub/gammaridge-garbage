import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import locationService from "./locationService";

const initialState = {
  locations: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Get all locations
export const getLocations = createAsyncThunk(
  "locations/getAll",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await locationService.getLocations(token);
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

// Create location
export const createLocation = createAsyncThunk(
  "locations/create",
  async (locationData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await locationService.createLocation(locationData, token);
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

// Update location
export const updateLocation = createAsyncThunk(
  "locations/update",
  async ({ locationId, locationData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await locationService.updateLocation(
        locationId,
        locationData,
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

// Delete location
export const deleteLocation = createAsyncThunk(
  "locations/delete",
  async (locationId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await locationService.deleteLocation(locationId, token);
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

export const locationSlice = createSlice({
  name: "locations",
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
      .addCase(getLocations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLocations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.locations = action.payload;
      })
      .addCase(getLocations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createLocation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.locations.push(action.payload);
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateLocation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.locations = state.locations.map((location) =>
          location._id === action.payload._id ? action.payload : location
        );
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteLocation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.locations = state.locations.filter(
          (location) => location._id !== action.payload.id
        );
      })
      .addCase(deleteLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = locationSlice.actions;
export default locationSlice.reducer;
