import { useEffect, useState } from "react";
import Navbar from '../component/Layout/Navbar';
import toast from "react-hot-toast";
import AdminSidebar from "../component/Layout/AdminSidebar";
import { adminService } from "../services/adminService";

const STATUS_STYLES = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
};

const PRIORITY_STYLES = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-orange-50 text-orange-600",
  HIGH: "bg-red-50 text-red-600",
};

const STATUS_TRANSITIONS = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

const AdminHelpTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [updating, setUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const response = await adminService.getHelpTickets(params);
      setTickets(response?.payload || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTickets();
  }, [statusFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const pagedTickets = tickets.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleUpdateTicket = async (ticketId, updates) => {
    setUpdating(true);
    try {
      await adminService.updateHelpTicket(ticketId, updates);
      toast.success("Ticket updated");
      setAdminResponse("");
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 pb-20 lg:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blinkit-dark">Help Tickets</h1>
              <p className="text-sm text-blinkit-gray">Manage support tickets</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40"
              />
              <button
                onClick={fetchTickets}
                className="px-4 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
              <span className="text-4xl block mb-3">🎫</span>
              <p className="text-blinkit-gray">No tickets found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pagedTickets.map((ticket) => {
                const ticketId = ticket?.id || ticket?._id;
                const isExpanded = expandedTicket === ticketId;
                const user = ticket.userId;
                const nextStatuses = STATUS_TRANSITIONS[ticket.status] || [];

                return (
                  <div
                    key={ticketId}
                    className="bg-white rounded-2xl border border-blinkit-border overflow-hidden card-hover"
                  >
                    <button
                      onClick={() => {
                        setExpandedTicket(isExpanded ? null : ticketId);
                        setAdminResponse(ticket.adminResponse || "");
                      }}
                      className="w-full p-4 text-left hover:bg-blinkit-light-gray/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-blinkit-gray">
                              #{String(ticketId).slice(-6).toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.MEDIUM}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="font-semibold text-blinkit-dark text-sm">
                            {ticket.category}
                          </p>
                          <p className="text-xs text-blinkit-gray mt-0.5">
                            {user?.name || "Unknown"} · {user?.email || ""} · {user?.phone || ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold border rounded-full ${STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN}`}>
                            {(ticket.status || "OPEN").replace(/_/g, " ")}
                          </span>
                          <svg
                            className={`w-4 h-4 text-blinkit-gray transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-blinkit-border p-4 space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-blinkit-gray mb-1">Message</p>
                          <p className="text-sm text-blinkit-dark bg-blinkit-light-gray rounded-xl p-3">
                            {ticket.message}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-blinkit-gray">Created</p>
                            <p className="font-semibold text-blinkit-dark">
                              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "N/A"}
                            </p>
                          </div>
                          {ticket.orderId && (
                            <div>
                              <p className="text-xs text-blinkit-gray">Order</p>
                              <p className="font-semibold text-blinkit-dark">
                                #{String(ticket.orderId?._id || ticket.orderId).slice(-6).toUpperCase()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-blinkit-gray mb-1">
                            Admin Response
                          </label>
                          <textarea
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            placeholder="Write a response to the user..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40 resize-none"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {adminResponse !== (ticket.adminResponse || "") && (
                            <button
                              onClick={() => handleUpdateTicket(ticketId, { adminResponse })}
                              disabled={updating}
                              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blinkit-green text-white hover:bg-blinkit-green-dark transition-colors disabled:opacity-60"
                            >
                              {updating ? "Saving..." : "Save Response"}
                            </button>
                          )}

                          {nextStatuses.map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                const updates = { status: s };
                                if (adminResponse && adminResponse !== (ticket.adminResponse || "")) {
                                  updates.adminResponse = adminResponse;
                                }
                                handleUpdateTicket(ticketId, updates);
                              }}
                              disabled={updating}
                              className="px-4 py-2 rounded-xl text-sm font-semibold border border-blinkit-border text-blinkit-dark hover:bg-blinkit-light-gray transition-colors disabled:opacity-60"
                            >
                              Move to {s.replace(/_/g, " ")}
                            </button>
                          ))}

                          <select
                            value={ticket.priority}
                            onChange={(e) => handleUpdateTicket(ticketId, { priority: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-blinkit-border text-sm"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tickets.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-blinkit-gray">
                Page {page} of {totalPages} · {tickets.length} tickets
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
        </main>
      </div>
    </div>
  );
};

export default AdminHelpTickets;






