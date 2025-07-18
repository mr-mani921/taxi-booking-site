import { motion } from "framer-motion";

function Terms() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden bg-gray-50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-white/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg text-gray-600">
              Please read these terms carefully before using our services
            </p>
          </motion.div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="prose max-w-none"
            >
              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  By accessing and using TaxiGo's services, you agree to be
                  bound by these Terms and Conditions and all applicable laws
                  and regulations. If you do not agree with any of these terms,
                  you are prohibited from using or accessing our services.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  2. Service Description
                </h2>
                <p className="text-gray-600 mb-4">
                  TaxiGo provides a platform connecting passengers with
                  transportation services. We facilitate the booking process but
                  are not responsible for the actual transportation service
                  provided by independent contractors.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  3. User Responsibilities
                </h2>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide accurate information when booking rides</li>
                  <li>Maintain appropriate behavior during rides</li>
                  <li>Pay for services as agreed</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  4. Payment Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  Users agree to pay all fees and charges associated with their
                  use of our services. Payments are processed securely through
                  our platform using approved payment methods.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  5. Cancellation Policy
                </h2>
                <p className="text-gray-600 mb-4">
                  Cancellation fees may apply based on the timing of the
                  cancellation and other factors. Please refer to our
                  cancellation policy for specific details.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  6. Liability
                </h2>
                <p className="text-gray-600 mb-4">
                  TaxiGo is not liable for any direct, indirect, incidental,
                  special, or consequential damages resulting from the use or
                  inability to use our services.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  7. Changes to Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  We reserve the right to modify these terms at any time. Users
                  will be notified of significant changes and continued use of
                  our services constitutes acceptance of the modified terms.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Questions About Our Terms?
            </h2>
            <p className="text-gray-600 mb-8">
              Contact our support team for clarification on any of our terms and
              conditions
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Contact Support
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Terms;
