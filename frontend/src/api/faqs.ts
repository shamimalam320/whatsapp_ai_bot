import { fetchJson } from './index';

export async function listFaqs(params: Record<string,string|boolean|undefined> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{ if (v!==undefined) qs.set(k, String(v)); });
  return fetchJson(`/api/faqs?${qs.toString()}`);
}

export async function createFaq(payload: any) {
  return fetchJson('/api/faqs', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateFaq(id: string, payload: any) {
  return fetchJson(`/api/faqs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteFaq(id: string) {
  return fetchJson(`/api/faqs/${id}`, { method: 'DELETE' });
}
