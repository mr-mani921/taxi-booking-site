import React from "react";
import Hero from "../components/Hero";
import FeatureHighlights from "../components/FeatureHighlights";
import FeaturedRides from "../components/FeaturedRides";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import { motion } from "framer-motion";
import RideBenefits from "../components/RideBenefits";

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section with Booking Form */}
      <Hero />

      {/* Stats Section */}
      <FeatureHighlights />

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
