import React, { useEffect, useState } from 'react';
import Navbar from '../component/Layout/Navbar';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import Footer from '../component/Layout/Footer';

const tabs = [
  { id: 'description', label: 'Description' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'reviews', label: 'Reviews' },
];

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data.payload);
      } catch (err) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.id || product._id, quantity, product);
    }
  };

  const incrementQty = () => setQuantity((p) => p + 1);
  const decrementQty = () => setQuantity((p) => (p > 1 ? p - 1 : 1));

  const handleBack = () => {
    const from = location.state?.from;
    const savedScroll = Number(sessionStorage.getItem('homeScrollY'));
    const restoreScrollY = Number.isFinite(savedScroll) ? savedScroll : undefined;
    if (from) {
      navigate(from, { replace: true, state: restoreScrollY !== undefined ? { restoreScrollY } : undefined });
      return;
    }
    if (window.history.length > 1) { navigate(-1); return; }
    navigate('/', { replace: true, state: restoreScrollY !== undefined ? { restoreScrollY } : undefined });
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="min-h-screen bg-blinkit-bg flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
          <div className="bg-white rounded-3xl border border-blinkit-border overflow-hidden flex flex-col md:flex-row animate-pulse">
            <div className="w-full md:w-1/2 p-8">
              <div className="h-72 sm:h-96 bg-blinkit-light-gray rounded-2xl shimmer" />
            </div>
            <div className="w-full md:w-1/2 p-8 space-y-4">
              <div className="h-4 w-20 bg-blinkit-light-gray rounded-full shimmer" />
              <div className="h-8 w-3/4 bg-blinkit-light-gray rounded-full shimmer" />
              <div className="h-4 w-1/2 bg-blinkit-light-gray rounded-full shimmer" />
              <div className="h-10 w-32 bg-blinkit-light-gray rounded-xl shimmer mt-6" />
              <div className="h-20 w-full bg-blinkit-light-gray rounded-xl shimmer mt-6" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* Error state */
  if (error || !product) {
    return (
      <div className="min-h-screen bg-blinkit-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <span className="text-6xl mb-4">😕</span>
          <h2 className="text-2xl font-bold text-blinkit-dark mb-2">Product Not Found</h2>
          <p className="text-blinkit-gray mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link to="/" className="px-6 py-2.5 bg-blinkit-green text-white rounded-xl font-semibold hover:bg-blinkit-green-dark transition-colors">
            Go Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : (product.discount || 0);
  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.url)
    : ['https://placehold.co/400x400?text=No+Image'];

  const tabContent = {
    description: product.description || 'No description available for this product. Check back soon for more details.',
    ingredients: product.ingredients || 'Ingredients information will be available soon.',
    nutrition: product.nutritionalInfo || product.nutrition || 'Nutritional information will be available soon.',
    reviews: null,
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-5">
          <Link to="/" className="text-blinkit-gray hover:text-blinkit-green transition-colors">Home</Link>
          <svg className="w-3.5 h-3.5 text-blinkit-gray/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-blinkit-dark font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-blinkit-border overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image Gallery */}
            <div className="w-full md:w-1/2 p-4 sm:p-8 border-b md:border-b-0 md:border-r border-blinkit-border">
              <div className="relative rounded-2xl bg-blinkit-light-gray aspect-square flex items-center justify-center overflow-hidden mb-4">
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg z-10 shadow-md">
                    {discount}% OFF
                  </span>
                )}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 z-10 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blinkit-green animate-pulse-soft" />
                  <span className="text-xs font-semibold text-blinkit-dark">8 MIN</span>
                </div>
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain mix-blend-multiply p-4 hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=Error'; }}
                />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 justify-center">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                        i === activeImage ? 'border-blinkit-green shadow-md' : 'border-blinkit-border hover:border-blinkit-gray'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-10 flex flex-col">
              <div className="mb-6">
                {/* Brand */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-blinkit-light-gray text-blinkit-gray text-xs font-semibold rounded-lg">{product.brand || 'Brand'}</span>
                  {product.weight && <span className="text-blinkit-gray text-xs">• {product.weight}</span>}
                </div>

                {/* Name */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blinkit-dark mb-4 leading-tight">{product.name}</h1>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-blinkit-dark">₹{product.price}</span>
                  {product.mrp && discount > 0 && (
                    <>
                      <span className="text-lg text-blinkit-gray line-through">₹{product.mrp}</span>
                      <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Save ₹{product.mrp - product.price}</span>
                    </>
                  )}
                </div>

                {/* Stock */}
                {product.stocks > 0 ? (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1.5 mb-6">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    In Stock ({product.stocks} available)
                  </p>
                ) : (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1.5 mb-6">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Out of Stock
                  </p>
                )}

                {/* Quantity & Add to Cart */}
                {product.stocks > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                    <div className="flex items-center border-2 border-blinkit-border rounded-xl overflow-hidden">
                      <button
                        onClick={decrementQty}
                        className="px-4 py-3 text-blinkit-dark hover:bg-blinkit-light-gray transition-colors font-bold text-lg"
                      >−</button>
                      <div className="px-5 py-3 font-bold text-blinkit-dark min-w-[3rem] text-center border-x-2 border-blinkit-border">
                        {quantity}
                      </div>
                      <button
                        onClick={incrementQty}
                        className="px-4 py-3 text-blinkit-dark hover:bg-blinkit-light-gray transition-colors font-bold text-lg"
                      >+</button>
                    </div>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 py-3.5 bg-gradient-to-r from-blinkit-green to-blinkit-green text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blinkit-green/25 transition-all hover:-translate-y-0.5 active:scale-[0.98] text-base flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                      Add to Cart — ₹{product.price * quantity}
                    </button>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-t border-blinkit-border pt-6">
                <div className="flex gap-1 bg-blinkit-light-gray rounded-xl p-1 mb-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-blinkit-dark shadow-sm'
                          : 'text-blinkit-gray hover:text-blinkit-dark'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="min-h-[120px] animate-fade-in-up" key={activeTab}>
                  {activeTab === 'reviews' ? (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-3 block">⭐</span>
                      <p className="text-blinkit-gray text-sm">No reviews yet. Be the first to review this product!</p>
                    </div>
                  ) : (
                    <p className="text-sm text-blinkit-gray leading-relaxed">{tabContent[activeTab]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to products */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blinkit-gray hover:text-blinkit-green transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to products
          </button>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {product.stocks > 0 && (
        <div className="md:hidden sticky bottom-0 z-40 bg-white border-t border-blinkit-border p-3 glass">
          <div className="flex items-center gap-3">
            <div className="flex items-center border-2 border-blinkit-border rounded-xl">
              <button onClick={decrementQty} className="px-3 py-2 font-bold text-blinkit-dark">−</button>
              <span className="px-3 py-2 font-bold text-blinkit-dark border-x-2 border-blinkit-border">{quantity}</span>
              <button onClick={incrementQty} className="px-3 py-2 font-bold text-blinkit-dark">+</button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 bg-gradient-to-r from-blinkit-green to-blinkit-green text-white font-bold rounded-xl text-sm active:scale-[0.98]"
            >
              Add to Cart — ₹{product.price * quantity}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetails;





