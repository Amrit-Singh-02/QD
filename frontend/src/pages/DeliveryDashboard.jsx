import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { createSocket } from "../services/socket";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { deliveryService } from "../services/deliveryService";
import DeliveryOrderActions from "../component/Delivery/DeliveryOrderActions";
import DeliveryNavbar from "../component/Layout/DeliveryNavbar";
import { useAuth } from "../context/AuthContext";
import { locationService } from "../services/locationService";

const AGENT_LOCATION_KEY = "qd_agent_location";
const AGENT_CHAT_PREFIX = "qd_agent_chat_";

const loadStoredAgentLocation = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AGENT_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Number.isFinite(parsed.latitude) ||
      !Number.isFinite(parsed.longitude)
    ) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

const loadAgentChat = (orderId) => {
  if (!orderId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${AGENT_CHAT_PREFIX}${orderId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const getInitials = (name) => {
  if (!name) return "DA";
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatDuration = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return "N/A";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.round((mins / 60) * 10) / 10;
  return `${hours} hr`;
};

const DeliveryDashboard = () => {
  const { logout } = useAuth();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [incomingAt, setIncomingAt] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const activeOrderRef = useRef(null);
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastEmitRef = useRef(0);
  const geoErrorShownRef = useRef(false);
  const [gpsStatus, setGpsStatus] = useState("Idle");
  const [gpsError, setGpsError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [lastLocation, setLastLocation] = useState(() =>
    loadStoredAgentLocation(),
  );
  const [agentLocationLabel, setAgentLocationLabel] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationLabel, setUserLocationLabel] = useState("");
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const lastAgentGeoRef = useRef({ key: "", at: 0 });
  const lastUserGeoRef = useRef({ key: "", at: 0 });

  const fetchHistory = async (agentOverride) => {
    const hasAgent = agentOverride || agent;
    if (!hasAgent) return;
    setHistoryLoading(true);
    try {
      const historyResponse = await deliveryService.getOrderHistory();
      setOrderHistory(historyResponse?.payload || []);
    } catch (error) {
      toast.error("Failed to fetch delivery history.");
      setOrderHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const response = await deliveryService.current();
        const agentPayload = response?.payload || null;
        setAgent(agentPayload);
        const coords = agentPayload?.currentLocation?.coordinates;
        if (
          Array.isArray(coords) &&
          coords.length === 2 &&
          Number.isFinite(coords[0]) &&
          Number.isFinite(coords[1])
        ) {
          setLastLocation((prev) => ({
            ...prev,
            latitude: coords[1],
            longitude: coords[0],
            updatedAt: Date.now(),
          }));
        }
        const activeResponse = await deliveryService.getActiveOrder();
        setActiveOrder(activeResponse?.payload || null);
        await fetchHistory(agentPayload);
      } catch (error) {
        setAgent(null);
        setActiveOrder(null);
        setOrderHistory([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!agent) return;

    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      const agentId = agent?.id || agent?._id;
      if (agentId) socket.emit("agentOnline", agentId);
    });

    socket.on("newOrder", (payload) => {
      if (activeOrderRef.current) return;
      const order = payload?.order || payload;
      if (!order) return;
      setIncomingOrder(order);
      setIncomingAt(Date.now());
    });

    const handleOrderCancelled = (payload) => {
      const cancelledId = payload?.orderId;
      const activeId =
        activeOrderRef.current?.id || activeOrderRef.current?._id;
      if (activeId && cancelledId && String(activeId) !== String(cancelledId)) {
        return;
      }
      if (cancelledId) {
        socketRef.current?.emit("routeUpdate", {
          orderId: cancelledId,
          route: null,
        });
      }
      setActiveOrder(null);
      setIncomingOrder(null);
      setIncomingAt(null);
      setUserLocation(null);
      setRouteCoords(null);
      toast.error("Order was cancelled by the customer.");
      fetchHistory();
    };

    socket.on("orderCancelled", handleOrderCancelled);

    const handleUserLocationUpdate = (payload) => {
      const { orderId, latitude, longitude } = payload || {};
      const activeId =
        activeOrderRef.current?.id || activeOrderRef.current?._id;
      if (activeId && orderId && String(activeId) !== String(orderId)) {
        return;
      }
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      setUserLocation({
        latitude,
        longitude,
        updatedAt: Date.now(),
      });
    };

    socket.on("userLocationUpdate", handleUserLocationUpdate);

    const handleAgentMessage = (payload) => {
      const { orderId, message, userName, userPhone, sentAt } = payload || {};
      const activeId =
        activeOrderRef.current?.id || activeOrderRef.current?._id;
      if (activeId && orderId && String(activeId) !== String(orderId)) {
        return;
      }
      if (!message) return;
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          message,
          sender: "user",
          userName,
          userPhone,
          sentAt: sentAt || new Date().toISOString(),
        },
      ]);
      toast.success("New message from customer");
    };

    socket.on("agentMessage", handleAgentMessage);

    return () => {
      socket.off("newOrder");
      socket.off("orderCancelled", handleOrderCancelled);
      socket.off("userLocationUpdate", handleUserLocationUpdate);
      socket.off("agentMessage", handleAgentMessage);
      socket.disconnect();
    };
  }, [agent]);

  useEffect(() => {
    activeOrderRef.current = activeOrder;
  }, [activeOrder]);

  useEffect(() => {
    const orderId = activeOrder?.id || activeOrder?._id;
    setChatMessages(loadAgentChat(orderId));
    setReplyText("");
  }, [activeOrder?.id, activeOrder?._id]);

  useEffect(() => {
    const orderId = activeOrder?.id || activeOrder?._id;
    if (!orderId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        `${AGENT_CHAT_PREFIX}${orderId}`,
        JSON.stringify(chatMessages.slice(-200)),
      );
    } catch (error) {
      // ignore storage failures
    }
  }, [chatMessages, activeOrder?.id, activeOrder?._id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!lastLocation) {
      window.localStorage.removeItem(AGENT_LOCATION_KEY);
      return;
    }
    try {
      window.localStorage.setItem(
        AGENT_LOCATION_KEY,
        JSON.stringify(lastLocation),
      );
    } catch (error) {
      // ignore storage failures
    }
  }, [lastLocation]);

  useEffect(() => {
    if (!activeOrder) {
      setUserLocation(null);
      setUserLocationLabel("");
      setRouteCoords(null);
      return;
    }

    const stored = activeOrder?.userLiveLocation;
    if (
      Number.isFinite(stored?.latitude) &&
      Number.isFinite(stored?.longitude)
    ) {
      setUserLocation({
        latitude: stored.latitude,
        longitude: stored.longitude,
        updatedAt: stored.updatedAt
          ? new Date(stored.updatedAt).getTime()
          : Date.now(),
      });
    }
  }, [activeOrder]);

  useEffect(() => {
    const latitude = lastLocation?.latitude;
    const longitude = lastLocation?.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setAgentLocationLabel("");
      return;
    }

    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const now = Date.now();
    if (lastAgentGeoRef.current.key === key && now - lastAgentGeoRef.current.at < 30000) {
      return;
    }
    lastAgentGeoRef.current = { key, at: now };

    (async () => {
      try {
        const result = await locationService.reverseGeocode(latitude, longitude);
        if (result?.fullAddress) {
          setAgentLocationLabel(result.fullAddress);
        }
      } catch (error) {
        // ignore reverse geocode errors
      }
    })();
  }, [lastLocation]);

  useEffect(() => {
    const latitude = userLocation?.latitude;
    const longitude = userLocation?.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setUserLocationLabel("");
      return;
    }

    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const now = Date.now();
    if (lastUserGeoRef.current.key === key && now - lastUserGeoRef.current.at < 30000) {
      return;
    }
    lastUserGeoRef.current = { key, at: now };

    (async () => {
      try {
        const result = await locationService.reverseGeocode(latitude, longitude);
        if (result?.fullAddress) {
          setUserLocationLabel(result.fullAddress);
        }
      } catch (error) {
        // ignore reverse geocode errors
      }
    })();
  }, [userLocation]);

  useEffect(() => {
    if (!incomingOrder) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [incomingOrder]);

  const secondsLeft = useMemo(() => {
    if (!incomingAt) return 0;
    const diff = Math.floor((now - incomingAt) / 1000);
    return Math.max(0, 30 - diff);
  }, [incomingAt, now]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // ignore
    } finally {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setAgent(null);
      setIncomingOrder(null);
      setActiveOrder(null);
      setOrderHistory([]);
      setHistoryLoading(false);
      setUserLocation(null);
      setRouteCoords(null);
      setRouteLoading(false);
    }
  };

  const handleAccept = () => {
    const orderId = incomingOrder?.id || incomingOrder?._id;
    if (!orderId) return;
    socketRef.current?.emit("acceptOrder", orderId);
    setActiveOrder({ ...incomingOrder, orderStatus: "ACCEPTED" });
    setIncomingOrder(null);
    setIncomingAt(null);
  };

  const handleReject = () => {
    const orderId = incomingOrder?.id || incomingOrder?._id;
    if (orderId) {
      socketRef.current?.emit("rejectOrder", orderId);
    }
    setIncomingOrder(null);
    setIncomingAt(null);
  };

  const handleDetectLocation = () => {
    const agentId = agent?.id || agent?._id;
    if (!agentId) return;
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available in this browser.");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingLocation(false);
        const latitude = position?.coords?.latitude;
        const longitude = position?.coords?.longitude;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          toast.error("Unable to detect location.");
          return;
        }

        const payload = {
          agentId,
          latitude,
          longitude,
        };

        socketRef.current?.emit("agentLocationUpdate", payload);
        setLastLocation({
          latitude,
          longitude,
          accuracy: position?.coords?.accuracy,
          updatedAt: Date.now(),
        });
        toast.success("Live location detected");
      },
      (error) => {
        setDetectingLocation(false);
        toast.error(error?.message || "Unable to detect location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleOrderUpdate = (updatedOrder) => {
    if (!updatedOrder) {
      const activeId =
        activeOrderRef.current?.id || activeOrderRef.current?._id;
      if (activeId) {
        socketRef.current?.emit("routeUpdate", {
          orderId: activeId,
          route: null,
        });
      }
      setActiveOrder(null);
      setIncomingOrder(null);
      setIncomingAt(null);
      setUserLocation(null);
      setRouteCoords(null);
      setChatMessages([]);
      fetchHistory();
      return;
    }
    const nextStatus = (updatedOrder?.orderStatus || "").toUpperCase();
    if (nextStatus === "DELIVERED") {
      const orderId = updatedOrder?.id || updatedOrder?._id;
      if (orderId) {
        socketRef.current?.emit("routeUpdate", {
          orderId,
          route: null,
        });
      }
      setActiveOrder(null);
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              totalDeliveries: (prev.totalDeliveries || 0) + 1,
            }
          : prev,
      );
      fetchHistory();
      return;
    }
    setActiveOrder(updatedOrder);
  };

  const buildRoute = async () => {
    const origin = lastLocation;
    const destination = userLocation || activeOrder?.shippingAddress;
    const originLat = origin?.latitude;
    const originLng = origin?.longitude;
    const destLat = destination?.latitude;
    const destLng = destination?.longitude;

    if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) {
      toast.error("Unable to detect your current location.");
      return;
    }
    if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
      toast.error("Destination coordinates are unavailable.");
      return;
    }

    setRouteLoading(true);
    setRouteError("");
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Route request failed.");
      }
      const data = await response.json();
      const route = data?.routes?.[0]?.geometry?.coordinates || [];
      if (!route.length) {
        throw new Error("No route available.");
      }
      const latLngs = route.map((coord) => [coord[1], coord[0]]);
      setRouteCoords(latLngs);
      const orderId = activeOrder?.id || activeOrder?._id;
      if (orderId) {
        socketRef.current?.emit("routeUpdate", {
          orderId,
          route: latLngs,
        });
      }
    } catch (error) {
      setRouteError(error?.message || "Failed to build route.");
      toast.error("Failed to build route.");
    } finally {
      setRouteLoading(false);
    }
  };

  const toggleRoute = async () => {
    const orderId = activeOrder?.id || activeOrder?._id;
    if (routeCoords && routeCoords.length > 0) {
      setRouteCoords(null);
      if (orderId) {
        socketRef.current?.emit("routeUpdate", { orderId, route: null });
      }
      return;
    }
    await buildRoute();
  };

  const handleSendReply = () => {
    const text = replyText.trim();
    const orderId = activeOrder?.id || activeOrder?._id;
    if (!text || !orderId || sendingReply) return;
    if (!socketRef.current) {
      toast.error("Unable to send message right now.");
      return;
    }
    setSendingReply(true);
    socketRef.current.emit("messageUser", { orderId, message: text });
    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        message: text,
        sender: "agent",
        sentAt: new Date().toISOString(),
      },
    ]);
    setReplyText("");
    setTimeout(() => setSendingReply(false), 300);
  };

  const mapOrder = activeOrder || incomingOrder;
  const agentInitials = getInitials(agent?.name);
  const profileUrl = agent?.profileImage?.url || "";
  const acceptanceRate = Number.isFinite(agent?.acceptanceRate)
    ? Math.round(agent.acceptanceRate)
    : null;
  const avgDeliveryTime = formatDuration(agent?.avgDeliveryTimeMs);
  const ratingValue = Number.isFinite(agent?.rating)
    ? agent.rating.toFixed(1)
    : "0.0";
  const totalReviews = agent?.totalReviews || 0;

  useEffect(() => {
    const agentId = agent?.id || agent?._id;

    if (!agentId) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsStatus("Paused");
      return;
    }

    if (!navigator.geolocation) {
      if (!geoErrorShownRef.current) {
        const message = "Geolocation is not available in this browser.";
        toast.error(message);
        setGpsError(message);
        geoErrorShownRef.current = true;
      }
      setGpsStatus("Unavailable");
      return;
    }

    if (watchIdRef.current !== null) return;

    const onSuccess = (position) => {
      const latitude = position?.coords?.latitude;
      const longitude = position?.coords?.longitude;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const nowMs = Date.now();
      if (nowMs - lastEmitRef.current < 4000) return;
      lastEmitRef.current = nowMs;

      setLastLocation({
        latitude,
        longitude,
        accuracy: position?.coords?.accuracy,
        updatedAt: nowMs,
      });

      const active = activeOrderRef.current;
      const orderStatus = (active?.orderStatus || "").toUpperCase();
      const shouldShareWithUser = [
        "ACCEPTED",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
      ].includes(orderStatus);
      const orderId = shouldShareWithUser
        ? active?.id || active?._id
        : null;

      const payload = {
        agentId,
        latitude,
        longitude,
      };
      if (orderId) payload.orderId = orderId;

      socketRef.current?.emit("agentLocationUpdate", payload);
      setGpsStatus("Streaming");
      setGpsError("");
    };

    const onError = (error) => {
      if (!geoErrorShownRef.current) {
        const message = error?.message || "Unable to fetch live location";
        toast.error(message);
        setGpsError(message);
        geoErrorShownRef.current = true;
      }
      setGpsStatus("Error");
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });
    setGpsStatus("Starting");

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [agent]);

  useEffect(() => {
    if (mapOrder) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    destinationMarkerRef.current = null;
    userMarkerRef.current = null;
    routeRef.current = null;
  }, [mapOrder]);

  useEffect(() => {
    if (!mapOrder || !mapContainerRef.current || mapRef.current) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });

    const latitude = mapOrder?.shippingAddress?.latitude;
    const longitude = mapOrder?.shippingAddress?.longitude;
    const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
    const center = hasCoords ? [latitude, longitude] : [20.5937, 78.9629];
    const zoom = hasCoords ? 13 : 5;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });
    mapRef.current = map;

    const geoapifyKey = import.meta.env.VITE_GEOAPIFY_MAP_KEY;
    const tileUrl = geoapifyKey
      ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyKey}`
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution = geoapifyKey
      ? "© Geoapify, © OpenStreetMap contributors"
      : "© OpenStreetMap contributors";

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(map);

    if (hasCoords) {
      destinationMarkerRef.current = L.marker(center).addTo(map);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }, [mapOrder]);

  useEffect(() => {
    if (!mapRef.current || !mapOrder) return;
    const latitude = mapOrder?.shippingAddress?.latitude;
    const longitude = mapOrder?.shippingAddress?.longitude;
    const fallbackLat = userLocation?.latitude;
    const fallbackLng = userLocation?.longitude;
    const destLat = Number.isFinite(latitude)
      ? latitude
      : Number.isFinite(fallbackLat)
        ? fallbackLat
        : null;
    const destLng = Number.isFinite(longitude)
      ? longitude
      : Number.isFinite(fallbackLng)
        ? fallbackLng
        : null;
    if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) return;
    const nextLatLng = [destLat, destLng];

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker(nextLatLng).addTo(mapRef.current);
    } else {
      destinationMarkerRef.current.setLatLng(nextLatLng);
    }

    if (!routeRef.current) {
      mapRef.current.setView(
        nextLatLng,
        Math.max(mapRef.current.getZoom(), 14),
        {
          animate: true,
        },
      );
    }
  }, [mapOrder, userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    const latitude = userLocation?.latitude;
    const longitude = userLocation?.longitude;
    const hasCoords =
      Number.isFinite(latitude) && Number.isFinite(longitude);

    if (!hasCoords) {
      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    const nextLatLng = [latitude, longitude];
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.circleMarker(nextLatLng, {
        radius: 6,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng(nextLatLng);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!routeCoords || routeCoords.length === 0) {
      if (routeRef.current) {
        mapRef.current.removeLayer(routeRef.current);
        routeRef.current = null;
      }
      return;
    }

    if (routeRef.current) {
      routeRef.current.setLatLngs(routeCoords);
    } else {
      routeRef.current = L.polyline(routeCoords, {
        color: "#16a34a",
        weight: 4,
        opacity: 0.9,
      }).addTo(mapRef.current);
    }

    const bounds = routeRef.current.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [routeCoords]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blinkit-bg flex flex-col">
        <DeliveryNavbar agent={agent} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <DeliveryNavbar agent={agent} onLogout={handleLogout} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blinkit-dark">
              Delivery Dashboard
            </h1>
            <p className="text-sm text-blinkit-gray">
              Accept orders and update delivery status.
            </p>
          </div>
        </div>

        {!agent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-blinkit-border p-6 max-w-md">
            <h2 className="text-lg font-bold text-blinkit-dark mb-2">
              Delivery agent login required
            </h2>
            <p className="text-sm text-blinkit-gray mb-4">
              Please log in from the main login page to access delivery tools.
            </p>
            <Link
              to="/login?role=delivery"
              className="inline-flex px-4 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div
              id="delivery-profile"
              className="bg-white rounded-2xl border border-blinkit-border p-5 mb-6"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 rounded-full bg-blinkit-green text-white flex items-center justify-center text-lg font-bold overflow-hidden">
                  {profileUrl ? (
                    <img
                      src={profileUrl}
                      alt={agent?.name || "Delivery Agent"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    agentInitials
                  )}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs text-blinkit-gray">AGENT PROFILE</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-semibold text-blinkit-dark">
                      {agent?.name || "Delivery Agent"}
                    </p>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        agent?.isOnline
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {agent?.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <p className="text-sm text-blinkit-gray">
                    {agent?.email || ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-blinkit-gray">
                <div>
                  <p className="text-xs text-blinkit-gray">Phone</p>
                  <p className="font-semibold text-blinkit-dark">
                    {agent?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blinkit-gray">Pincode</p>
                  <p className="font-semibold text-blinkit-dark">
                    {agent?.pincode || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blinkit-gray">Total Deliveries</p>
                  <p className="font-semibold text-blinkit-dark">
                    {agent?.totalDeliveries ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blinkit-gray">Acceptance Rate</p>
                  <p className="font-semibold text-blinkit-dark">
                    {acceptanceRate !== null ? `${acceptanceRate}%` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blinkit-gray">Avg Delivery Time</p>
                  <p className="font-semibold text-blinkit-dark">
                    {avgDeliveryTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blinkit-gray">Rating</p>
                  <p className="font-semibold text-blinkit-dark flex items-center gap-1">
                    <span className="text-yellow-500">{"\u2605"}</span>
                    {ratingValue}
                    <span className="text-xs text-blinkit-gray">
                      ({totalReviews} reviews)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-blinkit-border p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-blinkit-gray">GPS TRACKING</p>
                <p className="text-sm font-semibold text-blinkit-dark">
                  {gpsStatus}
                </p>
                {gpsError && (
                  <p className="text-xs text-red-600 mt-1">{gpsError}</p>
                )}
                {lastLocation && (
                  <p className="text-xs text-blinkit-gray mt-2">
                    Detected:{" "}
                    {agentLocationLabel
                      ? agentLocationLabel
                      : `${lastLocation.latitude.toFixed(5)}, ${lastLocation.longitude.toFixed(5)}`}
                    {lastLocation.accuracy
                      ? ` \u00b7 ${Math.round(lastLocation.accuracy)}m`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="px-4 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors disabled:opacity-70"
                >
                  {detectingLocation ? "Detecting..." : "Detect Location"}
                </button>
              </div>
            </div>

            {incomingOrder && (
              <div className="bg-white rounded-2xl border border-blinkit-border p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blinkit-dark">
                    New Order Request
                  </h2>
                  <span className="text-xs text-blinkit-gray uppercase tracking-wide">
                    Accept in {secondsLeft}s
                  </span>
                </div>
                <div className="space-y-2 text-sm text-blinkit-gray">
                  <p>
                    Order:{" "}
                    <span className="font-semibold text-blinkit-dark">
                      #{(incomingOrder?.id || incomingOrder?._id || "")
                        .toString()
                        .slice(-6)
                        .toUpperCase()}
                    </span>
                  </p>
                  <p>
                    Items:{" "}
                    <span className="font-semibold text-blinkit-dark">
                      {incomingOrder?.items?.length || 0}
                    </span>
                  </p>
                  <p>
                    Address:{" "}
                    <span className="font-semibold text-blinkit-dark">
                      {incomingOrder?.shippingAddress?.addressLine1 || ""},{" "}
                      {incomingOrder?.shippingAddress?.city || ""}
                    </span>
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleAccept}
                    className="px-4 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {activeOrder ? (
              <div className="bg-white rounded-2xl border border-blinkit-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blinkit-dark">
                    Active Order
                  </h2>
                  <span className="text-xs text-blinkit-gray uppercase tracking-wide">
                    {activeOrder?.orderStatus || "ASSIGNED"}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-blinkit-gray">
                  <p>
                    Order:{" "}
                    <span className="font-semibold text-blinkit-dark">
                      #{(activeOrder?.id || activeOrder?._id || "")
                        .toString()
                        .slice(-6)
                        .toUpperCase()}
                    </span>
                  </p>
                  <p>
                    Items:{" "}
                    <span className="font-semibold text-blinkit-dark">
                      {activeOrder?.items?.length || 0}
                    </span>
                  </p>
                  <p>
                    Address:{" "}
                    <span className="font-semibold text-blinkit-dark">
                      {activeOrder?.shippingAddress?.addressLine1 || ""},{" "}
                      {activeOrder?.shippingAddress?.city || ""}
                    </span>
                  </p>
                </div>
                <DeliveryOrderActions
                  orderId={activeOrder?.id || activeOrder?._id}
                  status={(activeOrder?.orderStatus || "").toUpperCase()}
                  paymentStatus={activeOrder?.paymentStatus}
                  onOrderUpdate={handleOrderUpdate}
                />

                <div className="mt-6 rounded-xl border border-blinkit-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-blinkit-dark">
                        Chat with Customer
                      </h3>
                      <p className="text-xs text-blinkit-gray">
                        {activeOrder?.user?.name || "Customer"}
                        {activeOrder?.user?.phone
                          ? ` · ${activeOrder.user.phone}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-blinkit-border bg-white">
                    <div className="max-h-44 overflow-y-auto p-3 space-y-2">
                      {chatMessages.length === 0 ? (
                        <p className="text-xs text-blinkit-gray">
                          No messages yet.
                        </p>
                      ) : (
                        chatMessages.map((msg, index) => (
                          <div
                            key={msg.id || `${msg.sentAt || "msg"}-${index}`}
                            className={`flex ${
                              msg.sender === "agent"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${
                                msg.sender === "agent"
                                  ? "bg-blinkit-green text-white"
                                  : "bg-gray-100 text-blinkit-dark"
                              }`}
                            >
                              <p>{msg.message}</p>
                              <p
                                className={`text-[10px] mt-1 ${
                                  msg.sender === "agent"
                                    ? "text-white/80"
                                    : "text-blinkit-gray"
                                }`}
                              >
                                {msg.sentAt
                                  ? new Date(msg.sentAt).toLocaleTimeString()
                                  : ""}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-blinkit-border p-2 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 px-3 py-2 rounded-lg border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40"
                      />
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sendingReply}
                        className="px-3 py-2 rounded-lg bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark disabled:opacity-60"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              !incomingOrder && (
                <div className="bg-white rounded-2xl border border-blinkit-border p-6 text-center text-sm text-blinkit-gray">
                  No active orders right now. Keep this tab open to receive new
                  requests.
                </div>
              )
            )}

            {mapOrder && (
              <div className="mt-6 rounded-2xl border border-blinkit-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-blinkit-dark">
                      Delivery Map
                    </h3>
                    <span className="text-xs text-blinkit-gray uppercase tracking-wide">
                      Destination
                    </span>
                  </div>
                  {activeOrder && (
                    <button
                      onClick={toggleRoute}
                      disabled={routeLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blinkit-border text-blinkit-dark hover:bg-blinkit-light-gray transition-colors disabled:opacity-60"
                    >
                      {routeLoading
                        ? "Building route..."
                        : routeCoords
                          ? "Hide Route"
                          : "Start Navigation"}
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-blinkit-border overflow-hidden">
                  <div ref={mapContainerRef} className="h-64 md:h-80 w-full" />
                </div>
                <p className="text-xs text-blinkit-gray mt-2">
                  {mapOrder?.shippingAddress?.addressLine1
                    ? `Drop: ${mapOrder.shippingAddress.addressLine1}`
                    : "Customer drop location."}
                </p>
                {userLocation && (
                  <p className="text-xs text-blinkit-gray mt-1">
                    Live user location:{" "}
                    {userLocationLabel
                      ? userLocationLabel
                      : `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`}
                  </p>
                )}
                {routeError && (
                  <p className="text-xs text-red-600 mt-1">{routeError}</p>
                )}
              </div>
            )}

            <div className="mt-6 bg-white rounded-2xl border border-blinkit-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-blinkit-dark">
                  Delivery History
                </h2>
                <button
                  onClick={() => fetchHistory()}
                  className="text-sm font-semibold text-blinkit-green hover:text-blinkit-green-dark"
                >
                  Refresh
                </button>
              </div>
              {historyLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blinkit-green"></div>
                </div>
              ) : orderHistory.length === 0 ? (
                <p className="text-sm text-blinkit-gray">
                  No delivery history yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map((order) => {
                    if (!order) return null;
                    const orderId = order?.id || order?._id;
                    const status = (order?.orderStatus || "").toUpperCase();
                    const statusLabel = status.replace(/_/g, " ");
                    const statusStyle =
                      status === "DELIVERED"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : status === "CANCELLED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-700 border-gray-200";
                    const paymentStatus = String(
                      order?.paymentStatus || "pending",
                    ).toUpperCase();
                    const paymentStyle = ["PAID", "SUCCESSFUL"].includes(
                      paymentStatus,
                    )
                      ? "text-green-600"
                      : "text-orange-500";
                    return (
                      <div
                        key={orderId}
                        className="border border-blinkit-border rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-blinkit-gray">ORDER</p>
                            <p className="font-semibold text-blinkit-dark">
                              #
                              {String(orderId || "")
                                .slice(-6)
                                .toUpperCase()}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-semibold border rounded-full uppercase tracking-wide ${statusStyle}`}
                          >
                            {statusLabel || "UNKNOWN"}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-blinkit-gray">
                          <div>
                            <p className="text-xs text-blinkit-gray">Items</p>
                            <p className="font-semibold text-blinkit-dark">
                              {order?.items?.length || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blinkit-gray">Amount</p>
                            <p className="font-semibold text-blinkit-dark">
                              {"\u20B9"}{order?.totalAmount || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blinkit-gray">Updated</p>
                            <p className="font-semibold text-blinkit-dark">
                              {order?.updatedAt
                                ? new Date(order.updatedAt).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-blinkit-gray">
                          Payment:{" "}
                          <span className={`font-semibold ${paymentStyle}`}>
                            {paymentStatus}
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

    </div>
  );
};

export default DeliveryDashboard;

