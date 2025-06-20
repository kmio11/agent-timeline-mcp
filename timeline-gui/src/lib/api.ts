/**
 * API client for Timeline GUI
 */

import { PostWithAgent } from 'agent-timeline-shared';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch recent posts from API
 */
export async function getRecentPosts(limit: number = 100): Promise<PostWithAgent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    throw error;
  }
}

/**
 * Fetch posts newer than timestamp
 */
export async function getPostsAfterTimestamp(timestamp: Date): Promise<PostWithAgent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/after/${timestamp.toISOString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Failed to fetch new posts:', error);
    throw error;
  }
}

/**
 * Health check for API
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}