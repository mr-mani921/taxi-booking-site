import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { handleGoogleAuthSuccess } from "../store/thunks";
import { extractTokenFromUrl } from "../utils/authUtils";

/**
 * Component to handle OAuth redirect success
 * This component is rendered when OAuth provider redirects back to our app
 */
const AuthSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleRedirect = async () => {
      // Extract token from URL
      const token = extractTokenFromUrl();

      if (token) {
        try {
          // Process the token
          await dispatch(handleGoogleAuthSuccess(token)).unwrap();

          // Redirect to home page on success
          navigate("/");
        } catch (error) {
          console.error("Failed to process authentication:", error);
          navigate("/login", {
            state: {
              error: "Authentication failed. Please try again.",
            },  
          });
        }
      } else {
        // No token found, redirect to login
        navigate("/login", {
          state: {
            error: "Authentication failed. No token received.",
          },
        });
      }
    };

    handleRedirect();
  }, [dispatch, navigate]);

  // Display a simple loading message while processing
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark text-white">
      <div className="animate-pulse text-xl mb-4">
        Processing authentication...
      </div>
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default AuthSuccess;
