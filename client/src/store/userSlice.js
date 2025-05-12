import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  isAuthenticated: false,
  isEmailVerified: false,
  emailVerificationStatus: null, // 'pending', 'success', 'failed'
  pendingAuth: null, // { email, isRegistration }
  preferences: {
    defaultPaymentMethod: null,
    notifications: {
      bookingUpdates: true,
      promotions: true,
      news: false,
    },
    language: "en",
    theme: "dark",
  },
  savedLocations: [],
  favoriteDrivers: [],
  paymentMethods: [],
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
      if (action.payload && action.payload.isEmailVerified !== undefined) {
        state.isEmailVerified = action.payload.isEmailVerified;
      }
    },
    setIsAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    updatePreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
    },
    addSavedLocation: (state, action) => {
      state.savedLocations.push(action.payload);
    },
    removeSavedLocation: (state, action) => {
      state.savedLocations = state.savedLocations.filter(
        (location) => location.id !== action.payload
      );
    },
    addFavoriteDriver: (state, action) => {
      state.favoriteDrivers.push(action.payload);
    },
    removeFavoriteDriver: (state, action) => {
      state.favoriteDrivers = state.favoriteDrivers.filter(
        (driver) => driver.id !== action.payload
      );
    },
    setPaymentMethods: (state, action) => {
      state.paymentMethods = action.payload;
    },
    addPaymentMethod: (state, action) => {
      state.paymentMethods.push(action.payload);
    },
    removePaymentMethod: (state, action) => {
      state.paymentMethods = state.paymentMethods.filter(
        (method) => method.id !== action.payload
      );
    },
    setEmailVerificationStatus: (state, action) => {
      state.emailVerificationStatus = action.payload;
    },
    setIsEmailVerified: (state, action) => {
      state.isEmailVerified = action.payload;
    },
    setPendingAuth: (state, action) => {
      state.pendingAuth = action.payload;
    },
    clearPendingAuth: (state) => {
      state.pendingAuth = null;
    },
    resetUserState: () => initialState,
  },
});

export const {
  setProfile,
  setIsAuthenticated,
  updatePreferences,
  addSavedLocation,
  removeSavedLocation,
  addFavoriteDriver,
  removeFavoriteDriver,
  setPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setEmailVerificationStatus,
  setIsEmailVerified,
  setPendingAuth,
  clearPendingAuth,
  resetUserState,
} = userSlice.actions;

export default userSlice.reducer;
