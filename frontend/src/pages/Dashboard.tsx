import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchJson } from '../api';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ chats: 0, products: 0, orders: 0, customers: 0 });

  const loadOverview = async () => {
    setLoading(true);
    try {
      const resp = await fetchJson('/api/analytics/overview');
      if (resp && resp.data) {
        setStats(resp.data);
      }
    } catch (err: any) {
      // unauthorized -> redirect to login
      if (err.message === 'unauthorized') {
        logout();
        navigate('/login');
        return;
      }
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();

    // React to socket-driven updates (emitted from Layout)
    const handler = () => loadOverview();
    window.addEventListener('socket:update-overview', handler as EventListener);

    return () => window.removeEventListener('socket:update-overview', handler as EventListener);
  }, []);
  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Stats Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-3xl">💬</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Chats
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">{loading ? '—' : stats.chats}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-3xl">📦</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Products
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">{loading ? '—' : stats.products}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-3xl">🛒</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Orders
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">{loading ? '—' : stats.orders}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-3xl">👥</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Customers
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">{loading ? '—' : stats.customers}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h2>
                <div className="space-y-4">
                  <Link to="/settings" className="flex items-start hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">1️⃣</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">Connect WhatsApp</h3>
                      <p className="text-sm text-gray-500">Set up your WhatsApp Business number</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link to="/products" className="flex items-start hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">2️⃣</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">Add Products</h3>
                      <p className="text-sm text-gray-500">Upload your product catalog</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link to="/settings" className="flex items-start hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">3️⃣</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">Configure AI</h3>
                      <p className="text-sm text-gray-500">Train your AI assistant</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
