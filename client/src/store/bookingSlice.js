import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userLocation: null,
  currentBooking: null,
  bookingHistory: [],
  activeRide: null,
  rideStatus: null,
  bookingStep: 1, // 1: Location, 2: Vehicle, 3: Payment
  bookingData: {
    pickupLocation: null,
    dropoffLocation: null,
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
} = bookingSlice.actions;

export default bookingSlice.reducer;
