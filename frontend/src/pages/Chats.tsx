import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';

interface Message {
  _id: string;
  sender: 'customer' | 'business';
  text: string;
  timestamp: Date;
  status?: string;
  mediaUrl?: string;
}

interface Chat {
  _id: string;
  customerPhone: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: Date;
  status: 'active' | 'pending' | 'closed';
  unreadCount?: number;
  messages?: Message[];
}

export default function Chats() {
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check authentication
  const getToken = () => {
    return localStorage.getItem('token');
  };

  const handleApiError = (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      useAuthStore.getState().logout();
      navigate('/login');
    }
  };

  // Fetch chats
  const fetchChats = async () => {
    try {
      const authToken = getToken();
      if (!authToken) {
        navigate('/login');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `http://localhost:5000/api/chats?${params}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        handleApiError({ response });
        throw new Error('Failed to fetch chats');
      }

      const result = await response.json();
      setChats(result.data.chats);
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      alert(error.message || 'Failed to load chats');
    }
  };

  // Fetch single chat with messages
  const fetchChatDetails = async (chatId: string) => {
    try {
      const authToken = getToken();
      if (!authToken) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        handleApiError({ response });
        throw new Error('Failed to fetch chat details');
      }

      const result = await response.json();
      setSelectedChat(result.data);
    } catch (error: any) {
      console.error('Error fetching chat details:', error);
      alert('Failed to load chat details');
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    setLoading(true);
    try {
      const authToken = getToken();
      if (!authToken) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/chats/${selectedChat._id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        handleApiError({ response });
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      // Update chat with new message
      setSelectedChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), result.data],
          lastMessage: message,
          lastMessageAt: new Date(),
        };
      });

      setMessage('');
      fetchChats(); // Refresh chat list
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Update chat status
  const handleStatusChange = async (chatId: string, status: string) => {
    try {
      const authToken = getToken();
      if (!authToken) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/chats/${chatId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        handleApiError({ response });
        throw new Error('Failed to update status');
      }

      fetchChats();
      if (selectedChat?._id === chatId) {
        setSelectedChat((prev) => (prev ? { ...prev, status: status as any } : null));
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Failed to update chat status');
    }
  };

  useEffect(() => {
    fetchChats();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Filter chats by search
  const filteredChats = chats.filter(
    (chat) =>
      chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.customerPhone.includes(searchQuery)
  );

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Chat List Sidebar */}
        <div className="w-96 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
            
            {/* Search */}
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
            />

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'active', 'pending', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusFilter === status
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg font-medium mb-2">No chats yet</p>
                <p className="text-sm">
                  Messages will appear here when customers contact you
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => fetchChatDetails(chat._id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedChat?._id === chat._id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                        {chat.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {chat.customerName}
                        </h3>
                        <p className="text-xs text-gray-500">{chat.customerPhone}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(chat.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate ml-12">
                    {chat.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-2 ml-12">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        chat.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : chat.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {chat.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedChat.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedChat.customerName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat.customerPhone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedChat.status}
                    onChange={(e) =>
                      handleStatusChange(selectedChat._id, e.target.value)
                    }
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {selectedChat.messages?.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.sender === 'business' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'business'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      {msg.mediaUrl && (
                        <img
                          src={msg.mediaUrl}
                          alt="Media"
                          className="mb-2 rounded"
                        />
                      )}
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'business'
                            ? 'text-green-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 bg-white"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg
                  className="w-24 h-24 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg font-medium">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
