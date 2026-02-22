import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../component/Layout/Navbar";
import { adminService } from "../services/adminService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-2xl border border-blinkit-border p-5 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </span>
    </div>
    <p className="text-2xl font-bold text-blinkit-dark">{value}</p>
    <p className="text-xs text-blinkit-gray mt-1">{label}</p>
  </div>
);

const fmt = (n) => {
  if (n == null) return "0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await adminService.getDashboard();
      setData(response?.payload || null);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-blinkit-bg">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blinkit-green" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-blinkit-bg">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-blinkit-gray">No dashboard data available.</p>
        </div>
      </div>
    );
  }

  const { users, products, orders, agents, zones, tickets } = data;

  // Order status counts
  const statusMap = {};
  (orders?.byStatus || []).forEach((s) => {
    statusMap[s._id] = s.count;
  });

  // Revenue trend chart data
  const trendLabels = (orders?.revenueTrend || []).map((d) => {
    const date = new Date(d._id);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });
  const trendData = (orders?.revenueTrend || []).map((d) => d.revenue);
  const trendOrders = (orders?.revenueTrend || []).map((d) => d.orders);

  const revenueTrendConfig = {
    labels: trendLabels,
    datasets: [
      {
        label: "Revenue (₹)",
        data: trendData,
        borderColor: "#0c831f",
        backgroundColor: "rgba(12,131,31,0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: "#0c831f",
      },
      {
        label: "Orders",
        data: trendOrders,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.1)",
        tension: 0.4,
        fill: false,
        yAxisID: "y1",
        pointRadius: 3,
        pointBackgroundColor: "#f59e0b",
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { position: "top", labels: { usePointStyle: true } } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Revenue (₹)" } },
      y1: { position: "right", beginAtZero: true, title: { display: true, text: "Orders" }, grid: { drawOnChartArea: false } },
    },
  };

  // Orders by status doughnut
  const statusLabels = Object.keys(statusMap);
  const statusValues = Object.values(statusMap);
  const statusColors = [
    "#3b82f6", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ef4444", "#6b7280", "#ec4899",
  ];

  const doughnutConfig = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: statusColors.slice(0, statusLabels.length),
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  // Top products bar
  const topProductNames = (orders?.topProducts || []).map((p) => p.name || "Unknown");
  const topProductSold = (orders?.topProducts || []).map((p) => p.totalSold);

  const barConfig = {
    labels: topProductNames.slice(0, 8),
    datasets: [
      {
        label: "Units Sold",
        data: topProductSold.slice(0, 8),
        backgroundColor: "rgba(12,131,31,0.8)",
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true },
      x: { ticks: { maxRotation: 45, minRotation: 30 } },
    },
  };

  // Ticket stats
  const ticketMap = {};
  (tickets || []).forEach((t) => {
    ticketMap[t._id] = t.count;
  });

  return (
    <div className="min-h-screen bg-blinkit-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blinkit-dark">Dashboard</h1>
            <p className="text-sm text-blinkit-gray">Analytics Overview</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-lg bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Users" value={users?.total || 0} icon="👥" color="#3b82f6" />
          <StatCard label="Total Orders" value={(statusMap.DELIVERED || 0) + (statusMap.PLACED || 0) + (statusMap.ACCEPTED || 0) + (statusMap.CANCELLED || 0)} icon="📦" color="#f59e0b" />
          <StatCard label="Total Revenue" value={fmt(orders?.totalRevenue)} icon="💰" color="#10b981" />
          <StatCard label="Products" value={products?.total || 0} icon="🛍️" color="#8b5cf6" />
          <StatCard label="Agents" value={agents?.total || 0} icon="🚴" color="#06b6d4" />
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Today's Revenue" value={fmt(orders?.todayRevenue)} icon="📊" color="#10b981" />
          <StatCard label="Weekly Revenue" value={fmt(orders?.weeklyRevenue)} icon="📈" color="#3b82f6" />
          <StatCard label="Monthly Revenue" value={fmt(orders?.monthlyRevenue)} icon="🏦" color="#8b5cf6" />
          <StatCard label="Avg Order Value" value={fmt(orders?.avgOrderValue)} icon="🧾" color="#f59e0b" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-blinkit-border p-5">
            <h3 className="font-bold text-blinkit-dark mb-4">Revenue Trend (30 days)</h3>
            {trendLabels.length > 0 ? (
              <Line data={revenueTrendConfig} options={trendOptions} />
            ) : (
              <p className="text-sm text-blinkit-gray text-center py-8">No data yet</p>
            )}
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-2xl border border-blinkit-border p-5">
            <h3 className="font-bold text-blinkit-dark mb-4">Orders by Status</h3>
            {statusLabels.length > 0 ? (
              <Doughnut data={doughnutConfig} options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 12 } } } }} />
            ) : (
              <p className="text-sm text-blinkit-gray text-center py-8">No data yet</p>
            )}
          </div>
        </div>

        {/* Top Products + Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-2xl border border-blinkit-border p-5">
            <h3 className="font-bold text-blinkit-dark mb-4">Top Selling Products</h3>
            {topProductNames.length > 0 ? (
              <Bar data={barConfig} options={barOptions} />
            ) : (
              <p className="text-sm text-blinkit-gray text-center py-8">No data yet</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-blinkit-border p-5">
            <h3 className="font-bold text-blinkit-dark mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-blinkit-border">
                <span className="text-sm text-blinkit-gray">Verified Users</span>
                <span className="text-sm font-bold text-blinkit-dark">{users?.verified || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blinkit-border">
                <span className="text-sm text-blinkit-gray">New Users This Month</span>
                <span className="text-sm font-bold text-blinkit-dark">{users?.newThisMonth || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blinkit-border">
                <span className="text-sm text-blinkit-gray">Out of Stock Products</span>
                <span className="text-sm font-bold text-red-600">{products?.outOfStock || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blinkit-border">
                <span className="text-sm text-blinkit-gray">Low Stock Products</span>
                <span className="text-sm font-bold text-orange-600">{products?.lowStock || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blinkit-border">
                <span className="text-sm text-blinkit-gray">Cancellation Rate</span>
                <span className="text-sm font-bold text-red-600">{orders?.cancellationRate || 0}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blinkit-border">
                <span className="text-sm text-blinkit-gray">Online Agents</span>
                <span className="text-sm font-bold text-green-600">{agents?.online || 0} / {agents?.total || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blinkit-border">
                <span className="text-sm text-blinkit-gray">Open Tickets</span>
                <span className="text-sm font-bold text-blue-600">{ticketMap.OPEN || 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-blinkit-gray">In Progress Tickets</span>
                <span className="text-sm font-bold text-yellow-600">{ticketMap.IN_PROGRESS || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Agents Table */}
        <div className="bg-white rounded-2xl border border-blinkit-border p-5 mb-8">
          <h3 className="font-bold text-blinkit-dark mb-4">Top Performing Agents</h3>
          {(agents?.topAgents || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blinkit-border text-blinkit-gray text-left">
                    <th className="py-3 pr-4">#</th>
                    <th className="py-3 pr-4">Agent</th>
                    <th className="py-3 pr-4">Deliveries</th>
                    <th className="py-3 pr-4">Rating</th>
                    <th className="py-3 pr-4">Acceptance</th>
                    <th className="py-3 pr-4">Avg Time</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(agents?.topAgents || []).map((agent, i) => {
                    const initials = (agent.name || "?")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const avgMins = agent.avgDeliveryTimeMs
                      ? `${Math.round(agent.avgDeliveryTimeMs / 60000)} min`
                      : "N/A";
                    return (
                      <tr key={agent._id || i} className="border-b border-blinkit-border last:border-0 hover:bg-blinkit-light-gray/50 transition-colors">
                        <td className="py-3 pr-4 text-blinkit-gray">{i + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {agent.profileImage?.url ? (
                              <img src={agent.profileImage.url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blinkit-green text-white flex items-center justify-center text-xs font-bold">
                                {initials}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-blinkit-dark">{agent.name}</p>
                              <p className="text-xs text-blinkit-gray">{agent.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-semibold">{agent.totalDeliveries || 0}</td>
                        <td className="py-3 pr-4">
                          <span className="text-yellow-500">★</span> {agent.rating || 0}
                        </td>
                        <td className="py-3 pr-4">{agent.acceptanceRate || 0}%</td>
                        <td className="py-3 pr-4">{avgMins}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${agent.isOnline ? "text-green-600" : "text-gray-400"}`}>
                            <span className={`w-2 h-2 rounded-full ${agent.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                            {agent.isOnline ? "Online" : "Offline"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-blinkit-gray text-center py-6">No agent data yet</p>
          )}
        </div>

        {/* Zone Analytics */}
        <div className="bg-white rounded-2xl border border-blinkit-border p-5">
          <h3 className="font-bold text-blinkit-dark mb-4">Zone Analytics</h3>
          {(zones || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blinkit-border text-blinkit-gray text-left">
                    <th className="py-3 pr-4">Zone / Pincode</th>
                    <th className="py-3 pr-4">Orders</th>
                    <th className="py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(zones || []).map((zone, i) => (
                    <tr key={zone._id || i} className="border-b border-blinkit-border last:border-0 hover:bg-blinkit-light-gray/50 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-blinkit-dark">{zone._id || "N/A"}</td>
                      <td className="py-3 pr-4">{zone.orders}</td>
                      <td className="py-3">{fmt(zone.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-blinkit-gray text-center py-6">No zone data yet</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
