import { useEffect, useState } from "react";
import GoogleMapReact from "google-map-react";
import { FaCar, FaMapMarkerAlt } from "react-icons/fa";
import { BiCurrentLocation } from "react-icons/bi";

const LocationMarker = ({ type, text }) => {
  const getMarkerStyle = () => {
    const baseStyle = {
      position: "absolute",
      transform: "translate(-50%, -50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    };

    switch (type) {
      case "pickup":
        return {
          ...baseStyle,
          color: "#10B981", // green-500
        };
      case "dropoff":
        return {
          ...baseStyle,
          color: "#EF4444", // red-500
        };
      case "driver":
        return {
          ...baseStyle,
          color: "#3B82F6", // blue-500
        };
      default:
        return baseStyle;
    }
  };

  const getIcon = () => {
    switch (type) {
      case "pickup":
        return <BiCurrentLocation className="text-2xl" />;
      case "dropoff":
        return <FaMapMarkerAlt className="text-2xl" />;
      case "driver":
        return <FaCar className="text-2xl" />;
      default:
        return null;
    }
  };

  return (
    <div style={getMarkerStyle()}>
      {getIcon()}
      {text && (
        <div className="text-xs mt-1 bg-white px-2 py-1 rounded shadow">
          {text}
        </div>
      )}
    </div>
  );
};

const RideMap = ({ pickupLocation, dropoffLocation, driverLocation }) => {
  const [center, setCenter] = useState({
    lat: pickupLocation?.latitude || 51.5074,
    lng: pickupLocation?.longitude || -0.1278,
  });

  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      // Calculate center point between pickup and dropoff
      const centerLat =
        (pickupLocation.latitude + dropoffLocation.latitude) / 2;
      const centerLng =
        (pickupLocation.longitude + dropoffLocation.longitude) / 2;
      setCenter({ lat: centerLat, lng: centerLng });

      // Calculate appropriate zoom level based on distance
      const R = 6371; // Earth's radius in km
      const dLat =
        ((dropoffLocation.latitude - pickupLocation.latitude) * Math.PI) / 180;
      const dLon =
        ((dropoffLocation.longitude - pickupLocation.longitude) * Math.PI) /
        180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((pickupLocation.latitude * Math.PI) / 180) *
          Math.cos((dropoffLocation.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Adjust zoom based on distance
      if (distance > 20) setZoom(10);
      else if (distance > 10) setZoom(11);
      else if (distance > 5) setZoom(12);
      else if (distance > 2) setZoom(13);
      else setZoom(14);
    }
  }, [pickupLocation, dropoffLocation]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <GoogleMapReact
        bootstrapURLKeys={{ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY }}
        center={center}
        zoom={zoom}
        options={{
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {pickupLocation && (
          <LocationMarker
            lat={pickupLocation.latitude}
            lng={pickupLocation.longitude}
            type="pickup"
            text="Pickup"
          />
        )}

        {dropoffLocation && (
          <LocationMarker
            lat={dropoffLocation.latitude}
            lng={dropoffLocation.longitude}
            type="dropoff"
            text="Dropoff"
          />
        )}

        {driverLocation && (
          <LocationMarker
            lat={driverLocation.latitude}
            lng={driverLocation.longitude}
            type="driver"
            text="Driver"
          />
        )}
      </GoogleMapReact>
    </div>
  );
};

export default RideMap;
