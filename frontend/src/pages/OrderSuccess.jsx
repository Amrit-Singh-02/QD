import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';

const OrderSuccess = () => {
    const { user } = useAuth();
    const { location: liveLocation } = useLocationContext();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [order, setOrder] = useState(location.state?.order || null);
    const [loading, setLoading] = useState(!order);
    const socketRef = useRef(null);
    const lastUserEmitRef = useRef(0);

    const orderId = useMemo(() => {
        return (
            order?.id ||
            order?._id ||
            searchParams.get('orderId') ||
            null
        );
    }, [order, searchParams]);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId || order) return;
            setLoading(true);
            try {
                const response = await orderService.getOrderById(orderId);
                setOrder(response?.payload || null);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to fetch order');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, order]);

    useEffect(() => {
        const userId = user?.id || user?._id;
        if (!userId || !orderId) return;

        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
        const socket = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket'],
        });
        socketRef.current = socket;
        socket.on('connect', () => {
            socket.emit('userOnline', userId);
        });

        const handleOrderAccepted = (payload) => {
            const incomingId = payload?.orderId;
            if (!incomingId || String(incomingId) !== String(orderId)) return;
            setOrder((prev) => (prev ? { ...prev, orderStatus: 'ACCEPTED' } : prev));
        };

        const handleNoAgent = (payload) => {
            const incomingId = payload?.orderId;
            if (!incomingId || String(incomingId) !== String(orderId)) return;
            setOrder((prev) => (prev ? { ...prev, orderStatus: 'NO_AGENT_AVAILABLE' } : prev));
        };

        socket.on('orderAccepted', handleOrderAccepted);
        socket.on('noAgentAvailable', handleNoAgent);

        return () => {
            socket.off('orderAccepted', handleOrderAccepted);
            socket.off('noAgentAvailable', handleNoAgent);
            socket.disconnect();
        };
    }, [user, orderId]);

    useEffect(() => {
        const coords = liveLocation?.coords;
        const socket = socketRef.current;
        if (!coords || !socket || !orderId) return;

        const status = (order?.orderStatus || '').toUpperCase();
        if (['CANCELLED', 'DELIVERED', 'NO_AGENT_AVAILABLE'].includes(status)) {
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
    }, [liveLocation?.coords, order?.orderStatus, orderId]);

    const status = (order?.orderStatus || '').toUpperCase();
    const isAccepted = ['ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status);
    const isNoAgent = status === 'NO_AGENT_AVAILABLE';
    const isPending = !status || ['PLACED', 'ASSIGNING'].includes(status);

    const orderNumber = orderId ? String(orderId).slice(-6).toUpperCase() : 'N/A';
    const amount = order?.totalAmount ?? 0;
    const itemsCount = order?.items?.length || 0;
    const addressLine = order?.shippingAddress?.addressLine1 || '';

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

    if (!orderId) {
        return (
            <div className="min-h-screen bg-blinkit-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-bold text-blinkit-dark mb-2">Order not found</h2>
                    <p className="text-blinkit-gray mb-6">We could not locate your order.</p>
                    <Link to="/orders" className="px-6 py-3 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-colors">
                        Go to My Orders
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blinkit-bg flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {isAccepted ? (
                    <>
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <svg className="w-12 h-12 text-blinkit-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-blinkit-dark mb-2">Order Placed Successfully!</h2>
                        <p className="text-blinkit-gray mb-6 text-center max-w-md">
                            Your delivery agent has accepted the order. We are preparing your items now.
                        </p>
                        <div className="bg-white rounded-xl border border-blinkit-border shadow-sm p-5 w-full max-w-xl mb-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs text-blinkit-gray">ORDER ID</p>
                                    <p className="font-mono font-bold text-blinkit-dark">#{orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blinkit-gray">AMOUNT</p>
                                    <p className="font-semibold text-blinkit-dark">₹{amount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blinkit-gray">ITEMS</p>
                                    <p className="font-semibold text-blinkit-dark">{itemsCount}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Link to={`/order/${orderId}`} className="px-6 py-3 bg-white border border-blinkit-green text-blinkit-green font-bold rounded-xl hover:bg-green-50 transition-colors">
                                Track Order
                            </Link>
                            <Link to="/" className="px-6 py-3 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-colors">
                                Continue Shopping
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white rounded-2xl border border-blinkit-border shadow-sm p-6 w-full max-w-xl">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs text-blinkit-gray">ORDER ID</p>
                                    <p className="font-mono font-bold text-blinkit-dark">#{orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blinkit-gray">AMOUNT</p>
                                    <p className="font-semibold text-blinkit-dark">₹{amount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blinkit-gray">ITEMS</p>
                                    <p className="font-semibold text-blinkit-dark">{itemsCount}</p>
                                </div>
                            </div>
                            {addressLine && (
                                <p className="text-xs text-blinkit-gray mt-3">
                                    Delivering to: <span className="font-semibold text-blinkit-dark">{addressLine}</span>
                                </p>
                            )}
                            <div className="mt-5">
                                <p className="text-sm font-semibold text-blinkit-dark">
                                    {isNoAgent ? 'No delivery agent available' : 'Finding a delivery agent'}
                                </p>
                                <p className="text-xs text-blinkit-gray mt-1">
                                    {isNoAgent
                                        ? 'Please retry to find a delivery agent.'
                                        : 'We are matching you with the nearest agent.'}
                                </p>
                                <div className="mt-3 h-2 rounded-full bg-blinkit-light-gray overflow-hidden">
                                    <div className={`h-full ${isNoAgent ? 'bg-red-400' : 'bg-blinkit-green animate-pulse'} w-2/3`} />
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                    <span className={`px-2 py-1 rounded-full border font-semibold ${isPending ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                        Finding agent
                                    </span>
                                    <span className={`px-2 py-1 rounded-full border font-semibold ${isAccepted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                        Making your order
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isNoAgent ? (
                            <div className="mt-6">
                                <button
                                    onClick={async () => {
                                        try {
                                            await orderService.retryAssign(orderId);
                                            setOrder((prev) => (prev ? { ...prev, orderStatus: 'ASSIGNING' } : prev));
                                            toast.success('Retrying delivery agent assignment...');
                                        } catch (error) {
                                            toast.error(error.response?.data?.message || 'Retry failed');
                                        }
                                    }}
                                    className="px-6 py-3 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-colors"
                                >
                                    Retry Finding Agent
                                </button>
                            </div>
                        ) : (
                            <div className="mt-6 text-xs text-blinkit-gray">
                                We will notify you as soon as an agent accepts your order.
                            </div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default OrderSuccess;
