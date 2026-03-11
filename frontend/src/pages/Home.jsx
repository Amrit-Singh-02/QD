import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';
import { getAllProducts } from '../services/productService';
import { getAllCategories } from '../services/categoryService';
import { useCart } from '../context/CartContext';

const categoryPalette = [
  'bg-green-50 text-green-700 border-green-200',
  'bg-red-50 text-red-700 border-red-200',
  'bg-yellow-50 text-yellow-700 border-yellow-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
];

const defaultCategory = {
  id: 'all',
  label: 'All Products',
  image: 'https://cached.imagescaler.hbpl.co.uk/resize/scaleHeight/815/cached.offlinehbpl.hbpl.co.uk/news/OMC/all-products-20170125054108782.gif',
  tone: 'bg-gray-100 text-blinkit-dark border-blinkit-border',
};

const categoryImageFallback = 'https://placehold.co/80x80?text=Cat';

const mapCategories = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return [defaultCategory];
  const filtered = items.filter((cat) => cat?._id || cat?.id);
  return [
    defaultCategory,
    ...filtered.map((cat, index) => ({
      id: cat?._id || cat?.id,
      label: cat?.name || 'Category',
      image: cat?.image || categoryImageFallback,
      tone: categoryPalette[index % categoryPalette.length],
    })),
  ];
};

const sortOptions = [
  { id: 'featured', label: 'Relevance' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'discount', label: 'Best Discount' },
];

const getDiscount = (product) => {
  if (product?.mrp && product?.price && product.mrp > product.price) {
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }
  if (product?.discount && product.discount > 0) return Math.round(product.discount);
  return 0;
};

const pageSize = 10;

/* --- Shimmer Card --- */
const ProductCardShimmer = () => (
  <div className="flex flex-col bg-white rounded-2xl border border-blinkit-border p-3">
    <div className="relative rounded-xl bg-blinkit-light-gray h-28 sm:h-32 shimmer" />
    <div className="mt-2 h-2.5 w-16 rounded-full bg-blinkit-light-gray shimmer" />
    <div className="mt-2 space-y-2">
      <div className="h-3 w-3/4 rounded-full bg-blinkit-light-gray shimmer" />
      <div className="h-3 w-1/2 rounded-full bg-blinkit-light-gray shimmer" />
    </div>
    <div className="mt-3 flex items-center justify-between">
      <div className="h-4 w-14 rounded-full bg-blinkit-light-gray shimmer" />
      <div className="h-8 w-16 rounded-lg bg-blinkit-light-gray shimmer" />
    </div>
  </div>
);

/* --- Product Card --- */
const ProductCard = ({ product, onAdd, cartQty, isNew }) => {
  const id = product?.id || product?._id;
  const discount = getDiscount(product);
  const imageUrl = product?.images?.[0]?.url || product?.image || 'https://placehold.co/400x400?text=No+Image';
  const weightLabel = product?.weight || product?.unit || product?.size || '1 pack';

  return (
    <Link
      to={`/product/${id}`}
      className="group flex flex-col bg-white rounded-2xl border border-blinkit-border p-3 hover:shadow-md transition-all card-hover"
    >
      <div className="relative rounded-xl bg-blinkit-light-gray h-28 sm:h-32 flex items-center justify-center overflow-hidden">
        {isNew && (
          <span className="absolute top-2 left-2 bg-blinkit-green text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            NEW
          </span>
        )}
        <img
          src={imageUrl}
          alt={product?.name || 'Product'}
          className="w-full h-full object-contain mix-blend-multiply p-2 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=No+Image'; }}
          loading="lazy"
        />
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-blinkit-gray uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-blinkit-gray/60" />
        8 mins
      </div>

      <h3 className="text-sm font-semibold text-blinkit-dark mt-1 line-clamp-2 min-h-[36px] leading-tight">
        {product?.name || 'Product'}
      </h3>
      <p className="text-[11px] text-blinkit-gray mt-0.5">{weightLabel}</p>

      <div className="mt-auto pt-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-bold text-sm text-blinkit-dark">{`\u20B9${product?.price ?? 0}`}</span>
          {product?.mrp && discount > 0 && (
            <span className="text-[10px] text-blinkit-gray line-through">{`\u20B9${product.mrp}`}</span>
          )}
        </div>

        {cartQty > 0 ? (
          <div
            className="flex items-center bg-blinkit-orange rounded-lg overflow-hidden shadow-sm"
            onClick={(e) => e.preventDefault()}
          >
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(product, -1); }}
              className="w-7 h-7 text-white text-sm font-bold hover:bg-white/20 transition-colors"
              aria-label="Decrease"
            >
              -
            </button>
            <span className="text-white font-bold text-xs w-5 text-center">{cartQty}</span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(product, 1); }}
              className="w-7 h-7 text-white text-sm font-bold hover:bg-white/20 transition-colors"
              aria-label="Increase"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(product, 1); }}
            className="px-3 py-1.5 rounded-lg border border-blinkit-orange text-blinkit-orange text-[11px] font-bold uppercase hover:bg-blinkit-orange hover:text-white transition-all active:scale-95"
          >
            Add
          </button>
        )}
      </div>
    </Link>
  );
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([defaultCategory]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(defaultCategory.id);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { addToCart, cart } = useCart();
  const location = useLocation();
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await getAllCategories();
        const list = data?.payload || [];
        if (!isMounted) return;
        setCategories(mapCategories(list));
      } catch {
        if (!isMounted) return;
        setCategories([defaultCategory]);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!categories.some((cat) => cat.id === activeCategory)) {
      setActiveCategory(defaultCategory.id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [activeCategory, sortBy, debouncedQuery]);

  const activeCategoryData = useMemo(
    () => categories.find((c) => c.id === activeCategory),
    [categories, activeCategory],
  );

  const activeCategoryLabel = activeCategoryData?.label || defaultCategory.label;
  const categoryIdParam = activeCategory !== defaultCategory.id ? activeCategory : '';

  useEffect(() => {
    const fetchProducts = async () => {
      const requestId = ++fetchIdRef.current;
      setLoading(true);

      try {
        const params = { page, limit: pageSize, sort: sortBy };
        if (debouncedQuery) params.q = debouncedQuery;
        if (categoryIdParam) params.categoryId = categoryIdParam;

        const data = await getAllProducts(params);
        if (fetchIdRef.current !== requestId) return;

        const payload = data.payload || [];
        const meta = data.meta || {};

        const nextTotalItems = meta.totalItems ?? payload.length;
        const nextTotalPages = meta.totalPages ?? Math.max(1, Math.ceil(nextTotalItems / pageSize));

        setProducts(payload);
        setTotalItems(nextTotalItems);
        setTotalPages(nextTotalPages);
      } catch {
        if (fetchIdRef.current !== requestId) return;
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        if (fetchIdRef.current === requestId) {
          setLoading(false);
        }
      }
    };
    fetchProducts();
  }, [page, sortBy, debouncedQuery, categoryIdParam]);

  useEffect(() => {
    const scrollY = location.state?.restoreScrollY;
    if (typeof scrollY === 'number') {
      setTimeout(() => window.scrollTo({ top: scrollY, behavior: 'auto' }), 0);
    }
  }, [location.state?.restoreScrollY]);

  const handleAddToCart = useCallback((product, delta) => {
    const id = product.id || product._id;
    addToCart(id, delta, product);
  }, [addToCart]);

  const getCartQty = useCallback((product) => {
    const id = product?.id || product?._id;
    const item = cart?.find((c) => {
      const cid = c.productId?._id || c.productId?.id || c.productId;
      return cid === id;
    });
    return item?.quantity || 0;
  }, [cart]);

  const cartSummary = useMemo(() => {
    if (!Array.isArray(cart)) return { count: 0, total: 0 };
    return cart.reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const product = item.productId || item.product || item;
      const price = Number(product?.price ?? product?.sellingPrice ?? 0);
      acc.count += quantity;
      acc.total += quantity * (Number.isFinite(price) ? price : 0);
      return acc;
    }, { count: 0, total: 0 });
  }, [cart]);

  const totalLabel = totalItems > 0 ? `${totalItems} items delivered in 8 mins` : 'Fresh picks delivered in 8 mins';
  const filteredProducts = useMemo(() => {
    if (!debouncedQuery) return products;
    const tokens = debouncedQuery
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return products;
    return products.filter((product) => {
      const haystack = [
        product?.name,
        product?.brand,
        product?.category,
        product?.subcategory,
        product?.weight,
        product?.unit,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [products, debouncedQuery]);

  const visibleCount = filteredProducts.length;
  const totalCount = debouncedQuery ? filteredProducts.length : (totalItems || visibleCount);
  const progressPct = totalCount > 0 ? Math.min(100, Math.round((visibleCount / totalCount) * 100)) : 0;

  const resetFilters = () => {
    setActiveCategory(defaultCategory.id);
    setQuery('');
    setSortBy('featured');
  };

  return (
    <div className="min-h-screen bg-blinkit-bg">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-24">
        <div className="flex gap-3 sm:gap-4 lg:gap-6 items-start">
          <aside className="w-[86px] sm:w-[104px] lg:w-64 shrink-0">
            <div className="bg-white border border-blinkit-border rounded-2xl p-2 sm:p-3 lg:p-3">
              <p className="hidden lg:block text-[11px] font-bold uppercase tracking-widest text-blinkit-gray px-1 mb-3">
                Categories
              </p>
              {categoriesLoading ? (
                <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto no-scrollbar">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={`cat-skeleton-${idx}`}
                      className="flex flex-col items-center gap-2 px-2 py-2 rounded-xl border border-blinkit-border bg-white"
                    >
                      <div className="w-14 h-14 rounded-full bg-blinkit-light-gray shimmer" />
                      <div className="h-2 w-14 rounded-full bg-blinkit-light-gray shimmer" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto no-scrollbar pr-1 lg:pr-0">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2.5 rounded-xl border transition-all ${
                          isActive
                            ? 'border-blinkit-green bg-blinkit-green text-white shadow-sm'
                            : 'border-blinkit-border bg-white text-blinkit-dark hover:bg-blinkit-light-gray'
                        }`}
                      >
                        <span className={`w-14 h-14 lg:w-12 lg:h-12 rounded-full border flex items-center justify-center ${cat.tone}`}>
                          <img
                            src={cat.image || categoryImageFallback}
                            alt={`${cat.label} icon`}
                            className="w-10 h-10 lg:w-9 lg:h-9 rounded-full object-cover"
                            loading="lazy"
                            onError={(e) => { e.target.src = categoryImageFallback; }}
                          />
                        </span>
                        <span className="text-[11px] sm:text-xs lg:text-sm font-semibold text-center lg:text-left leading-tight">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-blinkit-gray font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blinkit-orange" />
                  Delivery in 8 mins
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-blinkit-dark mt-1">{activeCategoryLabel}</h2>
                <p className="text-xs sm:text-sm text-blinkit-gray mt-1">{totalLabel}</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="relative w-full sm:w-60">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blinkit-gray/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for 'eggs', 'milk' or 'chips'"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-blinkit-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-orange/20 focus:border-blinkit-orange/40 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-blinkit-gray uppercase tracking-widest">
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl border border-blinkit-border bg-white px-3 py-2 text-xs font-semibold text-blinkit-dark focus:outline-none focus:ring-2 focus:ring-blinkit-orange/20 cursor-pointer normal-case"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {Array.from({ length: pageSize }).map((_, i) => (
                    <ProductCardShimmer key={`shimmer-${i}`} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-blinkit-border bg-white p-12 text-center">
                  <span className="text-4xl mb-3 block">No items</span>
                  <h3 className="text-lg font-bold text-blinkit-dark">No products found</h3>
                  <p className="text-sm text-blinkit-gray mt-2 mb-6">Try clearing filters or choosing a different category.</p>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2.5 rounded-xl bg-blinkit-orange text-white font-semibold text-sm hover:brightness-95 transition-colors active:scale-95"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {filteredProducts.map((product, index) => (
                      <ProductCard
                        key={product?.id || product?._id}
                        product={product}
                        onAdd={handleAddToCart}
                        cartQty={getCartQty(product)}
                        isNew={index === 0}
                      />
                    ))}
                  </div>

                  {totalCount > 0 && (
                    <div className="mt-2 flex flex-col items-center gap-2">
                      <p className="text-xs text-blinkit-gray">{`Viewing ${Math.min(visibleCount, totalCount)} of ${totalCount} items`}</p>
                      <div className="w-44 h-1.5 bg-blinkit-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blinkit-orange rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-blinkit-gray">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1 || loading}
                          className="px-3 py-1.5 rounded-lg border border-blinkit-border text-xs font-semibold text-blinkit-dark hover:bg-blinkit-light-gray disabled:opacity-60"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages || loading}
                          className="px-3 py-1.5 rounded-lg border border-blinkit-border text-xs font-semibold text-blinkit-dark hover:bg-blinkit-light-gray disabled:opacity-60"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {cartSummary.count > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(560px,calc(100%-2rem))] bg-blinkit-orange text-white rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold">{`${cartSummary.count} item${cartSummary.count > 1 ? 's' : ''} added`}</p>
              <p className="text-sm font-bold">{`\u20B9${cartSummary.total.toFixed(0)}`}</p>
            </div>
          </div>
          <Link
            to="/cart"
            className="view-cart-btn font-semibold text-sm px-4 py-2 rounded-xl hover:shadow-md transition-all"
          >
            View Cart >
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
