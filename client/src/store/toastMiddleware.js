import { showSuccess, showError } from "../utils/toast";

// Define action types that should trigger toast notifications
const SUCCESS_ACTION_TYPES = {
  "auth/login/fulfilled": "Successfully logged in",
  "auth/register/fulfilled": "Account created successfully",
  "auth/logout/fulfilled": "Successfully logged out",
  "user/updateProfile/fulfilled": "Profile updated successfully",
  "rides/book/fulfilled": "Ride booked successfully",
  "rides/cancel/fulfilled": "Ride cancelled successfully",
  "quotes/selectBid/fulfilled": "Bid selected successfully",
  "payments/process/fulfilled": "Payment processed successfully",
  "payments/addPaymentMethod/fulfilled": "Payment method added successfully",
  "payments/deletePaymentMethod/fulfilled":
    "Payment method removed successfully",
  "verification/verifyEmail/fulfilled": "Email verified successfully",
};

const ERROR_ACTION_TYPES = {
  "auth/login/rejected": "Login failed",
  "auth/register/rejected": "Registration failed",
  "auth/logout/rejected": "Logout failed",
  "user/updateProfile/rejected": "Failed to update profile",
  "rides/book/rejected": "Failed to book ride",
  "rides/cancel/rejected": "Failed to cancel ride",
  "quotes/selectBid/rejected": "Failed to select bid",
  "payments/process/rejected": "Payment failed",
  "payments/addPaymentMethod/rejected": "Failed to add payment method",
  "payments/deletePaymentMethod/rejected": "Failed to remove payment method",
  "verification/verifyEmail/rejected": "Email verification failed",
};

/**
 * Redux middleware for showing toast notifications on API responses
 */
const toastMiddleware = () => (next) => (action) => {
  // Process the action first
  const result = next(action);

  // Check if this is a fulfilled action that should show a success toast
  if (action.type in SUCCESS_ACTION_TYPES) {
    const customMessage = action.payload?.message;
    showSuccess(customMessage || SUCCESS_ACTION_TYPES[action.type]);
  }

  // Check if this is a rejected action that should show an error toast
  if (action.type in ERROR_ACTION_TYPES) {
    const errorMessage = action.payload?.message || action.error?.message;
    showError(errorMessage || ERROR_ACTION_TYPES[action.type]);
  }

  return result;
};

export default toastMiddleware;
