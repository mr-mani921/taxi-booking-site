import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaTimes, FaChevronDown } from "react-icons/fa";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/thunks";

function NavbarMobileMenu({ isOpen, navLinks, setIsOpen }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { isAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const toggleDropdown = (label) => {
    if (activeDropdown === label) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(label);
    }
  };
  const handleLogout = () => {
    // Dispatch logout action
    dispatch(logoutUser());
    // Close the menu
    setIsOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="md:hidden bg-white border-t border-gray-200"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsOpen(false)}
            className="text-minicabit-darkGray hover:text-primary transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <nav className="flex flex-col space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="text-minicabit-darkGray hover:text-primary py-2 border-b border-gray-100"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              onClick={() => handleLogout()}
              className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-all text-center mt-4"
            >
              Logout
            </Link>
          ) : (
            <Link
              to="/auth"
              onClick={() => setIsOpen(false)}
              className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-all text-center mt-4"
            >
              Login / Sign Up
            </Link>
          )}
        </nav>
      </div>
    </motion.div>
  );
}

NavbarMobileMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  navLinks: PropTypes.array.isRequired,
  setIsOpen: PropTypes.func.isRequired,
};

export default NavbarMobileMenu;
