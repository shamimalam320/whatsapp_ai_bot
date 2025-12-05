import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { createOrder as createOrderApi } from '../api/orders';
import { getProducts } from '../api/products';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customerPhone: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock?: number;
  category?: string;
}

interface CreateOrderItem {
  productId: string;
  quantity: number;
}

interface CreateOrderForm {
  customerPhone: string;
  customerName: string;
  deliveryAddress: string;
  notes: string;
  items: CreateOrderItem[];
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [createForm, setCreateForm] = useState<CreateOrderForm>({
    customerPhone: '',
    customerName: '',
    deliveryAddress: '',
    notes: '',
    items: [],
  });

  const getToken = () => localStorage.getItem('token');

  const handleApiError = (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      useAuthStore.getState().logout();
      navigate('/login');
    }
  };

  const fetchOrders = async () => {
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
        `http://localhost:5000/api/orders?${params}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        handleApiError({ response });
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();
      setOrders(result.data.orders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      alert(error.message || 'Failed to load orders');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoading(true);
    try {
      const authToken = getToken();
      if (!authToken) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        handleApiError({ response });
        throw new Error('Failed to update status');
      }

      alert('Order status updated successfully!');
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts({ limit: 100 });
      if (response.success && response.data?.products) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    const existingItem = createForm.items.find(
      (item) => item.productId === selectedProduct
    );

    if (existingItem) {
      alert('Product already added. Update quantity instead.');
      return;
    }

    const productObj = products.find((p) => p._id === selectedProduct);
    if (!productObj) {
      alert('Selected product not found');
      return;
    }
    if ((productObj.stock ?? 0) <= 0) {
      alert('Selected product is out of stock');
      return;
    }

    setCreateForm({
      ...createForm,
      items: [...createForm.items, { productId: selectedProduct, quantity: 1 }],
    });
    setSelectedProduct('');
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    const productObj = products.find((p) => p._id === productId);
    const available = productObj?.stock ?? 0;
    if (quantity > available) {
      alert(`Cannot set quantity greater than available stock (${available})`);
      return;
    }
    setCreateForm({
      ...createForm,
      items: createForm.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCreateForm({
      ...createForm,
      items: createForm.items.filter((item) => item.productId !== productId),
    });
  };

  const calculateTotal = () => {
    return createForm.items.reduce((total, item) => {
      const product = products.find((p) => p._id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const hasStockIssues = () => {
    // true if any item is requesting more than available or product is out of stock
    return createForm.items.some((item) => {
      const p = products.find((pr) => pr._id === item.productId);
      const available = p?.stock ?? 0;
      return available <= 0 || item.quantity > available;
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.customerPhone || createForm.items.length === 0) {
      alert('Please provide customer phone and add at least one item');
      return;
    }

    // Validate phone number (basic)
    const phoneRegex = /^[+]?[\d\s()-]{10,}$/;
    if (!phoneRegex.test(createForm.customerPhone)) {
      alert('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await createOrderApi({
        customerPhone: createForm.customerPhone,
        customerName: createForm.customerName || undefined,
        deliveryAddress: createForm.deliveryAddress || undefined,
        notes: createForm.notes || undefined,
        items: createForm.items,
      });

      if (response.success) {
        alert('Order created successfully! Confirmation sent to customer.');
        setShowCreateModal(false);
        setCreateForm({
          customerPhone: '',
          customerName: '',
          deliveryAddress: '',
          notes: '',
          items: [],
        });
        fetchOrders();
      } else {
        alert(response.message || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    fetchProducts();
    setShowCreateModal(true);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order._id.includes(searchQuery)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Create Order
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by customer, phone, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium ${
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
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-16 h-16 mb-4 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        <p className="text-lg font-medium">No orders yet</p>
                        <p className="text-sm">Orders will appear here when customers place them</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {order.items.length} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder._id.slice(-6).toUpperCase()}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {selectedOrder.customerName || 'Unknown'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> {selectedOrder.customerPhone}
                    </p>
                    {selectedOrder.deliveryAddress && (
                      <p className="text-sm">
                        <span className="font-medium">Address:</span> {selectedOrder.deliveryAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-lg font-bold text-gray-900">Total</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{selectedOrder.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Status Update */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Update Status</h3>
                  <div className="flex gap-2">
                    {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedOrder._id, status)}
                        disabled={loading || selectedOrder.status === status}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          selectedOrder.status === status
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  <p>Created: {formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateOrder} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Customer Information */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={createForm.customerPhone}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, customerPhone: e.target.value })
                        }
                        placeholder="+919876543210"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={createForm.customerName}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, customerName: e.target.value })
                        }
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      value={createForm.deliveryAddress}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, deliveryAddress: e.target.value })
                      }
                      rows={2}
                      placeholder="Full delivery address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Products Selection */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Order Items <span className="text-red-500">*</span>
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select a product...</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} - ₹{product.price}
                          {product.stock !== undefined && ` (Stock: ${product.stock})`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add Item
                    </button>
                  </div>

                  {/* Added Items */}
                  {createForm.items.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                      No items added yet. Select a product and click "Add Item".
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {createForm.items.map((item) => {
                        const product = products.find((p) => p._id === item.productId);
                        if (!product) return null;
                        return (
                          <div
                            key={item.productId}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">₹{product.price} each</p>
                            </div>
                              <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQuantity(item.productId, item.quantity - 1)
                                  }
                                  disabled={item.quantity <= 1}
                                  className={`w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                >
                                  -
                                </button>
                                <span className="w-12 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQuantity(item.productId, item.quantity + 1)
                                  }
                                  disabled={item.quantity >= (product.stock ?? 0)}
                                  className={`w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded ${(item.quantity >= (product.stock ?? 0)) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                >
                                  +
                                </button>
                              </div>
                              <p className="font-semibold text-gray-900 w-20 text-right">
                                ₹{product.price * item.quantity}
                              </p>
                              <div className="ml-3 text-right w-32">
                                {product.stock !== undefined && (
                                  <p className={`text-xs ${product.stock === 0 ? 'text-red-600' : product.stock <= 5 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                    {product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left`}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.productId)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t border-gray-300 flex justify-between items-center">
                        <p className="text-lg font-bold text-gray-900">Total Amount</p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{calculateTotal().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes
                  </label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Any special instructions or notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || createForm.items.length === 0 || hasStockIssues()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
