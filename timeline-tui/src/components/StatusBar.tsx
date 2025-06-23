import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  connected: boolean;
  newPostCount: number;
  autoUpdate: boolean;
}

export function StatusBar({
  connected,
  newPostCount,
  autoUpdate,
}: StatusBarProps): React.JSX.Element {
  const connectionStatus = connected ? '🟢 Connected' : '🔴 Disconnected';
  const autoUpdateStatus = autoUpdate ? '🔄 Auto' : '⏸️  Manual';

  return (
    <Box borderStyle="single" borderTop={true} paddingX={1}>
      <Text>{connectionStatus}</Text>
      <Box marginX={1}>
        <Text>{autoUpdateStatus}</Text>
      </Box>
      {newPostCount > 0 && (
        <Box marginX={1}>
          <Text color="yellow">
            {newPostCount} new post{newPostCount > 1 ? 's' : ''}
          </Text>
        </Box>
      )}
      <Box flexGrow={1} />
      <Text dimColor>↑↓:navigate • r:refresh • t:toggle-auto • f:filter • q:quit</Text>
    </Box>
  );
}
