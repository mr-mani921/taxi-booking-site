import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  isAuthenticated: false,
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
  resetUserState,
} = userSlice.actions;

export default userSlice.reducer;
