import React from 'react';
import { Box, Text } from 'ink';
import { PostWithAgent } from 'agent-timeline-shared';
import { Post } from './Post.js';

interface TimelineProps {
  posts: PostWithAgent[];
  loading: boolean;
  selectedAgent: string | null;
  scrollPosition: number;
}

export function Timeline({ posts, loading, selectedAgent }: TimelineProps): React.JSX.Element {
  // Filter posts by selected agent if specified
  const filteredPosts = selectedAgent
    ? posts.filter(post => post.agent_name === selectedAgent)
    : posts;

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
    <Box flexDirection="column" paddingX={1}>
      {filteredPosts.map((post, index) => (
        <Post key={`${post.id}-${post.timestamp}`} post={post} isFirst={index === 0} />
      ))}
      {loading && (
        <Box marginTop={1}>
          <Text dimColor>Loading more posts...</Text>
        </Box>
      )}
    </Box>
  );
}
