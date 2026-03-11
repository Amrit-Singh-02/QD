import React, { useEffect, useState } from 'react';
import Navbar from '../component/Layout/Navbar';
import { Link } from 'react-router-dom';
import Footer from '../component/Layout/Footer';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';

const statusColors = {
  PLACED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-amber-100 text-amber-700',
  PACKED: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const expandFooter = () => window.dispatchEvent(new CustomEvent("footer:expand"));

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await orderService.getMyOrders();
        setOrders(r?.payload || []);
      } catch { toast.error('Failed to load orders'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [orders.length]);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const pagedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blinkit-dark">My Orders</h1>
          <button
            type="button"
            onClick={expandFooter}
            className="px-3 py-1.5 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
          >
            Expand Footer
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-blinkit-border p-5 shimmer h-32" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-blinkit-border p-12 text-center">
            <span className="text-5xl mb-4 block">📦</span>
            <h3 className="text-lg font-bold text-blinkit-dark mb-2">No orders yet</h3>
            <p className="text-sm text-blinkit-gray mb-6">Start shopping to see your orders here</p>
            <Link to="/" className="px-6 py-2.5 bg-blinkit-green text-white font-semibold rounded-xl text-sm hover:bg-blinkit-green-dark transition-colors">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pagedOrders.map((order) => {
              const oid = order._id || order.id;
              const status = order.status || 'PLACED';
              const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
              const itemCount = order.items?.length || 0;
              const firstImage = order.items?.[0]?.productId?.images?.[0]?.url;

              return (
                <div key={oid} className="bg-white rounded-2xl border border-blinkit-border p-4 sm:p-5 card-hover">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-blinkit-light-gray rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-blinkit-border">
                      {firstImage ? <img src={firstImage} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">📦</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs text-blinkit-gray font-mono">#{oid?.slice(-8)?.toUpperCase()}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-blinkit-dark">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 text-xs text-blinkit-gray">
                          <span>{date}</span>
                          <span className="font-bold text-blinkit-dark">₹{order.totalAmount || order.total || 0}</span>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/order/${oid}`} className="px-3 py-1.5 text-xs font-semibold bg-blinkit-green text-white rounded-lg hover:bg-blinkit-green-dark transition-colors">
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {orders.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-blinkit-gray">
              Page {page} of {totalPages} · {orders.length} orders
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray disabled:opacity-60"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyOrders;





