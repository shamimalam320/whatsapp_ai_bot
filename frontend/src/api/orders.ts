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

// NOTE: The frontend `Product` type defined in `Products.tsx` has been extended
// with attributes like `size`, `color`, `weight`, and `weightUnit`. If any
// order-related code needs to reference product details, ensure the type
// definitions here (or a shared type) are updated to match that Product
// interface to maintain type safety when sending/receiving payloads.

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
