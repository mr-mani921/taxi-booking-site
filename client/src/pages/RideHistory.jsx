import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchRides } from "../store/thunks";
import {
  FaCarSide,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaChevronRight,
  FaChevronDown,
  FaSearch,
} from "react-icons/fa";
import { IoFilterOutline } from "react-icons/io5";

const RideHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
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
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      case "in_progress":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "in_progress":
        return "In Progress";
      case "booked":
        return "Booked";
      case "assigned":
        return "Driver Assigned";
      default:
        return (
          status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1)
        );
    }
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Filter and sort rides
  const filteredRides = rides
    ?.filter((ride) => {
      // Filter by search term (match against pickup or dropoff locations)
      if (
        searchTerm &&
        !(
          ride.pickupLocation?.address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ride.dropoffLocation?.address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      ) {
        return false;
      }

      // Filter by status
      if (filters.status !== "all" && ride.status !== filters.status) {
        return false;
      }

      // Filter by time range
      if (filters.timeRange !== "all") {
        const rideDate = new Date(ride.createdAt || ride.scheduledAt);
        const now = new Date();

        switch (filters.timeRange) {
          case "today":
            return rideDate.toDateString() === now.toDateString();
          case "week": {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return rideDate >= weekAgo;
          }
          case "month": {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return rideDate >= monthAgo;
          }
          default:
            return true;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.scheduledAt);
      const dateB = new Date(b.createdAt || b.scheduledAt);

      switch (filters.sortBy) {
        case "date_asc":
          return dateA - dateB;
        case "date_desc":
          return dateB - dateA;
        case "price_asc":
          return (a.fare?.total || 0) - (b.fare?.total || 0);
        case "price_desc":
          return (b.fare?.total || 0) - (a.fare?.total || 0);
        default:
          return dateB - dateA;
      }
    });

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">
          Your Ride History
        </h1>

        <div className="w-full md:w-auto flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search rides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-dark-lighter text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center px-4 py-2 bg-dark-lighter text-white rounded-lg hover:bg-dark-lightest"
          >
            <IoFilterOutline className="mr-2" />
            <span>Filter</span>
            {filterOpen ? (
              <FaChevronDown className="ml-2" />
            ) : (
              <FaChevronRight className="ml-2" />
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {filterOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-dark-lighter rounded-lg p-4 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full bg-dark-lightest text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="in_progress">In Progress</option>
                <option value="booked">Booked</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-gray-300 mb-2">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) =>
                  handleFilterChange("timeRange", e.target.value)
                }
                className="w-full bg-dark-lightest text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {/* Sort By Filter */}
            <div>
              <label className="block text-gray-300 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full bg-dark-lightest text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="date_desc">Date (Newest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="price_desc">Price (Highest First)</option>
                <option value="price_asc">Price (Lowest First)</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ride List */}
      {filteredRides.length > 0 ? (
        <div className="space-y-4">
          {filteredRides.map((ride) => (
            <motion.div
              key={ride._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-dark-lighter rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/ride/${ride._id}`)}
            >
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div className="flex items-center mb-2 md:mb-0">
                    <FaCalendarAlt className="text-primary mr-2" />
                    <span className="text-white">
                      {formatDate(ride.createdAt || ride.scheduledAt)} •{" "}
                      {formatTime(ride.createdAt || ride.scheduledAt)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(
                        ride.status
                      )}`}
                    >
                      {getStatusText(ride.status)}
                    </span>

                    {ride.paymentStatus && (
                      <span className="ml-2 px-3 py-1 bg-dark-lightest rounded-full text-white text-sm">
                        {ride.prepaid ? "Pre-paid" : "Pay to driver"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {/* Locations */}
                  <div className="md:col-span-4 space-y-2">
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-gray-400 text-sm">From</p>
                        <p className="text-white">
                          {ride.pickupLocation?.address || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-gray-400 text-sm">To</p>
                        <p className="text-white">
                          {ride.dropoffLocation?.address || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle and Price */}
                  <div className="md:col-span-3 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center mb-2 md:mb-0">
                      <FaCarSide className="text-gray-400 mr-2" />
                      <span className="text-white">
                        {ride.vehicleType || "Standard"}
                      </span>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm">Total</p>
                      <p className="text-primary font-semibold text-lg">
                        ${ride.fare?.total || ride.price || "0.00"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ride Reference */}
                {ride.bookingReference && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <p className="text-gray-400 text-sm">
                      Booking Reference:{" "}
                      <span className="text-white font-mono">
                        {ride.bookingReference}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-dark-lightest px-6 py-3 flex justify-between items-center">
                <span className="text-white">View Details</span>
                <FaChevronRight className="text-gray-400" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-lighter rounded-lg p-8 text-center">
          <p className="text-white text-lg mb-4">No rides found.</p>
          <p className="text-gray-400 mb-6">
            You haven&apos;t taken any rides yet, or none match your filters.
          </p>
          <button
            onClick={() => navigate("/booking")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Book a Ride
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default RideHistory;
