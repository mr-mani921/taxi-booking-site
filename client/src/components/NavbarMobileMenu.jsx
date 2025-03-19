import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";

const NavbarMobileMenu = ({ isOpen, navLinks, setIsOpen }) => {
  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className=" fixed inset-0 z-50 md:hidden"
        >
          <div className="min-h-screen inset-0 bg-dark/95 backdrop-blur-md">
            <div onClick={() => {setIsOpen(!isOpen)}} className="w-full flex justify-end">
              <FaTimes size={24} />
            </div>
            <div className="flex flex-col p-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg py-3 text-lightGray hover:text-primary transition-colors ${
                    location.pathname === link.path ? "text-primary" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/booking"
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-primary text-dark px-4 py-2 rounded-lg font-medium text-center hover:scale-105 hover:shadow-glow transition-all"
              >
                Book Now
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default NavbarMobileMenu;
