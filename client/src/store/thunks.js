import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";
import { setIsAuthenticated } from "./userSlice";
import { setLoading } from "./apiSlice";
import { setAvailabilityReference } from "./bookingSlice";

// Auth thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      console.log(credentials);
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.login(credentials);
      console.log(response.data);
      localStorage.setItem("token", response.data.token);
      dispatch(setIsAuthenticated(true));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      console.log(error);
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.register(userData);
      localStorage.setItem("token", response.data.token);
      dispatch(setIsAuthenticated(true));
      dispatch(setLoading({ entity: "user", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      console.log(error.response.data.message);

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
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
    }
  }
);

// User profile thunks
export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.getUserProfile();
      dispatch(setLoading({ entity: "user", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "user", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.updateUserProfile(profileData);
      dispatch(setLoading({ entity: "user", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "user", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// Rides thunks
export const fetchRides = createAsyncThunk(
  "rides/fetchAll",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.getRides();
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "rides", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const fetchRideById = createAsyncThunk(
  "rides/fetchById",
  async (rideId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.getRideById(rideId);
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "rides", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const bookRide = createAsyncThunk(
  "rides/book",
  async (bookingData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.bookRide(bookingData);
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "rides", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const cancelRide = createAsyncThunk(
  "rides/cancel",
  async (rideId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.cancelRide(rideId);
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "rides", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const rateRide = createAsyncThunk(
  "rides/rate",
  async ({ rideId, ratingData }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "rides", isLoading: true }));
      const response = await api.rateRide(rideId, ratingData);
      dispatch(setLoading({ entity: "rides", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "rides", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// Quotes and bids thunks
export const getPriceEstimate = createAsyncThunk(
  "quotes/getEstimate",
  async (estimateData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "quotes", isLoading: true }));
      const response = await api.getPriceEstimate(estimateData);
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const getVendorBids = createAsyncThunk(
  "quotes/getVendorBids",
  async (bidData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "quotes", isLoading: true }));
      const response = await api.getVendorBids(bidData);
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const selectBid = createAsyncThunk(
  "quotes/selectBid",
  async (bidData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "quotes", isLoading: true }));
      const response = await api.selectBid(bidData);
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const checkBidAvailability = createAsyncThunk(
  "quotes/checkAvailability",
  async (bidData, { dispatch, rejectWithValue }) => {
    try {
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

      dispatch(setLoading({ entity: "quotes", isLoading: false }));

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
      dispatch(setLoading({ entity: "quotes", isLoading: false }));
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to check ride availability",
        }
      );
    }
  }
);

// Payment thunks
export const processPayment = createAsyncThunk(
  "payments/process",
  async (paymentData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "payments", isLoading: true }));
      const response = await api.processPayment(paymentData);
      dispatch(setLoading({ entity: "payments", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "payments", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const createStripePaymentIntent = createAsyncThunk(
  "payments/createStripeIntent",
  async (paymentData, { dispatch, rejectWithValue }) => {
    try {
      console.log("in the cratePaymentIntent Thunk");

      dispatch(setLoading({ entity: "payments", isLoading: true }));
      // Uncomment the API call when the backend is ready
      const response = await api.createStripePaymentIntent(paymentData);

      dispatch(setLoading({ entity: "payments", isLoading: false }));
      console.log("and the secret is ", response.data.clientSecret);

      return response.data.clientSecret;
    } catch (error) {
      dispatch(setLoading({ entity: "payments", isLoading: false }));
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const fetchSavedPaymentMethods = createAsyncThunk(
  "payments/fetchSavedMethods",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "payments", isLoading: true }));
      const response = await api.getSavedPaymentMethods();
      dispatch(setLoading({ entity: "payments", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "payments", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const deletePaymentMethod = createAsyncThunk(
  "payments/deleteMethod",
  async (methodId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "payments", isLoading: true }));
      const response = await api.deletePaymentMethod(methodId);
      dispatch(setLoading({ entity: "payments", isLoading: false }));
      return { id: methodId, ...response.data };
    } catch (error) {
      dispatch(setLoading({ entity: "payments", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);
