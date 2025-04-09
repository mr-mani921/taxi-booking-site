import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { setRideStatus } from "../store/bookingSlice";
import { fetchRideById, cancelRide } from "../store/thunks";
import {
  FaCar,
  FaPhoneAlt,
  FaUserAlt,
  FaStar,
  FaRegClock,
} from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import { BiCurrentLocation } from "react-icons/bi";
import io from "socket.io-client";

const RideDetails = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [ride, setRide] = useState(null);
  const [eta, setEta] = useState("--");
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideStatus, setCurrentRideStatus] = useState("");

  // Get loading and error states from Redux
  const loading = useSelector((state) => state.api.loading.rides);
  const error = useSelector((state) => state.api.errors.rides);

  // Socket for real-time updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("joinRideRoom", rideId);
    });

    socket.on("rideUpdate", (updatedRide) => {
      console.log("Ride update received:", updatedRide);
      setRide(updatedRide);
      setCurrentRideStatus(updatedRide.status);

      if (updatedRide.estimatedTimeOfArrival) {
        setEta(updatedRide.estimatedTimeOfArrival);
      }

      if (updatedRide.driverLocation) {
        setDriverLocation(updatedRide.driverLocation);
      }
    });

    socket.on("driverLocationUpdate", (location) => {
      setDriverLocation(location);
    });

    return () => {
      socket.emit("leaveRideRoom", rideId);
      socket.disconnect();
    };
  }, [rideId]);

  // Fetch ride details
  useEffect(() => {
    dispatch(fetchRideById(rideId))
      .unwrap()
      .then((data) => {
        setRide(data);
        setCurrentRideStatus(data.status);

        if (data.estimatedTimeOfArrival) {
          setEta(data.estimatedTimeOfArrival);
        }

        if (data.driverLocation) {
          setDriverLocation(data.driverLocation);
        }
      })
      .catch((err) => {
        console.error("Error fetching ride details:", err);
      });
  }, [dispatch, rideId]);

  // Handle cancelling ride
  const handleCancelRide = async () => {
    if (window.confirm("Are you sure you want to cancel this ride?")) {
      dispatch(cancelRide(rideId))
        .unwrap()
        .then(() => {
          dispatch(setRideStatus("cancelled"));
          navigate("/");
        })
        .catch((err) => {
          console.error("Error cancelling ride:", err);
        });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "booked":
        return "Booked";
      case "assigned":
        return "Driver Assigned";
      case "driver_arrived":
        return "Driver Arrived";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown Status";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            onClick={() => navigate("/")}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md">
          <p>No ride details found.</p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            onClick={() => navigate("/")}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="bg-dark-lighter rounded-lg shadow-xl overflow-hidden">
        {/* Status Header */}
        <div className="p-6 pb-2">
          <h1 className="text-3xl font-bold text-white">Ride Details</h1>
          <div className="mt-2 flex items-center">
            <div
              className={`h-3 w-3 rounded-full ${getStatusColor(
                rideStatus
              )} mr-2`}
            ></div>
            <span className="text-white text-lg">
              {getStatusText(rideStatus)}
            </span>
          </div>
        </div>

        {/* Map Placeholder - In a real app, this would be a map component showing driver/user location */}
        <div className="bg-gray-700 h-64 relative mx-6 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex justify-center items-center">
            <span className="text-white">Map View (Location Tracking)</span>
          </div>
          {driverLocation && (
            <div className="absolute bottom-4 left-4 bg-dark-lighter p-2 rounded-md text-white text-xs">
              <p>Driver is nearby</p>
            </div>
          )}
        </div>

        {/* Driver Details */}
        {ride.driver && (
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Driver Details
            </h2>
            <div className="flex items-center">
              <div className="bg-gray-700 h-16 w-16 rounded-full flex items-center justify-center">
                <FaUserAlt className="text-gray-400 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">
                  {ride.driver.name}
                </h3>
                <div className="flex items-center mt-1">
                  <FaStar className="text-yellow-400 mr-1" />
                  <span className="text-white">
                    {ride.driver.rating || "4.8"}
                  </span>
                </div>
              </div>
              <div className="ml-auto">
                <a
                  href={`tel:${ride.driver.phone}`}
                  className="flex items-center justify-center h-12 w-12 rounded-full bg-primary hover:bg-primary-dark transition-colors"
                >
                  <FaPhoneAlt className="text-white" />
                </a>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center mb-2">
                <FaCar className="text-gray-400 mr-2" />
                <span className="text-white">
                  {ride.driver.carModel || "Toyota Camry"} -{" "}
                  {ride.driver.carColor || "Silver"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="bg-gray-700 px-3 py-1 rounded-full text-white text-sm">
                  {ride.driver.licensePlate || "ABC 123"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Ride Details */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Ride Information
          </h2>

          {/* Pickup & Destination */}
          <div className="mb-6">
            <div className="flex items-start mb-4">
              <div className="mt-1">
                <BiCurrentLocation className="text-green-500 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Pickup</p>
                <p className="text-white">
                  {ride.pickupLocation?.address || "Loading address..."}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="mt-1">
                <MdOutlineLocationOn className="text-red-500 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Destination</p>
                <p className="text-white">
                  {ride.dropoffLocation?.address || "Loading address..."}
                </p>
              </div>
            </div>
          </div>

          {/* Time & Price Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-lightest p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaRegClock className="text-gray-400 mr-2" />
                <p className="text-gray-400 text-sm">ETA</p>
              </div>
              <p className="text-white text-lg font-semibold">{eta || "--"}</p>
            </div>

            <div className="bg-dark-lightest p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Fare</p>
              <p className="text-white text-lg font-semibold">
                ${ride.fare?.total || "--"}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {["booked", "assigned", "driver_arrived"].includes(rideStatus) && (
            <button
              onClick={handleCancelRide}
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Ride
            </button>
          )}

          {rideStatus === "completed" && (
            <button
              onClick={() => navigate("/rate-ride/" + rideId)}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Rate Your Ride
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RideDetails;
