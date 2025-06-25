/**
 * API client for Timeline TUI
 * Reuses the same API endpoints as timeline-gui
 */

import { API_BASE_URL } from '../config/index.js';
import { PostWithAgent } from 'agent-timeline-shared';

// API timeout configuration
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Create a fetch request with timeout
 */
function fetchWithTimeout(url: string, options: Record<string, unknown> = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Fetch recent posts from API
 */
export async function getRecentPosts(limit: number = 100): Promise<PostWithAgent[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/posts?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.posts || [];
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timeout: API took too long to respond');
    }
    throw err;
  }
}

/**
 * Fetch older posts for pagination
 */
export async function getPostsBefore(
  beforeId: number,
  limit: number = 20
): Promise<PostWithAgent[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/posts?before=${beforeId}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.posts || [];
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timeout: API took too long to respond');
    }
    throw err;
  }
}

/**
 * Fetch posts newer than timestamp
 */
export async function getPostsAfterTimestamp(timestamp: Date): Promise<PostWithAgent[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/posts?after=${timestamp.toISOString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.posts || [];
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timeout: API took too long to respond');
    }
    throw err;
  }
}

/**
 * Health check for API
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
