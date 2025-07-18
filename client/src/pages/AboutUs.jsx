import { motion } from "framer-motion";
import { FaUsers, FaTaxi, FaHandshake, FaGlobe } from "react-icons/fa";

const stats = [
  { icon: <FaUsers />, value: "50K+", label: "Happy Customers" },
  { icon: <FaTaxi />, value: "1000+", label: "Premium Vehicles" },
  { icon: <FaHandshake />, value: "2000+", label: "Expert Drivers" },
  { icon: <FaGlobe />, value: "20+", label: "Cities Covered" },
];

const teamMembers = [
  {
    name: "John Smith",
    role: "CEO & Founder",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300",
    bio: "20+ years of experience in transportation and technology",
  },
  {
    name: "Sarah Johnson",
    role: "Operations Director",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300",
    bio: "Expert in fleet management and customer service",
  },
  {
    name: "Michael Chen",
    role: "Technology Head",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300",
    bio: "Leading innovation in ride-hailing technology",
  },
];

function AboutUs() {
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
              About Zappy Taxis
            </h1>
            <p className="text-lg text-gray-600">
              Revolutionizing urban transportation with premium service and
              cutting-edge technology
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2020, Zappy Taxis emerged from a vision to transform
                  urban transportation. We saw an opportunity to combine premium
                  service with cutting-edge technology, creating a taxi service
                  that truly puts customers first.
                </p>
                <p>
                  Today, we're proud to serve thousands of customers daily,
                  providing safe, reliable, and comfortable rides across major
                  cities. Our commitment to excellence and innovation continues
                  to drive our growth and success.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80"
                alt="Taxi Service"
                className="rounded-xl shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-800/30 to-transparent rounded-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="text-primary text-3xl mb-4">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center text-gray-800 mb-12"
          >
            Meet Our Team
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl overflow-hidden group shadow-sm border border-gray-200"
              >
                <div className="relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-800/50 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Our Mission
              </h3>
              <p className="text-gray-600">
                To provide safe, reliable, and comfortable transportation
                services that exceed customer expectations while contributing to
                sustainable urban mobility.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Our Values
              </h3>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="text-primary">●</span>
                  Customer Safety First
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">●</span>
                  Professional Excellence
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">●</span>
                  Innovation & Technology
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">●</span>
                  Environmental Responsibility
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
