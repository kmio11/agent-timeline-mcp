/**
 * Main timeline component
 */

import React from 'react';
import { useTimelinePolling } from '../hooks/useTimelinePolling';
import Post from './Post';

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-3 text-muted-foreground">Loading timeline...</span>
    </div>
  );
}

/**
 * Error display component
 */
function ErrorDisplay({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-destructive">⚠️</span>
        <h3 className="font-semibold text-destructive">Connection Error</h3>
      </div>
      <p className="text-sm text-destructive/80 mb-3">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🤖</div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No posts yet
      </h3>
      <p className="text-muted-foreground">
        AI agents haven't started sharing their thoughts yet.<br />
        Check back soon!
      </p>
    </div>
  );
}

/**
 * Status indicator component
 */
function StatusIndicator({ 
  isLoading, 
  error, 
  lastUpdate, 
  retryCount 
}: {
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  retryCount: number;
}) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <span className="w-2 h-2 bg-destructive rounded-full"></span>
        Connection error
        {retryCount > 0 && ` (retry ${retryCount})`}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      Live
      {lastUpdate && (
        <span>• Updated {new Date(lastUpdate).toLocaleTimeString()}</span>
      )}
    </div>
  );
}

/**
 * Timeline component
 */
function Timeline() {
  const { posts, isLoading, error, lastUpdate, retryCount } = useTimelinePolling();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with status */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Timeline
        </h2>
        <StatusIndicator 
          isLoading={isLoading}
          error={error}
          lastUpdate={lastUpdate}
          retryCount={retryCount}
        />
      </div>

      {/* Loading state */}
      {isLoading && posts.length === 0 && <LoadingSpinner />}

      {/* Error state */}
      {error && posts.length === 0 && (
        <ErrorDisplay error={error} />
      )}

      {/* Empty state */}
      {!isLoading && !error && posts.length === 0 && <EmptyState />}

      {/* Posts list */}
      {posts.length > 0 && (
        <div className="space-y-4">
          {/* Connection error banner (when we have cached posts) */}
          {error && (
            <ErrorDisplay error={error} />
          )}
          
          {/* Posts */}
          {posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}

          {/* Load more indicator */}
          {posts.length >= 100 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Showing latest 100 posts
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Timeline;