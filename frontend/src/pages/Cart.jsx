import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../component/Layout/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LocationModal from '../component/Location/LocationModal';
import { userService } from '../services/userService';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';
import { useLocationContext } from '../context/LocationContext';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const loadPayPalSdk = (clientId, currency) => {
  return new Promise((resolve, reject) => {
    if (window.paypal) { resolve(window.paypal); return; }
    const existing = document.getElementById('paypal-sdk');
    if (existing) { existing.addEventListener('load', () => resolve(window.paypal)); existing.addEventListener('error', reject); return; }
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.body.appendChild(script);
  });
};

const steps = [
  { id: 1, label: 'Address', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { id: 2, label: 'Payment', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 3, label: 'Review', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
];

const StripeCheckout = ({
  amount,
  addressId,
  locationCoords,
  canCheckout,
  onSuccess,
  onProcessingChange,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canCheckout) {
      setError('Select address and delivery location first.');
      return;
    }
    if (!stripe || !elements) return;

    setProcessing(true);
    onProcessingChange?.(true);
    setError('');
    try {
      const createResp = await orderService.createStripeOrder({
        addressId,
        locationCoords,
      });
      const payload = createResp?.payload || {};
      const clientSecret = payload.clientSecret;
      const orderId = payload.orderId;
      const paymentIntentId = payload.paymentIntentId;

      if (!clientSecret || !orderId) {
        throw new Error('Stripe setup failed');
      }

      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result?.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      const intentId = result?.paymentIntent?.id || paymentIntentId;
      const confirmResp = await orderService.confirmStripePayment({
        orderId,
        paymentIntentId: intentId,
      });
      const order = confirmResp?.payload?.order || confirmResp?.payload;
      onSuccess(order, orderId);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Stripe payment failed');
    } finally {
      setProcessing(false);
      onProcessingChange?.(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-xl border border-blinkit-border bg-white p-3">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '14px',
                color: '#1f2937',
                fontFamily: 'inherit',
                '::placeholder': { color: '#94a3b8' },
              },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 text-white font-bold rounded-xl transition-all ${
          processing
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-blinkit-green to-blinkit-green hover:shadow-lg hover:shadow-blinkit-green/25'
        }`}
      >
        {processing ? 'Processing...' : `Pay Now — ₹${amount}`}
      </button>
    </form>
  );
};

const Cart = () => {
  const { cart, addToCart, updateQuantity, removeFromCart, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { location, isTracking } = useLocationContext();
  const [total, setTotal] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalCurrency, setPaypalCurrency] = useState('INR');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [stripeBusy, setStripeBusy] = useState(false);
  const navigate = useNavigate();
  const paypalButtonRef = useRef(null);
  const paypalButtonsInstanceRef = useRef(null);
  const paypalOrderRef = useRef(null);
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

  const handleRemoveWithUndo = (item) => {
    removeFromCart(item._id);
    toast.custom((t) => (
      <div className={`bg-white border border-blinkit-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <span className="text-sm text-blinkit-dark">Item removed</span>
        <button
          onClick={() => {
            const productId = item.productId?.id || item.productId?._id;
            if (productId) {
              addToCart(productId, item.quantity, item.productId);
            }
            toast.dismiss(t.id);
          }}
          className="text-xs font-bold text-blinkit-green"
        >
          UNDO
        </button>
      </div>
    ), { duration: 4000 });
  };

  const handleDecreaseQty = (item) => {
    if (stripeBusy) return;
    if (item.quantity <= 1) {
      handleRemoveWithUndo(item);
    } else {
      updateQuantity(item._id, item.quantity - 1);
    }
  };

  const handleIncreaseQty = (item) => {
    if (stripeBusy) return;
    const maxStocks = Number(item.productId?.stocks);
    if (Number.isFinite(maxStocks) && maxStocks > 0 && item.quantity >= maxStocks) {
      toast.error(`Only ${maxStocks} left in stock`);
      return;
    }
    updateQuantity(item._id, item.quantity + 1);
  };

  useEffect(() => {
    fetchCart();
    if (isAuthenticated) fetchAddresses();
    else { setAddresses([]); setSelectedAddress(null); }
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const response = await userService.getMyAddresses();
      const fetched = response.payload || [];
      setAddresses(fetched);
      const def = fetched.find((a) => a.isDefault);
      setSelectedAddress(def?._id || fetched[0]?._id || null);
    } catch { /* silent */ }
  };

  const filteredCart = Array.isArray(cart)
    ? cart.filter((item) => Number(item?.quantity) > 0)
    : [];

  useEffect(() => {
    const t = filteredCart.reduce(
      (a, item) => a + (item.productId?.price || 0) * item.quantity,
      0,
    );
    setTotal(t);
  }, [filteredCart]);

  const deliveryFee = total >= 199 ? 0 : 29;
  const taxes = Math.round(total * 0.05);
  const grandTotal = total + deliveryFee + taxes;
  const canCheckout = isAuthenticated && selectedAddress && location?.label;

  // PayPal setup
  useEffect(() => {
    if (paymentMethod !== 'paypal') {
      setPaypalReady(false); setPaypalError(''); setPaypalProcessing(false);
      if (paypalButtonsInstanceRef.current) { paypalButtonsInstanceRef.current.close(); paypalButtonsInstanceRef.current = null; }
      if (paypalButtonRef.current) paypalButtonRef.current.innerHTML = '';
      return;
    }
    let cancelled = false;
    const setup = async () => {
      if (!isAuthenticated) { setPaypalLoading(false); setPaypalReady(false); return; }
      setPaypalLoading(true); setPaypalError('');
      try {
        let cid = paypalClientId, cur = paypalCurrency;
        if (!cid) {
          const r = await orderService.getPaypalClientConfig();
          cid = r?.payload?.clientId; cur = r?.payload?.currency || 'INR';
          if (!cid) throw new Error('PayPal not configured');
          if (!cancelled) { setPaypalClientId(cid); setPaypalCurrency(cur); }
        }
        await loadPayPalSdk(cid, cur);
        if (!cancelled) setPaypalReady(true);
      } catch (e) { if (!cancelled) { setPaypalReady(false); setPaypalError(e?.response?.data?.message || e?.message || 'Failed to load PayPal'); } }
      finally { if (!cancelled) setPaypalLoading(false); }
    };
    setup();
    return () => { cancelled = true; };
  }, [paymentMethod, paypalClientId, paypalCurrency, isAuthenticated]);

  useEffect(() => {
    if (paymentMethod !== 'paypal' || !paypalReady || !window.paypal || !paypalButtonRef.current) return;
    if (paypalButtonsInstanceRef.current) { paypalButtonsInstanceRef.current.close(); paypalButtonsInstanceRef.current = null; }
    paypalButtonRef.current.innerHTML = '';
    const buttons = window.paypal.Buttons({
      style: { layout: 'vertical', shape: 'rect', label: 'paypal' },
      createOrder: async (data, actions) => {
        if (!canCheckout) { toast.error('Please select address and location.'); return actions.reject(); }
        try {
          setPaypalProcessing(true);
          const r = await orderService.createPaypalOrder({ addressId: selectedAddress, locationCoords: location?.coords });
          const p = r?.payload;
          if (!p?.paypalOrderId || !p?.orderId) throw new Error('Failed');
          paypalOrderRef.current = { orderId: p.orderId, paypalOrderId: p.paypalOrderId };
          return p.paypalOrderId;
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); return actions.reject(); }
        finally { setPaypalProcessing(false); }
      },
      onApprove: async (data) => {
        try {
          setPaypalProcessing(true);
          const oid = paypalOrderRef.current?.orderId;
          const r = await orderService.capturePaypalOrder({ orderId: oid, paypalOrderId: data.orderID });
          const order = r?.payload?.order || r?.payload;
          const rid = order?.id || order?._id || oid;
          await fetchCart();
          navigate(rid ? `/order-success?orderId=${rid}` : '/order-success', { state: { order } });
        } catch (e) { toast.error(e.response?.data?.message || 'Capture failed'); }
        finally { setPaypalProcessing(false); }
      },
      onCancel: () => { setPaypalProcessing(false); toast.error('Payment cancelled'); },
      onError: (err) => { setPaypalProcessing(false); toast.error(err?.message || 'PayPal failed'); },
    });
    if (buttons.isEligible()) { buttons.render(paypalButtonRef.current); paypalButtonsInstanceRef.current = buttons; }
    else setPaypalError('PayPal unavailable in this browser.');
    return () => { if (paypalButtonsInstanceRef.current) { paypalButtonsInstanceRef.current.close(); paypalButtonsInstanceRef.current = null; } };
  }, [paymentMethod, paypalReady, canCheckout, selectedAddress, location, fetchCart, navigate]);

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'paypal' || paymentMethod === 'stripe') return;
    if (!isAuthenticated) { navigate('/login', { state: { from: '/cart' } }); return; }
    if (!location?.label) { toast.error('Please detect your delivery location.'); setShowLocationModal(true); return; }
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    setLoading(true);
    try {
      const r = await orderService.createOrder({ addressId: selectedAddress, paymentMethod, locationCoords: location?.coords });
      const order = r?.payload;
      const oid = order?.id || order?._id;
      navigate(oid ? `/order-success?orderId=${oid}` : '/order-success', { state: { order } });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to place order'); }
    finally { setLoading(false); }
  };

  /* Empty Cart */
  if (!filteredCart || filteredCart.length === 0) {
    return (
      <div className="min-h-screen bg-blinkit-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-48 h-48 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blinkit-border">
            <span className="text-7xl">🛒</span>
          </div>
          <h2 className="text-2xl font-bold text-blinkit-dark mb-2">Your cart is empty</h2>
          <p className="text-blinkit-gray mb-6 text-sm">Add fresh groceries to your cart and checkout</p>
          <Link to="/" className="px-8 py-3 bg-gradient-to-r from-blinkit-green to-blinkit-green text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blinkit-green/25 transition-all hover:-translate-y-0.5 active:scale-95">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const selectedAddressObj = addresses.find((a) => a._id === selectedAddress);

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blinkit-dark">Checkout</h1>
          <Link to="/" className="text-sm text-blinkit-green font-semibold hover:underline">
            ← Continue Shopping
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-2xl border border-blinkit-border p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={`step-dot transition-all ${
                    currentStep >= step.id
                      ? 'bg-blinkit-green text-white shadow-md'
                      : 'bg-blinkit-light-gray text-blinkit-gray'
                  }`}>
                    {currentStep > step.id ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${currentStep >= step.id ? 'text-blinkit-dark' : 'text-blinkit-gray'}`}>
                    {step.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`step-line mx-2 ${currentStep > step.id ? 'bg-blinkit-green' : 'bg-blinkit-border'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-5">

            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="animate-fade-in-up space-y-5">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blinkit-border shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg text-blinkit-dark">Delivery Address</h2>
                    <Link to="/addresses" className="text-blinkit-green text-sm font-bold hover:underline">+ Add New</Link>
                  </div>
                  {!isAuthenticated ? (
                    <div className="text-center py-6 bg-blinkit-light-gray rounded-xl border border-dashed border-blinkit-border">
                      <p className="text-sm text-blinkit-gray mb-2">Login to add a delivery address</p>
                      <Link to="/login" className="text-blinkit-green font-bold text-sm">Login →</Link>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-6 bg-blinkit-light-gray rounded-xl border border-dashed border-blinkit-border">
                      <p className="text-sm text-blinkit-gray mb-2">No addresses found</p>
                      <Link to="/addresses" className="text-blinkit-green font-bold text-sm">Add address →</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <label
                          key={addr._id}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedAddress === addr._id
                              ? 'border-blinkit-green bg-blinkit-green text-white'
                              : 'border-blinkit-border hover:border-blinkit-gray'
                          }`}
                        >
                          <input type="radio" name="address" value={addr._id} checked={selectedAddress === addr._id} onChange={() => setSelectedAddress(addr._id)} className="mt-1 w-4 h-4 text-blinkit-green focus:ring-blinkit-green" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-bold text-sm ${selectedAddress === addr._id ? 'text-white' : 'text-blinkit-dark'}`}>{addr.fullName}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                selectedAddress === addr._id
                                  ? 'bg-white/90 text-blinkit-green'
                                  : addr.type === 'home'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}>
                                {addr.type}
                              </span>
                            </div>
                            <p className={`text-sm ${selectedAddress === addr._id ? 'text-white/80' : 'text-blinkit-gray'}`}>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} - {addr.pincode || addr.postalCode}</p>
                            <p className={`text-xs font-medium mt-1 ${selectedAddress === addr._id ? 'text-white/90' : 'text-blinkit-dark'}`}>📞 {addr.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blinkit-border shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-lg text-blinkit-dark">Delivery Location</h2>
                      <p className="text-xs text-blinkit-gray mt-1">{location?.label || (isTracking ? 'Live GPS active' : 'Detect location to continue')}</p>
                    </div>
                    <button onClick={() => setShowLocationModal(true)} className="px-4 py-2 text-xs font-bold rounded-xl transition-all bg-gradient-to-r from-blinkit-green to-blinkit-green text-white hover:shadow-lg hover:shadow-blinkit-green/25">
                      {location?.label ? 'Update' : 'Detect'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { if (selectedAddress && location?.label) setCurrentStep(2); else toast.error('Select address & location first'); }}
                  className="w-full py-3.5 bg-blinkit-green text-white font-bold rounded-xl hover:brightness-95 transition-colors"
                >
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="animate-fade-in-up space-y-5">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blinkit-border shadow-sm">
                  <h2 className="font-bold text-lg text-blinkit-dark mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                      { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: '💵' },
                      { id: 'paypal', label: 'PayPal', desc: 'Pay securely online', icon: '💳' },
                      { id: 'stripe', label: 'Card (Stripe)', desc: 'Pay with debit/credit card', icon: '💳' },
                    ].map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === pm.id
                            ? 'border-blinkit-green bg-blinkit-green text-white'
                            : 'border-blinkit-border hover:border-blinkit-gray'
                        }`}
                      >
                        <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blinkit-green focus:ring-blinkit-green" />
                        <span className="text-2xl">{pm.icon}</span>
                        <div>
                          <span className={`font-semibold text-sm block ${paymentMethod === pm.id ? 'text-white' : 'text-blinkit-dark'}`}>{pm.label}</span>
                          <span className={`text-xs ${paymentMethod === pm.id ? 'text-white/80' : 'text-blinkit-gray'}`}>{pm.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === 'paypal' && (
                    <div className="mt-4 border border-blinkit-border rounded-xl p-4 bg-blinkit-light-gray">
                      {!isAuthenticated && <p className="text-xs text-red-500 font-medium mb-2">Please login to pay with PayPal.</p>}
                      {paypalLoading && (
                        <div className="flex items-center gap-2 text-xs text-blinkit-gray"><div className="w-4 h-4 border-2 border-blinkit-green border-t-transparent rounded-full animate-spin" />Loading PayPal...</div>
                      )}
                      {paypalError && <p className="text-xs text-red-500 font-medium">{paypalError}</p>}
                      {paypalProcessing && (
                        <div className="flex items-center gap-2 text-xs text-blinkit-gray"><div className="w-4 h-4 border-2 border-blinkit-green border-t-transparent rounded-full animate-spin" />Processing...</div>
                      )}
                      <div ref={paypalButtonRef} className="mt-3" />
                    </div>
                  )}
                  {paymentMethod === 'stripe' && (
                    <div className="mt-4 border border-blinkit-border rounded-xl p-4 bg-blinkit-light-gray">
                      {!stripeKey && (
                        <p className="text-xs text-red-500 font-medium">
                          Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY.
                        </p>
                      )}
                      <p className="text-xs text-blinkit-gray">
                        You will enter card details in the review step.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(1)} className="flex-1 py-3 border-2 border-blinkit-border text-blinkit-dark font-bold rounded-xl hover:bg-blinkit-light-gray transition-colors">
                    ← Back
                  </button>
                  <button onClick={() => setCurrentStep(3)} className="flex-1 py-3 bg-blinkit-green text-white font-bold rounded-xl hover:brightness-95 transition-colors">
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="animate-fade-in-up space-y-5">
                {/* Delivery info */}
                {selectedAddressObj && (
                  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blinkit-border shadow-sm">
                    <h2 className="font-bold text-lg text-blinkit-dark mb-3">Delivering to</h2>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blinkit-green flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-blinkit-dark">{selectedAddressObj.fullName}</p>
                        <p className="text-sm text-blinkit-gray">{selectedAddressObj.addressLine1}, {selectedAddressObj.city} - {selectedAddressObj.pincode || selectedAddressObj.postalCode}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blinkit-border shadow-sm">
                  <h2 className="font-bold text-lg text-blinkit-dark mb-4">Items ({filteredCart.length})</h2>
                  <div className="space-y-0 divide-y divide-blinkit-border">
                    {filteredCart.map((item) => (
                      <div key={item._id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                        <div className="w-14 h-14 bg-blinkit-light-gray rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-blinkit-border">
                          {item.productId?.images?.[0]?.url ? (
                            <img src={item.productId.images[0].url} alt="" className="w-full h-full object-contain p-1 mix-blend-multiply" />
                          ) : <span className="text-xl">📦</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-blinkit-dark truncate">{item.productId?.name || 'Product'}</h3>
                          <p className="text-xs text-blinkit-gray">{item.productId?.weight || '1 unit'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-blinkit-green rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleDecreaseQty(item)}
                              disabled={stripeBusy}
                              className="qty-btn text-white w-7 h-7 hover:bg-white/20 disabled:opacity-60"
                            >
                              −
                            </button>
                            <span className="text-white font-bold text-xs w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleIncreaseQty(item)}
                              disabled={stripeBusy}
                              className="qty-btn text-white w-7 h-7 hover:bg-white/20 disabled:opacity-60"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-sm text-blinkit-dark w-14 text-right">₹{(item.productId?.price || 0) * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setCurrentStep(2)} className="w-full py-3 border-2 border-blinkit-border text-blinkit-dark font-bold rounded-xl hover:bg-blinkit-light-gray transition-colors">
                  ← Back to Payment
                </button>
              </div>
            )}
          </div>

          {/* Right Column — Bill Summary */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blinkit-border shadow-sm lg:sticky top-24 space-y-5">
              <h2 className="font-bold text-lg text-blinkit-dark">Bill Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-blinkit-gray">Item Total ({filteredCart.length} items)</span>
                  <span className="font-medium text-blinkit-dark">₹{total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blinkit-gray">Delivery Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="text-blinkit-green font-semibold">FREE</span>
                  ) : (
                    <span className="font-medium text-blinkit-dark">₹{deliveryFee}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-blinkit-gray">Taxes & Charges</span>
                  <span className="font-medium text-blinkit-dark">₹{taxes}</span>
                </div>
                <div className="border-t border-dashed border-blinkit-border my-1" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-blinkit-dark">Total</span>
                  <span className="text-blinkit-dark">₹{grandTotal}</span>
                </div>
              </div>

              {deliveryFee === 0 && (
                <div className="bg-blinkit-green rounded-xl px-4 py-2.5 flex items-center gap-2 text-white">
                  <span className="text-white text-sm">🎉</span>
                  <p className="text-xs text-white/90 font-semibold">You saved ₹29 in delivery fee!</p>
                </div>
              )}

              {paymentMethod === 'stripe' && currentStep === 3 && (
                <div className="border border-blinkit-border rounded-xl p-4 bg-blinkit-light-gray">
                  {!stripeKey ? (
                    <p className="text-xs text-red-500 font-medium">
                      Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY.
                    </p>
                  ) : (
                    <Elements stripe={stripePromise}>
                      <StripeCheckout
                        amount={grandTotal}
                        addressId={selectedAddress}
                        locationCoords={location?.coords}
                        canCheckout={canCheckout}
                        onProcessingChange={setStripeBusy}
                        onSuccess={async (order, fallbackId) => {
                          const oid = order?.id || order?._id || fallbackId;
                          await fetchCart();
                          navigate(oid ? `/order-success?orderId=${oid}` : '/order-success', {
                            state: { order },
                          });
                        }}
                      />
                    </Elements>
                  )}
                </div>
              )}

              {/* Place Order Button */}
              {paymentMethod === 'cod' && currentStep === 3 && (
                <>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || !canCheckout}
                    className={`w-full py-4 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base ${
                      loading || !canCheckout
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blinkit-green to-blinkit-green hover:shadow-lg hover:shadow-blinkit-green/25 hover:-translate-y-0.5 active:scale-[0.98]'
                    }`}
                  >
                    {loading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Placing Order...</>
                    ) : (
                      <>Place Order — ₹{grandTotal}</>
                    )}
                  </button>
                  {isAuthenticated && !canCheckout && (
                    <p className="text-xs text-red-500 text-center font-medium">
                      {!selectedAddress ? 'Select a delivery address' : 'Detect your delivery location'}
                    </p>
                  )}
                </>
              )}

              {currentStep < 3 && (
              <div className="border-t border-blinkit-border pt-4">
                {/* Editable cart preview (available in every step) */}
                <p className="text-xs font-semibold text-blinkit-gray uppercase tracking-wider mb-3">Cart Preview</p>
                {filteredCart.length === 0 ? (
                  <p className="text-xs text-blinkit-gray">Your cart is empty.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {filteredCart.map((item) => (
                      <div key={item._id} className="flex items-center gap-2 text-xs">
                        <div className="w-9 h-9 bg-blinkit-light-gray rounded-lg overflow-hidden flex-shrink-0 border border-blinkit-border">
                          {item.productId?.images?.[0]?.url ? (
                            <img src={item.productId.images[0].url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-base">N/A</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-blinkit-dark font-semibold">{item.productId?.name}</p>
                          <p className="text-[10px] text-blinkit-gray">₹{item.productId?.price || 0} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-blinkit-green rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleDecreaseQty(item)}
                              disabled={stripeBusy}
                              className="qty-btn text-white w-6 h-6 hover:bg-white/20 disabled:opacity-60"
                            >
                              −
                            </button>
                            <span className="text-white font-bold text-[10px] w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleIncreaseQty(item)}
                              disabled={stripeBusy}
                              className="qty-btn text-white w-6 h-6 hover:bg-white/20 disabled:opacity-60"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveWithUndo(item)}
                            disabled={stripeBusy}
                            className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LocationModal open={showLocationModal} onClose={() => setShowLocationModal(false)} />
    </div>
  );
};

export default Cart;





