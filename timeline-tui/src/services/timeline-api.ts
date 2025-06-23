/**
 * API client for Timeline TUI
 * Reuses the same API endpoints as timeline-gui
 */

import { API_BASE_URL } from '../config/index.js';
import { PostWithAgent } from 'agent-timeline-shared';

/**
 * Fetch recent posts from API
 */
export async function getRecentPosts(limit: number = 100): Promise<PostWithAgent[]> {
  const response = await fetch(`${API_BASE_URL}/posts?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.posts || [];
}

/**
 * Fetch older posts for pagination
 */
export async function getPostsBefore(
  beforeId: number,
  limit: number = 20
): Promise<PostWithAgent[]> {
  const response = await fetch(`${API_BASE_URL}/posts?before=${beforeId}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.posts || [];
}

/**
 * Fetch posts newer than timestamp
 */
export async function getPostsAfterTimestamp(timestamp: Date): Promise<PostWithAgent[]> {
  const response = await fetch(`${API_BASE_URL}/posts?after=${timestamp.toISOString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.posts || [];
}

/**
 * Health check for API
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
