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
} from "react-icons/fa";
import { IoFilterOutline } from "react-icons/io5";
import RideTracking from "../components/RideTracking";

const RideHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedRide, setExpandedRide] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    timeRange: "all",
    sortBy: "date_desc",
  });

  // Get rides from Redux
  const rides = useSelector((state) => state.booking.rides || []);
  const loading = useSelector((state) => state.api.loading.rides);
  const error = useSelector((state) => state.api.errors.rides);

  // Fetch ride history
  useEffect(() => {
    dispatch(fetchRides());
  }, [dispatch]);

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
        return "bg-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400";
      case "driver_assigned":
        return "bg-purple-500/20 text-purple-400";
      case "driver_arrived":
        return "bg-indigo-500/20 text-indigo-400";
      case "dispatched":
        return "bg-yellow-500/20 text-yellow-400";
      case "booked":
        return "bg-teal-500/20 text-teal-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  // Get filtered rides
  const getFilteredRides = () => {
    if (!rides || !Array.isArray(rides)) return [];

    let filteredRides = [...rides];

    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filteredRides = filteredRides.filter(
        (ride) =>
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
    }

    // Apply status filter
    if (filters.status !== "all") {
      filteredRides = filteredRides.filter(
        (ride) =>
          ride.status &&
          ride.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Apply time filter
    if (filters.timeRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      if (filters.timeRange === "last_24h") {
        cutoffDate.setDate(now.getDate() - 1);
      } else if (filters.timeRange === "last_week") {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filters.timeRange === "last_month") {
        cutoffDate.setMonth(now.getMonth() - 1);
      }

      filteredRides = filteredRides.filter(
        (ride) => new Date(ride.createdAt) >= cutoffDate
      );
    }

    // Apply sorting
    if (filters.sortBy === "date_desc") {
      filteredRides.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else if (filters.sortBy === "date_asc") {
      filteredRides.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    } else if (filters.sortBy === "price_desc") {
      filteredRides.sort((a, b) => (b.fare || 0) - (a.fare || 0));
    } else if (filters.sortBy === "price_asc") {
      filteredRides.sort((a, b) => (a.fare || 0) - (b.fare || 0));
    }

    return filteredRides;
  };

  // Toggle expanded ride
  const toggleExpandRide = (rideId) => {
    if (expandedRide === rideId) {
      setExpandedRide(null);
    } else {
      setExpandedRide(rideId);
    }
  };

  const filteredRides = getFilteredRides();

  return (
    <div className="min-h-screen bg-dark pt-20 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Rides</h1>
            <p className="text-lightGray">View and manage your ride history</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search rides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-charcoal border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 rounded-lg py-3 px-5 text-white transition-colors"
            >
              <IoFilterOutline />
              <span>Filter</span>
              {filterOpen ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-charcoal rounded-lg p-6 border border-gray-700">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-lightGray mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) =>
                          setFilters({ ...filters, status: e.target.value })
                        }
                        className="w-full bg-dark border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary"
                      >
                        <option value="all">All Statuses</option>
                        <option value="booked">Booked</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="driver_assigned">Driver Assigned</option>
                        <option value="driver_arrived">Driver Arrived</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Time Range Filter */}
                    <div>
                      <label className="block text-lightGray mb-2">
                        Time Range
                      </label>
                      <select
                        value={filters.timeRange}
                        onChange={(e) =>
                          setFilters({ ...filters, timeRange: e.target.value })
                        }
                        className="w-full bg-dark border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary"
                      >
                        <option value="all">All Time</option>
                        <option value="last_24h">Last 24 Hours</option>
                        <option value="last_week">Last Week</option>
                        <option value="last_month">Last Month</option>
                      </select>
                    </div>

                    {/* Sort By Filter */}
                    <div>
                      <label className="block text-lightGray mb-2">
                        Sort By
                      </label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) =>
                          setFilters({ ...filters, sortBy: e.target.value })
                        }
                        className="w-full bg-dark border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary"
                      >
                        <option value="date_desc">Date (Newest First)</option>
                        <option value="date_asc">Date (Oldest First)</option>
                        <option value="price_desc">
                          Price (Highest First)
                        </option>
                        <option value="price_asc">Price (Lowest First)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rides List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-lightGray">Loading your rides...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 glass-effect rounded-xl p-8">
              <FaTimes className="text-red-500 text-3xl mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Error Loading Rides
              </h3>
              <p className="text-lightGray mb-6">{error}</p>
              <button
                onClick={() => dispatch(fetchRides())}
                className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-md text-white font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredRides.length === 0 ? (
            <div className="text-center py-12 glass-effect rounded-xl p-8">
              <FaCarSide className="text-gray-400 text-3xl mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Rides Found
              </h3>
              <p className="text-lightGray mb-6">
                {searchTerm || filters.status !== "all"
                  ? "No rides match your search or filter criteria."
                  : "You haven't taken any rides yet."}
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-md text-white font-medium transition-colors"
              >
                Book a Ride
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRides.map((ride) => (
                <div
                  key={ride._id}
                  className="bg-charcoal rounded-xl overflow-hidden border border-gray-700"
                >
                  {/* Ride Card Header */}
                  <div
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-800/40 transition-colors"
                    onClick={() => toggleExpandRide(ride._id)}
                  >
                    <div className="flex items-start md:items-center mb-4 md:mb-0">
                      <div className="w-10 h-10 bg-dark rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <FaCarSide className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">
                          {ride.pickupLocation?.address?.split(",")[0]} to{" "}
                          {ride.dropoffLocation?.address?.split(",")[0]}
                        </h3>
                        <div className="flex flex-wrap items-center text-sm text-lightGray mt-1">
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
                      <div className="text-white font-medium mr-4">
                        ${ride.fare?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-gray-400">
                        {expandedRide === ride._id ? (
                          <FaChevronDown />
                        ) : (
                          <FaChevronRight />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Ride Detail */}
                  <AnimatePresence>
                    {expandedRide === ride._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-700 p-0">
                          <RideTracking
                            rideId={ride._id}
                            bookingReference={ride.igoBookingId}
                            authorizationReference={
                              ride.igoAuthorizationReference
                            }
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideHistory;
