import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  FaStar,
  FaComment,
  FaThumbsUp,
  FaCarSide,
  FaUser,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { fetchRideById, rateRide } from "../store/thunks";

const RateRide = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [ride, setRide] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // Get loading and error states from Redux
  const loading = useSelector((state) => state.api.loading.rides);
  const error = useSelector((state) => state.api.errors.rides);

  const feedbackTags = [
    "Professional driver",
    "Clean vehicle",
    "Great conversation",
    "On-time pickup",
    "Safe driving",
    "Helpful with luggage",
    "Good route choice",
    "Comfortable ride",
    "Poor navigation",
    "Late pickup",
    "Unprofessional",
    "Dirty vehicle",
  ];

  // Fetch ride details
  useEffect(() => {
    dispatch(fetchRideById(rideId))
      .unwrap()
      .then((data) => {
        if (data.status !== "completed") {
          // Use Redux to set error
          // For now, we'll handle it locally
          setError("This ride is not yet completed and cannot be rated.");
        } else if (data.rated) {
          setError("You have already rated this ride.");
        } else {
          setRide(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching ride details:", err);
      });
  }, [dispatch, rideId]);

  // Manually set error since we're using Redux for API errors
  const [localError, setError] = useState(null);

  // Toggle feedback tags
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (overallRating === 0) {
      alert("Please provide an overall rating for your ride.");
      return;
    }

    setSubmitting(true);

    const ratingData = {
      overallRating,
      driverRating: driverRating || overallRating,
      vehicleRating: vehicleRating || overallRating,
      comment: commentText,
      feedbackTags: selectedTags,
    };

    dispatch(rateRide({ rideId, ratingData }))
      .unwrap()
      .then(() => {
        setSubmitting(false);
        // Navigate to thank you page
        navigate(`/rating-success/${rideId}`);
      })
      .catch((err) => {
        setSubmitting(false);
        console.error("Error submitting rating:", err);
        alert("Failed to submit your rating. Please try again.");
      });
  };

  // Render star rating component
  const StarRating = ({
    rating,
    setRating,
    size = "text-3xl",
    color = "text-yellow-400",
  }) => {
    const handleStarClick = (selectedRating) => {
      setRating(
        selectedRating === rating ? selectedRating - 1 : selectedRating
      );
    };

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            className={`${size} ${
              star <= rating ? color : "text-gray-500"
            } focus:outline-none transition-colors duration-200`}
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  if (loading && !ride) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || localError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-dark-lighter rounded-lg p-8 text-center">
          <div className="text-red-400 text-xl mb-4">{error || localError}</div>
          <button
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            onClick={() => navigate("/ride-history")}
          >
            View Ride History
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Rate Your Ride
        </h1>

        {ride && (
          <div className="bg-dark-lighter rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div>
                  <p className="text-gray-400 text-sm">Ride Date</p>
                  <p className="text-white">
                    {formatDate(ride.completedAt || ride.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Booking Reference</p>
                  <p className="text-white font-mono">
                    {ride.bookingReference || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start mb-4">
                <FaMapMarkerAlt className="text-green-500 mt-1 mr-2" />
                <div>
                  <p className="text-gray-400 text-sm">From</p>
                  <p className="text-white">
                    {ride.pickupLocation?.address || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FaMapMarkerAlt className="text-red-500 mt-1 mr-2" />
                <div>
                  <p className="text-gray-400 text-sm">To</p>
                  <p className="text-white">
                    {ride.dropoffLocation?.address || "N/A"}
                  </p>
                </div>
              </div>

              {ride.driver && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Driver</p>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <FaUser className="text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white">{ride.driver.name}</p>
                      <p className="text-gray-400 text-sm">
                        {ride.driver.carModel} • {ride.driver.licensePlate}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-dark-lighter rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Overall Rating */}
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold text-white mb-4">
                How was your ride?
              </h2>
              <StarRating rating={overallRating} setRating={setOverallRating} />
              <p className="text-gray-400 mt-2">
                {overallRating === 0 && "Tap a star to rate"}
                {overallRating === 1 && "Poor"}
                {overallRating === 2 && "Fair"}
                {overallRating === 3 && "Good"}
                {overallRating === 4 && "Very Good"}
                {overallRating === 5 && "Excellent"}
              </p>
            </div>

            {/* Driver Rating */}
            <div className="mb-8">
              <div className="flex items-center mb-3">
                <FaUser className="text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Driver</h3>
              </div>
              <StarRating
                rating={driverRating}
                setRating={setDriverRating}
                size="text-2xl"
              />
            </div>

            {/* Vehicle Rating */}
            <div className="mb-8">
              <div className="flex items-center mb-3">
                <FaCarSide className="text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Vehicle</h3>
              </div>
              <StarRating
                rating={vehicleRating}
                setRating={setVehicleRating}
                size="text-2xl"
              />
            </div>

            {/* Feedback Tags */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-white mb-3">
                <FaThumbsUp className="inline-block text-gray-400 mr-2" />
                What went well?
              </h3>
              <div className="flex flex-wrap gap-3">
                {feedbackTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-white"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-white mb-3">
                <FaComment className="inline-block text-gray-400 mr-2" />
                Additional Comments
              </h3>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your experience or suggestions..."
                className="w-full h-32 bg-dark-lightest text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting || overallRating === 0}
                className={`px-6 py-3 rounded-lg text-white font-semibold w-full sm:w-auto min-w-[200px] transition-colors ${
                  submitting || overallRating === 0
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-white rounded-full mr-2"></div>
                    Submitting...
                  </span>
                ) : (
                  "Submit Rating"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default RateRide;
