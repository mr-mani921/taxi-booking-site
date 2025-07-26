import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaExchangeAlt,
  FaClock,
  FaCalendarAlt,
  FaUser,
  FaSuitcase,
  FaArrowRight,
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
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm shadow-input animate-fade-in">
          {error}
        </div>
      )}

      <div className={pageIs === "quote" ? "block" : "md:flex md:gap-6"}>
        <div
          className={`${
            pageIs === "quote"
              ? "w-full"
              : pageIs === "home"
              ? "md:w-[40rem]"
              : "md:min-w-[15rem]"
          } space-y-5`}
        >
          {/* Pickup Location */}
          <div className="relative transition-all duration-250">
            <div className="relative group">
              <PlacesAutocomplete
                value={pickupAddress}
                onChange={setPickupAddress}
                onSelect={handlePickupSelect}
                label="From Location"
                isPickup={true}
                className="border border-gray-200 rounded-lg shadow-input focus:shadow-input-focus bg-white/90"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary p-2 hover:bg-primary/10 rounded-full transition-all duration-250"
                aria-label="Use current location"
              ></button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center relative z-10">
            <button
              type="button"
              onClick={swapLocations}
              className="flex items-center justify-center w-10 h-10 bg-white hover:bg-[#C61859] hover:text-white rounded-full text-[#C61859] border border-gray-200 shadow-input transition-all duration-250 transform hover:scale-110 rotate-90"
              aria-label="Swap locations"
            >
              <FaExchangeAlt size={14} />
            </button>
          </div>

          {/* Dropoff Location */}
          <div className="relative transition-all duration-250">
            <PlacesAutocomplete
              value={dropoffAddress}
              onChange={setDropoffAddress}
              onSelect={handleDropoffSelect}
              label="To Location"
              isPickup={false}
              className="border border-gray-200 rounded-lg shadow-input focus:shadow-input-focus bg-white/90"
            />
          </div>
        </div>

        <div className="w-full h-[.2px] bg-gray-300 my-6 md:hidden"></div>

        {/* Date, Time & Passenger, Luggage Selectors */}
        <div
          className={`${
            pageIs === "home"
              ? "w-full flex flex-col md:flex-row items-center md:items-start gap-4 md:mt-0 "
              : pageIs === "booking"
              ? "flex flex-col gap-2 md:mt-0"
              : "space-y-5"
          }`}
        >
          <div className="h-12 w-full md:w-fit flex items-center  gap-2 md:mr-2 bg--600">
            <div className="max-w-fit rounded-full bg-gray-50 border border-gray-400">
              <p className="w-2 h-2 m-1 rounded-full bg-primary"></p>
            </div>
            <p className="text-sm font-semibold text-gray-800 text-nowrap">
              One Way
            </p>
          </div>
          {/* Date and Time Row */}
          <div
            className={`flex justify-between items-center md:items-start gap-4 ${
              pageIs === "home"
                ? "w-full mx-auto md:flex-row gap-1 md:gap-4"
                : "flex-col"
            } ${pageIs === "quote" && "mt-4"}`}
          >
            <div className="relative group inline-block flex items-center">
              <FaCalendarAlt
                className="inline-block mr-2 text-gray-400 text-primary"
                size={20}
              />
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={`w-[8rem] md:w-[10rem] px-2 md:px-4 py-3 rounded-lg border border-gray-200 shadow-input focus:shadow-input-focus focus:border-primary/40 bg-white/90`}
                required
              />
            </div>

            {/* Time Selectors */}
            <div
              className={` ${pageIs === "home" ? "md:w-1/2 inline-block" : ""}`}
            >
              <div className="relative group flex items-center">
                <FaClock className="inline-block mr-2 text-primary" size={20} />
                <select
                  value={pickupHour}
                  onChange={(e) => setPickupHour(e.target.value)}
                  className="px-1 md:px-2 py-3 rounded-lg border border-gray-200 shadow-input focus:shadow-input-focus focus:border-primary/40 bg-white/90"
                  required
                >
                  {Array.from({ length: 24 }, (_, i) =>
                    String(i).padStart(2, "0")
                  ).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
                <p className="px-2">:</p>
                <select
                  value={pickupMinute}
                  onChange={(e) => setPickupMinute(e.target.value)}
                  className="px-1 md:px-2 py-3 rounded-lg border border-gray-200 shadow-input focus:shadow-input-focus focus:border-primary/40 bg-white/90"
                  required
                >
                  {["00", "10", "20", "30", "40", "50"].map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="w-full h-[.2px] bg-gray-300 my-6 md:hidden"></div>

          {/* Passengers + Luggage - Mobile style only */}
          <div
            className={`w-full md:hidden ${
              pageIs === "home" ? "md:flex md:items-start md:gap-4" : ""
            }`}
          >
            <div
              className={`
      flex w-full justify-between items-center 
      bg-[#EDF2F7] 
      rounded-lg px-4 py-3 
    `}
            >
              {/* Passenger */}
              <div className="flex items-center gap-2">
                <FaUser className="text-primary" size={16} />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value))}
                  className="bg-[#EDF2F7] focus:outline-none text-sm font-semibold text-gray-800"
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                    <option
                      key={num}
                      value={num}
                      className="bg-[#EDF2F7] font-semibold text-gray-800"
                    >
                      {num} {num === 1 ? "Passenger" : "Passengers"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="border-l h-5 border-gray-300 mx-4 hidden md:block"></div>

              {/* Luggage */}
              <div className="flex items-center gap-2">
                <FaSuitcase className="text-primary" size={16} />
                <select
                  value={luggage}
                  onChange={(e) => setLuggage(parseInt(e.target.value))}
                  className="bg-[#EDF2F7] focus:outline-none text-sm font-semibold text-gray-800"
                >
                  <option
                    value="0"
                    className="bg-[#EDF2F7] font-semibold text-gray-800"
                  >
                    No Luggage
                  </option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <option
                      key={num}
                      value={num}
                      className="bg-[#EDF2F7] font-semibold text-gray-800"
                    >
                      {num} {num === 1 ? "item" : "items"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Passenger and Luggage Selectors */}
          <div
            className={`hidden md:grid gap-4 max-w-fit md:max-w-full grid-cols-2 md:grid-cols-1 ${
              pageIs === "home" ? "w-full place-items-center " : ""
            }`}
          >
            <div className="relative group flex justify-between md:gap-2 items-center">
              <label className="flex font-medium text-sm md:text-md mb-1 text-primary">
                <FaUser className="inline-block mr-2" size={14} />
                Passengers
              </label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="md:w-[7rem] px-2 md:px-4 py-2 md:py-3 rounded-lg md:border md:border-gray-200 shadow-input md:focus:shadow-input-focus md:focus:border-primary/40 bg-[#EDF2F7] md:bg-white/90"
              >
                {/* // className="w-[7rem] px-4 py-3 rounded-lg border border-gray-200 shadow-input focus:shadow-input-focus focus:border-primary/40 bg-white/90" */}
                {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative group flex md:gap-2 justify-between items-center mt-2">
              <label className="flex font-medium text-sm md:text-md mb-1 text-primary">
                <FaSuitcase className="inline-block mr-2" size={14} />
                Luggage
              </label>

              <select
                value={luggage}
                onChange={(e) => setLuggage(parseInt(e.target.value))}
                className={`${
                  pageIs === "home" ? "md:ml-4" : ""
                } px-2 md:px-4 py-2 md:py-3 rounded-lg md:border md:border-gray-200 shadow-input md:focus:shadow-input-focus md:focus:border-primary/40 bg-[#EDF2F7] md:bg-white/90`}
              >
                <option value="0">None</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "item" : "items"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center space-x-2 bg-[#C61859] text-white py-3 px-6 rounded-lg font-medium shadow-button
          hover:shadow-lg hover:bg-[#C61859]/90 focus:outline-none focus:ring-2 focus:ring-[#C61859]/30 transition-all duration-250 
          ${
            isSubmitting
              ? "opacity-70 cursor-not-allowed"
              : "transform active:scale-[0.98]"
          }`}
        >
          <span>{isSubmitting ? "Getting Quotes..." : "Get Quotes"}</span>
          {!isSubmitting && <FaArrowRight size={14} />}
        </button>
      </div>
    </form>
  );
}

BookingForm.propTypes = {
  onGetLocation: PropTypes.func.isRequired,
  pageIs: PropTypes.string.isRequired,
};

export default BookingForm;
