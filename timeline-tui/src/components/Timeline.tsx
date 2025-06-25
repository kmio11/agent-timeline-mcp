import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { PostWithAgent } from 'agent-timeline-shared';
import { Post } from './Post.js';
import { useLayoutMetrics } from '../hooks/useLayoutMetrics.js';

interface TimelineProps {
  posts: PostWithAgent[];
  loading: boolean;
  selectedAgent: string | null;
  scrollPosition: number;
  terminalHeight: number;
}


export function Timeline({ 
  posts, 
  loading, 
  selectedAgent, 
  scrollPosition,
  terminalHeight 
}: TimelineProps): React.JSX.Element {
  const layoutMetrics = useLayoutMetrics(terminalHeight);
  
  // Filter posts by selected agent if specified
  const filteredPosts = selectedAgent
    ? posts.filter(post => post.agent_name === selectedAgent)
    : posts;

  // Calculate visible posts based on layout metrics
  // Display newest posts at bottom (terminal-like) without full array reversal
  const visiblePosts = useMemo(() => {
    const totalPosts = filteredPosts.length;
    if (totalPosts === 0) return [];
    
    const { maxVisiblePosts } = layoutMetrics;
    
    // Calculate slice indices for original array (newest first)
    // Convert bottom-up scrolling to top-down array indexing
    const endIndex = totalPosts - scrollPosition;
    const startIndex = Math.max(0, endIndex - maxVisiblePosts);
    
    // Get slice and reverse only the visible subset
    return filteredPosts.slice(startIndex, endIndex).reverse();
  }, [filteredPosts, layoutMetrics, scrollPosition]);

  // These are calculated in App component now
  // const showScrollIndicator = reversedPosts.length > maxVisiblePosts;
  // const isAtBottom = scrollPosition === 0;
  // const isAtTop = scrollPosition >= reversedPosts.length - maxVisiblePosts;

  if (loading && posts.length === 0) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text>Loading timeline...</Text>
      </Box>
    );
  }

  if (filteredPosts.length === 0) {
    const message = selectedAgent ? `No posts from ${selectedAgent}` : 'No posts yet';

    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text dimColor>{message}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} height="100%">
      {/* Timeline posts */}
      <Box flexDirection="column" flexGrow={1}>
        {visiblePosts.map((post, index) => (
          <Post 
            key={`${post.id}-${post.timestamp}`} 
            post={post} 
            isFirst={index === 0}
          />
        ))}
      </Box>

      {/* Loading indicator at bottom */}
      {loading && (
        <Box marginTop={1}>
          <Text dimColor>Loading more posts...</Text>
        </Box>
      )}
    </Box>
  );
}
