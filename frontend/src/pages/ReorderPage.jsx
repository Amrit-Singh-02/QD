import React, { useEffect, useState } from "react";
import Navbar from "../component/Layout/Navbar";
import Footer from "../component/Layout/Footer";
import { pantryOSService } from "../services/pantryOSService";

const ReorderPage = () => {
  const [pending, setPending] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [pendingRes, upcomingRes, patternRes] = await Promise.all([
        pantryOSService.getPendingReorders(),
        pantryOSService.getUpcomingReorders(),
        pantryOSService.getPatterns(),
      ]);
      setPending(pendingRes?.payload || []);
      setUpcoming(upcomingRes?.payload || []);
      setPatterns(patternRes?.payload || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-blinkit-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-extrabold text-blinkit-dark">Smart Auto-Reorder</h1>
        <p className="text-sm text-blinkit-gray mt-1">Patterns learned from your delivered orders</p>

        <section className="mt-5 rounded-2xl border border-blinkit-border bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blinkit-gray">Pending confirmation</h2>
          <div className="mt-3 space-y-2">
            {(pending || []).map((pattern) => (
              <div key={pattern._id || pattern.id} className="rounded-xl border border-blinkit-border px-3 py-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blinkit-dark">{pattern.productName || pattern.productId?.name || "Product"}</p>
                  <p className="text-xs text-blinkit-gray">
                    Suggested qty: {pattern.preferredQuantity} • Confidence: {Math.round((pattern.confidenceScore || 0) * 100)}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => pantryOSService.confirmReorder(pattern._id || pattern.id).then(load)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-blinkit-green text-white"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => pantryOSService.skipReorder(pattern._id || pattern.id).then(load)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-blinkit-border"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
            {!loading && pending.length === 0 && <p className="text-sm text-blinkit-gray">No pending reorders.</p>}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-blinkit-border bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blinkit-gray">Active patterns</h2>
          <div className="mt-3 space-y-2">
            {(patterns || []).map((pattern) => (
              <div key={pattern._id || pattern.id} className="rounded-xl border border-blinkit-border px-3 py-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blinkit-dark">{pattern.productName || pattern.productId?.name || "Product"}</p>
                  <p className="text-xs text-blinkit-gray">
                    Every {Math.round(pattern.avgDaysBetweenOrders || 0) || "-"} days • Confidence {Math.round((pattern.confidenceScore || 0) * 100)}%
                  </p>
                </div>
                <button
                  onClick={() => pantryOSService.togglePattern(pattern._id || pattern.id).then(load)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-blinkit-border"
                >
                  {pattern.isAutoReorderOn ? "AUTO ON" : "OFF"}
                </button>
              </div>
            ))}
            {!loading && patterns.length === 0 && <p className="text-sm text-blinkit-gray">No learned patterns yet.</p>}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-blinkit-border bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blinkit-gray">Upcoming</h2>
          <div className="mt-3 space-y-2">
            {(upcoming || []).map((pattern) => (
              <div key={pattern._id || pattern.id} className="rounded-xl border border-blinkit-border px-3 py-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blinkit-dark">{pattern.productName || pattern.productId?.name || "Product"}</p>
                  <p className="text-xs text-blinkit-gray">
                    Next predicted: {pattern.nextPredictedDate ? new Date(pattern.nextPredictedDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => pantryOSService.togglePattern(pattern._id || pattern.id).then(load)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-blinkit-border"
                >
                  Auto: {pattern.isAutoReorderOn ? "ON" : "OFF"}
                </button>
              </div>
            ))}
            {!loading && upcoming.length === 0 && <p className="text-sm text-blinkit-gray">No upcoming reorders.</p>}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-blinkit-border bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blinkit-gray">Savings summary</h2>
          <p className="text-sm text-blinkit-gray mt-2">
            This month: {patterns.filter((p) => p.isAutoReorderOn).length} products on auto reorder.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ReorderPage;
