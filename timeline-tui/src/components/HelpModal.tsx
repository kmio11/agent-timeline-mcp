import React from 'react';
import { Box, Text } from 'ink';

interface HelpModalProps {
  isVisible: boolean;
}

export function HelpModal({ isVisible }: HelpModalProps): React.JSX.Element | null {
  if (!isVisible) {
    return null;
  }

  return (
    <Box
      position="absolute"
      borderStyle="double"
      paddingX={2}
      paddingY={1}
      marginX={2}
      marginY={2}
      width="80%"
      height="80%"
    >
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="cyan">Timeline TUI - Keyboard Shortcuts</Text>
        </Box>
        
        <Box flexDirection="column" gap={0}>
          <Text bold color="yellow">Navigation:</Text>
          <Text>  ↑/k        Scroll up</Text>
          <Text>  ↓/j        Scroll down</Text>
          <Text>  g          Go to top</Text>
          <Text>  G          Go to bottom</Text>
          
          <Box marginTop={1}>
            <Text bold color="yellow">Actions:</Text>
          </Box>
          <Text>  r          Refresh timeline</Text>
          <Text>  t          Toggle auto-update</Text>
          <Text>  f          Filter by agent (TODO)</Text>
          <Text>  l          Load more posts</Text>
          <Text>  Space      Mark as read</Text>
          
          <Box marginTop={1}>
            <Text bold color="yellow">System:</Text>
          </Box>
          <Text>  h          Show/hide this help</Text>
          <Text>  q          Quit application</Text>
          <Text>  Esc        Close help</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press 'h' or 'Esc' to close this help</Text>
        </Box>
      </Box>
    </Box>
  );
}