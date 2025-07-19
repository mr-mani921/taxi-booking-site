import { motion } from "framer-motion";
import { FaUsers, FaSuitcase,  } from "react-icons/fa";
import { IoBagRemoveSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Import car type images
import saloonImg from "../assets/CarTypeSaloon.jpg";
import electricImg from "../assets/CarTypeElectric.jpg";
import estateImg from "../assets/CarTypeEstate.jpg";
import minivanImg from "../assets/CarTypeMinivan.jpg";
import executiveImg from "../assets/CarTypeExecutive.jpg";
import luxuryImg from "../assets/CarTypeLuxury.jpg";
import seaterImg from "../assets/CarType8-Seater.jpg";

const carTypes = [
  {
    image: saloonImg,
    name: "Saloon/Sedan",
    examples: "e.g. Toyota Prius, VW Passat",
    description: "For economy travel",
    passengers: 4,
    luggage: 2,
    carryOn: 2,
  },
  {
    image: electricImg,
    name: "Electric Vehicle (EV)",
    examples: "e.g. Tesla Model 3, Ioniq 5",
    description: "For greener travel",
    passengers: 4,
    luggage: 2,
    carryOn: 2,
  },
  {
    image: estateImg,
    name: "Estate",
    examples: "e.g. Vauxhall Zafira",
    description: "For more luggage space",
    passengers: 4,
    luggage: 3,
    carryOn: 3,
  },
  {
    image: minivanImg,
    name: "MPV/Minivan",
    examples: "e.g. VW Sharan, Ford Galaxy",
    description: "Ideal for families",
    passengers: 6,
    luggage: 4,
    carryOn: 4,
  },
  {
    image: executiveImg,
    name: "Executive",
    examples: "e.g. Merc E class, BMW 5",
    description: "For extra comfort",
    passengers: 4,
    luggage: 2,
    carryOn: 2,
  },
  {
    image: luxuryImg,
    name: "Luxury",
    examples: "e.g. Merc S class, BMW 7",
    description: "Travel in style",
    passengers: 4,
    luggage: 2,
    carryOn: 2,
  },
  {
    image: seaterImg,
    name: "8 passengers",
    examples: "e.g. Mercedes Viano",
    description: "For group Travel",
    passengers: 8,
    luggage: 4,
    carryOn: 4,
  },
  {
    image: seaterImg, // Using the same image for wheelchair accessible
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
            destination and we&apos;ll provide you with a list of quotes,
            allowing you to make your choice based on price, eco-friendliness or
            car type.
          </p>
        </motion.div>

        {/* Swiper Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
            }}
            className="car-type-swiper"
          >
            {carTypes.map((car, index) => (
              <SwiperSlide key={index}>
                <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 h-full">
                  {/* Car Image */}
                  <div className="h-48 overflow-hidden bg-gray-100 flex justify-center items-center">
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {car.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{car.examples}</p>
                    <p className="text-gray-600 mb-4">{car.description}</p>

                    {/* Passenger and Luggage Info */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <FaUsers className="text-gray-500" />
                        <span className="text-gray-700">{car.passengers}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <FaSuitcase className="text-gray-500" />
                        <span className="text-gray-700">{car.luggage}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <IoBagRemoveSharp className="text-gray-500 text-md" />
                        <span className="text-gray-700">{car.carryOn}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        <div className="mt-8 text-center">
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
