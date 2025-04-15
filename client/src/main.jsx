import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Elements } from "@stripe/react-stripe-js";
import { store } from "./store/store";
import App from "./App.jsx";
import "./index.css";
import stripePromise from "./config/stripe";

// Configure Stripe Elements with proper accessibility settings
const elementsOptions = {
  fonts: [
    {
      cssSrc: "https://fonts.googleapis.com/css?family=Roboto",
    },
  ],
  locale: "auto",
  // Improve accessibility
  a11y: {
    locale: "auto",
    allowTabNavigation: true,
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>  
    <Provider store={store}>
      <Elements stripe={stripePromise} options={elementsOptions}>
        <App />
      </Elements>
    </Provider>
  </StrictMode>
);
