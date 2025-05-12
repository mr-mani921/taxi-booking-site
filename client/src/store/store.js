import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice.js";
import quoteReducer from "./quoteSlice.js";
import bookingReducer from "./bookingSlice.js";
import apiReducer from "./apiSlice.js";
import paymentReducer from "./paymentSlice.js";
import toastMiddleware from "./toastMiddleware.js";

export const store = configureStore({
  reducer: {
    user: userReducer,
    quote: quoteReducer,
    booking: bookingReducer,
    api: apiReducer,
    payment: paymentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(toastMiddleware),
});

export default store;
