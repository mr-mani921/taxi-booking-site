import { motion } from 'framer-motion';
import { FaCheckCircle, FaUserFriends, FaCar, FaMapMarkerAlt, FaPlane, FaBuilding } from 'react-icons/fa';

function FeatureHighlights() {
  const stats = [
    {
      icon: <FaCheckCircle className="text-4xl text-primary" />,
      value: "10+",
      label: "Years in Business"
    },
    {
      icon: <FaUserFriends className="text-4xl text-primary" />,
      value: "2m+",
      label: "Passengers Served"
    },
    {
      icon: <FaCar className="text-4xl text-primary" />,
      value: "1,000+",
      label: "Cab Operators"
    },
    {
      icon: <FaMapMarkerAlt className="text-4xl text-primary" />,
      value: "550+",
      label: "UK Towns & Cities"
    },
    {
      icon: <FaBuilding className="text-4xl text-primary" />,
      value: "99%",
      label: "of UK Stations Covered"
    },
    {
      icon: <FaPlane className="text-4xl text-primary" />,
      value: "95%",
      label: "of Major UK Airports"
    }
  ];

  return (
    <section className="py-16  ">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4"
        >
          Zappy Taxis in numbers
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Trusted by millions of travellers across the UK, we connect you with reliable taxi services nationwide.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-all duration-300 shadow-sm border border-gray-200 "
            >
              <div className="mb-4 text-primary">
                {stat.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-600">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            href="/booking"
            className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Book a Taxi Now
          </motion.a>
        </div>
      </div>
    </section>
  );
}

export default FeatureHighlights;