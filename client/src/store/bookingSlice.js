import { createSlice } from "@reduxjs/toolkit";
import {
  fetchRides,
  fetchRideById,
  bookRide,
  cancelRide,
  rateRide,
} from "./thunks";

const initialState = {
  selectedQuote: null,
  estimatedPrice: null,
  selectedVehicleType: null,
  bookingStep: "location",
  isLoading: false,
  error: null,
  rides: [],
  currentRide: null,
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

    clearBookingData: (state) => {
      state.bookingData = initialState.bookingData;
      state.selectedQuote = null;
      state.estimatedPrice = null;
      state.selectedVehicleType = null;
      state.error = null;
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchRides.fulfilled, (state, action) => {
        if (action.payload.append) {
          state.rides = [...state.rides, ...(action.payload.rides || [])];
        } else {
          state.rides = action.payload.rides || [];
        }

        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchRides.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to fetch rides";
      })
      .addCase(fetchRideById.fulfilled, (state, action) => {
        state.currentRide = action.payload;

        if (state.rides && state.rides.length > 0) {
          const index = state.rides.findIndex(
            (ride) => ride._id === action.payload._id
          );
          if (index !== -1) {
            state.rides[index] = action.payload;
          }
        }
      })
      .addCase(bookRide.fulfilled, (state, action) => {
        if (action.payload) {
          state.rides = [action.payload, ...(state.rides || [])];
          state.currentRide = action.payload;
        }
      })
      .addCase(cancelRide.fulfilled, (state, action) => {
        if (action.payload && state.rides) {
          const index = state.rides.findIndex(
            (ride) => ride._id === action.payload._id
          );
          if (index !== -1) {
            state.rides[index] = action.payload;
          }
          if (
            state.currentRide &&
            state.currentRide._id === action.payload._id
          ) {
            state.currentRide = action.payload;
          }
        }
      })
      .addCase(rateRide.fulfilled, (state, action) => {
        if (action.payload && state.rides) {
          const index = state.rides.findIndex(
            (ride) => ride._id === action.payload._id
          );
          if (index !== -1) {
            state.rides[index] = action.payload;
          }
          if (
            state.currentRide &&
            state.currentRide._id === action.payload._id
          ) {
            state.currentRide = action.payload;
          }
        }
      });
  },
});

export const {
  setUserLocation,
  setCurrentBooking,
  setBookingHistory,
  setActiveRide,
  setRideStatus,
  updateBookingData,
  clearBookingData,
  setBookingStep,
  resetBookingData,
  setAvailabilityReference,
  resetBookingState,
} = bookingSlice.actions;

export default bookingSlice.reducer;
