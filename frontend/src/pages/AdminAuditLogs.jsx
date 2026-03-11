import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../component/Layout/Navbar";
import AdminSidebar from "../component/Layout/AdminSidebar";
import { adminService } from "../services/adminService";
import { useAuth } from "../context/AuthContext";

const AdminAuditLogs = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [logs, setLogs] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
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
  const [expandedId, setExpandedId] = useState(null);

  const setLastSeen = (logsList) => {
    if (!Array.isArray(logsList) || logsList.length === 0) return;
    const newest = logsList.find((log) => log?.createdAt)?.createdAt;
    const stamp = newest || new Date().toISOString();
    try {
      window.localStorage.setItem('qd_admin_audit_last_seen', stamp);
    } catch (error) {
      // ignore storage errors
    }
  };

  const filtersActive = useMemo(
    () =>
      actionFilter.trim() ||
      entityFilter.trim() ||
      actorFilter.trim() ||
      fromDate ||
      toDate,
    [actionFilter, entityFilter, actorFilter, fromDate, toDate],
  );

  const fetchLogs = async (nextPage = page) => {
    try {
      setFetching(true);
      const params = { page: nextPage, limit };
      if (actionFilter.trim()) params.action = actionFilter.trim();
      if (entityFilter.trim()) params.entityType = entityFilter.trim();
      if (actorFilter.trim()) params.actorId = actorFilter.trim();
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await adminService.getAuditLogs(params);
      const payload = response?.payload || {};
      const nextLogs = payload.logs || [];
      setLogs(nextLogs);
      setLastSeen(nextLogs);
      setPagination(payload.pagination || { page: 1, limit, total: 0, totalPages: 0 });
      setPage(payload.pagination?.page || nextPage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch audit logs");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchLogs(1);
    } else {
      setFetching(false);
    }
  }, [isAuthenticated, isAdmin]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchLogs(1);
  };

  const handleClearFilters = () => {
    setActionFilter("");
    setEntityFilter("");
    setActorFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
    fetchLogs(1);
  };

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 pb-20 lg:pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blinkit-dark">Admin: Audit Logs</h1>
              <p className="text-sm text-blinkit-gray mt-1">
                Track administrative actions across products, categories, orders, and agents.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fetchLogs(page)}
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
                  <div>
                    <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                      Action
                    </label>
                    <input
                      value={actionFilter}
                      onChange={(event) => setActionFilter(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                      placeholder="e.g. product.update"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                      Entity
                    </label>
                    <input
                      value={entityFilter}
                      onChange={(event) => setEntityFilter(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                      placeholder="Order, Product"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                      Actor ID
                    </label>
                    <input
                      value={actorFilter}
                      onChange={(event) => setActorFilter(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                      placeholder="Admin id"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                      From
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(event) => setFromDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-blinkit-gray uppercase tracking-wide">
                      To
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(event) => setToDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    />
                  </div>
                </div>
                {filtersActive && (
                  <p className="text-xs text-blinkit-gray">
                    Filters active. Showing {pagination.total || logs.length} matching logs.
                  </p>
                )}
              </div>

              {fetching ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto" />
                </div>
              ) : logs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
                  <h2 className="text-lg font-bold text-blinkit-dark">No audit logs</h2>
                  <p className="text-sm text-blinkit-gray mt-2">
                    No logs match the current filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => {
                    const id = log?.id || log?._id;
                    const actorName =
                      log?.actor?.name || log?.actor?.email || log?.actor || "System";
                    const createdAt = log?.createdAt
                      ? new Date(log.createdAt).toLocaleString()
                      : "N/A";
                    const isExpanded = expandedId === id;
                    return (
                      <div key={id} className="bg-white rounded-2xl border border-blinkit-border p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-xs text-blinkit-gray">ACTION</p>
                            <p className="text-sm font-semibold text-blinkit-dark">
                              {log?.action || "unknown"}
                            </p>
                            <p className="text-xs text-blinkit-gray mt-2">ENTITY</p>
                            <p className="text-sm text-blinkit-dark">
                              {log?.entityType || "N/A"}{" "}
                              {log?.entityId ? `• ${String(log.entityId).slice(-6)}` : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blinkit-gray">ACTOR</p>
                            <p className="text-sm font-semibold text-blinkit-dark">{actorName}</p>
                            <p className="text-xs text-blinkit-gray mt-2">TIME</p>
                            <p className="text-sm text-blinkit-dark">{createdAt}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(id)}
                            className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                          >
                            {isExpanded ? "Hide Details" : "View Details"}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-blinkit-light-gray/60 rounded-xl p-3">
                              <p className="font-semibold text-blinkit-dark mb-2">Meta</p>
                              <pre className="whitespace-pre-wrap text-[11px] text-blinkit-dark">
                                {JSON.stringify(log?.meta || {}, null, 2)}
                              </pre>
                            </div>
                            <div className="bg-blinkit-light-gray/60 rounded-xl p-3">
                              <p className="font-semibold text-blinkit-dark mb-2">Before</p>
                              <pre className="whitespace-pre-wrap text-[11px] text-blinkit-dark">
                                {JSON.stringify(log?.before || {}, null, 2)}
                              </pre>
                            </div>
                            <div className="bg-blinkit-light-gray/60 rounded-xl p-3">
                              <p className="font-semibold text-blinkit-dark mb-2">After</p>
                              <pre className="whitespace-pre-wrap text-[11px] text-blinkit-dark">
                                {JSON.stringify(log?.after || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-blinkit-gray">
                    Page {pagination.page} of {pagination.totalPages} · {pagination.total} logs
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fetchLogs(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page <= 1 || fetching}
                      className="px-3 py-1.5 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray disabled:opacity-60"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        fetchLogs(Math.min(pagination.totalPages, pagination.page + 1))
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
      </div>
    </div>
  );
};

export default AdminAuditLogs;
