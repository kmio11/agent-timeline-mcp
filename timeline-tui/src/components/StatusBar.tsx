import React from 'react';
import { Box, Text } from 'ink';
import { getStatusChars, getNavChars, getSafeColors } from '../utils/terminalCompat.js';

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
  // Terminal-compatible indicators with fallbacks
  const statusChars = getStatusChars();
  const navChars = getNavChars();
  const colors = getSafeColors();
  
  const connectionColor = connected ? colors.success : colors.error;
  const connectionText = connected 
    ? `${statusChars.connected} Connected` 
    : `${statusChars.disconnected} Disconnected`;
  const autoUpdateText = autoUpdate 
    ? `${navChars.refresh} Auto` 
    : `${navChars.pause} Manual`;

  return (
    <Box borderStyle="single" borderTop={true} paddingX={1}>
      <Text color={connectionColor}>{connectionText}</Text>
      <Box marginX={1}>
        <Text>{autoUpdateText}</Text>
      </Box>
      {newPostCount > 0 && (
        <Box marginX={1}>
          <Text color={colors.warning}>
            {newPostCount} new post{newPostCount > 1 ? 's' : ''}
          </Text>
        </Box>
      )}
      <Box flexGrow={1} />
      <Text color={colors.muted}>↑↓/jk:scroll • g/G:top/bottom • r:refresh • t:toggle • h:help • q:quit</Text>
    </Box>
  );
}
