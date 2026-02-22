import { createContext, useContext, useEffect, useRef, useState } from "react";

const LocationContext = createContext(null);
const STORAGE_KEY = "qd_location";

const loadStoredLocation = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    return null;
  }
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationContext must be used within LocationProvider");
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => loadStoredLocation());
  const [isTracking, setIsTracking] = useState(false);
  const [permission, setPermission] = useState("prompt");
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!location) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    } catch (err) {
      // Ignore storage failures (quota, private mode, etc.)
    }
  }, [location]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const updateGpsCoords = (coords) => {
    setLocation((prev) => {
      const next = {
        ...(prev || {}),
        coords,
        source: "gps",
        updatedAt: Date.now(),
      };
      if (!next.label) {
        next.label = `Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`;
      }
      return next;
    });
  };

  const startTracking = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error("Geolocation is not supported by this browser.");
        setError(err.message);
        reject(err);
        return;
      }

      setError(null);
      const options = {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      };

      const handleWatchSuccess = (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        updateGpsCoords(coords);
        setIsTracking(true);
      };

      const handleWatchError = (err) => {
        if (err.code === 1) {
          setPermission("denied");
        }
        setError(err.message || "Unable to track your location.");
        setIsTracking(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };

      const handleInitialSuccess = (position) => {
        setPermission("granted");
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        updateGpsCoords(coords);
        setIsTracking(true);
        resolve(coords);

        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleWatchSuccess,
          handleWatchError,
          options,
        );
      };

      const handleInitialError = (err) => {
        setIsTracking(false);
        if (err.code === 1) {
          setPermission("denied");
        }
        setError(err.message || "Unable to retrieve your location.");
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        reject(err);
      };

      navigator.geolocation.getCurrentPosition(
        handleInitialSuccess,
        handleInitialError,
        options,
      );
    });
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const setManualLocation = (label, coords = null) => {
    stopTracking();
    setLocation({
      label,
      source: "manual",
      coords,
      updatedAt: Date.now(),
    });
  };

  const setGpsLocation = (coords, label) => {
    setLocation({
      label: label || `Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`,
      source: "gps",
      coords,
      updatedAt: Date.now(),
    });
  };

  const clearLocation = () => {
    stopTracking();
    setLocation(null);
  };

  const value = {
    location,
    isTracking,
    permission,
    error,
    startTracking,
    stopTracking,
    setManualLocation,
    setGpsLocation,
    updateGpsCoords,
    clearLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
