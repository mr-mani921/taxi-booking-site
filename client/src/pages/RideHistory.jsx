import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { fetchRides } from "../store/thunks";
import {
  FaCarSide,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaChevronRight,
  FaChevronDown,
  FaSearch,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import RideTracking from "../components/RideTracking";

const RideHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRide, setExpandedRide] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get rides from Redux
  const rides = useSelector((state) => state.booking.rides || []);
  const loading = useSelector((state) => state.api.loading.rides);
  const error = useSelector((state) => state.api.errors.rides);

  // Fetch ride history
  useEffect(() => {
    dispatch(fetchRides({ page: 1, limit }));
  }, [dispatch, limit]);

  // Function to load more rides
  const loadMoreRides = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const result = await dispatch(
        fetchRides({
          page: nextPage,
          limit,
          append: true, // Signal to append rather than replace rides
        })
      ).unwrap();

      // Check if there are more rides to load
      if (!result.pagination?.hasMore || result.rides?.length < limit) {
        setHasMore(false);
      }

      setPage(nextPage);
    } catch (err) {
      console.error("Error loading more rides:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "driver_assigned":
        return "bg-purple-100 text-purple-700";
      case "driver_arrived":
        return "bg-indigo-100 text-indigo-700";
      case "dispatched":
        return "bg-yellow-100 text-yellow-700";
      case "booked":
        return "bg-teal-100 text-teal-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Toggle expanded ride
  const toggleExpandRide = (rideId) => {
    if (expandedRide === rideId) {
      setExpandedRide(null);
    } else {
      setExpandedRide(rideId);
    }
  };

  // Filter rides by search term
  const filteredRides = searchTerm
    ? rides.filter((ride) => {
        const lowercaseSearch = searchTerm.toLowerCase();
        return (
          (ride.pickupLocation?.address &&
            ride.pickupLocation.address
              .toLowerCase()
              .includes(lowercaseSearch)) ||
          (ride.dropoffLocation?.address &&
            ride.dropoffLocation.address
              .toLowerCase()
              .includes(lowercaseSearch)) ||
          (ride.igoBookingId &&
            ride.igoBookingId.toLowerCase().includes(lowercaseSearch)) ||
          (ride.status && ride.status.toLowerCase().includes(lowercaseSearch))
        );
      })
    : rides;

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Rides</h1>
            <p className="text-gray-600">View and manage your ride history</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search rides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-12 pr-4 text-gray-700 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Rides List */}
          {loading && rides.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600">Loading your rides...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <FaTimes className="text-red-500 text-3xl mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Error Loading Rides
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => dispatch(fetchRides())}
                className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-md text-white font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredRides.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <FaCarSide className="text-gray-400 text-3xl mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No Rides Found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "No rides match your search criteria."
                  : "You haven't taken any rides yet."}
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-md text-white font-medium transition-colors"
              >
                Book a Ride
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRides.map((ride) => (
                <div
                  key={ride._id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                >
                  {/* Ride Card Header */}
                  <div
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    // onClick={() => toggleExpandRide(ride._id)}
                  >
                    <div className="flex items-start md:items-center mb-4 md:mb-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <FaCarSide className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-gray-800 font-medium">
                          {ride.pickupLocation?.address?.split(",")[0]} to{" "}
                          {ride.dropoffLocation?.address?.split(",")[0]}
                        </h3>
                        <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                          <span className="mr-4 flex items-center">
                            <FaCalendarAlt className="mr-1" />
                            {formatDate(ride.pickupTime)}
                          </span>
                          <span className="flex items-center">
                            <FaMapMarkerAlt className="mr-1" />
                            {formatTime(ride.pickupTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium mr-4 ${getStatusColor(
                          ride.status
                        )}`}
                      >
                        {ride.status}
                      </div>
                      <div className="text-gray-800 font-medium mr-4">
                        £{ride.fare?.toFixed(2) || "0.00"}
                      </div>
                      {/* <div className="text-gray-400">
                        {expandedRide === ride._id ? (
                          <FaChevronDown />
                        ) : (
                          <FaChevronRight />
                        )}
                      </div> */}
                    </div>
                  </div>

                  {/* Expanded Ride Detail
                  <AnimatePresence>
                    {expandedRide === ride._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-200 p-0">
                          <RideTracking
                            rideId={ride._id}
                            bookingReference={ride.igoBookingId}
                            authorizationReference={
                              ride.igoAuthorizationReference
                            }
                            isHistoryView={true}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence> */}
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && filteredRides.length > 0 && (
                <div className="text-center py-6">
                  <button
                    onClick={loadMoreRides}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 transition-colors flex items-center justify-center mx-auto"
                  >
                    {loadingMore ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load More Rides"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideHistory;
