import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  paymentIntent: null,
  paymentStatus: "idle", // idle, loading, succeeded, failed
  paymentError: null,
  selectedPaymentMethod: null,
  savedPaymentMethods: [],
  processingFee: 0.25, // 25% markup
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setPaymentIntent: (state, action) => {
      state.paymentIntent = action.payload;
    },
    setPaymentStatus: (state, action) => {
      state.paymentStatus = action.payload;
    },
    setPaymentError: (state, action) => {
      state.paymentError = action.payload;
    },
    setSelectedPaymentMethod: (state, action) => {
      state.selectedPaymentMethod = action.payload;
    },
    setSavedPaymentMethods: (state, action) => {
      state.savedPaymentMethods = action.payload;
    },
    resetPaymentState: () => initialState,
  },
});

export const {
  setPaymentIntent,
  setPaymentStatus,
  setPaymentError,
  setSelectedPaymentMethod,
  setSavedPaymentMethods,
  resetPaymentState,
} = paymentSlice.actions;

export default paymentSlice.reducer;
