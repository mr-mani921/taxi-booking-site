import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaExchangeAlt,
  FaClock,
  FaCalendarAlt,
  FaUser,
  FaSuitcase,
  FaLocationArrow,
} from "react-icons/fa";
import PropTypes from "prop-types";
import PlacesAutocomplete from "./PlacesAutocomplete";
import { updateBookingData } from "../store/bookingSlice";
import { getBids } from "../store/thunks/bookingThunks";

function BookingForm({ onGetLocation, pageIs }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userLocation = useSelector((state) => state.booking.userLocation);
  const [isOneWay] = useState(true);
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

  // Handler for getting current location
  const handleGetLocation = useCallback(() => {
    onGetLocation();
  }, [onGetLocation]);

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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
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
    <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      <div className={pageIs === "quote" ? "block" : "md:flex justify-evenly "}>
        <div className={`${pageIs === "quote" ? "w-full" : "md:w-1/2"}`}>
          {/* Pickup Location */}
          <div className="mb-4">
            <div className="relative">
              <PlacesAutocomplete
                value={pickupAddress}
                onChange={setPickupAddress}
                onSelect={handlePickupSelect}
                label="From"
                isPickup={true}
                className="border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                aria-label="Use current location"
              >
                <FaLocationArrow size={16} />
              </button>
            </div>
          </div>
          {/* Swap Button */}
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={swapLocations}
              className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
              aria-label="Swap locations"
            >
              <FaExchangeAlt size={14} />
            </button>
          </div>

          {/* Dropoff Location */}
          <div className="mb-4 ">
            <PlacesAutocomplete
              value={dropoffAddress}
              onChange={setDropoffAddress}
              onSelect={handleDropoffSelect}
              label="To"
              isPickup={false}
              className="border border-gray-300 rounded-md "
            />
          </div>
        </div>

        {/* Date and Time Row */}
        {/* Combined Layout Container */}
        <div
          className={`flex ${
            pageIs === "home" ? "flex-row justify-evenly" : "flex-col gap-4"
          } ${pageIs === "home" && "w-1/2"} mb-6`}
        >
          {/* Date + Time Group */}
          <div
            className={`flex ${
              pageIs === "booking" || pageIs === "quote"
                ? "flex-row"
                : "flex-col"
            } ${pageIs === "home" ? "md:w-1/3" : "w-full justify-evenly"}  gap-2`}
          >
            {/* Date Picker */}
            <div>
              <div className="relative flex items-center border border-gray-300 rounded-md px-3 py-2   min-w-full bg-white">
                <FaCalendarAlt className="text-gray-500 mr-2" size={16} />
                <div className="flex-grow text-sm text-gray-700">
                  {formatDate(pickupDate)}
                </div>
                <input
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  onClick={(e) => e.currentTarget.showPicker()}
                />
              </div>
            </div>

            {/* Time Picker */}
            <div>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <div className="flex items-center bg-white px-3 py-2">
                  <FaClock className="text-gray-500" size={16} />
                </div>
                <select
                  value={pickupHour}
                  onChange={(e) => setPickupHour(e.target.value)}
                  required
                  className="appearance-none bg-white py-2 px-2 border-r border-gray-300 text-sm text-gray-700 flex-1"
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={String(i).padStart(2, "0")}>
                      {String(i).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  value={pickupMinute}
                  onChange={(e) => setPickupMinute(e.target.value)}
                  required
                  className="appearance-none bg-white py-2 px-2 text-sm text-gray-700 flex-1"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => (
                    <option key={min} value={String(min).padStart(2, "0")}>
                      {String(min).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Passengers + Luggage Group */}
          <div
            className={`flex ${
              pageIs === "booking" ? "flex-row justify-evenly" : "flex-col"
            } gap-2`}
          >
            {/* Passengers */}
            <div>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <div className="flex items-center bg-white px-3 py-2">
                  <FaUser className="text-gray-500" size={16} />
                </div>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="appearance-none bg-white py-2 px-2 text-sm text-gray-700 flex-1"
                >
                  {[...Array(8)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? "Passenger" : "Passengers"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Luggage */}
            <div>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <div className="flex items-center bg-white px-3 py-2">
                  <FaSuitcase className="text-gray-500" size={16} />
                </div>
                <select
                  value={luggage}
                  onChange={(e) => setLuggage(Number(e.target.value))}
                  className="appearance-none bg-white py-2 px-2 text-sm text-gray-700 flex-1"
                >
                  {[...Array(6)].map((_, i) => (
                    <option key={i} value={i}>
                      {i} {i === 1 ? "Luggage" : "Luggages"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          isSubmitting || !pickupLocation || !dropoffLocation || !pickupTime
        }
        className={`w-full bg-primary text-white font-medium py-3 rounded-md transition-colors ${
          isSubmitting || !pickupLocation || !dropoffLocation || !pickupTime
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-primary/90"
        }`}
      >
        {isSubmitting ? "Getting Quotes..." : "Get Quotes"}
      </button>
    </form>
  );
}

BookingForm.propTypes = {
  onGetLocation: PropTypes.func.isRequired,
};

export default BookingForm;
