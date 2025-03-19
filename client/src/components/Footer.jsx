import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="bg-dark py-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">About Us</h3>
            <p className="text-lightGray">
              Premium taxi service providing safe and comfortable rides 24/7.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-lightGray hover:text-primary">Home</a></li>
              <li><a href="services" className="text-lightGray hover:text-primary">Services</a></li>
              <li><a href="about" className="text-lightGray hover:text-primary">About</a></li>
              <li><a href="contact" className="text-lightGray hover:text-primary">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Info</h3>
            <ul className="space-y-2 text-lightGray">
              <li>1234 Street Name</li>
              <li>City, Country</li>
              <li>Phone: (123) 456-7890</li>
              <li>Email: info@taxiservice.com</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-lightGray hover:text-primary hover-glow">
                <FaFacebook size={24} />
              </a>
              <a href="#" className="text-lightGray hover:text-primary hover-glow">
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-lightGray hover:text-primary hover-glow">
                <FaInstagram size={24} />
              </a>
              <a href="#" className="text-lightGray hover:text-primary hover-glow">
                <FaLinkedin size={24} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-lightGray">
          <p>&copy; 2024 Taxi Service. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;