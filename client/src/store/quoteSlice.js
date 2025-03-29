import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  quotes: [],
  selectedQuote: null,
  loading: false,
  error: null,
  paymentStatus: 'idle', // idle, processing, success, error
  paymentError: null
};

export const quoteSlice = createSlice({
  name: 'quote',
  initialState,
  reducers: {
    setQuotes: (state, action) => {
      state.quotes = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedQuote: (state, action) => {
      state.selectedQuote = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setPaymentStatus: (state, action) => {
      state.paymentStatus = action.payload;
    },
    setPaymentError: (state, action) => {
      state.paymentError = action.payload;
    },
    resetPayment: (state) => {
      state.paymentStatus = 'idle';
      state.paymentError = null;
    }
  }
});

export const {
  setQuotes,
  setSelectedQuote,
  setLoading,
  setError,
  setPaymentStatus,
  setPaymentError,
  resetPayment
} = quoteSlice.actions;

export default quoteSlice.reducer;