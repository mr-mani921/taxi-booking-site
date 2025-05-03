import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: {
    user: false,
    rides: false,
    quotes: false,
    payments: false,
    bids: false,
  },
  globalLoading: false,
  errors: {
    user: null,
    rides: null,
    quotes: null,
    payments: null,
    bids: null,
  },
  isAuthenticated: false,
  authChecked: false,
};

const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      const { entity, isLoading } = action.payload;
      state.loading[entity] = isLoading;
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    setError: (state, action) => {
      const { entity, error } = action.payload;
      state.errors[entity] = error;
    },
    clearError: (state, action) => {
      const entity = action.payload;
      state.errors[entity] = null;
    },
    clearAllErrors: (state) => {
      Object.keys(state.errors).forEach((key) => {
        state.errors[key] = null;
      });
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
      state.authChecked = true;
    },
    setAuthChecked: (state, action) => {
      state.authChecked = action.payload;
    },
    resetApiState: () => initialState,
  },
});

export const {
  setLoading,
  setGlobalLoading,
  setError,
  clearError,
  clearAllErrors,
  setAuthenticated,
  setAuthChecked,
  resetApiState,
} = apiSlice.actions;

export default apiSlice.reducer;
