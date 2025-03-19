import React from "react";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import FeaturedRides from "../components/FeaturedRides";
import Testimonials from "../components/Testimonials";
import FeatureHighlights from "../components/FeatureHighlights";
import FAQ from "../components/FAQ";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Hero />
        <FeatureHighlights />
        <HowItWorks />
        <FeaturedRides />
        <Testimonials />
        <FAQ />
      </motion.div>
    </div>
  );
};

export default Home;
