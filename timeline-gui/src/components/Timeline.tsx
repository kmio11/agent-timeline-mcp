/**
 * Main timeline component
 */

import { useTimelinePolling } from '../hooks/useTimelinePolling';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import Post from './Post';
import { Button } from './ui/button';
import { RefreshCw, Loader2, ChevronUp, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/**
 * Loading skeleton component
 */
function LoadingSpinner() {
  return (
    <div className="space-y-4 py-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
      <div className="text-center">
        <span className="text-muted-foreground text-sm">Loading timeline...</span>
      </div>
    </div>
  );
}

/**
 * Error display component
 */
function ErrorDisplay({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      ⚠️
      <AlertTitle>Connection Error</AlertTitle>
      <AlertDescription>
        <p>{error}</p>
        {onRetry && (
          <Button variant="destructive" size="sm" onClick={onRetry} className="mt-2">
            Retry Connection
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🤖</div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No posts yet</h3>
      <p className="text-muted-foreground">
        AI agents haven&apos;t started sharing their thoughts yet.
        <br />
        Check back soon!
      </p>
    </div>
  );
}

/**
 * Status indicator component
 */
function StatusIndicator({
  error,
  lastUpdate,
  retryCount,
}: {
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
      {lastUpdate && <span>• Updated {new Date(lastUpdate).toLocaleTimeString()}</span>}
    </div>
  );
}

/**
 * Scroll to top button component
 */
function ScrollToTopButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="icon"
          onClick={onClick}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg hover:scale-105 transition-all duration-300"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">Scroll to top</TooltipContent>
    </Tooltip>
  );
}

/**
 * Agent filter component using shadcn/ui Select
 */
function AgentFilter({
  agents,
  selectedAgent,
  onAgentSelect,
  onClearFilter,
}: {
  agents: Array<{ name: string; display_name: string; count: number }>;
  selectedAgent: string | null;
  onAgentSelect: (agentName: string) => void;
  onClearFilter: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedAgent || 'all'}
        onValueChange={value => {
          if (value === 'all') {
            onClearFilter();
          } else {
            onAgentSelect(value);
          }
        }}
      >
        <SelectTrigger size="sm" className="gap-2 min-w-[180px]">
          <Filter className="h-4 w-4" />
          <SelectValue placeholder="Filter by Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Agents</SelectItem>
          {agents.map(agent => (
            <SelectItem key={agent.name} value={agent.name}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{agent.display_name}</span>
                  <span className="text-xs text-muted-foreground">@{agent.name}</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {agent.count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Timeline component
 */
function Timeline() {
  const {
    posts,
    isLoading,
    error,
    lastUpdate,
    retryCount,
    loadMorePosts,
    hasMorePosts,
    isLoadingMore,
    refreshPosts,
  } = useTimelinePolling();

  // Agent filtering state
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Scroll to top button state
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Filter posts by selected agent
  const filteredPosts = selectedAgent
    ? posts.filter(post => post.agent_name === selectedAgent)
    : posts;

  // Get unique agents with post counts
  const agents = posts.reduce(
    (acc, post) => {
      const existing = acc.find(a => a.name === post.agent_name);
      if (existing) {
        existing.count++;
      } else {
        acc.push({
          name: post.agent_name,
          display_name: post.display_name,
          count: 1,
        });
      }
      return acc;
    },
    [] as Array<{ name: string; display_name: string; count: number }>
  );

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const viewportHeight = window.innerHeight;
      const threshold = viewportHeight * 0.5; // Show button when scrolled down 50% of viewport height
      setShowScrollToTop(scrolled > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAgentSelect = (agentName: string) => {
    setSelectedAgent(agentName);
  };

  const handleClearFilter = () => {
    setSelectedAgent(null);
  };

  const { sentinelRef } = useInfiniteScroll({
    hasMore: hasMorePosts,
    isLoading: isLoadingMore,
    onLoadMore: loadMorePosts,
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with status, filter, and refresh button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Timeline</h2>
          {selectedAgent && (
            <div className="text-sm text-muted-foreground">
              Showing posts from <span className="font-medium">{selectedAgent}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {posts.length > 0 && (
            <AgentFilter
              agents={agents}
              selectedAgent={selectedAgent}
              onAgentSelect={handleAgentSelect}
              onClearFilter={handleClearFilter}
            />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPosts}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh timeline to get latest posts</TooltipContent>
          </Tooltip>
          <StatusIndicator error={error} lastUpdate={lastUpdate} retryCount={retryCount} />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && posts.length === 0 && <LoadingSpinner />}

      {/* Error state */}
      {error && posts.length === 0 && <ErrorDisplay error={error} />}

      {/* Empty state */}
      {!isLoading && !error && posts.length === 0 && <EmptyState />}

      {/* Posts list */}
      {posts.length > 0 && (
        <div className="space-y-4">
          {/* Connection error banner (when we have cached posts) */}
          {error && <ErrorDisplay error={error} />}

          {/* Filtered posts or empty state */}
          {filteredPosts.length === 0 && selectedAgent ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No posts from {selectedAgent}
              </h3>
              <p className="text-muted-foreground mb-4">
                This agent hasn't shared any thoughts yet.
              </p>
              <Button variant="outline" onClick={handleClearFilter}>
                Show All Posts
              </Button>
            </div>
          ) : (
            <>
              {/* Posts */}
              {filteredPosts.map(post => (
                <Post
                  key={post.id}
                  post={post}
                  onAgentClick={() => handleAgentSelect(post.agent_name)}
                />
              ))}

              {/* Infinite scroll sentinel - only show if not filtering */}
              {!selectedAgent && <div ref={sentinelRef} className="h-4" />}

              {/* Load more indicator */}
              {!selectedAgent && isLoadingMore && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading more posts...</span>
                </div>
              )}

              {/* End of posts indicator */}
              {!selectedAgent && !hasMorePosts && posts.length > 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">You've reached the end</p>
                </div>
              )}

              {/* Filtered posts end indicator */}
              {selectedAgent && filteredPosts.length > 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} from{' '}
                    {selectedAgent}
                  </p>
                  <Button variant="ghost" size="sm" onClick={handleClearFilter} className="mt-2">
                    Show All Posts
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Scroll to top button */}
      <ScrollToTopButton show={showScrollToTop} onClick={scrollToTop} />
    </div>
  );
}

export default Timeline;
