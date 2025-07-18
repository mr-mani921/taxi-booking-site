import { motion } from "framer-motion";

function Privacy() {
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
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              How we collect, use, and protect your personal information
            </p>
          </motion.div>
        </div>
      </section>

      {/* Privacy Content */}
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
                  1. Information We Collect
                </h2>
                <p className="text-gray-600 mb-4">
                  We collect the following types of information:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>
                    Personal identification information (name, email, phone
                    number)
                  </li>
                  <li>Location data for ride services</li>
                  <li>Payment information</li>
                  <li>Device and usage information</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  2. How We Use Your Information
                </h2>
                <p className="text-gray-600 mb-4">
                  Your information is used to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide and improve our services</li>
                  <li>Process payments</li>
                  <li>Communicate with you</li>
                  <li>Ensure safety and security</li>
                  <li>Comply with legal requirements</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  3. Data Security
                </h2>
                <p className="text-gray-600 mb-4">
                  We implement appropriate security measures to protect your
                  personal information from unauthorized access, alteration,
                  disclosure, or destruction. These measures include encryption,
                  secure servers, and regular security assessments.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  4. Data Sharing
                </h2>
                <p className="text-gray-600 mb-4">
                  We may share your information with:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Service providers and partners</li>
                  <li>Law enforcement when required</li>
                  <li>Other parties with your consent</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  5. Your Rights
                </h2>
                <p className="text-gray-600 mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Access your personal data</li>
                  <li>Request data correction</li>
                  <li>Request data deletion</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  6. Cookies and Tracking
                </h2>
                <p className="text-gray-600 mb-4">
                  We use cookies and similar tracking technologies to improve
                  user experience and analyze website traffic. You can control
                  cookie settings through your browser preferences.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  7. Updates to Privacy Policy
                </h2>
                <p className="text-gray-600 mb-4">
                  We may update this privacy policy periodically. Users will be
                  notified of significant changes, and continued use of our
                  services constitutes acceptance of the updated policy.
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
              Privacy Concerns?
            </h2>
            <p className="text-gray-600 mb-8">
              If you have any questions about our privacy practices, please
              contact our privacy team
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Contact Privacy Team
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Privacy;
