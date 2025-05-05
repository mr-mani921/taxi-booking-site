import axios from "axios";

// Create an axios instance with default configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor for adding user token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Userorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle userentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if needed
      localStorage.removeItem("token");
      window.location.href = "/user";
    }
    return Promise.reject(error);
  }
);

// API endpoints
const endpoints = {
  // User
  login: (data) => API.post("/api/user/login", data),
  register: (data) => API.post("/api/user/register", data),
  logout: () => API.get("/api/user/logout"),
  refreshToken: () => API.post("/api/user/refresh-token"),

  getUserProfile: () => API.get("/api/users/profile"),
  updateUserProfile: (data) => API.put("/api/users/profile", data),

  // Payments
  getSavedPaymentMethods: () => API.get("/api/payments/saved-methods"),
  deletePaymentMethod: (id) => API.delete(`/api/payments/saved-methods/${id}`),
  processPayment: (data) => API.post("/api/payments/process", data),
  createPaymentIntent: (data) => API.post("/api/payments/create-intent", data),

  // Stripe Payments - used specifically for Stripe integration
  createStripePaymentIntent: (data) =>
    API.post("/api/payment/payment-intent", data),
  captureStripePayment: (paymentIntentId) =>
    API.post(`/api/payment/capture/`, paymentIntentId),

  // Rides
  getRides: () => API.get("/api/rides/history"),
  getRideById: (id) => API.get(`/api/rides/${id}`),
  bookRide: (data) => API.post("/api/rides/book", data),
  cancelRide: (id) => API.post(`/api/rides/${id}/cancel`),
  rateRide: (id, data) => API.post(`/api/rides/${id}/rate`, data),
  getRideHistory: () => API.get("/api/rides/history"),
  getActiveRides: () => API.get("/api/rides/active"),
  // Quotes/Bids
  getPriceEstimate: (data) => API.post("/api/rides/quotes/estimate", data),
  getVendorBids: (data) => API.post("/api/rides/request-bids", data),
  selectBid: (data) => API.post("/api/bids/select", data),
  checkAvailability: (data) => API.post("/api/rides/select-bid", data),
  authorizeBid: (data) => API.post("/api/rides/authorize", data),
  //Events
  getEventsHistory: (bookingReference) => API.get(`/api/events/history/${bookingReference}`),
};

export default endpoints;
