import { motion } from "framer-motion";
import Hero from "../components/Hero";
import FeatureHighlights from "../components/FeatureHighlights";
import FeaturedRides from "../components/FeaturedRides";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import RideBenefits from "../components/RideBenefits";
import HowItWorks from "../components/HowItWorks";
import RideOptions from "../components/RideOptions";
import LargeGroupOptions from "../components/LargeGroupOptions";

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section with Booking Form */}
      <Hero />
      
      <HowItWorks />

      {/* Stats Section */}
      <FeatureHighlights />

      {/* Ride Options Section - Added from minicabit */}
      <RideOptions />

      {/* Large Group Options Section - Added from minicabit */}
      <LargeGroupOptions />

      {/* Benefits Section */}
      <RideBenefits />

      {/* Car Types Section */}
      <FeaturedRides />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />
    </motion.div>
  );
};

export default Home;
