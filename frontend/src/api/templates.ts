import { fetchJson } from './index';

export async function getTemplates() {
  return fetchJson('/api/templates');
}

export async function applyTemplate(templateId: string) {
  return fetchJson('/api/business/apply-template', {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
}
