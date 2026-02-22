import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../component/Layout/Navbar";
import { orderService } from "../services/orderService";

const CATEGORIES = [
  "Order Delayed",
  "Wrong Item Received",
  "Payment Issue",
  "Refund Issue",
  "Delivery Agent Behavior",
  "Technical Issue",
  "Other",
];

const STATUS_STYLES = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
};

const HelpDesk = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");

  const fetchTickets = async () => {
    try {
      const response = await orderService.getMyTickets();
      setTickets(response?.payload || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      const data = { category, message: message.trim() };
      if (orderId.trim()) data.orderId = orderId.trim();
      await orderService.createHelpTicket(data);
      toast.success("Ticket submitted!");
      setCategory("");
      setMessage("");
      setOrderId("");
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blinkit-dark mb-1">Help Desk</h1>
        <p className="text-sm text-blinkit-gray mb-6">
          Submit a support query or view your existing tickets.
        </p>

        {/* Helpline */}
        <div className="bg-gradient-to-r from-blinkit-green to-emerald-600 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">Need urgent help? Call us</p>
              <a
                href="tel:+911800123456"
                className="text-xl font-bold hover:underline"
              >
                1800-123-456
              </a>
              <p className="text-xs opacity-75 mt-0.5">Available 24×7 (toll free)</p>
            </div>
          </div>
        </div>

        {/* Submit Ticket */}
        <div className="bg-white rounded-2xl border border-blinkit-border p-6 mb-6">
          <h2 className="text-lg font-bold text-blinkit-dark mb-4">Submit a Query</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                Order ID <span className="text-blinkit-gray font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Paste the order ID if related to an order"
                className="w-full px-3 py-2.5 rounded-xl border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blinkit-dark mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail (min 10 characters)..."
                rows={4}
                maxLength={2000}
                className="w-full px-3 py-2.5 rounded-xl border border-blinkit-border text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/40 resize-none"
              />
              <p className="text-xs text-blinkit-gray mt-1">{message.length}/2000</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-2xl border border-blinkit-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-blinkit-dark">My Tickets</h2>
            <button
              onClick={fetchTickets}
              className="text-sm font-semibold text-blinkit-green hover:text-blinkit-green-dark"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blinkit-green" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-blinkit-gray text-center py-6">
              You haven't submitted any tickets yet.
            </p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const ticketId = ticket?.id || ticket?._id;
                return (
                  <div
                    key={ticketId}
                    className="border border-blinkit-border rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-xs text-blinkit-gray">
                          #{String(ticketId).slice(-6).toUpperCase()}
                        </span>
                        <p className="font-semibold text-blinkit-dark text-sm">
                          {ticket.category}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold border rounded-full uppercase tracking-wide ${STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN}`}
                      >
                        {(ticket.status || "OPEN").replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-blinkit-gray line-clamp-2 mb-2">
                      {ticket.message}
                    </p>
                    {ticket.adminResponse && (
                      <div className="bg-blinkit-light-gray rounded-lg p-3 mt-2">
                        <p className="text-xs font-semibold text-blinkit-dark mb-1">
                          Admin Response
                        </p>
                        <p className="text-sm text-blinkit-gray">
                          {ticket.adminResponse}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-blinkit-gray mt-2">
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HelpDesk;
