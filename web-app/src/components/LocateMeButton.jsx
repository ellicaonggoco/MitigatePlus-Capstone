import React, { useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";

const LocateMeButton = ({ onLocationFound }) => {
  const [locating, setLocating] = useState(false);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (typeof onLocationFound === "function") {
          onLocationFound(coords);
        }
        setLocating(false);
      },
      (error) => {
        alert("Could not fetch location. Please allow location access.");
        console.error(error);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocateMe}
      disabled={locating}
      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary-100 text-primary-700 font-medium hover:bg-primary-200 disabled:opacity-50"
    >
      <MapPinIcon className="w-5 h-5" />
      <span>{locating ? "Getting location..." : "Locate Me"}</span>
    </button>
  );
};

export default LocateMeButton;
