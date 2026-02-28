import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';
import LocationModal from '../component/Location/LocationModal';
import { userService } from '../services/userService';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';
import { useLocationContext } from '../context/LocationContext';

const loadPayPalSdk = (clientId, currency) => {
    return new Promise((resolve, reject) => {
        if (window.paypal) {
            resolve(window.paypal);
            return;
        }

        const existing = document.getElementById('paypal-sdk');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.paypal));
            existing.addEventListener('error', reject);
            return;
        }

        const script = document.createElement('script');
        script.id = 'paypal-sdk';
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
        script.async = true;
        script.onload = () => resolve(window.paypal);
        script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
        document.body.appendChild(script);
    });
};

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, fetchCart } = useCart();
    const { isAuthenticated } = useAuth();
    const { location, isTracking } = useLocationContext();
    const [total, setTotal] = useState(0);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [paypalLoading, setPaypalLoading] = useState(false);
    const [paypalReady, setPaypalReady] = useState(false);
    const [paypalError, setPaypalError] = useState('');
    const [paypalProcessing, setPaypalProcessing] = useState(false);
    const [paypalClientId, setPaypalClientId] = useState('');
    const [paypalCurrency, setPaypalCurrency] = useState('INR');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const navigate = useNavigate();
    const paypalButtonRef = useRef(null);
    const paypalButtonsInstanceRef = useRef(null);
    const paypalOrderRef = useRef(null);

    useEffect(() => {
        fetchCart();
        if (isAuthenticated) {
            fetchAddresses();
        } else {
            setAddresses([]);
            setSelectedAddress(null);
        }
    }, [isAuthenticated]);

    const fetchAddresses = async () => {
        try {
            const response = await userService.getMyAddresses();
            const fetchedAddresses = response.payload || [];
            setAddresses(fetchedAddresses);

            // Set default address if available
            const defaultAddress = fetchedAddresses.find(addr => addr.isDefault);
            if (defaultAddress) {
                setSelectedAddress(defaultAddress._id);
            } else if (fetchedAddresses.length > 0) {
                setSelectedAddress(fetchedAddresses[0]._id);
            }
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        }
    };

    useEffect(() => {
        const newTotal = cart.reduce((acc, item) => {
             const price = item.productId?.price || 0;
             return acc + price * item.quantity;
        }, 0);
        setTotal(newTotal);
    }, [cart]);

    const canCheckout = isAuthenticated && selectedAddress && location?.label;

    useEffect(() => {
        if (paymentMethod !== 'paypal') {
            setPaypalReady(false);
            setPaypalError('');
            setPaypalProcessing(false);
            if (paypalButtonsInstanceRef.current) {
                paypalButtonsInstanceRef.current.close();
                paypalButtonsInstanceRef.current = null;
            }
            if (paypalButtonRef.current) {
                paypalButtonRef.current.innerHTML = '';
            }
            return;
        }

        let cancelled = false;

        const setupPayPal = async () => {
            if (!isAuthenticated) {
                setPaypalLoading(false);
                setPaypalReady(false);
                setPaypalError('');
                return;
            }
            setPaypalLoading(true);
            setPaypalError('');
            try {
                let clientId = paypalClientId;
                let currency = paypalCurrency;

                if (!clientId) {
                    const response = await orderService.getPaypalClientConfig();
                    clientId = response?.payload?.clientId;
                    currency = response?.payload?.currency || 'INR';
                    if (!clientId) {
                        throw new Error('PayPal client id not configured');
                    }
                    if (!cancelled) {
                        setPaypalClientId(clientId);
                        setPaypalCurrency(currency);
                    }
                }

                await loadPayPalSdk(clientId, currency);
                if (!cancelled) {
                    setPaypalReady(true);
                }
            } catch (error) {
                if (!cancelled) {
                    setPaypalReady(false);
                    setPaypalError(
                        error?.response?.data?.message || error?.message || 'Failed to load PayPal',
                    );
                }
            } finally {
                if (!cancelled) {
                    setPaypalLoading(false);
                }
            }
        };

        setupPayPal();

        return () => {
            cancelled = true;
        };
    }, [paymentMethod, paypalClientId, paypalCurrency, isAuthenticated]);

    useEffect(() => {
        if (paymentMethod !== 'paypal') return;
        if (!paypalReady || !window.paypal || !paypalButtonRef.current) return;

        if (paypalButtonsInstanceRef.current) {
            paypalButtonsInstanceRef.current.close();
            paypalButtonsInstanceRef.current = null;
        }

        paypalButtonRef.current.innerHTML = '';

        const buttons = window.paypal.Buttons({
            style: {
                layout: 'vertical',
                shape: 'rect',
                label: 'paypal',
            },
            createOrder: async (data, actions) => {
                if (!canCheckout) {
                    toast.error('Please select address and detect location first.');
                    return actions.reject();
                }

                try {
                    setPaypalProcessing(true);
                    const response = await orderService.createPaypalOrder({
                        addressId: selectedAddress,
                        locationCoords: location?.coords,
                    });
                    const payload = response?.payload;
                    if (!payload?.paypalOrderId || !payload?.orderId) {
                        throw new Error('Failed to create PayPal order');
                    }
                    paypalOrderRef.current = {
                        orderId: payload.orderId,
                        paypalOrderId: payload.paypalOrderId,
                    };
                    return payload.paypalOrderId;
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to create PayPal order');
                    return actions.reject();
                } finally {
                    setPaypalProcessing(false);
                }
            },
            onApprove: async (data) => {
                try {
                    setPaypalProcessing(true);
                    const localOrderId = paypalOrderRef.current?.orderId;
                    const response = await orderService.capturePaypalOrder({
                        orderId: localOrderId,
                        paypalOrderId: data.orderID,
                    });
                    const payload = response?.payload;
                    const order = payload?.order || payload;
                    const resolvedOrderId = order?.id || order?._id || localOrderId;
                    await fetchCart();
                    if (resolvedOrderId) {
                        navigate(`/order-success?orderId=${resolvedOrderId}`, {
                            state: { order },
                        });
                    } else {
                        navigate('/order-success');
                    }
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Payment capture failed');
                } finally {
                    setPaypalProcessing(false);
                }
            },
            onCancel: () => {
                setPaypalProcessing(false);
                toast.error('PayPal payment cancelled');
            },
            onError: (err) => {
                setPaypalProcessing(false);
                const message =
                    err?.message ||
                    err?.details?.[0]?.description ||
                    'PayPal payment failed';
                toast.error(message);
            },
        });

        if (buttons.isEligible()) {
            buttons.render(paypalButtonRef.current);
            paypalButtonsInstanceRef.current = buttons;
        } else {
            setPaypalError('PayPal is not available in this browser.');
        }

        return () => {
            if (paypalButtonsInstanceRef.current) {
                paypalButtonsInstanceRef.current.close();
                paypalButtonsInstanceRef.current = null;
            }
        };
    }, [paymentMethod, paypalReady, canCheckout, selectedAddress, location, fetchCart, navigate]);

    const handlePlaceOrder = async () => {
        if (paymentMethod === 'paypal') {
            return;
        }
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/cart' } });
            return;
        }
        if (!location?.label) {
            toast.error("Please detect your delivery location.");
            setShowLocationModal(true);
            return;
        }
        if (!selectedAddress) {
            toast.error("Please select a delivery address");
            return;
        }

        setLoading(true);
        try {
            const response = await orderService.createOrder({
                addressId: selectedAddress,
                paymentMethod: paymentMethod,
                locationCoords: location?.coords
            });
            const createdOrder = response?.payload;
            const orderId = createdOrder?.id || createdOrder?._id;
            if (orderId) {
                navigate(`/order-success?orderId=${orderId}`, {
                    state: { order: createdOrder },
                });
            } else {
                navigate('/order-success');
            }
            // Cart will be cleared on backend, context refresh might be needed or page reload
            // fetchCart(); // Ideally fetchCart should be called or context updated, but navigation away happens anyway.
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to place order");
        } finally {
            setLoading(false);
        }
    };

    if (!cart || cart.length === 0) {
        return (
            <div className="min-h-screen bg-blinkit-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="w-64 h-64 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                        <span className="text-8xl">🛒</span>
                    </div>
                    <h2 className="text-2xl font-bold text-blinkit-dark mb-2">Your Cart is Empty</h2>
                    <p className="text-blinkit-gray mb-8">Add products to your cart to start shopping</p>
                    <Link to="/" className="px-8 py-3 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-colors">
                        Start Shopping
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blinkit-bg flex flex-col">
            <Navbar />
            <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
                <h1 className="text-2xl font-bold text-blinkit-dark mb-6">Checkout</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Cart & Address */}
                    <div className="flex-1 space-y-6">

                        {/* Address Selection */}
                        <div className="bg-white p-6 rounded-xl border border-blinkit-border shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-lg text-blinkit-dark">Delivery Address</h2>
                                <Link to="/addresses" className="text-blinkit-green text-sm font-bold hover:underline">+ Add New</Link>
                            </div>

                            {!isAuthenticated ? (
                                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500 mb-2">Login required to add a delivery address.</p>
                                    <Link to="/login" className="text-blinkit-green font-bold text-sm">Login to continue</Link>
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500 mb-2">No addresses found.</p>
                                    <Link to="/addresses" className="text-blinkit-green font-bold text-sm">Add an address to proceed</Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map((addr) => (
                                        <label key={addr._id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedAddress === addr._id ? 'border-blinkit-green bg-green-50' : 'border-blinkit-border hover:border-gray-300'}`}>
                                            <input
                                                type="radio"
                                                name="address"
                                                value={addr._id}
                                                checked={selectedAddress === addr._id}
                                                onChange={() => setSelectedAddress(addr._id)}
                                                className="mt-1 w-4 h-4 text-blinkit-green focus:ring-blinkit-green"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-blinkit-dark">{addr.fullName}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${addr.type === 'home' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {addr.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-blinkit-gray mb-1">
                                                    {addr.addressLine1}, {addr.addressLine2 ? addr.addressLine2 + ', ' : ''}{addr.city}, {addr.state} - {addr.pincode || addr.postalCode}
                                                </p>
                                                <p className="text-xs text-blinkit-dark font-medium">Phone: {addr.phone}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Location Detection */}
                        <div className="bg-white p-6 rounded-xl border border-blinkit-border shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-bold text-lg text-blinkit-dark">Detect Location</h2>
                                    <p className="text-xs text-blinkit-gray mt-1">
                                        {location?.label || (isTracking ? 'Live GPS active' : 'Detect your delivery location to continue.')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowLocationModal(true)}
                                    className="px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors bg-blinkit-green text-white hover:bg-blinkit-green-dark"
                                >
                                    {location?.label ? 'Update Location' : 'Detect Location'}
                                </button>
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="bg-white p-6 rounded-xl border border-blinkit-border shadow-sm">
                             <h2 className="font-bold text-lg text-blinkit-dark mb-4">Items in Cart ({cart.length})</h2>
                             <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={item._id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center py-4 border-b last:border-0 border-gray-100">
                                        <div className="flex gap-3 w-full sm:w-auto flex-1">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blinkit-light-gray rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border border-gray-200">
                                                {item.productId?.images && item.productId.images.length > 0 ? (
                                                    <img src={item.productId.images[0].url} alt={item.productId.name} className="w-full h-full object-contain p-1 mix-blend-multiply" />
                                                ) : (
                                                    <span className="text-xl sm:text-2xl text-gray-400">📦</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                                                <h3 className="font-semibold text-blinkit-dark line-clamp-2 text-sm sm:text-base leading-snug">{item.productId?.name || 'Product'}</h3>
                                                <p className="text-xs text-blinkit-gray mt-1">{item.productId?.weight || '1 unit'}</p>
                                                <div className="font-bold text-sm text-blinkit-dark mt-1 sm:hidden">₹{item.productId?.price * item.quantity || 0}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                            <div className="flex items-center gap-2 bg-blinkit-green/10 sm:bg-blinkit-green text-blinkit-green sm:text-white rounded-lg px-2 py-1 shadow-sm border border-blinkit-green/20 sm:border-transparent">
                                                <button
                                                    onClick={() => {
                                                        if (item.quantity <= 1) {
                                                            removeFromCart(item._id);
                                                        } else {
                                                            updateQuantity(item._id, item.quantity - 1);
                                                        }
                                                    }}
                                                    className="w-6 h-6 flex items-center justify-center font-bold text-lg hover:bg-black/5 sm:hover:bg-white/20 rounded transition-colors"
                                                    aria-label="Decrease quantity"
                                                >−</button>
                                                <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                    className="w-6 h-6 flex items-center justify-center font-bold text-lg hover:bg-black/5 sm:hover:bg-white/20 rounded transition-colors"
                                                    aria-label="Increase quantity"
                                                >+</button>
                                            </div>
                                            <div className="hidden sm:block font-bold text-sm sm:text-base text-blinkit-dark w-16 text-right">
                                                ₹{item.productId?.price * item.quantity || 0}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item._id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-2 sm:mr-0"
                                                aria-label="Remove item"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Right Column - Payment & Bill */}
                    <div className="w-full lg:w-96 shrink-0 mt-6 lg:mt-0">
                        <div className="bg-white p-4 sm:p-6 rounded-xl border border-blinkit-border shadow-sm lg:sticky top-24 space-y-4 sm:space-y-6">

                            {/* Payment Method */}
                            <div>
                                <h2 className="font-bold text-lg mb-3">Payment Method</h2>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === 'cod' ? 'border-blinkit-green bg-green-50' : 'border-blinkit-border'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-4 h-4 text-blinkit-green focus:ring-blinkit-green"
                                        />
                                        <span className="font-medium text-sm">Cash on Delivery</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === 'paypal' ? 'border-blinkit-green bg-green-50' : 'border-blinkit-border'}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="paypal"
                                            checked={paymentMethod === 'paypal'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-4 h-4 text-blinkit-green focus:ring-blinkit-green"
                                        />
                                        <div>
                                            <span className="font-medium text-sm block">PayPal</span>
                                            <span className="text-[10px] text-gray-500">Pay securely with PayPal</span>
                                        </div>
                                    </label>
                                    {paymentMethod === 'paypal' && (
                                        <div className="border border-blinkit-border rounded-lg p-3 bg-gray-50">
                                            {!isAuthenticated && (
                                                <p className="text-xs text-red-500 font-medium">
                                                    Please login to pay with PayPal.
                                                </p>
                                            )}
                                            {paypalLoading && (
                                                <div className="flex items-center gap-2 text-xs text-blinkit-gray">
                                                    <div className="w-4 h-4 border-2 border-blinkit-green border-t-transparent rounded-full animate-spin"></div>
                                                    Loading PayPal...
                                                </div>
                                            )}
                                            {paypalError && (
                                                <p className="text-xs text-red-500 font-medium">{paypalError}</p>
                                            )}
                                            {paypalProcessing && (
                                                <div className="flex items-center gap-2 text-xs text-blinkit-gray">
                                                    <div className="w-4 h-4 border-2 border-blinkit-green border-t-transparent rounded-full animate-spin"></div>
                                                    Processing payment...
                                                </div>
                                            )}
                                            <div ref={paypalButtonRef} className="mt-3"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-blinkit-border"></div>

                            {/* Bill Details */}
                            <div>
                                <h2 className="font-bold text-lg mb-3">Bill Details</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-blinkit-gray">Item Total</span>
                                        <span>₹{total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blinkit-gray">Delivery Charge</span>
                                        <span className="text-blinkit-green">Free</span>
                                    </div>
                                    <div className="border-t border-dashed border-blinkit-border my-2"></div>
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>To Pay</span>
                                        <span>₹{total}</span>
                                    </div>
                                </div>
                            </div>

                            {paymentMethod === 'cod' && (
                                <>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={loading || (isAuthenticated && (!selectedAddress || !location?.label))}
                                        className={`w-full py-3.5 sm:py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-base sm:text-lg
                                            ${loading || (isAuthenticated && (!selectedAddress || !location?.label)) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blinkit-green hover:bg-blinkit-green-dark hover:shadow-xl hover:-translate-y-0.5'}`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Placing Order...</span>
                                            </>
                                        ) : (
                                            <span>Place Order</span>
                                        )}
                                    </button>
                                    {isAuthenticated && (!selectedAddress || !location?.label) && (
                                        <p className="text-xs text-red-500 text-center font-medium">
                                            {!selectedAddress ? 'Please select a delivery address' : 'Please detect your delivery location'}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            <LocationModal open={showLocationModal} onClose={() => setShowLocationModal(false)} />
        </div>
    );
};

export default Cart;
