import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { setRideStatus } from "../store/bookingSlice";
import { useState } from "react";
import arrowLine from "../assets/dotted-arrow.png";
import TowWayArrows from "../assets/two-way-arrow.png";

function BookingForm({ onGetLocation }) {
  const dispatch = useDispatch();
  const userLocation = useSelector((state) => state.booking.userLocation);
  const [isOneWay, setIsOneWay] = useState(true);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(setRideStatus("pending"));
  };

  const toggleTripType = () => setIsOneWay(!isOneWay);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 glass-effect rounded-xl shadow-lg "
    >
      <div className="flex flex-col md:flex-row gap-10 justify-evenly">
        <div className="flex">
          <div className="flex min-h-full items-center">
            <img
              src={arrowLine}
              alt=""
              className="transform rotate-[135deg] w-10 h-10"
            />
          </div>

          {/* From Location */}
          <div className="flex flex-col gap-2">
            <div className="space-y-2 ">
              <label className="block text-white text-sm font-medium">
                From Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-dark/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter pickup location"
                  value={
                    userLocation
                      ? `${userLocation.lat.toFixed(
                          4
                        )}, ${userLocation.lng.toFixed(4)}`
                      : ""
                  }
                  readOnly
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={onGetLocation}
                  className="bg-primary text-dark font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-all"
                >
                  Get Location
                </motion.button>
              </div>
            </div>

            {/* To Location */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium">
                To Location
              </label>
              <input
                type="text"
                className="w-full bg-dark/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Enter your destination"
              />
            </div>
          </div>
          <div className="flex min-h-full items-center">
            <img
              src={TowWayArrows}
              alt=""
              className="transform w-7 h-7 mt-4"
            />
          </div>
        </div>
        <div>
          {/* Trip Type Toggle */}
          <div className="space-x-2 items-center">
            <div className="flex items-center gap-4">
              <span className="text-white">
                One-Way
              </span>
              <button
                type="button"
                onClick={toggleTripType}
                className={`relative w-12 h-6 rounded-full p-1 transition-all ${
                  isOneWay ? "bg-primary" : "bg-gray-600"
                }`}
              >
                <motion.div
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: isOneWay ? 0 : 24 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </button>
              <span className="text-white">
                Two-Way
              </span>
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
            />
          </div>
        </div>
        <div>
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
              >
                -
              </button>
              <span className="text-white">{passengers}</span>
              <button
                type="button"
                onClick={() => setPassengers((prev) => prev + 1)}
                className="p-2 bg-dark/50 border border-gray-600 rounded-lg text-white hover:bg-primary/50 transition-all"
              >
                +
              </button>
            </div>
          </div>

          {/* Luggage Count */}
          <div className="space-y-2">
            <label className="block text-white text-sm font-medium">
              Luggage
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setLuggage((prev) => Math.max(0, prev - 1))}
                className="p-2 bg-dark/50 border border-gray-600 rounded-lg text-white hover:bg-primary/50 transition-all"
              >
                -
              </button>
              <span className="text-white">{luggage}</span>
              <button
                type="button"
                onClick={() => setLuggage((prev) => prev + 1)}
                className="p-2 bg-dark/50 border border-gray-600 rounded-lg text-white hover:bg-primary/50 transition-all"
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
        className="w-full bg-primary text-dark font-semibold py-3 rounded-lg hover-glow"
      >
        Get a Quote
      </motion.button>
    </form>
  );
}

export default BookingForm;
