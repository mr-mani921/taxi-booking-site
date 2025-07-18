import { motion } from "framer-motion";

function ContactMap() {
  return (
    <div className="relative h-64 rounded-lg overflow-hidden border border-gray-200">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2364.046247047604!2d-1.3347032234367566!3d53.71957437034165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48796f659f75c101%3A0x5d47140cdae97577!2sAltofts%20Ln%2C%20Castleford%20WF10%205PZ%2C%20UK!5e0!3m2!1sen!2sus!4v1719617198763!5m2!1sen!2sus"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0"
      />
    </div>
  );
}

export default ContactMap;
