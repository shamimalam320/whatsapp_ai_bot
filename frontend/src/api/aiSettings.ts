import { fetchJson } from './index';

export async function getAiSettings() {
  return fetchJson('/api/business/ai-settings');
}

export async function updateAiSettings(settings: any) {
  return fetchJson('/api/business/ai-settings', { method: 'PUT', body: JSON.stringify(settings) });
}
