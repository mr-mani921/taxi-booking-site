import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";
import {
  setCurrentBooking,
  setBookingHistory,
  setActiveRide,
  setRideStatus,
  setBookingStep,
  updateBookingData,
} from "../bookingSlice";
import {
  setQuotes,
  setSelectedQuote,
  setEstimatedPrice,
  setSelectedVehicleType,
} from "../quoteSlice";

// Get price estimate
export const getPriceEstimate = createAsyncThunk(
  "booking/getPriceEstimate",
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.getPriceEstimate(bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// Select a bid and check availability
export const selectBid = createAsyncThunk(
  "booking/selectBid",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.selectBid(data);


      // Store the availability reference in the state
      if (response.data && response.data.availabilityReference) {
        // We'll store this in the booking data
        return {
          ...response.data,
          availabilityReference: response.data.availabilityReference,
        };
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const authorizeBid = createAsyncThunk(
  "booking/authorizeBid",
  async (data, { rejectWithValue }) => {
    const response = await api.authorizeBid(data);
    return response.data;
  }
);

// Book a ride
export const bookRide = createAsyncThunk(
  "booking/bookRide",
  async (bookingData, { rejectWithValue, getState }) => {
    try {
      console.log("the request has came to bookRide Thunk");

      // Get the availability reference from the state
      const state = getState();
      const availabilityReference = state.booking.availabilityReference;

      // Add the availability reference to the booking data
      const bookingDataWithAvailability = {
        ...bookingData,
        availabilityReference,
      };

      console.log(
        "Booking with availability reference:",
        availabilityReference
      );

      const response = await api.bookRide(bookingDataWithAvailability);
      console.log("the response from thunk is ", response);

      // Check if response exists before trying to access data
      if (response && response.data) {
        return response.data;
      } else {
        return rejectWithValue("No response data received from server");
      }
    } catch (error) {
      console.error("Error in bookRide thunk:", error);
      // Handle case where error.response might be undefined
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Unknown error occurred",
        }
      );
    }
  }
);

// Get booking history
export const getBookingHistory = createAsyncThunk(
  "booking/getBookingHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/rides/history");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



// Get active ride
export const getActiveRide = createAsyncThunk(
  "booking/getActiveRide",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/rides/active");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  "booking/cancelBooking",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/rides/${JSON.stringify(bookingId)}/cancel`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Rate ride
export const rateRide = createAsyncThunk(
  "booking/rateRide",
  async ({ bookingId, ratingData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/rides/${JSON.stringify(bookingId)}/rate`,
        ratingData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getBids = createAsyncThunk(
  "booking/getBids",
  async (rideData, { dispatch, rejectWithValue }) => {
    try {
      console.log(`the ride data is ${JSON.stringify(rideData)}`);
      const vendorBidsResponse = await api.getVendorBids(rideData);
      console.log("Vendor bids response:", vendorBidsResponse);

      if (vendorBidsResponse && vendorBidsResponse.data) {
        // Save quotes to redux store
        dispatch(setQuotes(vendorBidsResponse.data.bids || []));

        // Return the quotes data
        return {
          quotes: vendorBidsResponse.data.bids || [],
          rideData,
        };
      } else {
        return rejectWithValue("No quotes received from vendors");
      }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// // Extra thunk for handling the complete booking flow
// export const completeBookingFlow = createAsyncThunk(
//   "booking/completeBookingFlow",
//   async (bookingData, { dispatch, rejectWithValue }) => {
//     try {
//       console.log(`the booking data is ${JSON.stringify(bookingData)}`);

//       // Step 1: Get price estimate
//       const estimateResponse = await dispatch(getPriceEstimate(bookingData));
//       console.log(
//         `the estimate price response is ${JSON.stringify(estimateResponse)}`
//       );
//       if (getPriceEstimate.rejected.match(estimateResponse)) {
//         console.log(
//           `got an error in the estimating price ${JSON.stringify(
//             estimateResponse.payload
//           )}`
//         );
//         return rejectWithValue(estimateResponse.payload);
//       }

//       // Set estimated price
//       dispatch(setEstimatedPrice(estimateResponse.payload.estimatedPrice));

//       // Step 2: Get vendor bids/quotes instead of booking immediately
//       console.log("Getting vendor bids for the route");
//       try {
//         const vendorBidsResponse = await api.getVendorBids(bookingData);
//         console.log("Vendor bids response:", vendorBidsResponse);

//         if (vendorBidsResponse && vendorBidsResponse.data) {
//           // Save quotes to redux store
//           dispatch(setQuotes(vendorBidsResponse.data.quotes || []));

//           // Update booking step to quotes view
//           dispatch(setBookingStep(2));

//           // Return the quotes data
//           return {
//             quotes: vendorBidsResponse.data.quotes || [],
//             estimatedPrice: estimateResponse.payload.estimatedPrice,
//             bookingData,
//           };
//         } else {
//           return rejectWithValue("No quotes received from vendors");
//         }
//       } catch (bidError) {
//         console.error("Error getting vendor bids:", bidError);
//         return rejectWithValue(
//           bidError.response?.data?.message ||
//             bidError.message ||
//             "Failed to get quotes from vendors"
//         );
//       }
//     } catch (error) {
//       console.log(
//         "got an error while making a booking response: " + error.message
//       );
//       return rejectWithValue(error.message || "An unknown error occurred");
//     }
//   }
// );
