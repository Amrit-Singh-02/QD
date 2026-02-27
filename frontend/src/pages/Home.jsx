import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';
import { getAllProducts } from '../services/productService';
import { useCart } from '../context/CartContext';

const categories = [
  {
    id: 'all',
    label: 'All',
    hint: 'Everything',
    keywords: [],
    bg: 'bg-white',
    border: 'border-blinkit-border',
  },
  {
    id: 'fresh',
    label: 'Fresh Produce',
    hint: 'Fruits and veg',
    keywords: ['fruit', 'vegetable', 'tomato', 'onion', 'apple', 'banana', 'potato', 'carrot', 'spinach'],
    bg: 'bg-blinkit-green-light',
    border: 'border-emerald-200',
  },
  {
    id: 'dairy',
    label: 'Dairy and Bakery',
    hint: 'Milk, bread',
    keywords: ['milk', 'curd', 'paneer', 'cheese', 'yogurt', 'bread', 'butter', 'cream', 'egg'],
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'snacks',
    label: 'Snacks',
    hint: 'Chips, biscuits',
    keywords: ['snack', 'chips', 'biscuit', 'cookie', 'namkeen', 'nacho'],
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    id: 'drinks',
    label: 'Drinks',
    hint: 'Juices, coffee',
    keywords: ['juice', 'cola', 'soda', 'drink', 'coffee', 'tea'],
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    id: 'home',
    label: 'Home and Care',
    hint: 'Cleaning',
    keywords: ['detergent', 'soap', 'shampoo', 'cleaner', 'toothpaste', 'dish', 'floor'],
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  {
    id: 'baby',
    label: 'Baby and Pet',
    hint: 'Diapers and more',
    keywords: ['diaper', 'baby', 'pet', 'dog', 'cat'],
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
];

const quickFilters = [
  { id: 'all', label: 'All' },
  { id: 'deals', label: 'Deals' },
  { id: 'under-99', label: 'Under 99' },
];

const sortOptions = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'discount', label: 'Best Discount' },
];

const getDiscount = (product) => {
  if (product?.mrp && product?.price && product.mrp > product.price) {
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }
  if (product?.discount && product.discount > 0) {
    return Math.round(product.discount);
  }
  return 0;
};

const pageSize = 12;

const ProductCardShimmer = () => (
  <div className="flex flex-col bg-white rounded-2xl border border-blinkit-border p-4">
    <div className="relative rounded-xl bg-blinkit-light-gray h-32 shimmer" />
    <div className="mt-4 h-3 w-2/3 rounded-full bg-blinkit-light-gray shimmer" />
    <div className="mt-2 h-3 w-1/2 rounded-full bg-blinkit-light-gray shimmer" />
    <div className="mt-4 flex items-center justify-between">
      <div className="h-4 w-16 rounded-full bg-blinkit-light-gray shimmer" />
      <div className="h-7 w-14 rounded-lg bg-blinkit-light-gray shimmer" />
    </div>
  </div>
);

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { addToCart } = useCart();
  const location = useLocation();
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [activeCategory, quickFilter, sortBy, debouncedQuery]);

  const activeKeywords = useMemo(() => {
    const active = categories.find((cat) => cat.id === activeCategory);
    return active?.keywords || [];
  }, [activeCategory]);

  const keywordParam = useMemo(() => {
    if (activeCategory === 'all') return '';
    return activeKeywords.join(',');
  }, [activeCategory, activeKeywords]);

  useEffect(() => {
    const fetchProducts = async () => {
      const requestId = ++fetchIdRef.current;
      setLoading(true);
      try {
        const params = {
          page,
          limit: pageSize,
          sort: sortBy,
        };
        if (debouncedQuery) {
          params.q = debouncedQuery;
        }
        if (keywordParam) {
          params.keywords = keywordParam;
        }
        if (quickFilter !== 'all') {
          params.quick = quickFilter;
        }

        const data = await getAllProducts(params);
        if (fetchIdRef.current !== requestId) {
          return;
        }
        setProducts(data.payload || []);
        const meta = data.meta || {};
        setTotalItems(meta.totalItems ?? data.payload?.length ?? 0);
        setTotalPages(meta.totalPages ?? 1);
        if (meta.page && meta.page !== page) {
          setPage(meta.page);
        }
      } catch (error) {
        if (fetchIdRef.current !== requestId) {
          return;
        }
        console.error('Failed to fetch products', error);
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
  }, [page, sortBy, quickFilter, debouncedQuery, keywordParam]);

  useEffect(() => {
    const restoreScrollY = location.state?.restoreScrollY;
    if (typeof restoreScrollY === 'number') {
      const timer = setTimeout(() => {
        window.scrollTo({ top: restoreScrollY, behavior: 'auto' });
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [location.state?.restoreScrollY]);

  const handleAddToCart = (event, product) => {
    event.preventDefault();
    addToCart(product.id || product._id, 1, product);
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setQuickFilter('all');
    setQuery('');
    setSortBy('featured');
    setPage(1);
  };

  const recordHomeScroll = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('homeScrollY', String(window.scrollY || 0));
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg">
      <Navbar />

      <main>
        <section className="max-w-7xl mx-auto px-4 pt-6 pb-8">
          <div className="relative overflow-hidden rounded-3xl border border-blinkit-border bg-gradient-to-br from-white via-blinkit-yellow-light to-blinkit-green-light">
            <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-blinkit-yellow opacity-30 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-blinkit-green opacity-20 blur-3xl" />
            <div className="relative p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 animate-fade-in-up">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-xs font-semibold text-blinkit-dark border border-blinkit-border">
                  Delivery in 14 minutes
                </span>
                <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-blinkit-dark leading-tight">
                  Stock up on daily essentials, fast.
                </h1>
                <p className="mt-3 text-blinkit-gray text-sm md:text-base max-w-md">
                  Fresh produce, pantry staples, and home care delivered in minutes with clear pricing and easy picks.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#products"
                    className="px-6 py-3 bg-blinkit-green text-white font-semibold rounded-xl hover:bg-blinkit-green-dark transition-colors shadow-sm"
                  >
                    Shop essentials
                  </a>
                  <a
                    href="#categories"
                    className="px-6 py-3 bg-white text-blinkit-dark font-semibold rounded-xl border border-blinkit-border hover:bg-blinkit-light-gray transition-colors"
                  >
                    Browse categories
                  </a>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-blinkit-gray">
                  <span className="px-3 py-1 rounded-full bg-white/80 border border-blinkit-border">
                    Free delivery over 199
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/80 border border-blinkit-border">
                    Secure checkout
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/80 border border-blinkit-border">
                    Freshness guarantee
                  </span>
                </div>
              </div>

              <div className="flex-1 flex justify-center">
                <div className="relative w-56 h-56 md:w-72 md:h-72 animate-float-soft">
                  <div className="absolute inset-0 rounded-[28px] bg-white/80 border border-blinkit-border shadow-xl" />
                  <div className="relative h-full flex flex-col items-center justify-center text-center">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-blinkit-gray">Quick cart</p>
                    <p className="text-5xl md:text-6xl font-black text-blinkit-green">10</p>
                    <p className="text-sm text-blinkit-gray">minute delivery</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-blinkit-dark">
                      <span className="px-2 py-1 rounded-lg bg-blinkit-green-light">Fresh picks</span>
                      <span className="px-2 py-1 rounded-lg bg-blinkit-yellow-light">Daily deals</span>
                      <span className="px-2 py-1 rounded-lg bg-white border border-blinkit-border">Safe handling</span>
                      <span className="px-2 py-1 rounded-lg bg-white border border-blinkit-border">Easy returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-blinkit-dark">Shop by category</h2>
              <p className="text-blinkit-gray text-sm mt-1">Tap a category to focus your results.</p>
            </div>
            <a href="#products" className="text-sm font-semibold text-blinkit-green hover:underline">
              Jump to products
            </a>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`min-w-[160px] text-left rounded-2xl border ${cat.border} ${cat.bg} px-4 py-3 transition-all snap-start ${
                    isActive ? 'ring-2 ring-blinkit-green shadow-md' : 'hover:shadow-md hover:-translate-y-0.5'
                  }`}
                  aria-pressed={isActive}
                >
                  <p className="text-sm font-semibold text-blinkit-dark">{cat.label}</p>
                  <p className="text-xs text-blinkit-gray mt-1">{cat.hint}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section id="products" className="max-w-7xl mx-auto px-4 pb-12 pt-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-blinkit-dark">Products you will love</h2>
              <p className="text-blinkit-gray text-sm mt-1">Simple filters and quick add to cart.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setQuickFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    quickFilter === filter.id
                      ? 'bg-blinkit-green text-white border-blinkit-green'
                      : 'bg-white text-blinkit-dark border-blinkit-border hover:bg-blinkit-light-gray'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search milk, bread, soap..."
                className="w-full rounded-xl border border-blinkit-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
              />
            </div>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-xl border border-blinkit-border bg-white px-4 py-3 text-sm font-semibold text-blinkit-dark focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: pageSize }).map((_, index) => (
                <ProductCardShimmer key={`shimmer-${index}`} />
              ))}
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="rounded-2xl border border-blinkit-border bg-white p-8 text-center">
                  <h3 className="text-lg font-bold text-blinkit-dark">No products found</h3>
                  <p className="text-sm text-blinkit-gray mt-2">
                    Try clearing filters or choosing a different category.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-blinkit-green text-white font-semibold hover:bg-blinkit-green-dark transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {products.map((product) => {
                    const id = product?.id || product?._id;
                    const discount = getDiscount(product);
                    const imageUrl =
                      product?.images && product.images.length > 0
                        ? product.images[0].url
                        : 'https://placehold.co/400x400?text=No+Image';

                    return (
                      <Link
                        to={`/product/${id}`}
                        key={id}
                        state={{
                          from: `${location.pathname}${location.search}${location.hash}`,
                        }}
                        onClick={recordHomeScroll}
                        className="group flex flex-col bg-white rounded-2xl border border-blinkit-border p-4 hover:shadow-lg transition-all"
                      >
                        <div className="relative rounded-xl bg-blinkit-light-gray h-32 flex items-center justify-center overflow-hidden">
                          {discount > 0 && (
                            <span className="absolute top-2 left-2 bg-blinkit-green text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {discount}% OFF
                            </span>
                          )}
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                            onError={(event) => {
                              event.target.src = 'https://placehold.co/400x400?text=Error';
                            }}
                          />
                        </div>
                        <div className="mt-3 flex-1">
                          <p className="text-xs text-blinkit-gray">{product.brand || 'Brand'}</p>
                          <h3 className="text-sm font-semibold text-blinkit-dark mt-1 line-clamp-2 min-h-[36px]">
                            {product.name}
                          </h3>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-blinkit-dark">Rs {product.price}</span>
                            {product.mrp && discount > 0 && (
                              <span className="text-xs text-blinkit-gray line-through">Rs {product.mrp}</span>
                            )}
                          </div>
                          <button
                            onClick={(event) => handleAddToCart(event, product)}
                            className="px-3 py-1.5 rounded-lg border border-blinkit-green text-blinkit-green text-xs font-bold uppercase hover:bg-blinkit-green hover:text-white transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!loading && totalItems > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-blinkit-gray">
                Showing{' '}
                <span className="font-semibold text-blinkit-dark">
                  {Math.min((page - 1) * pageSize + 1, totalItems)}-
                  {Math.min(page * pageSize, totalItems)}
                </span>{' '}
                of <span className="font-semibold text-blinkit-dark">{totalItems}</span> items
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className="px-3 py-2 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blinkit-light-gray transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((pageNumber) => {
                    const window = 2;
                    return (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= page - window && pageNumber <= page + window)
                    );
                  })
                  .map((pageNumber, index, arr) => {
                    const prev = arr[index - 1];
                    const showGap = prev && pageNumber - prev > 1;
                    return (
                      <React.Fragment key={`page-${pageNumber}`}>
                        {showGap && <span className="px-1 text-blinkit-gray">...</span>}
                        <button
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                            pageNumber === page
                              ? 'bg-blinkit-green text-white border-blinkit-green'
                              : 'bg-white text-blinkit-dark border-blinkit-border hover:bg-blinkit-light-gray'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="px-3 py-2 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blinkit-light-gray transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
