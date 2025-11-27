import { ReactNode, useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
}


export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message?: string }>>([]);
  const socketRef = useRef<any | null>(null);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Initialize socket when user is present
  useEffect(() => {
    const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000';

    const businessId = user?.business?.id;
    if (!businessId) return;

    // Avoid reconnecting if already connected
    if (socketRef.current) {
      socketRef.current.emit('join', businessId);
      return;
    }

    async function initSocket() {
        // dynamic import avoids top-level type/import issues in environments where the package hasn't been installed yet
        const mod: any = await import('socket.io-client');
        const io = mod.io || mod.default || mod;

        const socket = io(API_BASE, { transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join', businessId);
      });

      socket.on('order.created', (payload: any) => {
        const id = String(Date.now());
        setNotifications((n) => [{ id, title: 'New order', message: payload?.summary || payload?.id || 'Order created' }, ...n]);
        setTimeout(() => setNotifications((s: any) => s.filter((x: any) => x.id !== id)), 8000);
        // Inform other parts of the app (e.g., Dashboard) that overview data should refresh
        try { window.dispatchEvent(new CustomEvent('socket:update-overview', { detail: { type: 'order', payload } })); } catch (e) {}
      });

      socket.on('chat.new', (payload: any) => {
        const id = String(Date.now());
        setNotifications((n) => [{ id, title: 'New chat', message: payload?.text || payload?.id || 'New message' }, ...n]);
        setTimeout(() => setNotifications((s: any) => s.filter((x: any) => x.id !== id)), 8000);
        try { window.dispatchEvent(new CustomEvent('socket:update-overview', { detail: { type: 'chat', payload } })); } catch (e) {}
      });

      socket.on('disconnect', () => {
        // socketRef cleared on unmount
      });
    }

    initSocket().catch((e) => console.warn('Socket init failed', e));

    return () => {
      try {
        socketRef.current?.disconnect();
        socketRef.current = null;
      } catch (e) {}
    };
  }, [user?.business?.id]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Chats', href: '/chats', icon: '💬' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Orders', href: '/orders', icon: '🛒' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'FAQs', href: '/faqs', icon: '❓' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-green-600">WhatsApp AI</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'border-green-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-sm focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block text-gray-700 font-medium">
                      {user?.name}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        showUserMenu ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-20">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Simple toast notifications */}
      <div className="fixed right-4 top-20 z-50 flex flex-col gap-3 max-w-xs w-full">
        {notifications.map((t) => (
          <div key={t.id} className="bg-white rounded shadow border px-4 py-3">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-sm font-semibold">{t.title}</div>
                {t.message && <div className="text-xs text-gray-600 mt-1">{t.message}</div>}
              </div>
              <div>
                <button onClick={() => setNotifications((s) => s.filter((x) => x.id !== t.id))} className="text-xs text-gray-400 hover:text-gray-700">Dismiss</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <main>{children}</main>
    </div>
  );
}
