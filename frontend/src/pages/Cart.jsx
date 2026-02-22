import React, { useEffect, useState } from 'react';
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

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, fetchCart } = useCart();
    const { isAuthenticated } = useAuth();
    const { location, isTracking } = useLocationContext();
    const [total, setTotal] = useState(0);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const navigate = useNavigate();

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

    const handlePlaceOrder = async () => {
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
                                    <div key={item._id} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-blinkit-light-gray rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                             {item.productId?.images && item.productId.images.length > 0 ? (
                                                <img src={item.productId.images[0].url} alt={item.productId.name} className="w-full h-full object-contain" />
                                             ) : (
                                                <span className="text-2xl">📦</span>
                                             )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-blinkit-dark truncate text-sm">{item.productId?.name || 'Product'}</h3>
                                            <p className="text-xs text-blinkit-gray">{item.productId?.weight || '1 unit'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-blinkit-green text-white rounded px-2 py-1 text-xs">
                                                <button
                                                    onClick={() => {
                                                        if (item.quantity <= 1) {
                                                            removeFromCart(item._id);
                                                        } else {
                                                            updateQuantity(item._id, item.quantity - 1);
                                                        }
                                                    }}
                                                    aria-label="Decrease quantity"
                                                >-</button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                    aria-label="Increase quantity"
                                                >+</button>
                                            </div>
                                            <div className="font-semibold text-sm text-blinkit-dark w-16 text-right">{item.productId?.price * item.quantity || 0}</div>
                                            <button
                                                onClick={() => removeFromCart(item._id)}
                                                className="text-red-500 hover:text-red-700"
                                                aria-label="Remove item"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>

                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Right Column - Payment & Bill */}
                    <div className="lg:w-96 shrink-0">
                        <div className="bg-white p-6 rounded-xl border border-blinkit-border shadow-sm sticky top-24 space-y-6">

                            {/* Payment Method */}
                            <div>
                                <h2 className="font-bold text-lg mb-3">Payment Method</h2>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === 'COD' ? 'border-blinkit-green bg-green-50' : 'border-blinkit-border'}`}>
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
                                    {/* Placeholder for Online Payment - Disabled for now */}
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed">
                                        <input type="radio" name="payment" value="ONLINE" disabled className="w-4 h-4" />
                                        <div>
                                            <span className="font-medium text-sm block">Online Payment</span>
                                            <span className="text-[10px] text-gray-500">Coming Soon</span>
                                        </div>
                                    </label>
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

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading || (isAuthenticated && (!selectedAddress || !location?.label))}
                                className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2
                                    ${loading || (isAuthenticated && (!selectedAddress || !location?.label)) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blinkit-green hover:bg-blinkit-green-dark hover:shadow-xl hover:-translate-y-0.5'}`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
