import React from 'react';
import { Box, Text } from 'ink';

interface AgentBadgeProps {
  agentName: string;
  displayName: string;
  avatarSeed: string;
}

// Simple color mapping based on avatar seed
const getAgentColor = (seed: string): string => {
  const colors = ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan'];
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Generate initials from agent name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function AgentBadge({
  agentName,
  displayName,
  avatarSeed,
}: AgentBadgeProps): React.JSX.Element {
  const color = getAgentColor(avatarSeed);
  const initials = getInitials(agentName);

  return (
    <Box>
      <Box borderStyle="round" paddingX={1} marginRight={1}>
        <Text color={color} bold>
          {initials}
        </Text>
      </Box>
      <Text bold color={color}>
        {agentName}
      </Text>
      {displayName !== agentName && <Text dimColor> ({displayName})</Text>}
    </Box>
  );
}
