/**
 * Extracts the token from URL query parameters
 * This function is used after Google OAuth redirect
 */
export const extractTokenFromUrl = () => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    return token;
  }
  return null;
};

/**
 * Handles the OAuth success by storing the token and redirecting
 * @param {string} token - JWT token received from OAuth provider
 */
export const handleOAuthSuccess = (token) => {
  if (token) {
    // Store token in localStorage (same as regular login)
    localStorage.setItem("token", token);

    // Clean up URL
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    return true;
  }
  return false;
};

// Booking data persistence utilities
export const saveBookingDataToStorage = (bookingData) => {
  try {
    localStorage.setItem("savedBookingData", JSON.stringify(bookingData));
  } catch (error) {
    console.warn("Failed to save booking data to localStorage:", error);
  }
};

export const loadBookingDataFromStorage = () => {
  try {
    const savedData = localStorage.getItem("savedBookingData");
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.warn("Failed to load booking data from localStorage:", error);
    return null;
  }
};

export const clearBookingDataFromStorage = () => {
  try {
    localStorage.removeItem("savedBookingData");
  } catch (error) {
    console.warn("Failed to clear booking data from localStorage:", error);
  }
};
