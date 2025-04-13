import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import userReducer from "../features/users/userSlice";
import locationReducer from "../features/locations/locationSlice";
import plotReducer from "../features/plots/plotSlice";
import paymentReducer from "../features/payments/paymentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    locations: locationReducer,
    plots: plotReducer,
    payments: paymentReducer,
  },
});
