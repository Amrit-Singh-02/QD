import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';
import LocationModal from '../Location/LocationModal';
import { getAllProducts } from '../../services/productService';

const Navbar = () => {
  const { loading, user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const { location, isTracking } = useLocationContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchRequestRef = useRef(0);

  // Close dropdown/search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const keyword = debouncedQuery.trim();
    if (keyword.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    setSearchLoading(true);
    getAllProducts({ q: keyword, limit: 6, page: 1 })
      .then((data) => {
        if (searchRequestRef.current !== requestId) return;
        setSearchResults(data?.payload || []);
      })
      .catch(() => {
        if (searchRequestRef.current !== requestId) return;
        setSearchResults([]);
      })
      .finally(() => {
        if (searchRequestRef.current === requestId) {
          setSearchLoading(false);
        }
      });
  }, [debouncedQuery]);

  const handleLogout = async () => {
    setShowDropdown(false);
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  const cartCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  const locationLabel = location?.label?.trim();
  const locationTitle = locationLabel ? 'Deliver to' : 'Detect My Location';
  const locationSubtitle = locationLabel || (isTracking ? 'Live GPS active' : 'Use GPS or search address');
  const trimmedSearch = searchQuery.trim();
  const shouldSearch = trimmedSearch.length >= 2;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top green bar */}
      <div className="bg-blinkit-green">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <p className="text-white text-xs text-center tracking-wide font-medium">
            🚀 Free delivery on orders above ₹199 &bull; Delivery in minutes!
          </p>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4 lg:gap-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 bg-blinkit-green rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-black text-lg">Q</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-extrabold text-blinkit-dark leading-none tracking-tight">
                Quick<span className="text-blinkit-green">DROP</span>
              </h1>
              <p className="text-[10px] text-blinkit-gray tracking-wide">groceries delivered</p>
            </div>
          </Link>

          {/* Location */}
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            aria-label={locationTitle}
            className="flex items-center gap-1.5 text-sm shrink-0 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-blinkit-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-left max-w-[180px] hidden sm:block">
              <p className="font-semibold text-blinkit-dark text-xs">{locationTitle}</p>
              <p className="text-blinkit-gray text-[11px] truncate">{locationSubtitle}</p>
            </div>
            {isTracking && <span className="w-2 h-2 rounded-full bg-blinkit-green animate-pulse-soft" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative" ref={searchRef}>
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder='Search "milk, bread, eggs, fruits..."'
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (value.trim().length > 0) {
                    setShowSearchResults(true);
                  } else {
                    setShowSearchResults(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowSearchResults(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSearchResults(false);
                  }
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-blinkit-light-gray border border-blinkit-border rounded-xl text-sm placeholder:text-blinkit-gray/70 focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 focus:border-blinkit-green transition-all"
              />

              {showSearchResults && trimmedSearch.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-blinkit-border rounded-xl shadow-xl z-50 overflow-hidden">
                  {!shouldSearch ? (
                    <div className="px-4 py-3 text-sm text-blinkit-gray">
                      Type at least 2 characters to search.
                    </div>
                  ) : searchLoading ? (
                    <div className="px-4 py-3 text-sm text-blinkit-gray">
                      Searching products...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto divide-y divide-blinkit-border">
                      {searchResults.map((product) => {
                        const id = product?.id || product?._id;
                        const imageUrl =
                          product?.images?.[0]?.url ||
                          product?.image ||
                          'https://placehold.co/60x60?text=No+Image';
                        return (
                          <Link
                            key={id}
                            to={`/product/${id}`}
                            onClick={() => {
                              setShowSearchResults(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-blinkit-light-gray transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg bg-blinkit-light-gray overflow-hidden flex items-center justify-center">
                              <img
                                src={imageUrl}
                                alt={product?.name || 'Product'}
                                className="w-full h-full object-contain mix-blend-multiply"
                                onError={(event) => {
                                  event.target.src = 'https://placehold.co/60x60?text=No+Image';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-blinkit-dark truncate">
                                {product?.name || 'Product'}
                              </p>
                              <p className="text-xs text-blinkit-gray truncate">
                                {product?.brand || 'Brand'}
                              </p>
                            </div>
                            <div className="text-sm font-bold text-blinkit-dark">
                              {"\u20B9"}{product?.price || 0}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-blinkit-gray">
                      No products found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Auth / User section */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated && user ? (
              /* Logged in — show avatar + dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 bg-blinkit-green rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden lg:block text-sm font-semibold text-blinkit-dark max-w-[100px] truncate">
                    {user.name?.split(' ')[0] || 'User'}
                  </span>
                  <svg className={`w-4 h-4 text-blinkit-gray transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-blinkit-border overflow-hidden z-50 animate-fade-in-up">
                    {/* User info header */}
                    <div className="px-4 py-3 bg-blinkit-light-gray border-b border-blinkit-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blinkit-green rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-blinkit-dark truncate">{user.name || 'User'}</p>
                          <p className="text-xs text-blinkit-gray truncate">{user.email || ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                      >
                        <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">My Profile</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                      >
                        <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="font-medium">My Orders</span>
                      </Link>

                      <Link
                        to="/help"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                      >
                        <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10a4 4 0 118 0c0 2-2 3-2 3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Help Desk</span>
                      </Link>

                      <Link
                        to="/addresses"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                      >
                        <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Saved Addresses</span>
                      </Link>
                    </div>

                    {user?.role === "admin" && (
                      <div className="border-t border-blinkit-border py-2">
                        <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-blinkit-gray">
                          Admin Tools
                        </p>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                        >
                          <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h7v12H4zM13 4h7v14h-7zM4 18h16v2H4z" />
                          </svg>
                          <span className="font-medium">Dashboard</span>
                        </Link>
                        <Link
                          to="/admin/products/new"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                        >
                          <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="font-medium">Add Product</span>
                        </Link>
                        <Link
                          to="/admin/delivery-agent/new"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                        >
                          <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="font-medium">Create Delivery Agent</span>
                        </Link>
                        <Link
                          to="/admin/products"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                        >
                          <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <span className="font-medium">Fetch Products</span>
                        </Link>
                        <Link
                          to="/admin/orders"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                        >
                          <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                          </svg>
                          <span className="font-medium">Fetch Orders</span>
                        </Link>
                        <Link
                          to="/admin/help-tickets"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                        >
                          <svg className="w-4.5 h-4.5 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10a4 4 0 118 0c0 2-2 3-2 3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Help Tickets</span>
                        </Link>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="border-t border-blinkit-border py-1">
                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">{loading ? 'Logging out...' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in — show Login / Sign Up buttons */
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-blinkit-green border border-blinkit-green rounded-lg hover:bg-blinkit-green-light transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-blinkit-green rounded-lg hover:bg-blinkit-green-dark transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative ml-1 p-2 bg-blinkit-green rounded-lg text-white hover:bg-blinkit-green-dark transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-blinkit-yellow text-blinkit-dark text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
      </header>
      <LocationModal open={showLocationModal} onClose={() => setShowLocationModal(false)} />
    </>
  );
};
export default Navbar;
