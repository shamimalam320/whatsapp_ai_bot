import { API_BASE } from './index';

export async function uploadImage(file: File) {
  const token = localStorage.getItem('token');
  const fd = new FormData();
  fd.append('image', file);

  const res = await fetch(`${API_BASE}/api/uploads/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });

  return res.json();
}

export async function deleteImage(filename: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/uploads/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.json();
}
