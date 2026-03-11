import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';
import LocationModal from '../Location/LocationModal';
import { getAllProducts } from '../../services/productService';
import ThemeToggle from '../UI/ThemeToggle';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchRequestRef = useRef(0);

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

  const cartCount = cart?.length || 0;
  const locationLabel = location?.label?.trim();
  const locationTitle = locationLabel ? 'Deliver to' : 'Set Location';
  const locationSubtitle = locationLabel || (isTracking ? 'Live GPS active' : 'Detect my location');
  const trimmedSearch = searchQuery.trim();
  const shouldSearch = trimmedSearch.length >= 2;

  const searchDropdownContent = (
    <>
      {!shouldSearch ? (
        <div className="px-5 py-4 text-sm text-blinkit-gray flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Type at least 2 characters to search
        </div>
      ) : searchLoading ? (
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blinkit-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blinkit-gray">Searching...</span>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="max-h-[400px] overflow-y-auto">
          <p className="px-5 py-2 text-[11px] font-semibold text-blinkit-gray uppercase tracking-wider">Products</p>
          {searchResults.map((product) => {
            const id = product?.id || product?._id;
            const imageUrl = product?.images?.[0]?.url || product?.image || 'https://placehold.co/60x60?text=No+Image';
            return (
              <Link
                key={id}
                to={`/product/${id}`}
                onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-blinkit-light-gray transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-blinkit-light-gray overflow-hidden flex items-center justify-center flex-shrink-0 border border-blinkit-border">
                  <img
                    src={imageUrl}
                    alt={product?.name || 'Product'}
                    className="w-full h-full object-contain mix-blend-multiply p-0.5"
                    onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=No+Image'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blinkit-dark truncate group-hover:text-blinkit-green transition-colors">{product?.name || 'Product'}</p>
                  <p className="text-xs text-blinkit-gray truncate">{product?.brand || 'Brand'}</p>
                </div>
                <div className="text-sm font-bold text-blinkit-dark">₹{product?.price || 0}</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-blinkit-gray">No products found for "{trimmedSearch}"</p>
          <p className="text-xs text-blinkit-gray mt-1">Try searching for something else</p>
        </div>
      )}
    </>
  );

  const userMenuItems = [
    { to: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'My Profile' },
    { to: '/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'My Orders' },
    { to: '/help', icon: 'M8 10a4 4 0 118 0c0 2-2 3-2 3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Help Desk' },
    { to: '/addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Saved Addresses' },
  ];

  const adminMenuItems = [
    { to: '/admin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Admin Panel' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-blinkit-border/60">
        {/* Main navbar */}
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center gap-3 lg:gap-6">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blinkit-green to-blinkit-green rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <span className="text-white font-black text-base">Q</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-extrabold text-blinkit-dark leading-none tracking-tight">
                  Quick<span className="text-blinkit-green">DROP</span>
                </h1>
                <p className="text-[9px] text-blinkit-gray tracking-widest uppercase font-medium">apni dukan</p>
              </div>
            </Link>

            {/* Location */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              aria-label={locationTitle}
              className="hidden sm:flex items-center gap-2 text-sm shrink-0 hover:bg-blinkit-light-gray px-3 py-2 rounded-xl transition-all group border border-transparent hover:border-blinkit-border"
            >
              <div className="w-8 h-8 rounded-lg bg-blinkit-green flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left max-w-[160px]">
                <p className="font-semibold text-blinkit-dark text-xs leading-tight">{locationTitle}</p>
                <p className="text-blinkit-gray text-[11px] truncate leading-tight">{locationSubtitle}</p>
              </div>
              {isTracking && <span className="w-2 h-2 rounded-full bg-blinkit-green animate-pulse-soft" />}
              <svg className="w-3.5 h-3.5 text-blinkit-gray group-hover:text-blinkit-dark transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Search — Desktop */}
            <div className="flex-1 max-w-xl hidden md:block" ref={searchRef}>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blinkit-gray/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder='Search "milk, bread, eggs..."'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setShowSearchResults(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowSearchResults(false);
                  }}
                  className="w-full pl-11 pr-4 py-2.5 bg-blinkit-light-gray border border-blinkit-border rounded-xl text-sm placeholder:text-blinkit-gray/50 focus:outline-none focus:ring-2 focus:ring-blinkit-green/20 focus:border-blinkit-green/40 focus:bg-white transition-all"
                />

                {showSearchResults && trimmedSearch.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-blinkit-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-down">
                    {searchDropdownContent}
                  </div>
                )}
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
              <ThemeToggle className="shrink-0" />

              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-blinkit-light-gray transition-all border border-transparent hover:border-blinkit-border"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blinkit-green to-blinkit-green rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                    <span className="hidden lg:block text-sm font-semibold text-blinkit-dark max-w-[100px] truncate">
                      {user.name?.split(' ')[0] || 'User'}
                    </span>
                    <svg className={`w-3.5 h-3.5 text-blinkit-gray transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-blinkit-border overflow-hidden z-50 animate-fade-in-down">
                      {/* User info */}
                      <div className="px-5 py-4 bg-blinkit-green border-b border-blinkit-border">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-gradient-to-br from-blinkit-green to-blinkit-green rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-sm">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-white/80 truncate">{user.email || ''}</p>
                          </div>
                        </div>
                      </div>

                      {/* User Menu */}
                      <div className="py-1.5">
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                          >
                            <svg className="w-4 h-4 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                            </svg>
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        ))}
                      </div>

                      {/* Admin Tools */}
                      {user?.role === 'admin' && (
                        <div className="border-t border-blinkit-border py-1.5">
                          <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-blinkit-gray">Admin Panel</p>
                          {adminMenuItems.map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setShowDropdown(false)}
                              className="flex items-center gap-3 px-5 py-2.5 text-sm text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                            >
                              <svg className="w-4 h-4 text-blinkit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                              </svg>
                              <span className="font-medium">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Logout */}
                      <div className="border-t border-blinkit-border py-1.5">
                        <button
                          onClick={handleLogout}
                          disabled={loading}
                          className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-medium">{loading ? 'Logging out...' : 'Logout'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-blinkit-green border border-blinkit-green/30 rounded-xl hover:bg-blinkit-green-light hover:border-blinkit-green hover:text-white transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blinkit-green to-blinkit-green rounded-xl hover:shadow-lg hover:shadow-blinkit-green/20 transition-all hover:-translate-y-0.5"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="relative ml-1 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blinkit-green to-blinkit-green rounded-xl text-white hover:shadow-lg hover:shadow-blinkit-green/25 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <span className="hidden sm:inline text-sm font-bold">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-blinkit-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-badge-bounce shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile Search — Shows below header */}
          <div className="mt-2.5 md:hidden">
            <div className="relative" ref={searchRef}>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blinkit-gray/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder='Search products...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.trim().length > 0);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-blinkit-light-gray border border-blinkit-border rounded-xl text-sm placeholder:text-blinkit-gray/50 focus:outline-none focus:ring-2 focus:ring-blinkit-green/20 focus:border-blinkit-green/40 transition-all"
              />

              {showSearchResults && trimmedSearch.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-blinkit-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-down">
                  {searchDropdownContent}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <LocationModal open={showLocationModal} onClose={() => setShowLocationModal(false)} />
    </>
  );
};

export default Navbar;
