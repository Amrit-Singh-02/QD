import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useLocationContext } from "../../context/LocationContext";
import { locationService } from "../../services/locationService";
import { userService } from "../../services/userService";

const LocationModal = ({ open, onClose }) => {
  const { isAuthenticated } = useAuth();
  const {
    location,
    isTracking,
    permission,
    error,
    startTracking,
    stopTracking,
    setManualLocation,
    setGpsLocation,
    clearLocation,
  } = useLocationContext();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const coords = location?.coords;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSuggestions([]);
    setSearchError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setSearchError("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const results = await locationService.autoSuggest(trimmed);
        if (!cancelled) {
          setSuggestions(results);
        }
      } catch (err) {
        if (!cancelled) {
          setSuggestions([]);
          setSearchError(
            err.response?.data?.message ||
              err.message ||
              "Unable to search locations.",
          );
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const gpsStatus = useMemo(() => {
    if (gpsLoading) return "Requesting GPS permission...";
    if (isTracking && coords) return "Live GPS tracking is active.";
    if (permission === "denied") return "Location permission denied.";
    if (error) return error;
    return "Use GPS to detect your live location.";
  }, [gpsLoading, isTracking, coords, permission, error]);

  const handleDetectLocation = async () => {
    setGpsLoading(true);
    try {
      const detected = await startTracking();
      let label = "";
      try {
        const result = await locationService.reverseGeocode(
          detected.lat,
          detected.lng,
        );
        if (result?.serviceable === false) {
          clearLocation();
          toast.error(
            result.serviceabilityReason || "This area is not serviceable.",
          );
          return;
        }
        label = result?.fullAddress || "";
      } catch (err) {
        label = "";
      }
      setGpsLocation(detected, label || undefined);
      toast.success("Location updated");
    } catch (err) {
      if (err?.code === 1) {
        toast.error("Location permission denied. Please search your address.");
      } else {
        toast.error(err?.message || "Unable to detect location.");
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSelectSuggestion = async (item) => {
    if (item?.serviceable === false) {
      toast.error(item.serviceabilityReason || "This area is not serviceable.");
      return;
    }
    if (isAuthenticated && !item?.pincode) {
      toast.error("Pincode not available for this address.");
      return;
    }
    const label = item?.fullAddress || item?.addressLine1 || item?.name;
    if (!label) return;
    const nextCoords =
      Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude)
        ? { lat: item.latitude, lng: item.longitude }
        : null;
    setManualLocation(label, nextCoords);
    toast.success("Location updated");
    if (isAuthenticated && nextCoords) {
      try {
        await userService.addLocationAddress({
          fullAddress: item?.fullAddress || label,
          latitude: item?.latitude,
          longitude: item?.longitude,
          pincode: item?.pincode,
          addressLine1: item?.addressLine1,
          addressLine2: item?.addressLine2,
          city: item?.city,
          state: item?.state,
          postalCode: item?.pincode,
          country: item?.country,
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Unable to save address.");
      }
    }
    onClose();
  };

  const handleUseTyped = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setManualLocation(trimmed);
    toast.success("Location updated");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close location modal"
      />
      <div className="relative w-[92vw] max-w-2xl bg-white rounded-2xl shadow-2xl border border-blinkit-border animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blinkit-border">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blinkit-gray">Delivery Location</p>
            <h2 className="text-lg font-bold text-blinkit-dark">Detect My Location</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-blinkit-gray hover:text-blinkit-dark"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="border border-blinkit-border rounded-xl p-4 bg-blinkit-light-gray/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blinkit-dark">Use Live GPS</p>
                <p className="text-xs text-blinkit-gray mt-1">{gpsStatus}</p>
                {coords && (
                  <p className="text-[11px] text-blinkit-gray mt-2">
                    Lat {coords.lat.toFixed(5)}, Lng {coords.lng.toFixed(5)}
                    {coords.accuracy ? ` • Accuracy ${Math.round(coords.accuracy)}m` : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={gpsLoading}
                  className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors ${
                    gpsLoading ? "bg-gray-200 text-gray-500" : "bg-blinkit-green text-white hover:bg-blinkit-green-dark"
                  }`}
                >
                  {gpsLoading ? "Detecting..." : "Detect Location"}
                </button>
                {isTracking && (
                  <button
                    type="button"
                    onClick={stopTracking}
                    className="text-[11px] font-semibold text-blinkit-gray hover:text-blinkit-dark"
                  >
                    Stop Live Tracking
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border border-blinkit-border rounded-xl p-4">
            <p className="text-sm font-semibold text-blinkit-dark">Search Address Instead</p>
            <p className="text-xs text-blinkit-gray mt-1">
              If GPS is blocked, search for your address and select it below.
            </p>
            <div className="mt-3">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your locality, landmark, or address"
                className="w-full px-3 py-2.5 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
              />
            </div>
            {searchError && <p className="text-xs text-red-600 mt-2">{searchError}</p>}
            {searching && <p className="text-xs text-blinkit-gray mt-2">Searching...</p>}

            {!searching && suggestions.length > 0 && (
              <div className="mt-3 max-h-56 overflow-y-auto border border-blinkit-border rounded-lg">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    disabled={item.serviceable === false}
                    className={`w-full text-left px-3 py-2 border-b border-blinkit-border last:border-b-0 ${
                      item.serviceable === false
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-blinkit-light-gray"
                    }`}
                  >
                    <p className="text-sm font-semibold text-blinkit-dark">
                      {item.addressLine1 || item.fullAddress}
                    </p>
                    <p className="text-xs text-blinkit-gray">{item.fullAddress}</p>
                    {item.serviceable === false && (
                      <p className="text-[11px] text-red-600 mt-1">
                        {item.serviceabilityReason || "Not serviceable"}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!searching && suggestions.length === 0 && query.trim().length >= 3 && (
              <button
                type="button"
                onClick={handleUseTyped}
                className="mt-3 text-xs font-semibold text-blinkit-green hover:underline"
              >
                Use "{query.trim()}" as my delivery location
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-blinkit-border flex items-center justify-between">
          <div className="text-xs text-blinkit-gray">
            Current: {location?.label || "Not set"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-gray-100 text-blinkit-dark rounded-lg hover:bg-gray-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
