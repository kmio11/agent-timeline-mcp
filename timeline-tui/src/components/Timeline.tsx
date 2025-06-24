import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { PostWithAgent } from 'agent-timeline-shared';
import { Post } from './Post.js';

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
  // Filter posts by selected agent if specified
  const filteredPosts = selectedAgent
    ? posts.filter(post => post.agent_name === selectedAgent)
    : posts;

  // Reverse order so newest posts appear at bottom (terminal-like)
  const reversedPosts = useMemo(() => [...filteredPosts].reverse(), [filteredPosts]);

  // Calculate visible posts based on terminal height and scroll position
  const maxVisiblePosts = Math.max(1, terminalHeight - 5); // Reserve space for header/scroll/footer
  const visiblePosts = useMemo(() => {
    const startIndex = Math.max(0, reversedPosts.length - maxVisiblePosts - scrollPosition);
    const endIndex = reversedPosts.length - scrollPosition;
    return reversedPosts.slice(startIndex, endIndex);
  }, [reversedPosts, maxVisiblePosts, scrollPosition]);

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
