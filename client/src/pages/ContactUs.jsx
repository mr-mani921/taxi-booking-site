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
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white/80" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-600">
              Have questions? We'd love to hear from you. Send us a message and
              we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information & Form Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-xl p-8 shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <FaMapMarkerAlt className="text-primary text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-gray-800 font-semibold mb-1">
                        Visit Us
                      </h3>
                      <p className="text-gray-600">
                        Altofts Lane
                        <br />
                        Castleford
                        <br />
                        WF10 5PZ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <FaEnvelope className="text-primary text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-gray-800 font-semibold mb-1">
                        Email Us
                      </h3>
                      <p className="text-gray-600">Info@zappytaxis.com</p>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="mt-8">
                  <h3 className="text-gray-800 font-semibold mb-4">Follow Us</h3>
                  <div className="flex space-x-4">
                    <a
                      href="https://www.facebook.com/profile.php?id=61573706797388"
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-gray-500 hover:text-primary transition-colors"
                    >
                      <FaFacebook size={24} />
                    </a>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-primary transition-colors"
                    >
                      <FaTwitter size={24} />
                    </a>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-primary transition-colors"
                    >
                      <FaInstagram size={24} />
                    </a>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-primary transition-colors"
                    >
                      <FaLinkedin size={24} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Component */}
              <div className="bg-white rounded-xl p-8 shadow-md">
                <ContactMap />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-xl p-8 shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Send Us a Message
                </h2>
                <ContactForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <FAQ />
        </div>
      </section>
    </div>
  );
}

export default ContactUs;
