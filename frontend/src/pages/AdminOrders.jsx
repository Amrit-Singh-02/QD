import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../component/Layout/Navbar";
import Footer from "../component/Layout/Footer";
import { adminService } from "../services/adminService";
import { useAuth } from "../context/AuthContext";

const statusOptions = [
  { id: "all", label: "All Statuses" },
  { id: "PLACED", label: "Placed" },
  { id: "ASSIGNING", label: "Assigning" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "PICKED_UP", label: "Picked up" },
  { id: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "NO_AGENT_AVAILABLE", label: "No agent available" },
];

const AdminOrders = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });
  const [statusUpdates, setStatusUpdates] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = user?.role === "admin";

  const fetchOrders = async (nextPage = page) => {
    try {
      setFetching(true);
      const params = {
        page: nextPage,
        limit,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (orderIdFilter.trim()) params.orderId = orderIdFilter.trim();
      if (userFilter.trim()) params.user = userFilter.trim();
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await adminService.getOrders(params);
      const payload = response?.payload || {};
      setOrders(payload.orders || []);
      setPagination(payload.pagination || { page: 1, limit, total: 0, totalPages: 0 });
      setPage(payload.pagination?.page || nextPage);
    } catch (error) {
      if (error.response?.status === 404) {
        setOrders([]);
        setPagination({ page: 1, limit, total: 0, totalPages: 0 });
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch orders");
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchOrders(1);
    } else {
      setFetching(false);
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    const next = {};
    orders.forEach((order) => {
      const id = order?.id || order?._id;
      if (!id) return;
      next[id] = (order?.orderStatus || "PLACED").toUpperCase();
    });
    setStatusUpdates(next);
  }, [orders]);

  const getStatusColor = (status) => {
    switch (status) {
      case "PLACED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ASSIGNING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ACCEPTED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "PICKED_UP":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "OUT_FOR_DELIVERY":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "NO_AGENT_AVAILABLE":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "unknown";
    return status.replace(/_/g, " ").toLowerCase();
  };

  const handleStatusChange = (orderId, value) => {
    setStatusUpdates((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleUpdateStatus = async (order) => {
    const orderId = order?.id || order?._id;
    if (!orderId) return;
    const nextStatus = statusUpdates[orderId];
    if (!nextStatus) return;

    try {
      setUpdatingId(orderId);
      const response = await adminService.updateOrderStatus(orderId, {
        orderStatus: nextStatus,
      });
      const updated = response?.payload;
      setOrders((prev) =>
        prev.map((item) => {
          const id = item?.id || item?._id;
          if (id !== orderId) return item;
          return {
            ...item,
            ...updated,
            orderStatus: updated?.orderStatus || nextStatus,
          };
        }),
      );
      toast.success("Order status updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchOrders(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setOrderIdFilter("");
    setUserFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
    fetchOrders(1);
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blinkit-dark">Admin: User Orders</h1>
            <p className="text-sm text-blinkit-gray mt-1">
              Review all user orders from the admin route.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchOrders(page)}
              className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto" />
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
            <h2 className="text-lg font-bold text-blinkit-dark">Login required</h2>
            <p className="text-sm text-blinkit-gray mt-2">
              Please log in with an admin account to access this page.
            </p>
            <Link
              to="/login"
              className="inline-flex mt-4 px-5 py-2 rounded-xl bg-blinkit-green text-white font-semibold"
            >
              Go to Login
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
            <h2 className="text-lg font-bold text-blinkit-dark">Admin access only</h2>
            <p className="text-sm text-blinkit-gray mt-2">
              Your account does not have admin privileges.
            </p>
            <Link
              to="/"
              className="inline-flex mt-4 px-5 py-2 rounded-xl bg-blinkit-green text-white font-semibold"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-blinkit-border p-4 mb-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-blinkit-dark">Filters</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="px-4 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                    Order ID
                  </label>
                  <input
                    value={orderIdFilter}
                    onChange={(event) => setOrderIdFilter(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="e.g. 65af12"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                    User (name/email/phone)
                  </label>
                  <input
                    value={userFilter}
                    onChange={(event) => setUserFilter(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="Search user"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm font-semibold text-blinkit-dark focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>
              </div>
            </div>

            {fetching ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
                <h2 className="text-lg font-bold text-blinkit-dark">No orders found</h2>
                <p className="text-sm text-blinkit-gray mt-2">
                  There are no orders matching the current filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = (order?.orderStatus || "UNKNOWN").toUpperCase();
                  const userName = order?.user?.name || "Unknown user";
                  const userEmail = order?.user?.email || "No email";
                  const orderId = order?.id || order?._id;
                  return (
                    <div
                      key={orderId}
                      className="bg-white rounded-2xl border border-blinkit-border p-4 flex flex-col gap-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                        <p className="text-xs text-blinkit-gray">ORDER</p>
                        <p className="font-mono text-sm font-semibold text-blinkit-dark">
                          #{orderId?.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-blinkit-gray mt-2">PLACED</p>
                        <p className="text-sm text-blinkit-dark">
                          {order?.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
                        </p>
                        </div>
                        <div>
                        <p className="text-xs text-blinkit-gray">CUSTOMER</p>
                        <p className="text-sm font-semibold text-blinkit-dark">{userName}</p>
                        <p className="text-xs text-blinkit-gray">{userEmail}</p>
                        </div>
                        <div>
                        <p className="text-xs text-blinkit-gray">TOTAL</p>
                        <p className="text-sm font-bold text-blinkit-dark">
                          {"\u20B9"}{order?.totalAmount || 0}
                        </p>
                        <p className="text-xs text-blinkit-gray mt-1">
                          {order?.items?.length || 0} items
                        </p>
                        </div>
                        <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)} uppercase tracking-wide`}
                        >
                          {formatStatus(status)}
                        </span>
                        </div>
                      </div>
                      <div className="border-t border-blinkit-border pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <label className="text-sm font-semibold text-blinkit-dark">Update status</label>
                          <select
                            value={statusUpdates[orderId] || status}
                            onChange={(event) => handleStatusChange(orderId, event.target.value)}
                            className="rounded-xl border border-blinkit-border px-4 py-2 text-sm font-semibold text-blinkit-dark focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                          >
                            {statusOptions
                              .filter((option) => option.id !== "all")
                              .map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleUpdateStatus(order)}
                          disabled={updatingId === orderId}
                          className="px-4 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors disabled:opacity-60"
                        >
                          {updatingId === orderId ? "Updating..." : "Save Status"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-blinkit-gray">
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fetchOrders(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1 || fetching}
                    className="px-3 py-1.5 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray disabled:opacity-60"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      fetchOrders(Math.min(pagination.totalPages, pagination.page + 1))
                    }
                    disabled={pagination.page >= pagination.totalPages || fetching}
                    className="px-3 py-1.5 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminOrders;
