import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FaCar, FaClock, FaExclamationCircle, FaMoneyBillWave, FaStar, FaUserTie } from 'react-icons/fa';
import { format } from 'date-fns';
import { setSelectedQuote } from '../store/quoteSlice';

// Mock data - replace with actual API integration
const mockQuotes = [
  {
    id: 1,
    driverName: "John Smith",
    rating: 4.8,
    price: 25.50,
    vehicleType: "Sedan",
    vehicleModel: "Toyota Camry",
    estimatedArrival: new Date(Date.now() + 10 * 60000),
    paymentPoints: ["TimeOfBooking", "Prepay"],
    driverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100"
  },
  {
    id: 2,
    driverName: "Sarah Johnson",
    rating: 4.9,
    price: 28.75,
    vehicleType: "SUV",
    vehicleModel: "Honda CR-V",
    estimatedArrival: new Date(Date.now() + 15 * 60000),
    paymentPoints: ["Postpay"],
    driverImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100"
  },
  {
    id: 3,
    driverName: "Michael Chen",
    rating: 4.7,
    price: 23.00,
    vehicleType: "Compact",
    vehicleModel: "Toyota Prius",
    estimatedArrival: new Date(Date.now() + 8 * 60000),
    paymentPoints: ["TimeOfBooking", "Prepay", "Postpay"],
    driverImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100"
  }
];

function Quotes() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userLocation } = useSelector(state => state.booking);
  const { quotes, loading, error } = useSelector(state => state.quote);



  const handleQuoteSelect = (quote) => {
    dispatch(setSelectedQuote(quote));
    if (quote.paymentPoints.includes('Prepay')) {
      navigate('/payment');
    } else {
      // Handle postpay booking confirmation
      console.log('Booking confirmed for postpay');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark pt-20 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Finding the best rides for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark pt-20 flex items-center justify-center">
        <div className="text-white text-center">
          <FaExclamationCircle className="text-4xl text-red-500 mb-4" />
          <p className="text-lg">Error loading quotes. Please try again.</p>
        </div>
      </div>
    );
  }

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
              Available Rides
            </h1>
            <p className="text-lg text-lightGray">
              Choose from our selection of trusted drivers
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quotes Section */}
      <section className="py-16 bg-charcoal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockQuotes.map((quote, index) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-effect rounded-xl overflow-hidden group hover:border-primary border border-gray-700 transition-all duration-300"
              >
                {/* Driver Info */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <img
                      src={quote.driverImage}
                      alt={quote.driverName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-white">{quote.driverName}</h3>
                      <div className="flex items-center gap-2 text-primary">
                        <FaStar />
                        <span>{quote.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ride Details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lightGray">
                      <FaCar className="text-primary" />
                      <span>{quote.vehicleType}</span>
                    </div>
                    <span className="text-white font-semibold">{quote.vehicleModel}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lightGray">
                      <FaClock className="text-primary" />
                      <span>Arrival</span>
                    </div>
                    <span className="text-white font-semibold">
                      {format(quote.estimatedArrival, 'HH:mm')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lightGray">
                      <FaMoneyBillWave className="text-primary" />
                      <span>Price</span>
                    </div>
                    <span className="text-white font-semibold">${quote.price.toFixed(2)}</span>
                  </div>

                  {/* Payment Options */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {quote.paymentPoints.map((point, i) => (
                      <span
                        key={i}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                      >
                        {point}
                      </span>
                    ))}
                  </div>

                  {/* Select Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuoteSelect(quote)}
                    className="w-full bg-primary text-dark font-semibold py-3 rounded-lg mt-6 hover:shadow-glow transition-all duration-300"
                  >
                    Select This Ride
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Quotes;