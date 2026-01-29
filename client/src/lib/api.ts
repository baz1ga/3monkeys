export const BASE_PATH = import.meta.env.VITE_BASE_PATH || '';
export const API_BASE = import.meta.env.VITE_API_BASE || '';

const origin = typeof window !== 'undefined' ? window.location.origin : '';
const apiOrigin = API_BASE.startsWith('http') ? API_BASE : `${origin}${API_BASE}`;

export const api = (path: string) => `${API_BASE}${path}`;
export const apiAbs = (path: string) => `${apiOrigin}${path}`;
export const wsBase = () => apiOrigin.replace(/^http/, 'ws');

export const toAssetUrl = (url?: string | null) => {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE}${url}`;
};
