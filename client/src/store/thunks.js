import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";
import {
  setIsAuthenticated,
  setEmailVerificationStatus,
  setIsEmailVerified,
  setPendingAuth,
  clearPendingAuth,
  setProfile,
} from "./userSlice";
import { setLoading, setGlobalLoading } from "./apiSlice";
import { setAvailabilityReference, updateBookingData } from "./bookingSlice";
import {
  loadBookingDataFromStorage,
  clearBookingDataFromStorage,
} from "../utils/authUtils";

// Auth thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));
      const response = await api.login(credentials);

      // If we receive a success response but no token, it means OTP is required
      if (response.data.success && !response.data.token) {
        // Store the email for the OTP verification step
        dispatch(
          setPendingAuth({
            email: credentials.email,
            isRegistration: false,
          })
        );

        return {
          message:
            response.data.message ||
            "Please check your email for the verification code.",
          requireOTP: true,
        };
      }

      // This should not happen with the new flow, but keeping it for compatibility
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        dispatch(setIsAuthenticated(true));

        return {
          message: "Welcome back! You've successfully logged in.",
        };
      }

      return {
        message: response.data.message,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Login failed. Please check your credentials and try again.";
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

      // If we receive a success response but no token, it means OTP is required
      if (response.data.success && !response.data.token) {
        // Store the email for the OTP verification step
        dispatch(
          setPendingAuth({
            email: userData.email,
            isRegistration: true,
          })
        );

        return {
          message:
            response.data.message ||
            "Please check your email for the verification code.",
          requireOTP: true,
        };
      }

      // This should not happen with the new flow, but keeping it for compatibility
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        dispatch(setIsAuthenticated(true));
        dispatch(setIsEmailVerified(true));

        return {
          message: "Your account has been created successfully!",
        };
      }

      return {
        message: response.data.message,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Registration failed. Please try again.";
      return rejectWithValue({ message: errorMessage });
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ email, otp, isRegistration }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));

      const response = await api.verifyOTP({ email, otp, isRegistration });

      if (response.data.success && response.data.token) {
        localStorage.setItem("token", response.data.token);
        dispatch(setIsAuthenticated(true));
        dispatch(setIsEmailVerified(true));
        dispatch(clearPendingAuth());

        // Fetch user profile
        try {
          const profileResponse = await api.getUserProfile();
          dispatch(setProfile(profileResponse.data));
        } catch (profileError) {
          console.warn("Failed to fetch user profile:", profileError);
          // Don't fail the entire login process if profile fetch fails
        }

        // Load saved booking data from localStorage
        try {
          const savedBookingData = loadBookingDataFromStorage();
          if (savedBookingData) {
            dispatch(updateBookingData(savedBookingData));
            // Clear the data from localStorage after loading it into the store
            clearBookingDataFromStorage();
          }
        } catch (bookingError) {
          console.warn("Failed to load saved booking data:", bookingError);
          // Don't fail the entire login process if booking data load fails
        }

        return {
          message: response.data.message || "Authentication successful!",
        };
      }

      return {
        message: response.data.message,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Verification failed. Please try again.";
      return rejectWithValue({ message: errorMessage });
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);

export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async ({ email, isRegistration }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading({ entity: "user", isLoading: true }));

      const response = await api.resendOTP({ email, isRegistration });

      return {
        message:
          response.data.message || "Verification code resent successfully!",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to resend verification code. Please try again.";
      return rejectWithValue({ message: errorMessage });
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      await api.logout();
      localStorage.removeItem("token");
      clearBookingDataFromStorage(); // Clear saved booking data
      dispatch(setIsAuthenticated(false));
      return { success: true };
    } catch (error) {
      localStorage.removeItem("token"); // Still remove token even if API call fails
      clearBookingDataFromStorage(); // Clear saved booking data even if API call fails
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

      // Build the request data for the API call
      const requestData = {
        vendorId,
        bidReference,
      };

      // Make the API call to check availability
      const response = await api.checkAvailability(requestData);

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

      if (!selectedQuote.availabilityReference) {
        throw new Error("Missing availability reference");
      }

      // Prepare the data for authorization request
      // Note: Locations and pickupTime will be retrieved from the bid on the backend if not provided
      // This ensures we don't fail if bookingData is missing or incomplete
      const requestData = {
        // Required booking data
        bidReference,
        // Include location data if available in bookingData, otherwise backend will use bid data
        pickupLocation: bookingData.pickupLocation || null,
        dropoffLocation: bookingData.dropoffLocation || null,
        pickupTime: bookingData.pickupTime || null,
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

      console.log("the booking data is ", bookingData);
      console.log("the selected quote is ", selectedQuote);
      console.log("the request data is ", requestData);

      // Make the API call to authorize the bid
      const response = await api.authorizeBid(requestData);

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
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "payments", isLoading: true }));
      // Uncomment the API call when the backend is ready
      const response = await api.createStripePaymentIntent(paymentData);
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

// Google OAuth success thunk
export const handleGoogleAuthSuccess = createAsyncThunk(
  "auth/googleSuccess",
  async (token, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGlobalLoading(true));
      dispatch(setLoading({ entity: "user", isLoading: true }));

      // Store the token
      localStorage.setItem("token", token);

      // Set authentication state
      dispatch(setIsAuthenticated(true));
      dispatch(setIsEmailVerified(true)); // Google users are always email verified

      // Fetch user profile
      try {
        const profileResponse = await api.getUserProfile();
        dispatch(setProfile(profileResponse.data));
      } catch (profileError) {
        console.warn("Failed to fetch user profile:", profileError);
        // Don't fail the entire login process if profile fetch fails
      }

      // Load saved booking data from localStorage
      try {
        const savedBookingData = loadBookingDataFromStorage();
        if (savedBookingData) {
          dispatch(updateBookingData(savedBookingData));
          // Clear the data from localStorage after loading it into the store
          clearBookingDataFromStorage();
        }
      } catch (bookingError) {
        console.warn("Failed to load saved booking data:", bookingError);
        // Don't fail the entire login process if booking data load fails
      }

      return {
        message: "Google authentication successful!",
      };
    } catch (error) {
      const errorMessage =
        error.message ||
        "Failed to process Google authentication. Please try again.";
      return rejectWithValue({ message: errorMessage });
    } finally {
      dispatch(setLoading({ entity: "user", isLoading: false }));
      dispatch(setGlobalLoading(false));
    }
  }
);
