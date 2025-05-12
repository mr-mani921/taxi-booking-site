import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaSave,
  FaTimes,
  FaSignOutAlt,
  FaCreditCard,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  fetchUserProfile,
  updateUserProfile,
  logoutUser,
  fetchSavedPaymentMethods,
  deletePaymentMethod,
} from "../store/thunks";

const UserProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePicture: "",
  });

  // Get data from Redux store
  const profile = useSelector((state) => state.user.profile);
  const savedCards = useSelector((state) => state.user.paymentMethods || []);
  const loading = useSelector((state) => state.api.loading.user);
  const error = useSelector((state) => state.api.errors.user);

  // Fetch user profile and payment methods
  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchSavedPaymentMethods());
  }, [dispatch]);

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        profilePicture: profile.profilePicture || "",
      });
    }
  }, [profile]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();

    dispatch(updateUserProfile(formData))
      .unwrap()
      .then(() => {
        setIsEditing(false);
      })
      .catch((err) => {
        console.error("Error updating profile:", err);
      });
  };

  // Handle logout
  const handleLogout = async () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        navigate("/auth");
      })
      .catch((err) => {
        console.error("Error logging out:", err);
      });
  };

  // Handle removing saved card
  const handleRemoveCard = async (cardId) => {
    if (
      window.confirm("Are you sure you want to remove this payment method?")
    ) {
      dispatch(deletePaymentMethod(cardId))
        .unwrap()
        .then(() => {
          // Success notification could be shown here
        })
        .catch((err) => {
          console.error("Error removing payment method:", err);
          alert("Failed to remove payment method. Please try again.");
        });
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !profile) {
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

        <div className="bg-dark-lighter rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 bg-dark-lightest">
            <div className="flex items-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-gray-400 text-3xl" />
                  )}
                </div>
              </div>

              <div className="ml-6">
                <h2 className="text-2xl font-semibold text-white">
                  {profile?.name || "User"}
                </h2>
                <p className="text-gray-400">
                  {profile?.email || "No email provided"}
                </p>
              </div>

              <div className="ml-auto">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <FaEdit className="mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <FaTimes className="mr-2" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email Verification Status */}
          {profile && (
            <div className="px-6 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-400 mr-2" />
                  <span className="text-gray-300">Email Verification</span>
                </div>

                {profile.isEmailVerified ? (
                  <div className="flex items-center text-green-500">
                    <FaCheckCircle className="mr-1" />
                    <span>Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="flex items-center text-yellow-500 mr-3">
                      <FaExclamationCircle className="mr-1" />
                      <span>Not Verified</span>
                    </div>
                    <button
                      onClick={() => navigate("/email-verification")}
                      className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark transition-colors"
                    >
                      Verify Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Form */}
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3">
                        <FaUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-dark-lightest text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3">
                        <FaEnvelope className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-dark-lightest text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="phone">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3">
                        <FaPhone className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-dark-lightest text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+1 (123) 456-7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-gray-300 mb-2"
                      htmlFor="profilePicture"
                    >
                      Profile Picture URL
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="profilePicture"
                        name="profilePicture"
                        value={formData.profilePicture}
                        onChange={handleInputChange}
                        className="w-full bg-dark-lightest text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Enter a URL to your profile picture. Leave empty to use
                      default.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full mr-2"></div>
                          Saving...
                        </span>
                      ) : (
                        <>
                          <FaSave className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Account Information
                  </h3>
                  <div className="bg-dark-lightest rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Full Name</p>
                        <p className="text-white">
                          {profile?.name || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm">Email Address</p>
                        <p className="text-white">
                          {profile?.email || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm">Phone Number</p>
                        <p className="text-white">
                          {profile?.phone || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm">Member Since</p>
                        <p className="text-white">
                          {profile?.createdAt
                            ? new Date(profile.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saved Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Saved Payment Methods
                  </h3>

                  {savedCards.length > 0 ? (
                    <div className="space-y-3">
                      {savedCards.map((card) => (
                        <div
                          key={card.id}
                          className="bg-dark-lightest rounded-lg p-4 flex justify-between items-center"
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-16 bg-gray-700 rounded-md flex items-center justify-center mr-4">
                              <FaCreditCard className="text-xl text-white" />
                            </div>
                            <div>
                              <p className="text-white">
                                •••• •••• •••• {card.last4}
                              </p>
                              <p className="text-gray-400 text-sm">
                                Expires {card.expMonth}/{card.expYear}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCard(card.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-dark-lightest rounded-lg p-4 text-center">
                      <p className="text-gray-400">
                        You don&apos;t have any saved payment methods.
                      </p>
                      <p className="text-gray-300 mt-2">
                        Payment methods will be saved when you make a booking.
                      </p>
                    </div>
                  )}
                </div>

                {/* Account Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Account Actions
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate("/ride-history")}
                      className="px-4 py-2 bg-dark-lightest text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      View Ride History
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserProfile;
