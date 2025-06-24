export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005/api';

// Server-Sent Events endpoint for real-time updates
export const SSE_EVENTS_URL = `${API_BASE_URL}/events`;
