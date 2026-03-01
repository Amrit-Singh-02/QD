import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';
import ConfirmationModal from '../component/UI/ConfirmationModal';
import { createSocket } from '../services/socket';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useAuth } from '../context/AuthContext';
import DeliveryOrderActions from '../component/Delivery/DeliveryOrderActions';
import { useLocationContext } from '../context/LocationContext';
import ReviewModal from '../component/UI/ReviewModal';

const CHAT_STORAGE_PREFIX = 'qd_order_chat_';

const loadChatHistory = (orderId) => {
    if (!orderId || typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(`${CHAT_STORAGE_PREFIX}${orderId}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const OrderDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { location } = useLocationContext();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [liveLocation, setLiveLocation] = useState(null);
    const [routeCoords, setRouteCoords] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [review, setReview] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const routeRef = useRef(null);
    const socketRef = useRef(null);
    const orderIdRef = useRef(null);
    const lastUserEmitRef = useRef(0);

    const STATUSES = {
        PLACED: 'PLACED',
        ASSIGNING: 'ASSIGNING',
        ACCEPTED: 'ACCEPTED',
        PICKED_UP: 'PICKED_UP',
        OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
        DELIVERED: 'DELIVERED',
        CANCELLED: 'CANCELLED',
        NO_AGENT_AVAILABLE: 'NO_AGENT_AVAILABLE',
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    useEffect(() => {
        const orderId = order?.id || order?._id;
        const status = (order?.orderStatus || '').toUpperCase();
        if (!orderId || status !== STATUSES.DELIVERED || user?.role === 'delivery') {
            setReview(null);
            setReviewLoading(false);
            return;
        }

        let active = true;
        setReviewLoading(true);
        orderService.getOrderReview(orderId)
            .then((response) => {
                if (!active) return;
                setReview(response?.payload || null);
            })
            .catch(() => {
                if (!active) return;
                setReview(null);
            })
            .finally(() => {
                if (!active) return;
                setReviewLoading(false);
            });

        return () => {
            active = false;
        };
    }, [order?.id, order?._id, order?.orderStatus, user?.role]);

    const fetchOrderDetails = async () => {
        try {
            const response = await orderService.getOrderById(id);
            setOrder(response.payload);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch order details");
        } finally {
            setLoading(false);
        }
    };

    const initiateCancelOrder = () => {
        setIsModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        try {
            const orderId = order?.id || order?._id;
            await orderService.cancelOrder(orderId);
            toast.success("Order cancelled successfully");
            fetchOrderDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel order");
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleSendMessage = () => {
        const text = messageText.trim();
        const orderId = order?.id || order?._id;
        if (!text || !orderId || sendingMessage) return;
        if (!canChat) {
            toast.error("Chat is unavailable for this order.");
            return;
        }
        if (!socketRef.current) {
            toast.error("Unable to connect to delivery agent right now.");
            return;
        }
        setSendingMessage(true);
        socketRef.current.emit('messageAgent', { orderId, message: text });
        setChatMessages((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                sender: 'user',
                text,
                sentAt: new Date().toISOString(),
            },
        ]);
        setMessageText('');
        setTimeout(() => setSendingMessage(false), 300);
        toast.success('Message sent to delivery agent');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case STATUSES.PLACED: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case STATUSES.ASSIGNING: return 'bg-blue-100 text-blue-800 border-blue-200';
            case STATUSES.ACCEPTED: return 'bg-purple-100 text-purple-800 border-purple-200';
            case STATUSES.PICKED_UP: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case STATUSES.OUT_FOR_DELIVERY: return 'bg-purple-100 text-purple-800 border-purple-200';
            case STATUSES.DELIVERED: return 'bg-green-100 text-green-800 border-green-200';
            case STATUSES.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
            case STATUSES.NO_AGENT_AVAILABLE: return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatStatus = (status) => {
        if (!status) return 'unknown';
        return status.replace(/_/g, ' ').toLowerCase();
    };

    useEffect(() => {
        orderIdRef.current = order?.id || order?._id || null;
    }, [order]);

    const currentOrderId = order?.id || order?._id || id;

    useEffect(() => {
        setChatMessages(loadChatHistory(currentOrderId));
    }, [currentOrderId]);

    useEffect(() => {
        if (!currentOrderId || typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(
                `${CHAT_STORAGE_PREFIX}${currentOrderId}`,
                JSON.stringify(chatMessages.slice(-200)),
            );
        } catch (error) {
            // ignore storage failures
        }
    }, [chatMessages, currentOrderId]);

    useEffect(() => {
        const status = (order?.orderStatus || '').toUpperCase();
        if ([STATUSES.CANCELLED, STATUSES.DELIVERED, STATUSES.NO_AGENT_AVAILABLE].includes(status)) {
            setRouteCoords(null);
        }
    }, [order?.orderStatus]);

    useEffect(() => {
        const coords = location?.coords;
        const socket = socketRef.current;
        const orderId = orderIdRef.current;
        if (!coords || !socket || !orderId) return;

        const status = (order?.orderStatus || '').toUpperCase();
        if ([STATUSES.CANCELLED, STATUSES.DELIVERED, STATUSES.NO_AGENT_AVAILABLE].includes(status)) {
            return;
        }

        const now = Date.now();
        if (now - lastUserEmitRef.current < 4000) return;
        lastUserEmitRef.current = now;

        socket.emit('userLocationUpdate', {
            orderId,
            latitude: coords.lat,
            longitude: coords.lng,
        });
    }, [location?.coords, order?.orderStatus]);

    useEffect(() => {
        const userId = user?.id || user?._id;
        if (!userId) return;

        const socket = createSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('userOnline', userId);
        });

        const handleLocationUpdate = (payload) => {
            const { orderId, latitude, longitude } = payload || {};
            const currentOrderId = orderIdRef.current;
            if (currentOrderId && orderId && String(orderId) !== String(currentOrderId)) {
                return;
            }
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
            setLiveLocation({ latitude, longitude });
        };

        const handleStatusUpdate = (payload, fallbackStatus) => {
            const { orderId, status } = payload || {};
            const currentOrderId = orderIdRef.current;
            if (!currentOrderId || !orderId || String(orderId) !== String(currentOrderId)) return;
            const nextStatus = status || fallbackStatus;
            if (!nextStatus) return;
            setOrder((prev) => {
                if (!prev) return prev;
                const next = { ...prev, orderStatus: nextStatus };
                if (payload?.agent) {
                    next.assignedAgent = payload.agent;
                }
                return next;
            });
        };

        const handleAgentCancel = (payload) => {
            const { orderId, status, message } = payload || {};
            const currentOrderId = orderIdRef.current;
            if (!currentOrderId || !orderId || String(orderId) !== String(currentOrderId)) return;
            const nextStatus = status || STATUSES.ASSIGNING;
            setOrder((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    orderStatus: nextStatus,
                    assignedAgent: null,
                };
            });
            setLiveLocation(null);
            setRouteCoords(null);
            toast.error(message || "Your delivery agent cancelled. Reassigning a new agent...");
        };

        const handlePaymentUpdate = (payload) => {
            const { orderId, paymentStatus } = payload || {};
            const currentOrderId = orderIdRef.current;
            if (!currentOrderId || !orderId || String(orderId) !== String(currentOrderId)) return;
            if (!paymentStatus) return;
            setOrder((prev) => (prev ? { ...prev, paymentStatus } : prev));
        };

        const handleRouteUpdate = (payload) => {
            const { orderId, route } = payload || {};
            const currentOrderId = orderIdRef.current;
            if (!currentOrderId || !orderId || String(orderId) !== String(currentOrderId)) return;
            if (!route || !Array.isArray(route) || route.length === 0) {
                setRouteCoords(null);
                return;
            }
            setRouteCoords(route);
        };

        const handleAgentReply = (payload) => {
            const { orderId, message, sentAt } = payload || {};
            const currentOrderId = orderIdRef.current;
            if (!currentOrderId || !orderId || String(orderId) !== String(currentOrderId)) return;
            if (!message) return;
            setChatMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    sender: 'agent',
                    text: message,
                    sentAt: sentAt || new Date().toISOString(),
                },
            ]);
        };

        socket.on('liveLocationUpdate', handleLocationUpdate);
        socket.on('orderAccepted', (payload) => handleStatusUpdate(payload, STATUSES.ACCEPTED));
        socket.on('orderPickedUp', (payload) => handleStatusUpdate(payload, STATUSES.PICKED_UP));
        socket.on('orderOutForDelivery', (payload) => handleStatusUpdate(payload, STATUSES.OUT_FOR_DELIVERY));
        socket.on('orderDelivered', (payload) => handleStatusUpdate(payload, STATUSES.DELIVERED));
        socket.on('paymentAccepted', handlePaymentUpdate);
        socket.on('orderCancelledByAgent', handleAgentCancel);
        socket.on('routeUpdate', handleRouteUpdate);
        socket.on('userMessage', handleAgentReply);
        socket.on('noAgentAvailable', (payload) => {
            handleStatusUpdate(payload, STATUSES.NO_AGENT_AVAILABLE);
            toast.error('No delivery agent is available right now.');
        });

        return () => {
            socket.off('liveLocationUpdate', handleLocationUpdate);
            socket.off('orderAccepted');
            socket.off('orderPickedUp');
            socket.off('orderOutForDelivery');
            socket.off('orderDelivered');
            socket.off('paymentAccepted', handlePaymentUpdate);
            socket.off('orderCancelledByAgent', handleAgentCancel);
            socket.off('routeUpdate', handleRouteUpdate);
            socket.off('userMessage', handleAgentReply);
            socket.off('noAgentAvailable');
            socket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: markerIcon2x,
            iconUrl: markerIcon,
            shadowUrl: markerShadow,
        });

        const latitude = order?.shippingAddress?.latitude;
        const longitude = order?.shippingAddress?.longitude;
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
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const attribution = geoapifyKey
            ? '© Geoapify, © OpenStreetMap contributors'
            : '© OpenStreetMap contributors';

        L.tileLayer(tileUrl, {
            attribution,
            maxZoom: 19,
        }).addTo(map);

        if (hasCoords) {
            markerRef.current = L.marker(center).addTo(map);
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 0);
    }, [order]);

    useEffect(() => {
        if (!mapRef.current || !liveLocation) return;
        const { latitude, longitude } = liveLocation;
        const nextLatLng = [latitude, longitude];

        if (!markerRef.current) {
            markerRef.current = L.marker(nextLatLng).addTo(mapRef.current);
        } else {
            markerRef.current.setLatLng(nextLatLng);
        }

        mapRef.current.setView(nextLatLng, Math.max(mapRef.current.getZoom(), 14), {
            animate: true,
        });
    }, [liveLocation]);

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
                color: '#16a34a',
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
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-blinkit-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <h2 className="text-xl font-bold text-blinkit-dark mb-4">Order not found</h2>
                    <Link to="/orders" className="text-blinkit-green hover:underline">Back to My Orders</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const orderStatus = (order?.orderStatus || '').toUpperCase();
    const paymentLabel = order?.paymentStatus || 'Pending';
    const paymentSuccess = ['paid', 'successful'].includes(
        String(paymentLabel).toLowerCase(),
    );
    const assignedAgent = order?.assignedAgent || null;
    const agentName = assignedAgent?.name;
    const agentPhone = assignedAgent?.phone;
    const agentArea = assignedAgent?.pincode;
    const isHistoryView = [
        STATUSES.CANCELLED,
        STATUSES.DELIVERED,
        STATUSES.NO_AGENT_AVAILABLE,
    ].includes(orderStatus);
    const canChat =
        Boolean(assignedAgent) &&
        !isHistoryView;
    const trackingActive = [
        STATUSES.ACCEPTED,
        STATUSES.PICKED_UP,
        STATUSES.OUT_FOR_DELIVERY,
    ].includes(orderStatus);
    const canShowDeliveryActions = user?.role === 'delivery';
    const canReview = orderStatus === STATUSES.DELIVERED && user?.role !== 'delivery';

    const timelineSteps = [
        { id: STATUSES.PLACED, label: 'Placed' },
        { id: STATUSES.ASSIGNING, label: 'Assigning' },
        { id: STATUSES.ACCEPTED, label: 'Accepted' },
        { id: STATUSES.PICKED_UP, label: 'Picked Up' },
        { id: STATUSES.OUT_FOR_DELIVERY, label: 'Out For Delivery' },
        { id: STATUSES.DELIVERED, label: 'Delivered' },
    ];
    const activeIndex = timelineSteps.findIndex((step) => step.id === orderStatus);

    return (
        <div className="min-h-screen bg-blinkit-bg flex flex-col">
            <Navbar />
            <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Link to="/orders" className="text-blinkit-gray hover:text-blinkit-dark">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-blinkit-dark">Order Details</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-blinkit-border overflow-hidden mb-6">
                    <div className="p-4 border-b border-blinkit-border bg-gray-50 flex flex-wrap gap-4 justify-between items-center">
                        <div>
                            <p className="text-xs text-blinkit-gray">ORDER ID</p>
                            <p className="font-mono font-bold text-blinkit-dark">#{(order?.id || order?._id)?.toUpperCase() || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-blinkit-gray">PLACED ON</p>
                            <p className="font-medium text-blinkit-dark">{order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(orderStatus)} uppercase tracking-wide`}>
                                {formatStatus(orderStatus)}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-8">
                            <h3 className="font-bold text-blinkit-dark mb-3">Order Status</h3>
                            {[STATUSES.CANCELLED, STATUSES.NO_AGENT_AVAILABLE].includes(orderStatus) ? (
                                <div
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${
                                        orderStatus === STATUSES.CANCELLED
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-orange-50 text-orange-700 border-orange-200'
                                    }`}
                                >
                                    {orderStatus === STATUSES.CANCELLED
                                        ? 'Cancelled'
                                        : 'No agent available'}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    {timelineSteps.map((step, index) => {
                                        const isActive = index <= activeIndex && activeIndex !== -1;
                                        return (
                                            <div key={step.id} className="flex items-center gap-2">
                                                <span
                                                    className={`h-3 w-3 rounded-full border ${
                                                        isActive
                                                            ? 'bg-blinkit-green border-blinkit-green'
                                                            : 'bg-white border-blinkit-border'
                                                    }`}
                                                />
                                                <span
                                                    className={`text-xs font-semibold uppercase tracking-wide ${
                                                        isActive ? 'text-blinkit-dark' : 'text-blinkit-gray'
                                                    }`}
                                                >
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {isHistoryView ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-blinkit-dark mb-4">Items ({order?.items?.length || 0})</h3>
                                    <div className="space-y-4">
                                        {order?.items?.map((item, idx) => {
                                            const imageUrl =
                                                item?.product?.images?.[0]?.url ||
                                                item?.product?.image ||
                                                item?.image ||
                                                item?.imageUrl ||
                                                "";
                                            return (
                                                <div key={idx} className="flex gap-4 items-start">
                                                    <div className="w-16 h-16 bg-blinkit-light-gray rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={item?.name || "Item"}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <span className="text-[10px] text-blinkit-gray">
                                                                No Image
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-blinkit-dark">{item?.name || 'Item'}</p>
                                                        <p className="text-sm text-blinkit-gray">
                                                            Qty: {item?.quantity || 0} x {"\u20B9"}{item?.price || 0}
                                                        </p>
                                                    </div>
                                                    <div className="font-bold text-blinkit-dark">
                                                        {"\u20B9"}{item?.subtotal || 0}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-bold text-blinkit-dark mb-2">Payment Info</h3>
                                        <div className="text-sm text-blinkit-gray space-y-1">
                                            <div className="flex justify-between">
                                                <span>Method</span>
                                                <span className="font-medium uppercase">{order?.paymentMethod || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Payment Status</span>
                                                <span className={`font-medium uppercase ${paymentSuccess ? 'text-green-600' : 'text-orange-500'}`}>{paymentLabel}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border border-blinkit-border rounded-lg p-3 bg-gray-50">
                                        <div className="flex justify-between font-bold text-lg text-blinkit-dark">
                                            <span>Total Amount</span>
                                            <span>{"\u20B9"}{order?.totalAmount || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-blinkit-dark mb-4">Items ({order?.items?.length || 0})</h3>
                                    <div className="space-y-4">
                                        {order?.items?.map((item, idx) => {
                                            const imageUrl =
                                                item?.product?.images?.[0]?.url ||
                                                item?.product?.image ||
                                                item?.image ||
                                                item?.imageUrl ||
                                                "";
                                            return (
                                                <div key={idx} className="flex gap-4 items-start">
                                                    <div className="w-16 h-16 bg-blinkit-light-gray rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={item?.name || "Item"}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <span className="text-[10px] text-blinkit-gray">
                                                                No Image
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-blinkit-dark">{item?.name || 'Item'}</p>
                                                        <p className="text-sm text-blinkit-gray">
                                                            Qty: {item?.quantity || 0} x {"\u20B9"}{item?.price || 0}
                                                        </p>
                                                    </div>
                                                    <div className="font-bold text-blinkit-dark">
                                                        {"\u20B9"}{item?.subtotal || 0}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-bold text-blinkit-dark mb-2">Delivery Address</h3>
                                        <div className="text-sm text-blinkit-gray bg-gray-50 p-3 rounded-lg border border-blinkit-border">
                                            <p className="font-bold text-blinkit-dark mb-1">{order?.shippingAddress?.fullName || 'N/A'}</p>
                                            <p>{order?.shippingAddress?.addressLine1 || ''}</p>
                                            {order?.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                            <p>{order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.pincode || order?.shippingAddress?.postalCode}</p>
                                            <p className="mt-1 font-medium">Phone: {order?.shippingAddress?.phone || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-blinkit-dark mb-2">Delivery Agent</h3>
                                        {assignedAgent ? (
                                            <div className="text-sm text-blinkit-gray bg-gray-50 p-3 rounded-lg border border-blinkit-border space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-semibold text-blinkit-dark">
                                                        {agentName || 'Delivery Agent'}
                                                    </span>
                                                    {agentPhone && (
                                                        <a
                                                            href={`tel:${agentPhone}`}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-blinkit-border text-blinkit-green hover:bg-green-50"
                                                            aria-label="Call delivery agent"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h2.28a2 2 0 011.86 1.26l1.1 2.75a2 2 0 01-.45 2.18l-1.2 1.2a16 16 0 006.6 6.6l1.2-1.2a2 2 0 012.18-.45l2.75 1.1A2 2 0 0121 19.72V22a2 2 0 01-2 2h-1C9.16 24 2 16.84 2 8V7a2 2 0 011-2z" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="text-xs text-blinkit-gray">
                                                    Area: <span className="font-semibold text-blinkit-dark">{agentArea || 'N/A'}</span>
                                                </div>
                                                {agentPhone && (
                                                    <div className="text-xs text-blinkit-gray">
                                                        Phone: <span className="font-semibold text-blinkit-dark">{agentPhone}</span>
                                                    </div>
                                                )}
                                                <div className="pt-2">
                                                    <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                                                        Chat with agent
                                                    </label>
                                                    <div className="mt-2 rounded-lg border border-blinkit-border bg-white">
                                                        <div className="max-h-40 overflow-y-auto p-3 space-y-2">
                                                            {chatMessages.length === 0 ? (
                                                                <p className="text-xs text-blinkit-gray">No messages yet.</p>
                                                            ) : (
                                                                chatMessages.map((msg, index) => (
                                                                    <div
                                                                        key={msg.id || `${msg.sentAt || "msg"}-${index}`}
                                                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                                                    >
                                                                        <div
                                                                            className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${
                                                                                msg.sender === 'user'
                                                                                    ? 'bg-blinkit-green text-white'
                                                                                    : 'bg-gray-100 text-blinkit-dark'
                                                                            }`}
                                                                        >
                                                                            <p>{msg.text}</p>
                                                                            <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-white/80' : 'text-blinkit-gray'}`}>
                                                                                {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString() : ''}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                        <div className="border-t border-blinkit-border p-2 flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={messageText}
                                                                onChange={(e) => setMessageText(e.target.value)}
                                                                placeholder={canChat ? "Type a message..." : "Chat unavailable"}
                                                                disabled={!canChat}
                                                                className="flex-1 px-3 py-2 rounded-lg border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40 disabled:bg-gray-100"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleSendMessage}
                                                                disabled={!messageText.trim() || sendingMessage || !canChat}
                                                                className="px-3 py-2 rounded-lg bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark disabled:opacity-60"
                                                            >
                                                                Send
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-blinkit-gray">
                                                Waiting for a delivery agent to accept your order.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-blinkit-dark mb-2">Payment Info</h3>
                                        <div className="text-sm text-blinkit-gray space-y-1">
                                            <div className="flex justify-between">
                                                <span>Method</span>
                                                <span className="font-medium uppercase">{order?.paymentMethod || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Payment Status</span>
                                                <span className={`font-medium uppercase ${paymentSuccess ? 'text-green-600' : 'text-orange-500'}`}>{paymentLabel}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-blinkit-border pt-4">
                                        <div className="flex justify-between font-bold text-lg text-blinkit-dark">
                                            <span>Total Amount</span>
                                            <span>{"\u20B9"}{order?.totalAmount || 0}</span>
                                        </div>
                                    </div>

                                    {[STATUSES.PLACED, STATUSES.ASSIGNING, STATUSES.ACCEPTED].includes(orderStatus) && (
                                        <button
                                            onClick={initiateCancelOrder}
                                            className="w-full py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {canReview && (
                            <div className="mt-6 border border-blinkit-border rounded-xl p-4 bg-white">
                                <h3 className="font-bold text-blinkit-dark mb-2">Delivery Review</h3>
                                {reviewLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-blinkit-gray">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blinkit-green"></div>
                                        Loading your review...
                                    </div>
                                ) : review ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= (review?.rating || 0) ? "text-yellow-400" : "text-gray-200"}`}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-sm font-semibold text-blinkit-dark">
                                                {review?.rating || 0}/5
                                            </span>
                                        </div>
                                        {review?.comment ? (
                                            <p className="text-sm text-blinkit-gray bg-blinkit-light-gray rounded-lg p-3">
                                                {review.comment}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-blinkit-gray">No comment provided.</p>
                                        )}
                                        {review?.createdAt && (
                                            <p className="text-xs text-blinkit-gray">
                                                Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <p className="text-sm text-blinkit-gray">
                                            Share your delivery experience.
                                        </p>
                                        <button
                                            onClick={() => setShowReviewModal(true)}
                                            className="px-4 py-2 rounded-lg bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors"
                                        >
                                            Rate Your Delivery
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isHistoryView && (
                            <div className="mt-8">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-blinkit-dark">Live Tracking</h3>
                                <span className="text-xs text-blinkit-gray uppercase tracking-wide">
                                    {trackingActive ? 'Live' : 'Waiting'}
                                </span>
                            </div>
                            <div className="rounded-xl border border-blinkit-border overflow-hidden bg-white">
                                <div ref={mapContainerRef} className="h-64 md:h-80 w-full" />
                            </div>
                            <p className="text-xs text-blinkit-gray mt-2">
                                {trackingActive
                                    ? liveLocation
                                        ? 'Updating agent location in real time.'
                                        : 'Waiting for the delivery agent to share their live location.'
                                    : orderStatus === STATUSES.NO_AGENT_AVAILABLE
                                        ? 'No delivery agent found yet. You can retry assignment.'
                                        : 'Live tracking starts once your delivery agent accepts the order.'}
                            </p>
                            </div>
                        )}

                        {orderStatus === STATUSES.NO_AGENT_AVAILABLE && (
                            <div className="mt-4">
                                <button
                                    onClick={async () => {
                                        try {
                                            const orderId = order?.id || order?._id;
                                            await orderService.retryAssign(orderId);
                                            toast.success('Trying to find a new delivery agent...');
                                            fetchOrderDetails();
                                        } catch (error) {
                                            toast.error(error.response?.data?.message || 'Retry failed');
                                        }
                                    }}
                                    className="px-4 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors"
                                >
                                    Retry Finding Agent
                                </button>
                            </div>
                        )}

                        {canShowDeliveryActions && !isHistoryView && (
                            <DeliveryOrderActions
                                orderId={order?.id || order?._id}
                                status={orderStatus}
                                paymentStatus={order?.paymentStatus}
                                onOrderUpdate={(updatedOrder) => {
                                    if (!updatedOrder) {
                                        fetchOrderDetails();
                                        return;
                                    }
                                    setOrder((prev) =>
                                        prev ? { ...prev, ...updatedOrder } : prev,
                                    );
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            <ConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title="Cancel Order"
                message="Do you want to cancel this order or not?"
            />

            {showReviewModal && (
                <ReviewModal
                    orderId={order?.id || order?._id}
                    agentName={agentName}
                    onClose={() => setShowReviewModal(false)}
                    onReviewSubmitted={(newReview) => setReview(newReview || null)}
                />
            )}

            <Footer />
        </div>
    );
};

export default OrderDetails;
