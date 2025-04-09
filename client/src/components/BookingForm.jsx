import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import arrowLine from "../assets/dotted-arrow.png";
import { FaExchangeAlt } from "react-icons/fa";
import PropTypes from "prop-types";
import PlacesAutocomplete from "./PlacesAutocomplete";
import { updateBookingData } from "../store/bookingSlice";
import { getBids } from "../store/thunks/bookingThunks";

function BookingForm({ onGetLocation }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userLocation = useSelector((state) => state.booking.userLocation);
  const [isOneWay, setIsOneWay] = useState(true);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [pickupTime, setPickupTime] = useState("");

  // Location state
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  // Update pickup address when user location changes
  useEffect(() => {
    if (userLocation) {
      setPickupAddress(
        userLocation.address ||
          `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`
      );
      setPickupLocation(userLocation);
    }
  }, [userLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      setError("Please login to continue");
      navigate("/auth");
      return;
    }

    if (!pickupLocation) {
      setError("Please set your pickup location");
      return;
    }

    if (!dropoffLocation) {
      setError("Please select a valid destination");
      return;
    }

    if (!pickupTime) {
      setError("Please select a pickup time");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare booking data with complete location objects
      const rideData = {
        pickupLocation: {
          ...pickupLocation,
          address: pickupAddress,
        },
        dropoffLocation: {
          ...dropoffLocation,
          address: dropoffAddress,
        },
        pickupTime,
        passengers,
        luggage,
        isOneWay,
      };

      // Update booking data in Redux
      dispatch(updateBookingData(rideData));

      // Call the completeBookingFlow thunk to get vendor quotes
      console.log("sending request for bids with data", rideData)
      const result = await dispatch(getBids(rideData));
      console.log(`Quote request result:`, result);

      if (result.error) {
        // Handle the error response
        const errorMessage =
          typeof result.payload === "string"
            ? result.payload
            : result.payload?.message || "Failed to get quotes";
        setError(errorMessage);
        return;
      }

      // Navigate to the quotes page if successful
      navigate("/quotes");
    } catch (err) {
      console.error("Error requesting quotes:", err);
      setError(
        err.message || "An unexpected error occurred while getting quotes"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTripType = () => setIsOneWay(!isOneWay);

  const handleDropoffSelect = (location) => {
    setDropoffLocation({
      lat: location.lat,
      lng: location.lng,
      address: location.address,
    });
    setDropoffAddress(location.address);
  };

  const handlePickupSelect = (location) => {
    setPickupLocation({
      lat: location.lat,
      lng: location.lng,
      address: location.address,
    });
    setPickupAddress(location.address);
  };

  const handleGetPickupLocation = async () => {
    try {
      await onGetLocation();
    } catch (locationError) {
      console.error("Location error:", locationError);
      setError("Failed to get your location. Please enter manually.");
    }
  };

  const swapLocations = () => {
    if (dropoffLocation && pickupLocation) {
      // Save current locations
      const tempPickup = { ...pickupLocation, address: pickupAddress };
      const tempDropoff = { ...dropoffLocation, address: dropoffAddress };

      // Swap locations
      setPickupAddress(tempDropoff.address);
      setPickupLocation(tempDropoff);
      setDropoffAddress(tempPickup.address);
      setDropoffLocation(tempPickup);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 glass-effect rounded-xl shadow-lg"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-10 justify-evenly">
        <div className="flex flex-1">
          <div className="flex min-h-full items-center">
            <img
              src={arrowLine}
              alt=""
              className="transform rotate-[135deg] w-10 h-10"
            />
          </div>

          <div className="flex flex-col gap-4 w-full">
            {/* From Location */}
            <div className="space-y-2">
              <PlacesAutocomplete
                value={pickupAddress}
                onChange={setPickupAddress}
                onSelect={handlePickupSelect}
                placeholder="Enter pickup location"
                label="From Location"
              />
              {pickupLocation && (
                <div className="text-green-400 text-xs">
                  Coordinates: {pickupLocation.lat.toFixed(4)},{" "}
                  {pickupLocation.lng.toFixed(4)}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={swapLocations}
              className="self-center text-primary hover:text-primary/80 transition-colors"
              aria-label="Swap locations"
            >
              <FaExchangeAlt size={20} />
            </button>

            {/* To Location */}
            <div className="space-y-2">
              <PlacesAutocomplete
                value={dropoffAddress}
                onChange={setDropoffAddress}
                onSelect={handleDropoffSelect}
                placeholder="Enter your destination"
                label="To Location"
              />
              {dropoffLocation && (
                <div className="text-green-400 text-xs">
                  Coordinates: {dropoffLocation.lat.toFixed(4)},{" "}
                  {dropoffLocation.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Trip Type Toggle */}
          <div className="space-x-2 items-center">
            <div className="flex items-center gap-4">
              <span className="text-white">One-Way</span>
              <button
                type="button"
                onClick={toggleTripType}
                className={`relative w-12 h-6 rounded-full p-1 transition-all ${
                  isOneWay ? "bg-primary" : "bg-gray-600"
                }`}
                aria-label={
                  isOneWay ? "Switch to round trip" : "Switch to one way"
                }
              >
                <motion.div
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: isOneWay ? 0 : 24 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </button>
              <span className="text-white">Round Trip</span>
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="space-y-2">
            <label className="block text-white text-sm font-medium">
              Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full bg-dark/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Number of Passengers */}
          <div className="space-y-2">
            <label className="block text-white text-sm font-medium">
              Passengers
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPassengers((prev) => Math.max(1, prev - 1))}
                className="p-2 bg-dark/50 border border-gray-600 rounded-lg text-white hover:bg-primary/50 transition-all"
                aria-label="Decrease passenger count"
              >
                -
              </button>
              <span className="text-white">{passengers}</span>
              <button
                type="button"
                onClick={() => setPassengers((prev) => Math.min(10, prev + 1))}
                className="p-2 bg-dark/50 border border-gray-600 rounded-lg text-white hover:bg-primary/50 transition-all"
                aria-label="Increase passenger count"
              >
                +
              </button>
            </div>
          </div>

          {/* Luggage Count */}
          <div className="space-y-2">
            <label className="block text-white text-sm font-medium">
              Luggage (pieces)
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setLuggage((prev) => Math.max(0, prev - 1))}
                className="p-2 bg-dark/50 border border-gray-600 rounded-lg text-white hover:bg-primary/50 transition-all"
                aria-label="Decrease luggage count"
              >
                -
              </button>
              <span className="text-white">{luggage}</span>
              <button
                type="button"
                onClick={() => setLuggage((prev) => Math.min(10, prev + 1))}
                className="p-2 bg-dark/50 border border-gray-600 rounded-lg text-white hover:bg-primary/50 transition-all"
                aria-label="Increase luggage count"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={
          isSubmitting || !pickupLocation || !dropoffLocation || !pickupTime
        }
        className={`w-full bg-primary text-dark font-semibold py-3 rounded-lg hover-glow ${
          isSubmitting || !pickupLocation || !dropoffLocation || !pickupTime
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {isSubmitting ? "Getting Quotes..." : "Get Quotes"}
      </motion.button>
    </form>
  );
}

BookingForm.propTypes = {
  onGetLocation: PropTypes.func.isRequired,
};

export default BookingForm;
