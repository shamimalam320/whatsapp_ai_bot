/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function fetchJson(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Let callers handle auth; return a structured error
    throw new Error('unauthorized');
  }

  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.message || res.statusText || 'Request failed');
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      if (!res.ok) throw new Error(res.statusText || 'Request failed');
      return {};
    }
    throw err;
  }
}

export { API_BASE, fetchJson };
