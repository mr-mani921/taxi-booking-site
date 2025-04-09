import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  quotes: [],
  selectedQuote: null,
  estimatedPrice: null,
  vehicleTypes: [
    {
      id: "standard",
      name: "Standard",
      description: "Comfortable sedan for up to 3 passengers",
      capacity: 3,
      priceMultiplier: 1,
      icon: "🚗",
    },
    {
      id: "premium",
      name: "Premium",
      description: "Luxury vehicle for up to 3 passengers",
      capacity: 3,
      priceMultiplier: 1.5,
      icon: "✨",
    },
    {
      id: "xl",
      name: "XL",
      description: "Spacious SUV for up to 6 passengers",
      capacity: 6,
      priceMultiplier: 2,
      icon: "🚙",
    },
  ],
  selectedVehicleType: null,
  paymentStatus: null,
  paymentMethod: null,
  savedPaymentMethods: [],
};

const quoteSlice = createSlice({
  name: "quote",
  initialState,
  reducers: {
    setQuotes: (state, action) => {
      state.quotes = action.payload;
    },
    setSelectedQuote: (state, action) => {
      state.selectedQuote = action.payload;
    },
    setEstimatedPrice: (state, action) => {
      state.estimatedPrice = action.payload;
    },
    setSelectedVehicleType: (state, action) => {
      state.selectedVehicleType = action.payload;
    },
    setPaymentStatus: (state, action) => {
      state.paymentStatus = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    setSavedPaymentMethods: (state, action) => {
      state.savedPaymentMethods = action.payload;
    },
    resetPayment: (state) => {
      state.paymentStatus = null;
      state.paymentMethod = null;
    },
    resetQuoteState: () => initialState,
  },
});

export const {
  setQuotes,
  setSelectedQuote,
  setEstimatedPrice,
  setSelectedVehicleType,
  setPaymentStatus,
  setPaymentMethod,
  setSavedPaymentMethods,
  resetPayment,
  resetQuoteState,
} = quoteSlice.actions;

export default quoteSlice.reducer;
