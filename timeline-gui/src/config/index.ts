export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Server-Sent Events endpoint for real-time updates
export const SSE_EVENTS_URL = `${API_BASE_URL}/events`;
