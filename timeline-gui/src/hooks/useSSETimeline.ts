import { useState, useEffect, useRef, useCallback } from 'react';
import { SSE_EVENTS_URL } from '@/config';
import { getRecentPosts, getPostsBefore } from '@/lib/api';
import type { PostWithAgent } from 'agent-timeline-shared';

interface SSEMessage {
  type: 'connected' | 'new_post' | 'keepalive';
  client_id?: string;
  timestamp?: string;
  post_id?: number;
  agent_id?: number;
  content?: string;
}

interface UseSSETimelineReturn {
  posts: PostWithAgent[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  newPostCount: number;
  autoUpdateEnabled: boolean;
  loadMorePosts: () => Promise<void>;
  hasMorePosts: boolean;
  isLoadingMore: boolean;
  refreshPosts: () => Promise<void>;
  markAsRead: () => void;
  toggleAutoUpdate: () => void;
}

/**
 * Hook for managing timeline data with Server-Sent Events for real-time updates
 * Replaces the polling-based useTimelinePolling hook
 */
export function useSSETimeline(): UseSSETimelineReturn {
  const [posts, setPosts] = useState<PostWithAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newPostCount, setNewPostCount] = useState(0);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingPostIds = useRef<Set<number>>(new Set());

  // Load initial posts
  const fetchInitialPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const initialPosts = await getRecentPosts(100);
      setPosts(initialPosts);
      setLastUpdate(new Date());
      setNewPostCount(0);
      pendingPostIds.current.clear();

      // Determine if there might be more posts
      setHasMorePosts(initialPosts.length === 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(`Failed to load initial posts: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch latest posts for manual refresh or auto-update
  const fetchLatestPosts = useCallback(async () => {
    try {
      const latestPosts = await getRecentPosts(20); // Get recent posts

      setPosts(prevPosts => {
        // Merge new posts with existing ones, avoiding duplicates
        const existingIds = new Set(prevPosts.map(p => p.id));
        const uniqueNewPosts = latestPosts.filter(p => !existingIds.has(p.id));

        if (uniqueNewPosts.length > 0) {
          return [...uniqueNewPosts, ...prevPosts];
        }
        return prevPosts;
      });

      setLastUpdate(new Date());
      setNewPostCount(0);
      pendingPostIds.current.clear();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch updates';
      setError(`Failed to fetch latest posts: ${errorMessage}`);
    }
  }, []);

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMorePosts || posts.length === 0) return;

    try {
      setIsLoadingMore(true);
      setError(null);

      const oldestPost = posts[posts.length - 1];
      const morePosts = await getPostsBefore(oldestPost.id, 20);

      if (morePosts.length > 0) {
        setPosts(prevPosts => [...prevPosts, ...morePosts]);
        setHasMorePosts(morePosts.length === 20);
      } else {
        setHasMorePosts(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more posts';
      setError(`Failed to load more posts: ${errorMessage}`);
    } finally {
      setIsLoadingMore(false);
    }
  }, [posts, isLoadingMore, hasMorePosts]);

  // Manual refresh function
  const refreshPosts = useCallback(async () => {
    await fetchLatestPosts();
  }, [fetchLatestPosts]);

  // Mark pending posts as read
  const markAsRead = useCallback(() => {
    setNewPostCount(0);
    pendingPostIds.current.clear();
  }, []);

  // Toggle auto-update functionality
  const toggleAutoUpdate = useCallback(() => {
    setAutoUpdateEnabled(prev => !prev);
  }, []);

  // Handle SSE messages
  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            setIsConnected(true);
            setError(null);
            break;

          case 'new_post':
            if (message.post_id && !pendingPostIds.current.has(message.post_id)) {
              pendingPostIds.current.add(message.post_id);
              setNewPostCount(prev => prev + 1);

              // Auto-update if enabled
              if (autoUpdateEnabled) {
                fetchLatestPosts();
              }
            }
            break;

          case 'keepalive':
            // Just maintain connection
            break;

          default:
          // Unknown message type - ignore silently
        }
      } catch {
        // Silently ignore SSE message parsing errors to avoid console spam
        setError('Error processing server message');
      }
    },
    [autoUpdateEnabled, fetchLatestPosts]
  );

  // Initialize SSE connection
  useEffect(() => {
    // Load initial data
    fetchInitialPosts();

    // Setup SSE connection
    const eventSource = new EventSource(SSE_EVENTS_URL);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = handleSSEMessage;

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection to server lost. Attempting to reconnect...');
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [fetchInitialPosts, handleSSEMessage]);

  return {
    posts,
    isLoading,
    error,
    isConnected,
    lastUpdate,
    newPostCount,
    autoUpdateEnabled,
    loadMorePosts,
    hasMorePosts,
    isLoadingMore,
    refreshPosts,
    markAsRead,
    toggleAutoUpdate,
  };
}
