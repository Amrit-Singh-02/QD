import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';
import { orderService } from '../services/orderService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmationModal from '../component/UI/ConfirmationModal';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { user } = useAuth();
  const socketRef = useRef(null);

  const STATUSES = {
    PLACED: "PLACED",
    ASSIGNING: "ASSIGNING",
    ACCEPTED: "ACCEPTED",
    PICKED_UP: "PICKED_UP",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    NO_AGENT_AVAILABLE: "NO_AGENT_AVAILABLE",
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('userOnline', userId);
    });

    const handleStatusUpdate = (payload, fallbackStatus) => {
      const { orderId, status } = payload || {};
      const nextStatus = status || fallbackStatus;
      if (!orderId || !nextStatus) return;
      setOrders((prev) =>
        prev.map((order) => {
          const id = order?.id || order?._id;
          if (String(id) !== String(orderId)) return order;
          return {
            ...order,
            orderStatus: nextStatus,
          };
        }),
      );
    };

    const handlePaymentUpdate = (payload) => {
      const { orderId, paymentStatus } = payload || {};
      if (!orderId || !paymentStatus) return;
      setOrders((prev) =>
        prev.map((order) => {
          const id = order?.id || order?._id;
          if (String(id) !== String(orderId)) return order;
          return {
            ...order,
            paymentStatus,
          };
        }),
      );
    };

    const handleAgentCancel = (payload) => {
      const { orderId, status, message } = payload || {};
      if (!orderId) return;
      const nextStatus = status || STATUSES.ASSIGNING;
      setOrders((prev) =>
        prev.map((order) => {
          const id = order?.id || order?._id;
          if (String(id) !== String(orderId)) return order;
          return {
            ...order,
            orderStatus: nextStatus,
            assignedAgent: null,
          };
        }),
      );
      toast.error(message || 'Your delivery agent cancelled. Reassigning...');
    };

    socket.on('orderAccepted', (payload) => handleStatusUpdate(payload, STATUSES.ACCEPTED));
    socket.on('orderPickedUp', (payload) => handleStatusUpdate(payload, STATUSES.PICKED_UP));
    socket.on('orderOutForDelivery', (payload) => handleStatusUpdate(payload, STATUSES.OUT_FOR_DELIVERY));
    socket.on('orderDelivered', (payload) => handleStatusUpdate(payload, STATUSES.DELIVERED));
    socket.on('paymentAccepted', handlePaymentUpdate);
    socket.on('orderCancelledByAgent', handleAgentCancel);
    socket.on('noAgentAvailable', (payload) => {
      handleStatusUpdate(payload, STATUSES.NO_AGENT_AVAILABLE);
      toast.error('No delivery agent is available right now.');
    });

    return () => {
      socket.off('orderAccepted');
      socket.off('orderPickedUp');
      socket.off('orderOutForDelivery');
      socket.off('orderDelivered');
      socket.off('paymentAccepted', handlePaymentUpdate);
      socket.off('orderCancelledByAgent', handleAgentCancel);
      socket.off('noAgentAvailable');
      socket.disconnect();
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getMyOrders();
      setOrders(response.payload || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const initiateCancelOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrderId) return;
    
    try {
      const response = await orderService.cancelOrder(selectedOrderId);
      const updatedOrder = response?.payload;
      setOrders((prev) =>
        prev.map((order) => {
          const orderId = order?.id || order?._id;
          if (orderId !== selectedOrderId) return order;
          return {
            ...order,
            ...updatedOrder,
            orderStatus: updatedOrder?.orderStatus || STATUSES.CANCELLED,
          };
        }),
      );
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsModalOpen(false);
      setSelectedOrderId(null);
    }
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

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-blinkit-dark mb-6">My Orders</h1>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-blinkit-border">
            <span className="text-6xl block mb-4">🛍️</span>
            <h2 className="text-xl font-bold text-blinkit-dark mb-2">No orders yet</h2>
            <p className="text-blinkit-gray mb-6">Looks like you haven't made your first order yet.</p>
            <Link to="/" className="bg-blinkit-green text-white font-bold py-2 px-6 rounded-lg hover:bg-blinkit-green-dark transition-colors inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(orders) && orders.map((order, index) => {
               if(!order) return null;
               const orderId = order?.id || order?._id;
               const status = (order?.orderStatus || '').toUpperCase();
               return (
              <div key={orderId || index} className="bg-white rounded-xl shadow-sm border border-blinkit-border overflow-hidden">
                <div className="p-4 border-b border-blinkit-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50">
                  <div>
                    <p className="text-xs text-blinkit-gray">ORDER ID</p>
                    <p className="font-mono font-medium text-sm">#{orderId?.slice(-6).toUpperCase() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blinkit-gray">DATE</p>
                    <p className="font-medium text-sm">{order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blinkit-gray">TOTAL AMOUNT</p>
                    <p className="font-bold text-sm">₹{order?.totalAmount || 0}</p>
                  </div>
                  <div>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)} uppercase tracking-wide`}>
                      {formatStatus(status)}
                    </span>
                  </div>
                  <div>
                      <Link 
                        to={`/order/${orderId}`}
                        className="text-blinkit-green font-bold text-sm hover:underline"
                      >
                          View Details
                      </Link>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    {order?.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                         <div className="flex items-center gap-3"> 
                            <div className="w-10 h-10 bg-blinkit-light-gray rounded-lg flex items-center justify-center text-lg">
                               📦
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blinkit-dark">{item?.name || 'Item'}</p>
                                <p className="text-xs text-blinkit-gray">Qty: {item?.quantity || 0}</p>
                            </div>
                         </div>
                         <p className="text-sm font-medium">₹{(item?.price || 0) * (item?.quantity || 0)}</p>
                      </div>
                    ))}
                  </div>
                  
                  {[STATUSES.PLACED, STATUSES.ASSIGNING, STATUSES.ACCEPTED].includes(status) && (
                    <div className="mt-6 border-t border-blinkit-border pt-4 flex justify-end">
                      <button 
                        onClick={() => initiateCancelOrder(orderId)}
                        className="text-red-600 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-red-200"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </main>

      <Footer />

      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Order"
        message="Do you want to cancel this order or not?"
      />
    </div>
  );
};

export default MyOrders;
