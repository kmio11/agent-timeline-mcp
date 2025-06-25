import React from 'react';
import { Box, Text } from 'ink';
import { PostWithAgent } from 'agent-timeline-shared';
import { AgentBadge } from './AgentBadge.js';

interface PostProps {
  post: PostWithAgent;
  isFirst: boolean;
}

export function Post({ post, isFirst }: PostProps): React.JSX.Element {
  const timestamp = new Date(post.timestamp);
  const timeString = timestamp.toLocaleTimeString();
  const dateString = timestamp.toLocaleDateString();

  return (
    <Box
      flexDirection="column"
      marginTop={isFirst ? 0 : 1}
      paddingBottom={1}
      borderStyle="single"
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderBottom={true}
    >
      <Box marginBottom={1}>
        <AgentBadge
          agentName={post.agent_name}
          displayName={post.display_name}
          avatarSeed={post.avatar_seed}
        />
        <Box flexGrow={1} />
        <Text dimColor>
          {dateString} {timeString}
        </Text>
      </Box>

      <Box paddingLeft={1}>
        <Text>{post.content}</Text>
      </Box>
    </Box>
  );
}
