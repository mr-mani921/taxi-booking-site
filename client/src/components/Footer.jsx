import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaPlane,
  FaTrain,
  FaTaxi,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Column */}
          <div>
            <h3 className="text-gray-800 font-semibold text-lg mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-600 hover:text-primary"
                >
                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  to="/booking"
                  className="text-gray-600 hover:text-primary"
                >
                  Book a Taxi
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-primary"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-primary">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-gray-800 font-semibold text-lg mb-4">
              Our Services
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/services"
                  className="text-gray-600 hover:text-primary"
                >
                  Airport Transfers
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-600 hover:text-primary"
                >
                  Corporate Travel
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-600 hover:text-primary"
                >
                  Event Transportation
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-600 hover:text-primary"
                >
                  City Tours
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-600 hover:text-primary"
                >
                  Intercity Travel
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-gray-800 font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-primary">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-gray-600 hover:text-primary"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/licenses"
                  className="text-gray-600 hover:text-primary"
                >
                  Licenses
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-gray-800 font-semibold text-lg mb-4">
              Contact Us
            </h3>
            <ul className="space-y-2">
              <li>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaEnvelope size={14} />
                  <span>info@zappytaxis.com</span>
                </div>
              </li>
              <li>
                <div className="flex items-start space-x-2 text-gray-600">
                  <FaMapMarkerAlt size={14} className="mt-1" />
                  <span>Locaton: Altofts Lane, Castleford, WF10 5PZ</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media and Logo Row */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link to="/" className="flex items-center">
                <FaTaxi className="text-primary text-2xl mr-2" />
                <span className="text-gray-800 font-bold text-xl">ZappyTaxi</span>
              </Link>
            </div>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500 text-sm">
            <p>
              © {new Date().getFullYear()} - ZappyTaxis.com. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
