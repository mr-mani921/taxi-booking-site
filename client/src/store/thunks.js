import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";
import {
  setIsAuthenticated,
  setEmailVerificationStatus,
  setIsEmailVerified,
} from "./userSlice";
import { setLoading, setGlobalLoading } from "./apiSlice";
import { setAvailabilityReference } from "./bookingSlice";

// Auth thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.login(credentials);
      localStorage.setItem("token", response.data.token);
      console.log("the success is ", response.data.success);
      console.log("the type of success is ", typeof response.data.success);
      console.log("complete response data: ", response.data);

      // Only set authenticated if success is explicitly true
      if (response.data.success === true) {
        dispatch(setIsAuthenticated(true));
      } else {
        dispatch(setIsAuthenticated(false));
      }

      return {
        ...response.data.message,
        message: "Welcome back! You've successfully logged in.",
      };
    } catch (error) {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Login failed. Please check your credentials and try again.";
      console.log("the error message", errorMessage);
      return rejectWithValue({ message: errorMessage });
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.register(userData);
      localStorage.setItem("token", response.data.token);
      dispatch(setIsAuthenticated(true));
      return response.data;
    } catch (error) {
      console.log(error.response.data.message);
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      console.log("request is in the frontend logging out");
      await api.logout();
      localStorage.removeItem("token");
      dispatch(setIsAuthenticated(false));
      return { success: true };
    } catch (error) {
      localStorage.removeItem("token"); // Still remove token even if API call fails
      dispatch(setIsAuthenticated(false));
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }
);

// User profile thunks
export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.getUserProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.updateUserProfile(profileData);
      return {
        ...response.data,
        message: "Your profile has been successfully updated!",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update your profile. Please try again.";
      return rejectWithValue({ message: errorMessage });
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

// Rides thunks
export const fetchRides = createAsyncThunk(
  "rides/fetchAll",
  async (params = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "rides", isLoading: true }));

      // Extract pagination and filter params
      const {
        page = 1,
        limit = 10,
        status,
        timeRange,
        sortBy,
        append = false, // Flag to indicate if we should append or replace results
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("limit", limit);

      if (status && status !== "all") {
        queryParams.append("status", status);
      }

      if (timeRange && timeRange !== "all") {
        queryParams.append("timeRange", timeRange);
      }

      if (sortBy) {
        queryParams.append("sortBy", sortBy);
      }

      const response = await api.getRides(queryParams.toString());

      // Add append flag to the response data to handle in the reducer
      return {
        ...response.data,
        append,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const fetchRideById = createAsyncThunk(
  "rides/fetchById",
  async (rideId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.getRideById(rideId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const bookRide = createAsyncThunk(
  "rides/book",
  async (bookingData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.bookRide(bookingData);
      return {
        ...response.data,
        message: "Your ride has been successfully booked!",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to book your ride. Please try again.";
      return rejectWithValue({ message: errorMessage });
    } finally {
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const cancelRide = createAsyncThunk(
  "rides/cancel",
  async (rideId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.cancelRide(rideId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const rateRide = createAsyncThunk(
  "rides/rate",
  async ({ rideId, ratingData }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.rateRide(rideId, ratingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

// Quotes and bids thunks
export const getPriceEstimate = createAsyncThunk(
  "quotes/getEstimate",
  async (estimateData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "quotes", isLoading: true }));
      const response = await api.getPriceEstimate(estimateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const getVendorBids = createAsyncThunk(
  "quotes/getVendorBids",
  async (bidData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "quotes", isLoading: true }));
      const response = await api.getVendorBids(bidData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const selectBid = createAsyncThunk(
  "quotes/selectBid",
  async (bidData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "quotes", isLoading: true }));
      const response = await api.selectBid(bidData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const checkBidAvailability = createAsyncThunk(
  "quotes/checkAvailability",
  async (bidData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "quotes", isLoading: true }));

      const { bidReference, vendorId } = bidData;

      console.log("bidData", bidData);
      // Build the request data for the API call
      const requestData = {
        vendorId,
        bidReference,
      };

      // Make the API call to check availability
      const response = await api.checkAvailability(requestData);
      console.log(
        "the availabiltiy referernce is ",
        response.data.availabilityReference
      );

      // If availability check is successful, navigate to payment or confirmation page
      dispatch(setAvailabilityReference(response.data.availabilityReference));
      if (response.data.success) {
        return {
          ...response.data,
          availabilityReference: response.data.availabilityReference,
        };
      } else {
        return rejectWithValue({
          message: response.data.message || "The ride is no longer available",
        });
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to check ride availability",
        }
      );
    } finally {
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const authorizeBid = createAsyncThunk(
  "quotes/authorizeBid",
  async ({ bidReference }, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "quotes", isLoading: true }));

      const state = getState();
      const { bookingData } = state.booking;
      const selectedQuote = state.quote.selectedQuote;

      if (!selectedQuote) {
        throw new Error("No quote selected");
      }

      if (!bookingData.availabilityReference) {
        throw new Error("Missing availability reference");
      }

      // Prepare the data for authorization request
      const requestData = {
        // Required booking data
        bidReference,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        pickupTime: bookingData.pickupTime,
        vehicleType: selectedQuote.vehicleType || bookingData.vehicleType,
        pricingModel: selectedQuote.pricing?.pricingMethod || "FixedPrice",
        paymentPoint: "TimeOfBooking", // Assuming pre-payment
        price: selectedQuote.pricing?.price || selectedQuote.price, // Use price that already includes profit
        passengers: bookingData.passengers || 1,
        specialInstructions: bookingData.specialRequests || "",
        availabilityReference: selectedQuote.availabilityReference,

        // Additional bid data
        vendorId: selectedQuote.vendorId,
      };

      console.log("Authorization request data:", requestData);

      // Make the API call to authorize the bid
      const response = await api.authorizeBid(requestData);

      console.log("the response is,", response.data);

      // Handle successful response
      if (response.data.success) {
        return {
          ...response.data,
          agentBookingReference: response.data.agentBookingReference,
          rideId: response.data.rideId,
          message: response.data.message || "Ride successfully authorized",
        };
      } else {
        return rejectWithValue({
          message: response.data.message || "Failed to authorize ride",
        });
      }
    } catch (error) {
      console.error("Authorize bid error:", error);

      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to authorize ride",
        }
      );
    } finally {
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

// Payment thunks
export const processPayment = createAsyncThunk(
  "payments/process",
  async (paymentData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "payments", isLoading: true }));
      const response = await api.processPayment(paymentData);
      return {
        ...response.data,
        message: "Payment processed successfully!",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Payment processing failed. Please try again or use a different payment method.";
      return rejectWithValue({ message: errorMessage });
    } finally {
      dispatch(setLoading({ entity: "payments", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const createStripePaymentIntent = createAsyncThunk(
  "payments/createStripeIntent",
  async (paymentData, { dispatch, rejectWithValue }) => {
    try {
      console.log("in the cratePaymentIntent Thunk");
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "payments", isLoading: true }));
      // Uncomment the API call when the backend is ready
      const response = await api.createStripePaymentIntent(paymentData);
      console.log("and the secret is ", response.data.clientSecret);
      return response.data.clientSecret;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "payments", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const fetchSavedPaymentMethods = createAsyncThunk(
  "payments/fetchSavedMethods",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "payments", isLoading: true }));
      const response = await api.getSavedPaymentMethods();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "payments", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const deletePaymentMethod = createAsyncThunk(
  "payments/deleteMethod",
  async (methodId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "payments", isLoading: true }));
      const response = await api.deletePaymentMethod(methodId);
      return { id: methodId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "payments", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

// Email verification thunks
export const sendVerificationCode = createAsyncThunk(
  "user/sendVerificationCode",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));
      dispatch(setEmailVerificationStatus("pending"));

      const response = await api.sendVerificationCode();

      dispatch(setEmailVerificationStatus("codeSent"));
      return response.data;
    } catch (error) {
      dispatch(setEmailVerificationStatus("failed"));
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const verifyEmail = createAsyncThunk(
  "user/verifyEmail",
  async (code, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));
      dispatch(setEmailVerificationStatus("verifying"));

      const response = await api.verifyEmail(code);

      dispatch(setIsEmailVerified(true));
      dispatch(setEmailVerificationStatus("success"));
      return response.data;
    } catch (error) {
      dispatch(setEmailVerificationStatus("failed"));
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);
