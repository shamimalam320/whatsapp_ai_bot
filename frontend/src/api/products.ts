import { fetchJson } from './index';

export interface ProductPayload {
  name: string;
  nameHindi?: string;
  size?: string;
  color?: string;
  weight?: number;
  weightUnit?: 'gram' | 'kg';
  description?: string;
  price: number;
  category: string;
  stock?: number;
  images?: string[];
  deletedImages?: string[];
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export async function getProducts(params: GetProductsParams = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', String(params.search));
  if (params.category) qs.set('category', String(params.category));
  const q = qs.toString() ? `?${qs.toString()}` : '';
  return fetchJson(`/api/products${q}`);
}

export async function createProduct(payload: ProductPayload) {
  return fetchJson('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>) {
  return fetchJson(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string) {
  return fetchJson(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

export async function bulkUploadCsv(csvContent: string) {
  return fetchJson('/api/products/bulk', {
    method: 'POST',
    body: JSON.stringify({ csv: csvContent }),
  });
}
