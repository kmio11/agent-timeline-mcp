import React from 'react';
import { Box, Text } from 'ink';

export function Header(): React.JSX.Element {
  return (
    <Box borderStyle="single" borderBottom={true} paddingX={1}>
      <Text bold color="blue">
        🤖 Agent Timeline TUI
      </Text>
      <Box flexGrow={1} />
      <Text dimColor>Press 'q' to quit, 'h' for help</Text>
    </Box>
  );
}
