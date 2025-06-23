import React from 'react';
import { Box } from 'ink';
import { Header } from './Header.js';
import { Timeline } from './Timeline.js';
import { StatusBar } from './StatusBar.js';
import { useTimeline } from '../hooks/useTimeline.js';
import { useKeyboard } from '../hooks/useKeyboard.js';

export function App(): React.JSX.Element {
  const timelineState = useTimeline();

  // Wire up keyboard handlers
  useKeyboard({
    onRefresh: timelineState.refresh,
    onToggleAutoUpdate: timelineState.toggleAutoUpdate,
    onFilter: () => {
      // TODO: Implement agent filtering UI
    },
    onLoadMore: timelineState.loadMore,
    onMarkAsRead: timelineState.markAsRead,
  });

  return (
    <Box flexDirection="column" height="100%">
      <Header />
      <Box flexGrow={1}>
        <Timeline {...timelineState} />
      </Box>
      <StatusBar
        connected={timelineState.connected}
        newPostCount={timelineState.newPostCount}
        autoUpdate={timelineState.autoUpdate}
      />
    </Box>
  );
}
