import { useState } from "react";
import { motion } from "framer-motion";

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus({
        type: "success",
        message: "Thank you for your message. We will get back to you soon!",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: "There was an error sending your message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-gray-700 text-sm font-medium mb-2"
        >
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-gray-700 text-sm font-medium mb-2"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-gray-700 text-sm font-medium mb-2"
        >
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-gray-700 text-sm font-medium mb-2"
        >
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={4}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="How can we help you?"
        />
      </div>

      {status.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            status.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status.message}
        </motion.div>
      )}

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full bg-primary text-white font-semibold py-3 rounded-lg transition-all duration-300 ${
          isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:shadow-md"
        }`}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </motion.button>
    </form>
  );
}

export default ContactForm;
