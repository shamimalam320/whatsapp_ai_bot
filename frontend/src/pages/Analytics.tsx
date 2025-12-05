import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import * as analyticsApi from '../api/analytics';
import { AnalyticsDashboardData } from '../api/analytics';

export default function Analytics() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const params: { startDate?: string; endDate?: string } = {};
      
      const now = new Date();
      const end = now.toISOString();
      
      if (dateRange === '7d') {
        params.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        params.endDate = end;
      } else if (dateRange === '30d') {
        params.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        params.endDate = end;
      } else if (dateRange === '90d') {
        params.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        params.endDate = end;
      } else if (dateRange === 'custom' && customStart && customEnd) {
        params.startDate = new Date(customStart).toISOString();
        params.endDate = new Date(customEnd).toISOString();
      }

      const res = await analyticsApi.getDashboard(params);
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics', err);
      if (err.message === 'unauthorized') {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      fetchAnalytics();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-6">Analytics</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-6">Analytics</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">No analytics data available</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Analytics</h1>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1 rounded text-sm ${dateRange === '7d' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1 rounded text-sm ${dateRange === '30d' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className={`px-3 py-1 rounded text-sm ${dateRange === '90d' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Last 90 Days
              </button>
              <button
                onClick={() => setDateRange('custom')}
                className={`px-3 py-1 rounded text-sm ${dateRange === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Custom
              </button>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {dateRange === 'custom' && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <button
                  onClick={applyCustomRange}
                  className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">{data.summary.totalProducts}</p>
                  <p className="text-xs text-green-600 mt-1">{data.summary.activeProducts} active</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  📦
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{data.summary.totalOrders}</p>
                  <p className="text-xs text-yellow-600 mt-1">{data.summary.pendingOrders} pending</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  🛒
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Chats</p>
                  <p className="text-3xl font-bold text-gray-900">{data.summary.totalChats}</p>
                  <p className="text-xs text-gray-500 mt-1">{data.summary.uniqueCustomers} customers</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  💬
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₹{data.revenue.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Avg: ₹{Math.round(data.revenue.average).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                  💰
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Order Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-semibold text-green-600">{data.summary.completedOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-semibold text-yellow-600">{data.summary.pendingOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cancelled</span>
                  <span className="text-sm font-semibold text-red-600">{data.summary.cancelledOrders}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Period Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orders in Period</span>
                  <span className="text-sm font-semibold">{data.revenue.ordersInPeriod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-semibold text-green-600">{data.revenue.completedInPeriod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm font-semibold">
                    {data.revenue.ordersInPeriod > 0
                      ? Math.round((data.revenue.completedInPeriod / data.revenue.ordersInPeriod) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Content Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total FAQs</span>
                  <span className="text-sm font-semibold">{data.summary.totalFaqs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active FAQs</span>
                  <span className="text-sm font-semibold text-green-600">{data.summary.activeFaqs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unique Customers</span>
                  <span className="text-sm font-semibold">{data.summary.uniqueCustomers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Trends</h3>
              <div className="space-y-2">
                {data.chartData.slice(-7).map((day, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>{day.orders} orders</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>{day.chats} chats</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>₹{day.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-1 flex gap-1 h-2">
                        <div
                          className="bg-blue-200 rounded"
                          style={{ width: `${(day.orders / Math.max(...data.chartData.map(d => d.orders), 1)) * 100}%` }}
                        ></div>
                        <div
                          className="bg-green-200 rounded"
                          style={{ width: `${(day.chats / Math.max(...data.chartData.map(d => d.chats), 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Popular Products</h3>
              {data.popularProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.popularProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                        <span className="text-sm text-gray-700 truncate">{product.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">{product.count} sold</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No product data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              {data.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {data.recentOrders.map((order: any) => (
                    <div key={order._id} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-start gap-4 min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{order.orderId || 'N/A'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[220px]">{order.customerName || 'Unknown'}</p>
                        </div>

                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-semibold text-gray-900">₹{order.totalAmount?.toLocaleString() || 0}</p>
                          <p className={`text-xs ${order.status === 'completed' ? 'text-green-600' : order.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {order.status}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 whitespace-normal">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent orders</p>
              )}
            </div>

            {/* Recent Chats removed per UI request */}
          </div>
        </div>
      </div>
    </Layout>
  );
}
