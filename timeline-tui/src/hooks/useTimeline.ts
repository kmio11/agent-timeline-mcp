import { useState, useEffect, useRef, useCallback } from 'react';
import { EventSource } from 'eventsource';
import { SSE_EVENTS_URL } from '../config/index.js';
import { getRecentPosts, getPostsBefore } from '../services/timeline-api.js';
import type { PostWithAgent } from 'agent-timeline-shared';
import type { SSEMessage } from '../types/index.js';

interface UseTimelineReturn {
  posts: PostWithAgent[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  newPostCount: number;
  autoUpdate: boolean;
  selectedAgent: string | null;
  scrollPosition: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  toggleAutoUpdate: () => void;
  setSelectedAgent: (agent: string | null) => void;
  markAsRead: () => void;
}

export function useTimeline(): UseTimelineReturn {
  const [posts, setPosts] = useState<PostWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [newPostCount, setNewPostCount] = useState(0);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [scrollPosition] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingPostIds = useRef<Set<number>>(new Set());

  // Load initial posts
  const fetchInitialPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const initialPosts = await getRecentPosts(100);
      setPosts(initialPosts);
      setNewPostCount(0);
      pendingPostIds.current.clear();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(`Failed to load initial posts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch latest posts for refresh or auto-update
  const fetchLatestPosts = useCallback(async () => {
    try {
      const latestPosts = await getRecentPosts(20);

      setPosts(prevPosts => {
        const existingIds = new Set(prevPosts.map(p => p.id));
        const uniqueNewPosts = latestPosts.filter(p => !existingIds.has(p.id));

        if (uniqueNewPosts.length > 0) {
          return [...uniqueNewPosts, ...prevPosts];
        }
        return prevPosts;
      });

      setNewPostCount(0);
      pendingPostIds.current.clear();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch updates';
      setError(`Failed to fetch latest posts: ${errorMessage}`);
    }
  }, []);

  // Load more posts for pagination
  const loadMore = useCallback(async () => {
    if (loading || posts.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      const oldestPost = posts[posts.length - 1];
      const morePosts = await getPostsBefore(oldestPost.id, 20);

      if (morePosts.length > 0) {
        setPosts(prevPosts => [...prevPosts, ...morePosts]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more posts';
      setError(`Failed to load more posts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [posts, loading]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchLatestPosts();
  }, [fetchLatestPosts]);

  // Toggle auto-update
  const toggleAutoUpdate = useCallback(() => {
    setAutoUpdate(prev => !prev);
  }, []);

  // Mark as read
  const markAsRead = useCallback(() => {
    setNewPostCount(0);
    pendingPostIds.current.clear();
  }, []);

  // Handle SSE messages
  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            setConnected(true);
            setError(null);
            break;

          case 'new_post':
            if (message.post_id && !pendingPostIds.current.has(message.post_id)) {
              pendingPostIds.current.add(message.post_id);
              setNewPostCount(prev => prev + 1);

              if (autoUpdate) {
                fetchLatestPosts();
              }
            }
            break;

          case 'keepalive':
            break;

          default:
        }
      } catch {
        setError('Error processing server message');
      }
    },
    [autoUpdate, fetchLatestPosts]
  );

  // Initialize SSE connection
  useEffect(() => {
    fetchInitialPosts();

    const eventSource = new EventSource(SSE_EVENTS_URL);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = handleSSEMessage;

    eventSource.onerror = () => {
      setConnected(false);
      setError('Connection lost. Reconnecting...');
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [fetchInitialPosts, handleSSEMessage]);

  return {
    posts,
    loading,
    error,
    connected,
    newPostCount,
    autoUpdate,
    selectedAgent,
    scrollPosition,
    loadMore,
    refresh,
    toggleAutoUpdate,
    setSelectedAgent,
    markAsRead,
  };
}
