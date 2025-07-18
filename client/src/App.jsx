import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Loader from "./components/Loader";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AuthSuccess from "./pages/AuthSuccess";
import Booking from "./pages/Booking";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import FAQ from "./pages/FAQ";
import Services from "./pages/Services";
import Terms from "./pages/Terms";
import Privacy from "./pages/PrivacyPage";
import Quotes from "./pages/Quotes";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import RideDetails from "./pages/RideDetails";
import RideConfirmation from "./pages/RideConfirmation";
import RideHistory from "./pages/RideHistory";
import UserProfile from "./pages/UserProfile";
import RateRide from "./pages/RateRide";
import RatingSuccess from "./pages/RatingSuccess";
import EmailVerification from "./pages/EmailVerification";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setIsAuthenticated } from "./store/userSlice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/toast.css";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(setIsAuthenticated(true));
    }
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <Loader />
      <div className="min-h-screen bg-lightBg text-gray-800">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/services" element={<Services />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/ride/:rideId" element={<RideDetails />} />
          <Route path="/ride-confirmation" element={<RideConfirmation />} />
          <Route path="/ride-history" element={<RideHistory />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/rate-ride/:rideId" element={<RateRide />} />
          <Route path="/rating-success/:rideId" element={<RatingSuccess />} />
        </Routes>
      </div>
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="toast-container"
        toastClassName="toast"
        bodyClassName="toast-body"
        progressClassName="toast-progress"
      />
    </Router>
  );
}

export default App;
