import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import arrowLine from "../assets/dotted-arrow.png";
import {
  FaExchangeAlt,
  FaClock,
  FaCalendarAlt,
  FaUser,
  FaSuitcase,
} from "react-icons/fa";
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

  // New date and time state variables
  const [pickupDate, setPickupDate] = useState("");
  const [pickupHour, setPickupHour] = useState("");
  const [pickupMinute, setPickupMinute] = useState("");
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

  // Update pickupTime when date or time components change
  useEffect(() => {
    if (pickupDate && pickupHour && pickupMinute) {
      const dateObj = new Date(pickupDate);
      dateObj.setHours(parseInt(pickupHour, 10));
      dateObj.setMinutes(parseInt(pickupMinute, 10));
      setPickupTime(dateObj.toISOString().slice(0, 16));
    }
  }, [pickupDate, pickupHour, pickupMinute]);

  // Initialize date and time values from current date
  useEffect(() => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 10) * 10); // Round up to nearest 10 minutes

    setPickupDate(now.toISOString().split("T")[0]);
    setPickupHour(String(now.getHours()).padStart(2, "0"));
    setPickupMinute(String(now.getMinutes()).padStart(2, "0"));
  }, []);

  // Format date as "Tue 24th Jun"
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const day = date.getDate();
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";

    return `${days[date.getDay()]} ${day}${suffix} ${months[date.getMonth()]}`;
  };

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
      const result = await dispatch(getBids(rideData));

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
      className="space-y-6 p-4 sm:p-6 glass-effect rounded-xl shadow-lg w-full max-w-full overflow-hidden"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 justify-between">
        <div className="flex flex-1 min-w-[50%]">
          <div className="flex min-h-full items-center">
            <img
              src={arrowLine}
              alt=""
              className="transform rotate-[135deg] w-8 h-8 sm:w-10 sm:h-10"
            />
          </div>

          <div className="flex flex-col gap-2 w-full min-w-0">
            {/* From Location */}
            <div className="space-y-2">
              <PlacesAutocomplete
                value={pickupAddress}
                onChange={setPickupAddress}
                onSelect={handlePickupSelect}
                label="From"
                isPickup={true}
              />
              {pickupLocation && (
                <div className="text-green-400 text-xs truncate">
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
                label="To"
                isPickup={false}
              />
              {dropoffLocation && (
                <div className="text-green-400 text-xs truncate">
                  Coordinates: {dropoffLocation.lat.toFixed(4)},{" "}
                  {dropoffLocation.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center w-full lg:w-auto lg:min-w-[320px] gap-4">
          {/* Date & Time Picker */}
          <div className="w-full space-y-4">
            {/* Pickup Date/Time Row */}
            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden w-full">
              {/* Date Selection */}
              <div className="flex items-center bg-white/5 px-3 py-2 md:py-4 flex-1 border-r border-gray-600/30 relative cursor-pointer">
                <FaCalendarAlt className="text-primary mr-2" size={16} />
                <div className="flex items-center justify-between flex-1">
                  <span className="text-white text-sm">
                    {formatDate(pickupDate)}
                  </span>
                  <svg
                    className="w-4 h-4 text-white ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
                <label htmlFor="date-picker" className="sr-only">
                  Select date
                </label>
                <input
                  id="date-picker"
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  onClick={(e) => {
                    // This ensures the calendar opens on mobile devices
                    e.currentTarget.showPicker();
                  }}
                />
              </div>

              {/* Time Selection */}
              <div className="flex items-center px-4 py-2 gap-1">
                <FaClock className="text-primary mr-2" size={16} />
                <input
                  type="number"
                  min="0"
                  max="23"
                  step="1"
                  className="bg-transparent border-none text-white focus:outline-none focus:ring-0 text-center w-10 p-0"
                  value={pickupHour}
                  onChange={(e) =>
                    setPickupHour(e.target.value.padStart(2, "0"))
                  }
                  required
                />
                <span className="text-white mx-1">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  className="bg-transparent border-none text-white focus:outline-none focus:ring-0 text-center w-10 p-0"
                  value={pickupMinute}
                  onChange={(e) =>
                    setPickupMinute(e.target.value.padStart(2, "0"))
                  }
                  required
                />
              </div>
            </div>

            {/* Passengers and Luggage Row */}
            <div className="flex flex-row gap-4 w-full">
              {/* Passengers Selection */}
              <div className="flex items-center bg-white/10 rounded-lg overflow-hidden flex-1">
                <div className="flex items-center gap-2 px-4 py-4 flex-1">
                  <FaUser className="text-primary" size={16} />
                  <span className="text-white text-sm">Passengers</span>
                </div>
                <div className="flex items-center gap-2 md:px-4">
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                    className="bg-transparent border-none text-white focus:outline-none focus:ring-0 pr-8 appearance-none cursor-pointer text-center"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option
                        key={num}
                        value={num}
                        className="bg-dark text-white text-center"
                        style={{ textAlign: "center" }}
                      >
                        {num}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Luggage Selection */}
              <div className="flex items-center bg-white/10 rounded-lg overflow-hidden flex-1">
                <div className="flex items-center gap-2 px-2 md:px-4 py-4 flex-1">
                  <FaSuitcase className="text-primary" size={16} />
                  <span className="text-white text-sm">Luggage</span>
                </div>
                <div className="flex items-center gap-2 md:px-4">
                  <select
                    value={luggage}
                    onChange={(e) => setLuggage(parseInt(e.target.value))}
                    className="bg-transparent border-none text-white focus:outline-none focus:ring-0 pr-8 appearance-none cursor-pointer text-center"
                  >
                    <option
                      value="0"
                      className="bg-dark text-white text-center"
                      style={{ textAlign: "center" }}
                    >
                      None
                    </option>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option
                        key={num}
                        value={num}
                        className="bg-dark text-white text-center"
                        style={{ textAlign: "center" }}
                      >
                        {num}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
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
