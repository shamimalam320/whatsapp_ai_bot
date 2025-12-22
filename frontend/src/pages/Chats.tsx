// Replaced with final cleaned Chat page implementation
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchJson } from '../api/index';
import { useAuthStore } from '../store/authStore';

interface Message {
  _id: string;
  sender: 'customer' | 'business';
  text: string;
  timestamp: string;
  status?: string;
  mediaUrl?: string;
}

interface Chat {
  _id: string;
  customerPhone: string;
  customerName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  status: 'active' | 'pending' | 'closed';
  unreadCount?: number;
  messages?: Message[];
}

export default function Chats() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleApiError = (err: any) => {
    if (err?.message === 'unauthorized') {
      localStorage.removeItem('token');
      logout();
      navigate('/login');
    }
  };

  const fetchChats = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetchJson(`/api/chats?${params.toString()}`);
      if (res?.success && res.data?.chats) setChats(res.data.chats);
      else setChats([]);
    } catch (err: any) {
      console.error('Error fetching chats', err);
      handleApiError(err);
    }
  };

  const fetchChatDetails = async (chatId: string) => {
    try {
      const res = await fetchJson(`/api/chats/${chatId}`);
      if (res?.success) setSelectedChat(res.data);
    } catch (err: any) {
      console.error('Error fetching chat details', err);
      handleApiError(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;
    setLoading(true);
    try {
      const result = await fetchJson(`/api/chats/${selectedChat._id}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
      if (result?.success) {
        setSelectedChat((prev) => prev ? { ...prev, messages: [...(prev.messages || []), result.data], lastMessage: message, lastMessageAt: new Date().toISOString() } : prev);
        setMessage('');
        fetchChats();
      } else {
        throw new Error(result?.message || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Error sending message', err);
      handleApiError(err);
    } finally { setLoading(false); }
  };

  const handleStatusChange = async (chatId: string, status: string) => {
    try {
      await fetchJson(`/api/chats/${chatId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      fetchChats();
      if (selectedChat?._id === chatId) setSelectedChat(prev => prev ? { ...prev, status: status as any } : prev);
    } catch (err: any) {
      console.error('Error updating status', err);
      handleApiError(err);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredChats = chats.filter(c =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || c.customerPhone.includes(searchQuery)
  );

  const formatTime = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-96 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
            <div className="flex items-center gap-2">
              <input className="flex-1 px-3 py-2 border rounded" placeholder="Search by name or phone" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredChats.map((chat) => (
              <div key={chat._id} className={`p-4 border-b cursor-pointer ${selectedChat?._id === chat._id ? 'bg-gray-100' : ''}`} onClick={() => { setSelectedChat(chat); fetchChatDetails(chat._id); }}>
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{chat.customerName}</div>
                    <div className="text-sm text-gray-600 truncate">{chat.lastMessage}</div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{formatTime(chat.lastMessageAt)}</div>
                    <div className="text-xs">{formatDate(chat.lastMessageAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Conversation</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedChat && <div className="text-gray-500">Select a chat to view messages</div>}
            {selectedChat && (
              <div className="space-y-4">
                {selectedChat.messages?.map((m) => (
                  <div key={m._id} className={`p-2 rounded ${m.sender === 'business' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}>
                    <div className="text-sm">{m.text}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatTime(m.timestamp)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedChat && (
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <input className="flex-1 px-3 py-2 border rounded" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message" />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
              <select value={selectedChat.status} onChange={(e) => handleStatusChange(selectedChat._id, e.target.value)} className="ml-2 px-2 py-1 border rounded">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
