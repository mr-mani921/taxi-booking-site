import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedQuote: null,
  estimatedPrice: null,
  selectedVehicleType: null,
  bookingStep: "location",
  isLoading: false,
  error: null,
  bookingData: {
    pickupLocation: null,
    dropoffLocation: null,
    availabilityReference: null,
    pickupTime: null,
    vehicleType: null,
    passengers: 1,
    luggage: 0,
    specialRequests: "",
    paymentMethod: null,
  },
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    setBookingHistory: (state, action) => {
      state.bookingHistory = action.payload;
    },
    setActiveRide: (state, action) => {
      state.activeRide = action.payload;
    },
    setRideStatus: (state, action) => {
      state.rideStatus = action.payload;
    },
    setBookingStep: (state, action) => {
      state.bookingStep = action.payload;
    },
    updateBookingData: (state, action) => {
      state.bookingData = {
        ...state.bookingData,
        ...action.payload,
      };
    },
    resetBookingData: (state) => {
      state.bookingData = initialState.bookingData;
    },
    setAvailabilityReference: (state, action) => {
      state.bookingData.availabilityReference = action.payload;
    },
    resetBookingState: () => initialState,
  },
});

export const {
  setUserLocation,
  setCurrentBooking,
  setBookingHistory,
  setActiveRide,
  setRideStatus,
  setBookingStep,
  updateBookingData,
  resetBookingData,
  resetBookingState,
  setAvailabilityReference,
} = bookingSlice.actions;

export default bookingSlice.reducer;
