import React from 'react';
import { Box, Text } from 'ink';
import { getSafeColors } from '../utils/terminalCompat.js';

interface HelpModalProps {
  isVisible: boolean;
}

export function HelpModal({ isVisible }: HelpModalProps): React.JSX.Element | null {
  const colors = getSafeColors();
  
  if (!isVisible) {
    return null;
  }

  return (
    <Box
      position="absolute"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
    >
      <Box
        borderStyle="double"
        paddingX={3}
        paddingY={2}
        width={50}
      >
        <Box flexDirection="column">
          <Box marginBottom={1} justifyContent="center">
            <Text bold color={colors.info}>Timeline TUI - Keyboard Shortcuts</Text>
          </Box>
          
          <Box flexDirection="row" gap={2}>
            {/* Left column */}
            <Box flexDirection="column" width="50%">
              <Text bold color={colors.warning}>Navigation:</Text>
              <Text>  ↑/k    Scroll up</Text>
              <Text>  ↓/j    Scroll down</Text>
              <Text>  g      Go to top</Text>
              <Text>  G      Go to bottom</Text>
              
              <Box marginTop={1}>
                <Text bold color={colors.warning}>Actions:</Text>
              </Box>
              <Text>  r      Refresh</Text>
              <Text>  t      Toggle auto-update</Text>
              <Text>  Space  Mark as read</Text>
            </Box>
            
            {/* Right column */}
            <Box flexDirection="column" width="50%">
              <Text bold color={colors.warning}>System:</Text>
              <Text>  h      Show/hide help</Text>
              <Text>  q      Quit application</Text>
              <Text>  Esc    Close help</Text>
              
              <Box marginTop={1}>
                <Text bold color={colors.warning}>Future:</Text>
              </Box>
              <Text>  f      Filter by agent</Text>
              <Text>  l      Load more posts</Text>
            </Box>
          </Box>
          
          <Box marginTop={1} justifyContent="center">
            <Text color={colors.muted}>Press 'h' or 'Esc' to close</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}