/**
 * Custom hook for timeline polling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PostWithAgent, POLLING_CONFIG } from 'agent-timeline-shared';
import { getRecentPosts, getPostsAfterTimestamp } from '../lib/database';

interface UseTimelinePollingResult {
  posts: PostWithAgent[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  retryCount: number;
}

/**
 * Hook for managing timeline data with polling
 */
export function useTimelinePolling(): UseTimelinePollingResult {
  const [posts, setPosts] = useState<PostWithAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch initial posts
   */
  const fetchInitialPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const initialPosts = await getRecentPosts(POLLING_CONFIG.MAX_POSTS_INITIAL);
      setPosts(initialPosts);
      setLastUpdate(new Date());
      setRetryCount(0);
      
      console.log(`Loaded ${initialPosts.length} initial posts`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load posts: ${errorMessage}`);
      console.error('Error fetching initial posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch new posts since last update
   */
  const fetchNewPosts = useCallback(async () => {
    if (!lastUpdate) return;

    try {
      const newPosts = await getPostsAfterTimestamp(lastUpdate);
      
      if (newPosts.length > 0) {
        setPosts(prevPosts => {
          // Merge new posts with existing ones, avoiding duplicates
          const existingIds = new Set(prevPosts.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          
          if (uniqueNewPosts.length > 0) {
            console.log(`Received ${uniqueNewPosts.length} new posts`);
            return [...uniqueNewPosts, ...prevPosts].slice(0, POLLING_CONFIG.MAX_POSTS_INITIAL);
          }
          
          return prevPosts;
        });
        
        setLastUpdate(new Date());
      }
      
      setRetryCount(0);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch updates: ${errorMessage}`);
      console.error('Error fetching new posts:', err);
      
      // Increment retry count for exponential backoff
      setRetryCount(prev => Math.min(prev + 1, POLLING_CONFIG.RETRY_INTERVALS.length - 1));
    }
  }, [lastUpdate]);

  /**
   * Start polling with retry logic
   */
  const startPolling = useCallback(() => {
    const scheduleNextPoll = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Determine polling interval based on retry count
      const interval = error && retryCount > 0
        ? POLLING_CONFIG.RETRY_INTERVALS[retryCount]
        : POLLING_CONFIG.INTERVAL_MS;

      timeoutRef.current = setTimeout(async () => {
        await fetchNewPosts();
        scheduleNextPoll();
      }, interval);
    };

    scheduleNextPoll();
  }, [fetchNewPosts, error, retryCount]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    stopPolling();
    await fetchInitialPosts();
    startPolling();
  }, [fetchInitialPosts, startPolling, stopPolling]);

  // Initialize on mount
  useEffect(() => {
    fetchInitialPosts();
  }, [fetchInitialPosts]);

  // Start polling after initial load
  useEffect(() => {
    if (!isLoading && posts.length >= 0) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isLoading, posts.length, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    posts,
    isLoading,
    error,
    lastUpdate,
    retryCount,
  };
}