import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../component/Layout/Navbar';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import Footer from '../component/Layout/Footer';
import { orderService } from '../services/orderService';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderId = searchParams.get('orderId');
  const order = location.state?.order;
  const [showCheck, setShowCheck] = useState(false);
  const [orderData, setOrderData] = useState(order || null);
  const [statusLoading, setStatusLoading] = useState(Boolean(orderId));
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      if (!orderId) {
        setStatusLoading(false);
        return;
      }
      try {
        setStatusLoading(true);
        const response = await orderService.getOrderById(orderId);
        if (!mounted) return;
        setOrderData(response?.payload || order || null);
        setStatusError('');
      } catch (error) {
        if (!mounted) return;
        setStatusError(error?.message || 'Unable to fetch order status');
      } finally {
        if (mounted) setStatusLoading(false);
      }
    };
    fetchStatus();
    return () => { mounted = false; };
  }, [orderId]);

  const orderStatus = useMemo(() => {
    const raw = orderData?.orderStatus || order?.orderStatus;
    return String(raw || 'PLACED').toUpperCase();
  }, [orderData, order]);

  const isAssigning = ['PLACED', 'ASSIGNING'].includes(orderStatus);
  const isAccepted = ['ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(orderStatus);
  const isNoAgent = orderStatus === 'NO_AGENT_AVAILABLE';

  useEffect(() => {
    if (!orderId || !isAssigning) return undefined;
    const interval = setInterval(async () => {
      try {
        const response = await orderService.getOrderById(orderId);
        setOrderData(response?.payload || orderData);
      } catch {
        // keep silent during polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId, isAssigning]);

  useEffect(() => {
    if (!isAccepted) return;
    const timer = setTimeout(() => setShowCheck(true), 300);
    return () => clearTimeout(timer);
  }, [isAccepted]);

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-blinkit-border shadow-sm p-8 sm:p-12 max-w-md w-full text-center animate-scale-in">
          {/* Animated Checkmark */}
          <div className="w-24 h-24 mx-auto mb-6 relative">
            {isAccepted ? (
              <svg className="w-24 h-24" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                {showCheck && <path className="checkmark-check" fill="none" stroke="#40513B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8" />}
              </svg>
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-blinkit-green/40 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-blinkit-green border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {isAccepted ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-blinkit-dark mb-2">Order Placed! 🎉</h1>
              <p className="text-blinkit-gray text-sm mb-6">Your groceries are on their way</p>
            </>
          ) : isNoAgent ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-blinkit-dark mb-2">No Agent Available</h1>
              <p className="text-blinkit-gray text-sm mb-6">We could not find a delivery partner right now.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-blinkit-dark mb-2">Finding a delivery agent...</h1>
              <p className="text-blinkit-gray text-sm mb-6">Hang tight! We're assigning the nearest available partner.</p>
            </>
          )}

          {orderId && (
            <div className="bg-blinkit-light-gray rounded-xl p-4 mb-6">
              <p className="text-xs text-blinkit-gray mb-1">Order ID</p>
              <p className="text-sm font-bold text-blinkit-dark font-mono">{orderId}</p>
            </div>
          )}

          {isAccepted ? (
            <div className="flex items-center justify-center gap-3 bg-blinkit-green rounded-xl p-4 mb-6 text-white">
              <span className="text-2xl">🚀</span>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Estimated Delivery</p>
                <p className="text-xs text-white/80 font-semibold">10-15 minutes</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 bg-blinkit-green rounded-xl p-4 mb-6 text-white">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">Finding a delivery agent</p>
                <p className="text-xs text-white/80 font-semibold">This usually takes a few moments</p>
              </div>
            </div>
          )}

          {orderData?.items && orderData.items.length > 0 && (
            <div className="border-t border-blinkit-border pt-4 mb-6">
              <p className="text-xs text-blinkit-gray mb-2">{orderData.items.length} item(s) ordered</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {orderId && isAccepted && (
              <Link to={`/order/${orderId}`} className="flex-1 py-3 bg-gradient-to-r from-blinkit-green to-blinkit-green text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm">
                Track Order
              </Link>
            )}
            <Link to="/" className="flex-1 py-3 border-2 border-blinkit-border text-blinkit-dark font-bold rounded-xl hover:bg-blinkit-light-gray transition-colors text-sm">
              Continue Shopping
            </Link>
          </div>

          {statusError && (
            <p className="mt-4 text-xs text-red-500 font-medium text-center">
              {statusError}
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderSuccess;





