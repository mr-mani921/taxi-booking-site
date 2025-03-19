import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRideType } from '../store/bookingSlice';
import { FaUsers, FaSuitcase, FaLeaf, FaCar, FaWifi, FaSnowflake } from 'react-icons/fa';

const vehicles = [
  {
    type: 'eco',
    name: 'Eco-Friendly',
    price: '1.0x',
    image: 'https://teara.govt.nz/files/p-20812-pc.jpg',
    description: 'Environmentally conscious travel with hybrid and electric vehicles',
    passengers: 4,
    luggage: 2,
    examples: ['Toyota Prius', 'Tesla Model 3'],
    features: ['Zero Emissions', 'Quiet Ride', 'Modern Tech'],
    icon: <FaLeaf className="text-green-500" />
  },
  {
    type: 'comfort',
    name: 'Comfort',
    price: '1.2x',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=300',
    description: 'Premium sedans for comfortable business or leisure travel',
    passengers: 4,
    luggage: 3,
    examples: ['BMW 5 Series', 'Mercedes E-Class'],
    features: ['Leather Seats', 'Extra Legroom', 'WiFi'],
    icon: <FaCar className="text-blue-500" />
  },
  {
    type: 'executive',
    name: 'Executive',
    price: '1.8x',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=300',
    description: 'Luxury vehicles for premium travel experience',
    passengers: 4,
    luggage: 3,
    examples: ['Mercedes S-Class', 'BMW 7 Series'],
    features: ['Premium Interior', 'Professional Driver', 'Refreshments'],
    icon: <FaWifi className="text-purple-500" />
  },
  {
    type: 'xl',
    name: 'XL / Minivan',
    price: '1.5x',
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=300',
    description: 'Spacious vehicles perfect for groups or extra luggage',
    passengers: 6,
    luggage: 4,
    examples: ['Mercedes V-Class', 'VW Multivan'],
    features: ['Extra Space', 'Family Friendly', 'Climate Control'],
    icon: <FaSnowflake className="text-cyan-500" />
  }
];

function FeaturedRides() {
  const dispatch = useDispatch();
  const selectedRideType = useSelector(state => state.booking.selectedRideType);

  return (
    <section className="py-20 bg-dark relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
        >
          Choose Your Perfect Ride
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`glass-effect rounded-xl overflow-hidden cursor-pointer group
                ${selectedRideType === vehicle.type ? 'border-2 border-primary' : 'border border-gray-700'}
              `}
              onClick={() => dispatch(setSelectedRideType(vehicle.type))}
            >
              {/* Image Container */}
              <div className="relative h-48">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 "
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
                
                {/* Price Badge */}
                <div className="absolute top-4 right-4 bg-primary text-dark px-3 py-1 rounded-full font-semibold">
                  {vehicle.price}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">
                    {vehicle.name}
                  </h3>
                  <div className="text-2xl">{vehicle.icon}</div>
                </div>

                {/* Description */}
                <p className="text-lightGray text-sm">{vehicle.description}</p>

                {/* Capacity Info */}
                <div className="flex items-center justify-between text-lightGray">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-primary" />
                    <span>{vehicle.passengers} seats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaSuitcase className="text-primary" />
                    <span>{vehicle.luggage} bags</span>
                  </div>
                </div>

                {/* Example Cars */}
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-sm text-lightGray mb-2">Available Models:</p>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.examples.map((car, i) => (
                      <span
                        key={i}
                        className="text-xs bg-charcoal text-white px-2 py-1 rounded-full"
                      >
                        {car}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature, i) => (
                    <span
                      key={i}
                      className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
}

export default FeaturedRides;