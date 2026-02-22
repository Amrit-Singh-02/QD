import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await getProductById(id);
                setProduct(data.payload); // Assuming ApiResponse structure
            } catch (err) {
                setError(err.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = async () => {
        if (product) {
            await addToCart(product.id || product._id, quantity, product);
        }
    };

    const incrementQty = () => setQuantity(prev => prev + 1);
    const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    const handleBack = () => {
        const from = location.state?.from;
        const savedScroll = Number(sessionStorage.getItem('homeScrollY'));
        const restoreScrollY = Number.isFinite(savedScroll) ? savedScroll : undefined;

        if (from) {
            navigate(from, {
                replace: true,
                state: restoreScrollY !== undefined ? { restoreScrollY } : undefined,
            });
            return;
        }

        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate('/', {
            replace: true,
            state: restoreScrollY !== undefined ? { restoreScrollY } : undefined,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-blinkit-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blinkit-green"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-blinkit-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                     <h2 className="text-2xl font-bold text-blinkit-dark mb-4">Product Not Found</h2>
                     <p className="text-blinkit-gray mb-6">{error || "The product you are looking for does not exist."}</p>
                     <Link to="/" className="px-6 py-2 bg-blinkit-green text-white rounded-lg hover:bg-blinkit-green-dark transition-colors">
                        Go Home
                     </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : (product.discount || 0);
    const imageUrl = product.images && product.images.length > 0 ? product.images[0].url : 'https://placehold.co/400x400?text=No+Image';

    return (
        <div className="min-h-screen bg-blinkit-bg flex flex-col">
            <Navbar />
            
            <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                <div className="mb-4">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blinkit-dark hover:text-blinkit-green transition-colors"
                        aria-label="Go back to products"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to products
                    </button>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-blinkit-border overflow-hidden flex flex-col md:flex-row">
                    
                    {/* Image Section */}
                    <div className="md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-blinkit-border flex items-center justify-center bg-white relative">
                         {discount > 0 && (
                            <span className="absolute top-6 left-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-md z-10">
                                {discount}% OFF
                            </span>
                        )}
                        <img 
                            src={imageUrl} 
                            alt={product.name} 
                            className="max-w-full max-h-[400px] object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500"
                            onError={(e) => {e.target.src = 'https://placehold.co/400x400?text=Error'}}
                        />
                    </div>

                    {/* Details Section */}
                    <div className="md:w-1/2 p-6 md:p-10 flex flex-col">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-blinkit-dark mb-2 leading-tight">{product.name}</h1>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-1 bg-blinkit-light-gray text-blinkit-gray text-xs font-semibold rounded">{product.brand}</span>
                                <span className="text-blinkit-gray text-sm">•</span>
                                <span className="text-blinkit-gray text-sm">{product.weight || '1 unit'}</span>
                            </div>
                            
                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="text-4xl font-bold text-blinkit-dark">₹{product.price}</span>
                                {product.mrp && (
                                    <>
                                        <span className="text-lg text-blinkit-gray line-through">₹{product.mrp}</span>
                                        <span className="text-green-600 font-bold text-sm">Save ₹{product.mrp - product.price}</span>
                                    </>
                                )}
                            </div>
                            
                            <div className="mb-8">
                                <h3 className="font-bold text-lg text-blinkit-dark mb-2">About the Product</h3>
                                <p className="text-blinkit-gray leading-relaxed text-sm md:text-base">
                                    {product.description || "No description available for this product."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto">
                            {product.stocks > 0 ? (
                                <div className="flex items-center gap-4">
                                     <div className="flex item-center border border-blinkit-green rounded-xl overflow-hidden">
                                        <button 
                                            onClick={decrementQty}
                                            className="px-4 py-3 text-blinkit-green hover:bg-blinkit-green/10 transition-colors font-bold text-xl"
                                        >−</button>
                                        <div className="px-4 py-3 font-bold text-blinkit-dark min-w-[3rem] text-center flex items-center justify-center">
                                            {quantity}
                                        </div>
                                        <button 
                                            onClick={incrementQty}
                                            className="px-4 py-3 text-blinkit-green hover:bg-blinkit-green/10 transition-colors font-bold text-xl"
                                        >+</button>
                                     </div>
                                     <button 
                                        onClick={handleAddToCart}
                                        className="flex-1 py-3.5 bg-blinkit-green text-white font-bold rounded-xl hover:bg-blinkit-green-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 text-lg"
                                     >
                                        Add to Cart
                                     </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-red-50 text-red-600 font-bold rounded-xl text-center border border-red-100">
                                    Out of Stock
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProductDetails;
