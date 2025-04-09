import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";
import { setIsAuthenticated } from "./userSlice";
import { setLoading } from "./apiSlice";

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
      console.log(error)
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
      console.log(error.response.data.message)

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
  async (quoteData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "quotes", isLoading: true }));
      const response = await api.getPriceEstimate(quoteData);
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

export const requestVendorBids = createAsyncThunk(
  "bids/request",
  async (bidRequestData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "bids", isLoading: true }));
      const response = await api.getVendorBids(bidRequestData);
      dispatch(setLoading({ entity: "bids", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "bids", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const selectBid = createAsyncThunk(
  "bids/select",
  async (bidData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "bids", isLoading: true }));
      const response = await api.selectBid(bidData);
      dispatch(setLoading({ entity: "bids", isLoading: false }));
      return response.data;
    } catch (error) {
      dispatch(setLoading({ entity: "bids", isLoading: false }));

      return rejectWithValue(
        error.response?.data || { message: error.message }
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
