import { toast } from "react-toastify";

// Toast notification types
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

// Default toast configuration
const defaultConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/**
 * Show a success toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration overrides
 */
export const showSuccess = (message, options = {}) => {
  toast.success(message, { ...defaultConfig, ...options });
};

/**
 * Show an error toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration overrides
 */
export const showError = (message, options = {}) => {
  toast.error(message, { ...defaultConfig, ...options });
};

/**
 * Show an info toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration overrides
 */
export const showInfo = (message, options = {}) => {
  toast.info(message, { ...defaultConfig, ...options });
};

/**
 * Show a warning toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration overrides
 */
export const showWarning = (message, options = {}) => {
  toast.warning(message, { ...defaultConfig, ...options });
};

/**
 * Show a toast notification for API responses
 * @param {boolean} success - Whether the API call was successful
 * @param {string} successMessage - Message to show on success
 * @param {string} errorMessage - Message to show on error
 * @param {Error|string} error - Optional error object or message
 */
export const showApiResponse = (
  success,
  successMessage,
  errorMessage,
  error = null
) => {
  if (success) {
    showSuccess(successMessage);
  } else {
    const message = error?.message || error || errorMessage;
    showError(message);
  }
};

export default {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showApiResponse,
};
