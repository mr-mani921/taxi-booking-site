import { loadStripe } from "@stripe/stripe-js";

// Using the provided publishable key
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51R6t9eQNXMFgfcltPXGRM7q6xwjFAK9wW5TMzk6r8lmAj0wWySMjAeV5qUdW8OYWZUYtDmYeNSCoNvYr7QSEVZ820014SolVM4";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default stripePromise;
