import { fetchJson } from './index';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customerPhone: string;
  customerName?: string;
  items: OrderItem[];
  deliveryAddress?: string;
  delivery?: {
    pincode?: string;
    state?: string;
    city?: string;
    locality?: string;
    addressLine?: string;
    landmark?: string;
  };
  notes?: string;
}

export interface UpdateOrderStatusPayload {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export async function createOrder(payload: CreateOrderPayload) {
  return fetchJson('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOrderStatus(orderId: string, payload: UpdateOrderStatusPayload) {
  return fetchJson(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getOrders(params?: { status?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const q = qs.toString() ? `?${qs.toString()}` : '';
  return fetchJson(`/api/orders${q}`);
}

export async function getOrder(orderId: string) {
  return fetchJson(`/api/orders/${orderId}`);
}
