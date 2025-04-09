import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import BookingForm from "../components/BookingForm";
import FeaturedRides from "../components/FeaturedRides";
import RideBenefits from "../components/RideBenefits";
import BookingTestimonials from "../components/BookingTestimonials";
import CTABanner from "../components/CTABanner";
import { resetBookingState, setUserLocation } from "../store/bookingSlice.js";
import { resetQuoteState } from "../store/quoteSlice.js";
import { getActiveRide } from "../store/thunks/bookingThunks";

function Booking() {
  const dispatch = useDispatch();
  const activeRide = useSelector((state) => state.booking.activeRide);
  const userLocation = useSelector((state) => state.booking.userLocation);

  useEffect(() => {
    // Reset states when component mounts
    dispatch(resetBookingState());
    dispatch(resetQuoteState());

    // Check for active ride
    dispatch(getActiveRide());

    // Get user's location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch(
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          );
        },
        (error) => {
          console.error("Error getting location:", error);
          // Set default location - New York City
          dispatch(
            setUserLocation({
              lat: 40.7128,
              lng: -74.006,
            })
          );
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      // Set default location - New York City
      dispatch(
        setUserLocation({
          lat: 40.7128,
          lng: -74.006,
        })
      );
    }
  }, [dispatch]);

  const handleGetLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            dispatch(setUserLocation(location));
            resolve(location);
          },
          (error) => {
            console.error("Error getting location:", error);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        const error = new Error(
          "Geolocation is not supported by this browser."
        );
        console.error(error);
        reject(error);
      }
    });
  };

  // If there's an active ride, redirect to the active ride page
  if (activeRide) {
    return <Navigate to="/active-ride" />;
  }

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-dark/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Book Your Ride
            </h1>
            <p className="text-lg text-lightGray">
              Fast, reliable transportation at your fingertips
            </p>
          </motion.div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <BookingForm onGetLocation={handleGetLocation} />
          </div>
        </div>
      </section>

      {/* Featured Rides */}
      <FeaturedRides />

      {/* Benefits Section */}
      <RideBenefits />

      {/* Testimonials */}
      <BookingTestimonials />

      {/* CTA Banner */}
      <CTABanner />
    </div>
  );
}

export default Booking;
