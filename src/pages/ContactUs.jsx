import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";
import ContactForm from "../components/ContactForm";
import ContactMap from "../components/ContactMap";
import FAQ from "../components/FAQ";

function ContactUs() {
  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-dark/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-lightGray">
              Have questions? We'd love to hear from you. Send us a message and
              we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information & Form Section */}
      <section className="py-16 bg-charcoal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="glass-effect rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <FaMapMarkerAlt className="text-primary text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Visit Us
                      </h3>
                      <p className="text-lightGray">
                        123 Business Street
                        <br />
                        New York, NY 10001
                        <br />
                        United States
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <FaPhone className="text-primary text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Call Us</h3>
                      <p className="text-lightGray">+1 (555) 123-4567</p>
                      <p className="text-lightGray">Mon-Sun 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <FaEnvelope className="text-primary text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Email Us
                      </h3>
                      <p className="text-lightGray">support@taxigo.com</p>
                      <p className="text-lightGray">business@taxigo.com</p>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="mt-8">
                  <h3 className="text-white font-semibold mb-4">Follow Us</h3>
                  <div className="flex space-x-4">
                    <a
                      href="#"
                      className="text-lightGray hover:text-primary transition-colors"
                    >
                      <FaFacebook size={24} />
                    </a>
                    <a
                      href="#"
                      className="text-lightGray hover:text-primary transition-colors"
                    >
                      <FaTwitter size={24} />
                    </a>
                    <a
                      href="#"
                      className="text-lightGray hover:text-primary transition-colors"
                    >
                      <FaInstagram size={24} />
                    </a>
                    <a
                      href="#"
                      className="text-lightGray hover:text-primary transition-colors"
                    >
                      <FaLinkedin size={24} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Component */}
              <div className="glass-effect rounded-xl p-8">
                <ContactMap />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="glass-effect rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Send Us a Message
                </h2>
                <ContactForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-dark">
        <div className="container mx-auto px-4">
          <FAQ />
        </div>
      </section>
    </div>
  );
}

export default ContactUs;
