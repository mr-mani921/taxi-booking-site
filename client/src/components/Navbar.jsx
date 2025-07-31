import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTaxi,
  FaBars,
  FaTimes,
  FaUser,
  FaChevronDown,
  FaMapMarkerAlt,
  FaPhone,
  FaMobileAlt,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import NavbarMobileMenu from "./NavbarMobileMenu";
import { Dropdown } from "flowbite-react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/thunks";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About us" },
    { path: "/booking", label: "Book a Taxi" },
    { path: "/services", label: "Services" },
    { path: "/terms", label: "Terms" },
    { path: "/privacy", label: "Privacy" },
    { path: "/contact", label: "Contact us" },
  ];

  const userMenuItems = [
    { label: "My Rides", path: "/ride-history" },
    {
      label: "Logout",
      action: () => {
        dispatch(logoutUser());
      },
    },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-minicabit" : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 flex items-center hover:cursor-pointer"
          >
            <Link
              to="/"
              className="flex items-center space-x-2 transition-transform"
            >
              <FaTaxi className="text-primary text-2xl" />
              <span className="text-minicabit-darkBlue font-bold text-xl">
                ZappyTaxis
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-minicabit-darkGray hover:text-primary transition-colors relative group ${
                  location.pathname === link.path
                    ? "text-primary font-medium"
                    : ""
                }`}
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA and User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/booking"
              className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-all"
            >
              Book Now
            </Link>

            {/* User Menu */}
            {!isAuthenticated ? (
              <div className="relative">
                <Link
                  to={"/auth"}
                  className="flex items-center space-x-2 px-4 py-2 text-minicabit-darkBlue hover:text-primary transition-colors"
                >
                  Login/SignUp
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 text-minicabit-darkGray hover:text-primary transition-colors"
                >
                  <FaUser />
                  <FaChevronDown
                    className={`transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50"
                    >
                      {userMenuItems.map((item, index) => (
                        <div key={index}>
                          {item.path ? (
                            <Link
                              to={item.path}
                              className="block px-4 py-2 text-minicabit-darkGray hover:bg-gray-100 hover:text-primary transition-colors"
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <button
                              onClick={item.action}
                              className="w-full text-left px-4 py-2 text-minicabit-darkGray hover:bg-gray-100 hover:text-primary transition-colors"
                            >
                              {item.label}
                            </button>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-minicabit-darkGray hover:text-primary transition-colors"
          >
            <FaBars size={24} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <NavbarMobileMenu
            isOpen={isOpen}
            navLinks={navLinks}
            setIsOpen={setIsOpen}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;
