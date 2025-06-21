/**
 * Unit tests for API client functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRecentPosts, getPostsBefore, getPostsAfterTimestamp, healthCheck } from './api';
import type { PostWithAgent } from 'agent-timeline-shared';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getRecentPosts', () => {
    it('should fetch recent posts with default limit', async () => {
      const mockPosts: PostWithAgent[] = [
        {
          id: 1,
          agent_id: 1,
          content: 'Test post',
          timestamp: new Date(),
          metadata: undefined,
          agent_name: 'TestAgent',
          display_name: 'Test Agent',
          identity_key: 'testagent:default',
          avatar_seed: 'test1234',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ posts: mockPosts }),
      });

      const result = await getRecentPosts();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/posts?limit=100'));
      expect(result).toEqual(mockPosts);
    });

    it('should fetch posts with custom limit', async () => {
      const mockPosts: PostWithAgent[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ posts: mockPosts }),
      });

      await getRecentPosts(50);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/posts?limit=50'));
    });

    it('should throw error on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getRecentPosts()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('getPostsBefore', () => {
    it('should fetch posts before specific ID', async () => {
      const mockPosts: PostWithAgent[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ posts: mockPosts }),
      });

      await getPostsBefore(10, 20);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/posts?before=10&limit=20'));
    });
  });

  describe('getPostsAfterTimestamp', () => {
    it('should fetch posts after timestamp', async () => {
      const testDate = new Date('2025-06-21T10:00:00.000Z');
      const mockPosts: PostWithAgent[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ posts: mockPosts }),
      });

      await getPostsAfterTimestamp(testDate);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts?after=2025-06-21T10:00:00.000Z')
      );
    });

    it('should handle empty response', async () => {
      const testDate = new Date();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await getPostsAfterTimestamp(testDate);

      expect(result).toEqual([]);
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/health'));
    });

    it('should return false for unhealthy API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await healthCheck();

      expect(result).toBe(false);
    });
  });
});
