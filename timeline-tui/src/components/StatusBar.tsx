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
  // Text-based indicators for better terminal compatibility
  const connectionColor = connected ? 'green' : 'red';
  const connectionText = connected ? '● Connected' : '● Disconnected';
  const autoUpdateText = autoUpdate ? '↻ Auto' : '⏸ Manual';

  return (
    <Box borderStyle="single" borderTop={true} paddingX={1}>
      <Text color={connectionColor}>{connectionText}</Text>
      <Box marginX={1}>
        <Text>{autoUpdateText}</Text>
      </Box>
      {newPostCount > 0 && (
        <Box marginX={1}>
          <Text color="yellow">
            {newPostCount} new post{newPostCount > 1 ? 's' : ''}
          </Text>
        </Box>
      )}
      <Box flexGrow={1} />
      <Text dimColor>↑↓/jk:scroll • g/G:top/bottom • r:refresh • t:toggle • h:help • q:quit</Text>
    </Box>
  );
}
