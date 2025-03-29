import { configureStore } from "@reduxjs/toolkit";
import bookingReducer from "./bookingSlice";
import quoteReducer from "./quoteSlice";

export const store = configureStore({
  reducer: {
    booking: bookingReducer,
    quote: quoteReducer,
  },
});
