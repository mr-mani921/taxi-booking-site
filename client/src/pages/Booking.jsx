import { motion } from "framer-motion";
import { FaClock, FaShieldAlt, FaHeadset, FaStar } from "react-icons/fa";
import BookingForm from "../components/BookingForm";
import FeaturedRides from "../components/FeaturedRides";
import RideBenefits from "../components/RideBenefits";
import BookingTestimonials from "../components/BookingTestimonials";
import CTABanner from "../components/CTABanner";

function Booking() {
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        dispatch(
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        );
      });
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-dark/50" />
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
            <p className="text-lg text-lightGray mb-8">
              Experience premium taxi service with professional drivers and
              comfortable vehicles
            </p>
          </motion.div>

          {/* Booking Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex justify-center  rounded-2xl  p-6 md:p-8">
              <BookingForm onGetLocation={handleGetLocation} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ride Benefits Section */}
      <RideBenefits />

      {/* Featured Rides Section */}
      <FeaturedRides />

      {/* Testimonials Section */}
      <BookingTestimonials />

      {/* CTA Banner */}
      <CTABanner />
    </div>
  );
}

export default Booking;
