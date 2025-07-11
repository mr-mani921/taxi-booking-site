import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchRideById, cancelRide } from "../store/thunks";
import {
  FaCar,
  FaPhoneAlt,
  FaUserAlt,
  FaStar,
  FaRegClock,
  FaMoneyBillWave,
} from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import { BiCurrentLocation } from "react-icons/bi";
import io from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { showSuccess, showError, showInfo } from "../utils/toast";
import RideMap from "../components/RideMap";
import PaymentModal from "../components/PaymentModal";

const RideDetails = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [ride, setRide] = useState(null);
  const [eta, setEta] = useState("--");
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideStatus, setCurrentRideStatus] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Get loading and error states from Redux
  const loading = useSelector((state) => state.api.loading.rides);
  const error = useSelector((state) => state.api.errors.rides);

  // Socket for real-time updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("joinRideRoom", rideId);
    });

    socket.on("rideUpdate", (updatedRide) => {
      setRide((prevRide) => ({
        ...prevRide,
        ...updatedRide,
      }));
      setCurrentRideStatus(updatedRide.status);

      // Show appropriate notifications based on status
      switch (updatedRide.status) {
        case "DISPATCHED":
          showInfo("Your ride has been dispatched");
          break;
        case "VEHICLE_ARRIVED":
          showSuccess("Your vehicle has arrived!");
          break;
        case "PASSENGER_ON_BOARD":
          showInfo("You are now on board");
          break;
        case "COMPLETED":
          showSuccess("Your journey has been completed");
          break;
        case "CANCELLED":
          showError(`Ride cancelled: ${updatedRide.cancellationReason}`);
          break;
      }

      if (updatedRide.estimatedArrivalTime) {
        const etaDate = new Date(updatedRide.estimatedArrivalTime);
        setEta(formatDistanceToNow(etaDate, { addSuffix: true }));
      }
    });

    socket.on("driverLocationUpdate", (location) => {
      setDriverLocation(location);
    });

    socket.on("paymentUpdate", (paymentData) => {
      if (paymentData.required) {
        setPaymentAmount(paymentData.amount);
        setShowPaymentModal(true);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.emit("leaveRideRoom", rideId);
      socket.disconnect();
    };
  }, [rideId]);

  // Fetch initial ride details
  useEffect(() => {
    const loadRideDetails = async () => {
      try {
        const result = await dispatch(fetchRideById(rideId)).unwrap();
        setRide(result);
        setCurrentRideStatus(result.status);

        if (result.estimatedArrivalTime) {
          const etaDate = new Date(result.estimatedArrivalTime);
          setEta(formatDistanceToNow(etaDate, { addSuffix: true }));
        }

        if (result.driverLocation) {
          setDriverLocation(result.driverLocation);
        }
      } catch (error) {
        console.error("Error fetching ride details:", error);
        showError("Failed to load ride details");
      }
    };

    loadRideDetails();
  }, [dispatch, rideId]);

  const handleCancelRide = async () => {
    try {
      await dispatch(cancelRide(rideId)).unwrap();
      showSuccess("Ride cancelled successfully");
    } catch (error) {
      console.error("Error cancelling ride:", error);
      showError("Failed to cancel ride");
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    showSuccess("Payment processed successfully");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!ride) {
    return <div>No ride found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h1 className="text-2xl font-bold mb-6">Ride Details</h1>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold
            ${
              rideStatus === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : rideStatus === "PASSENGER_ON_BOARD"
                ? "bg-blue-100 text-blue-800"
                : rideStatus === "VEHICLE_ARRIVED"
                ? "bg-purple-100 text-purple-800"
                : rideStatus === "CANCELLED"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {rideStatus}
          </span>
        </div>

        {/* Locations */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <BiCurrentLocation className="text-green-500 mr-2" />
            <span>{ride.pickupLocation?.address}</span>
          </div>
          <div className="flex items-center">
            <MdOutlineLocationOn className="text-red-500 mr-2" />
            <span>{ride.dropoffLocation?.address}</span>
          </div>
        </div>

        {/* Driver Details */}
        {ride.driverDetails && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Driver Details</h2>
            <div className="flex items-center mb-2">
              <FaUserAlt className="mr-2" />
              <span>{ride.driverDetails.name}</span>
            </div>
            <div className="flex items-center mb-2">
              <FaPhoneAlt className="mr-2" />
              <span>{ride.driverDetails.phone}</span>
            </div>
            <div className="flex items-center mb-2">
              <FaCar className="mr-2" />
              <span>{ride.driverDetails.vehicleDetails}</span>
            </div>
            {ride.driverDetails.rating && (
              <div className="flex items-center">
                <FaStar className="text-yellow-400 mr-2" />
                <span>{ride.driverDetails.rating}</span>
              </div>
            )}
          </div>
        )}

        {/* ETA */}
        {eta !== "--" && (
          <div className="mb-6">
            <div className="flex items-center">
              <FaRegClock className="mr-2" />
              <span>Estimated arrival: {eta}</span>
            </div>
          </div>
        )}

        {/* Map */}
        {driverLocation && (
          <div className="mb-6 h-64">
            <RideMap
              pickupLocation={ride.pickupLocation}
              dropoffLocation={ride.dropoffLocation}
              driverLocation={driverLocation}
            />
          </div>
        )}

        {/* Fare Details */}
        {ride.finalFare && (
          <div className="mb-6">
            <div className="flex items-center">
              <FaMoneyBillWave className="mr-2" />
              <span>Final Fare: £{ride.finalFare.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          {rideStatus === "PENDING" && (
            <button
              onClick={handleCancelRide}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel Ride
            </button>
          )}
          <button
            onClick={() => navigate("/rides")}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Rides
          </button>
        </div>
      </motion.div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          show={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={paymentAmount}
          onPaymentComplete={handlePaymentComplete}
          rideId={rideId}
        />
      )}
    </div>
  );
};

export default RideDetails;
