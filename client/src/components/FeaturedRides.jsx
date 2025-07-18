import { motion } from "framer-motion";
import {
  FaCar,
  FaLeaf,
  FaCogs,
  FaUsers,
  FaSuitcase,
  FaAccessibleIcon,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const carTypes = [
  {
    icon: <FaCar />,
    name: "Saloon/Sedan",
    examples: "e.g. Toyota Prius, VW Passat",
    description: "For economy travel",
    passengers: 4,
    luggage: 2,
    carryOn: 2,
  },
  {
    icon: <FaLeaf />,
    name: "Electric Vehicle (EV)",
    examples: "e.g. Tesla Model 3, Ioniq 5",
    description: "For greener travel",
    passengers: 4,
    luggage: 2,
    carryOn: 2,
  },
  {
    icon: <FaCogs />,
    name: "Estate",
    examples: "e.g. Vauxhall Zafira",
    description: "For more luggage space",
    passengers: 4,
    luggage: 3,
    carryOn: 3,
  },
  {
    icon: <FaUsers />,
    name: "MPV/Minivan",
    examples: "e.g. VW Sharan, Ford Galaxy",
    description: "Ideal for families",
    passengers: 6,
    luggage: 4,
    carryOn: 4,
  },
  {
    icon: <FaCar />,
    name: "Executive",
    examples: "e.g. Merc E class, BMW 5",
    description: "For extra comfort",
    passengers: 4,
    luggage: 2,
    carryOn: 2,
  },
  {
    icon: <FaCar />,
    name: "Luxury",
    examples: "e.g. Merc S class, BMW 7",
    description: "Travel in style",
    passengers: 4,
    luggage: 2,
    carryOn: 2,
  },
  {
    icon: <FaUsers />,
    name: "8 passengers",
    examples: "e.g. Mercedes Viano",
    description: "For group Travel",
    passengers: 8,
    luggage: 4,
    carryOn: 4,
  },
  {
    icon: <FaAccessibleIcon />,
    name: "Wheelchair accessible",
    examples: "e.g. Peugeot Premier",
    description: "For travelling by Wheelchair",
    passengers: 8,
    luggage: 4,
    carryOn: 4,
  },
];

function FeaturedRides() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Get a ride that fits your needs
          </h2>
          <p className="text-gray-600 mb-4">
            To book a taxi, simply enter your pickup location and chosen
            destination and we'll provide you with a list of quotes, allowing
            you to make your choice based on price, eco-friendliness or car
            type.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {carTypes.map((car, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl text-primary">{car.icon}</div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-gray-800">
                      {car.passengers}
                    </span>
                    <FaUsers className="text-gray-400" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  {car.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{car.examples}</p>
                <p className="text-gray-600 mb-4">{car.description}</p>

                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-1">
                    <FaSuitcase />
                    <span>{car.luggage}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaSuitcase className="text-xs" />
                    <span>{car.carryOn}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/booking"
            className="inline-block bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Book Your Ride Now
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedRides;
