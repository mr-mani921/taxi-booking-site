import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FaMapMarkerAlt, FaSpinner } from "react-icons/fa";

// Component for location autocomplete using Google Places API
const PlacesAutocomplete = ({
  value,
  onChange,
  onSelect,
  label,
  isPickup = false, // New prop to determine if this is pickup or destination
  country = "uk", // No country restriction by default
  readOnly = false, // Add readOnly prop
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps API script if not already loaded
    if (!window.google) {
      setLoading(true);
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }&libraries=places`;
      script.async = true;
      script.onload = () => {
        setIsGoogleLoaded(true);
        initAutocomplete();
      };
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        setLoading(false);
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else {
      setIsGoogleLoaded(true);
      initAutocomplete();
    }
  }, []);

  // Initialize autocomplete when component mounts or input ref changes
  useEffect(() => {
    if (isGoogleLoaded && inputRef.current && !autocompleteRef.current) {
      initAutocomplete();
    }

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        // Remove all listeners
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
        // Clear the autocomplete instance
        autocompleteRef.current = null;
      }
    };
  }, [isGoogleLoaded]);

  const initAutocomplete = () => {
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.places &&
      inputRef.current &&
      !autocompleteRef.current
    ) {
      try {
        // Set up the autocomplete
        const options = {
          fields: [
            "address_components",
            "geometry",
            "name",
            "formatted_address",
          ],
        };

        // Only add country restriction if a country is specified
        if (country) {
          options.componentRestrictions = { country };
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          options
        );

        // Add listener for place selection
        autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing autocomplete:", error);
        setLoading(false);
      }
    }
  };

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (place && place.geometry) {
      // Get the address and coordinates
      const address = place.formatted_address;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Update the input value with the formatted address
      onChange(address);

      // Call the onSelect callback with the place details
      onSelect({
        address,
        lat,
        lng,
      });
    }
    setShowSuggestions(false);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Show suggestions when typing
    if (inputValue && inputValue.length > 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Select a suggestion from the fallback list
  const selectSuggestion = (suggestion) => {
    onChange(suggestion.description);
    onSelect({
      address: suggestion.description,
      // Fake coordinates for fallback
      lat: 40.7128 + Math.random() * 0.1,
      lng: -74.006 + Math.random() * 0.1,
    });
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        {label && (
          <span className="absolute left-4 text-primary font-semibold text-sm z-10 pointer-events-none">
            {label}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value || ""}
          onChange={handleInputChange}
          placeholder={
            isPickup
              ? "Enter pickup, post code, venue or place"
              : "Enter destination, post code, venue or place"
          }
          onFocus={() => value && value.length > 2 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`w-full bg-white border border-gray-300 rounded-lg ${
            label === "From Location" ? "pl-[120px]" : "pl-[100px]"
          }  pr-10 py-2 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all`}
          readOnly={readOnly}
        />
        {loading ? (
          <FaSpinner className="absolute right-4 animate-spin text-blue-500 flex-shrink-0" />
        ) : (
          <FaMapMarkerAlt className="absolute right-4 text-blue-500 flex-shrink-0" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isGoogleLoaded ? (
            // Google Places API suggestions will be shown automatically
            <div className="px-4 py-2 text-gray-700 text-sm">
              Type to see suggestions...
            </div>
          ) : (
            // Fallback suggestions
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 text-sm truncate"
                onMouseDown={() => selectSuggestion(suggestion)}
              >
                {suggestion.description}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Add PropTypes validation
PlacesAutocomplete.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  label: PropTypes.string,
  isPickup: PropTypes.bool,
  country: PropTypes.string,
  readOnly: PropTypes.bool,
};

export default PlacesAutocomplete;
