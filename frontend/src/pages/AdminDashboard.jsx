import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../component/Layout/Navbar';
import AdminSidebar from '../component/Layout/AdminSidebar';
import { adminService } from '../services/adminService';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatDuration = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return 'N/A';
  const minutes = Math.round(ms / 60000);
  return `${minutes} min`;
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminService.getDashboard();
        setData(res?.payload || null);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const orderStatusCounts = useMemo(() => {
    const map = {};
    const list = data?.orders?.byStatus || [];
    list.forEach((item) => {
      const key = String(item._id || item.status || '').toUpperCase();
      if (!key) return;
      map[key] = Number(item.count || 0);
    });
    return map;
  }, [data]);

  const totalOrdersCount = useMemo(
    () => Object.values(orderStatusCounts).reduce((acc, cur) => acc + cur, 0),
    [orderStatusCounts],
  );

  const activeOrdersCount = useMemo(() => {
    const activeStatuses = [
      'PLACED',
      'ASSIGNING',
      'ACCEPTED',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
    ];
    return activeStatuses.reduce(
      (sum, status) => sum + (orderStatusCounts[status] || 0),
      0,
    );
  }, [orderStatusCounts]);

  const cancellationRate =
    typeof data?.orders?.cancellationRate === 'number'
      ? data.orders.cancellationRate
      : totalOrdersCount
        ? Math.round(
            ((orderStatusCounts.CANCELLED || 0) / totalOrdersCount) * 1000,
          ) / 10
        : 0;

  const successRate = totalOrdersCount
    ? Math.max(0, 100 - cancellationRate)
    : 0;

  const avgDeliveryTimeMs = useMemo(() => {
    const agents = data?.agents?.topAgents || [];
    const times = agents
      .map((agent) => Number(agent.avgDeliveryTimeMs || 0))
      .filter((value) => value > 0);
    if (times.length === 0) return null;
    return times.reduce((acc, cur) => acc + cur, 0) / times.length;
  }, [data]);

  const ordersLast24h = useMemo(() => {
    const trend = data?.orders?.revenueTrend || [];
    if (trend.length === 0) return null;
    const last = trend[trend.length - 1];
    return last?.orders ?? null;
  }, [data]);

  const commandCards = [
    { label: 'Live Orders', value: activeOrdersCount, sub: 'Active right now' },
    { label: 'Orders (1h)', value: 'N/A', sub: 'Realtime metric' },
    { label: 'Orders (6h)', value: 'N/A', sub: 'Realtime metric' },
    {
      label: 'Orders (24h)',
      value: ordersLast24h ?? 'N/A',
      sub: 'From daily trend',
    },
    {
      label: 'Revenue Today',
      value: formatCurrency(data?.orders?.todayRevenue),
      sub: 'Delivered orders',
    },
    {
      label: 'Revenue This Week',
      value: formatCurrency(data?.orders?.weeklyRevenue),
      sub: 'Delivered orders',
    },
    {
      label: 'Revenue This Month',
      value: formatCurrency(data?.orders?.monthlyRevenue),
      sub: 'Delivered orders',
    },
    {
      label: 'Active Agents',
      value: `${data?.agents?.online ?? 0}/${data?.agents?.total ?? 0}`,
      sub: 'Online / Total',
    },
    {
      label: 'Avg Delivery Time',
      value: formatDuration(avgDeliveryTimeMs),
      sub: 'From top agents',
    },
    {
      label: 'Order Success Rate',
      value: formatPercent(successRate),
      sub: 'Success vs cancelled',
    },
    {
      label: 'Cancelled Orders',
      value: formatPercent(cancellationRate),
      sub: 'Cancellation rate',
    },
    {
      label: 'Low Stock Alerts',
      value: `${data?.products?.lowStock ?? 0} low · ${data?.products?.outOfStock ?? 0} out`,
      sub: 'Inventory risk',
    },
    {
      label: 'System Health',
      value: 'N/A',
      sub: 'Requires uptime monitor',
    },
  ];

  const revenueTrend = data?.orders?.revenueTrend || [];
  const revenueChart = revenueTrend.length
    ? {
        labels: revenueTrend.map((point) => point._id || ''),
        datasets: [
          {
            label: 'Revenue',
            data: revenueTrend.map((point) => point.revenue || 0),
            borderColor: '#40513B',
            backgroundColor: 'rgba(64, 81, 59, 0.15)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#40513B',
            tension: 0.35,
            fill: true,
          },
        ],
      }
    : null;

  const orderStatusChart = data?.orders?.byStatus
    ? {
        labels: data.orders.byStatus.map((status) =>
          String(status._id || status.status || '').replace(/_/g, ' '),
        ),
        datasets: [
          {
            data: data.orders.byStatus.map((status) => status.count || 0),
            backgroundColor: [
              '#40513B',
              '#2F3A2B',
              '#6B7280',
              '#94A3B8',
              '#CBD5F5',
              '#475569',
              '#111827',
            ],
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      }
    : null;

  const areaChart = data?.zones
    ? {
        labels: data.zones.map((zone) => zone._id || 'Zone'),
        datasets: [
          {
            label: 'Orders',
            data: data.zones.map((zone) => zone.orders || 0),
            backgroundColor: 'rgba(64, 81, 59, 0.7)',
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      }
    : null;

  const ticketStats = data?.tickets || [];
  const ticketCounts = ticketStats.reduce((acc, item) => {
    acc[String(item._id || item.status || '').toUpperCase()] = item.count || 0;
    return acc;
  }, {});

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { family: 'Inter', weight: '600' },
        bodyFont: { family: 'Inter' },
        padding: 12,
        cornerRadius: 10,
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Inter', size: 11 } } },
    },
  };

  const topProducts = data?.orders?.topProducts || [];
  const topAgents = data?.agents?.topAgents || [];
  const recentOrders = data?.orders?.recentOrders || [];

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl pb-20 lg:pb-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blinkit-dark">
              Admin Panel
            </h1>
            <p className="text-blinkit-gray text-sm mt-1">
              Command center for live ops, revenue, inventory, and support.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-blinkit-border p-5 shimmer h-24" />
              ))}
            </div>
          ) : (
            <>
              {/* Command Center */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blinkit-dark">Overview / Command Center</h2>
                  <span className="text-xs text-blinkit-gray">Live + snapshot metrics</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {commandCards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-blinkit-border p-4 card-hover">
                      <p className="text-xs text-blinkit-gray font-semibold uppercase tracking-wide">
                        {card.label}
                      </p>
                      <p className="text-xl font-extrabold text-blinkit-dark mt-2">
                        {card.value}
                      </p>
                      <p className="text-[11px] text-blinkit-gray mt-1">{card.sub}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Order Management */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blinkit-dark">Order Management</h2>
                  <span className="text-xs text-blinkit-gray">Pipeline, live feed, SLA alerts</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl border border-blinkit-border p-5">
                    <h3 className="font-bold text-blinkit-dark mb-3">Order Status Pipeline</h3>
                    <div className="space-y-2">
                      {[
                        'PLACED',
                        'ASSIGNING',
                        'ACCEPTED',
                        'PICKED_UP',
                        'OUT_FOR_DELIVERY',
                        'DELIVERED',
                        'CANCELLED',
                        'NO_AGENT_AVAILABLE',
                      ].map((status) => (
                        <div key={status} className="flex items-center justify-between text-sm">
                          <span className="text-blinkit-gray">
                            {status.replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold text-blinkit-dark">
                            {orderStatusCounts[status] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-blinkit-gray">
                      <span>SLA breaches</span>
                      <span>N/A</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-blinkit-gray">
                      <span>Failed payments</span>
                      <span>N/A</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-blinkit-border p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-blinkit-dark">Live Orders Feed</h3>
                      <span className="text-xs text-blinkit-gray">Realtime feed</span>
                    </div>
                    {recentOrders.length === 0 ? (
                      <div className="text-sm text-blinkit-gray py-6 text-center border border-dashed border-blinkit-border rounded-xl">
                        No live feed available. Use the Orders page for real-time view.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recentOrders.map((order) => (
                          <div key={order._id || order.id} className="flex items-center justify-between text-sm border border-blinkit-border rounded-lg px-3 py-2">
                            <span className="text-blinkit-dark font-medium">
                              #{String(order._id || order.id).slice(-6).toUpperCase()}
                            </span>
                            <span className="text-blinkit-gray">
                              {(order.orderStatus || '').replace(/_/g, ' ')}
                            </span>
                            <span className="text-blinkit-dark font-semibold">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Inventory & Products */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blinkit-dark">Product & Inventory</h2>
                  <span className="text-xs text-blinkit-gray">Stock health & performance</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl border border-blinkit-border p-5">
                    <h3 className="font-bold text-blinkit-dark mb-2">Stock Health</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Total products</span>
                        <span className="font-semibold text-blinkit-dark">{data?.products?.total ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Low stock</span>
                        <span className="font-semibold text-blinkit-dark">{data?.products?.lowStock ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Out of stock</span>
                        <span className="font-semibold text-blinkit-dark">{data?.products?.outOfStock ?? 0}</span>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-blinkit-gray">
                      Thresholds require configuration in backend.
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-blinkit-border p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-blinkit-dark">Top Selling Products</h3>
                      <span className="text-xs text-blinkit-gray">Delivered orders</span>
                    </div>
                    {topProducts.length === 0 ? (
                      <p className="text-sm text-blinkit-gray text-center py-6">
                        No product performance data available.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {topProducts.map((product) => (
                          <div key={product._id} className="flex items-center justify-between text-sm border border-blinkit-border rounded-lg px-3 py-2">
                            <span className="text-blinkit-dark font-medium">{product.name || 'Product'}</span>
                            <span className="text-blinkit-gray">{product.totalSold || 0} sold</span>
                            <span className="font-semibold text-blinkit-dark">{formatCurrency(product.totalRevenue)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Delivery Agents */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blinkit-dark">Delivery Agent Management</h2>
                  <span className="text-xs text-blinkit-gray">Performance & availability</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl border border-blinkit-border p-5">
                    <h3 className="font-bold text-blinkit-dark mb-3">Agents Overview</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Total agents</span>
                        <span className="font-semibold text-blinkit-dark">{data?.agents?.total ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Online</span>
                        <span className="font-semibold text-blinkit-dark">{data?.agents?.online ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Offline</span>
                        <span className="font-semibold text-blinkit-dark">{data?.agents?.offline ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Avg delivery time</span>
                        <span className="font-semibold text-blinkit-dark">{formatDuration(avgDeliveryTimeMs)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-blinkit-border p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-blinkit-dark">Top Agents</h3>
                      <span className="text-xs text-blinkit-gray">By deliveries & rating</span>
                    </div>
                    {topAgents.length === 0 ? (
                      <p className="text-sm text-blinkit-gray text-center py-6">
                        No agent performance data available.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {topAgents.map((agent) => (
                          <div key={agent._id} className="flex items-center justify-between text-sm border border-blinkit-border rounded-lg px-3 py-2">
                            <span className="text-blinkit-dark font-medium">{agent.name || 'Agent'}</span>
                            <span className="text-blinkit-gray">{agent.totalDeliveries || 0} deliveries</span>
                            <span className="text-blinkit-dark font-semibold">{formatDuration(agent.avgDeliveryTimeMs)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Revenue & Analytics */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blinkit-dark">Revenue & Analytics</h2>
                  <span className="text-xs text-blinkit-gray">Financial performance & insights</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {revenueChart && (
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-blinkit-border p-5 card-hover">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-blinkit-dark">Revenue Trend</h3>
                          <p className="text-xs text-blinkit-gray">Last 30 days</p>
                        </div>
                      </div>
                      <div className="h-64">
                        <Line data={revenueChart} options={chartOptions} />
                      </div>
                    </div>
                  )}

                  {orderStatusChart && (
                    <div className="bg-white rounded-2xl border border-blinkit-border p-5 card-hover">
                      <div className="mb-4">
                        <h3 className="font-bold text-blinkit-dark">Order Status</h3>
                        <p className="text-xs text-blinkit-gray">Distribution breakdown</p>
                      </div>
                      <div className="h-64 flex items-center justify-center">
                        <Doughnut
                          data={orderStatusChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '65%',
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: { font: { family: 'Inter', size: 10 }, boxWidth: 10, padding: 12 },
                              },
                              tooltip: chartOptions.plugins.tooltip,
                            },
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                  {areaChart && (
                    <div className="bg-white rounded-2xl border border-blinkit-border p-5 card-hover">
                      <div className="mb-4">
                        <h3 className="font-bold text-blinkit-dark">Orders by Zone</h3>
                        <p className="text-xs text-blinkit-gray">Top service areas</p>
                      </div>
                      <div className="h-64">
                        <Bar data={areaChart} options={chartOptions} />
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-blinkit-border p-5 card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-blinkit-dark">Customer Snapshot</h3>
                        <p className="text-xs text-blinkit-gray">Acquisition & retention</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Total customers</span>
                        <span className="font-semibold text-blinkit-dark">{data?.users?.total ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Verified customers</span>
                        <span className="font-semibold text-blinkit-dark">{data?.users?.verified ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">New this month</span>
                        <span className="font-semibold text-blinkit-dark">{data?.users?.newThisMonth ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">High-value customers</span>
                        <span className="font-semibold text-blinkit-dark">N/A</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Retention rate</span>
                        <span className="font-semibold text-blinkit-dark">N/A</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Support & Alerts */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blinkit-dark">Support, Alerts & System Health</h2>
                  <span className="text-xs text-blinkit-gray">Critical signals</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl border border-blinkit-border p-5">
                    <h3 className="font-bold text-blinkit-dark mb-3">Support Tickets</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Open</span>
                        <span className="font-semibold text-blinkit-dark">{ticketCounts.OPEN || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">In Progress</span>
                        <span className="font-semibold text-blinkit-dark">{ticketCounts.IN_PROGRESS || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Resolved</span>
                        <span className="font-semibold text-blinkit-dark">{ticketCounts.RESOLVED || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Closed</span>
                        <span className="font-semibold text-blinkit-dark">{ticketCounts.CLOSED || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-blinkit-border p-5">
                    <h3 className="font-bold text-blinkit-dark mb-3">Alerts Center</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">No agent available</span>
                        <span className="font-semibold text-blinkit-dark">{orderStatusCounts.NO_AGENT_AVAILABLE || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Low stock items</span>
                        <span className="font-semibold text-blinkit-dark">{data?.products?.lowStock ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">High cancellation spike</span>
                        <span className="font-semibold text-blinkit-dark">
                          {cancellationRate > 10 ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">Payment gateway</span>
                        <span className="font-semibold text-blinkit-dark">N/A</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-blinkit-border p-5">
                    <h3 className="font-bold text-blinkit-dark mb-3">System Health</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">App uptime</span>
                        <span className="font-semibold text-blinkit-dark">N/A</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">API latency</span>
                        <span className="font-semibold text-blinkit-dark">N/A</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blinkit-gray">System health</span>
                        <span className="font-semibold text-blinkit-dark">N/A</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;






