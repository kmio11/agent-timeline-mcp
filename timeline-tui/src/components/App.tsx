import React, { useMemo } from 'react';
import { Box } from 'ink';
import { Header } from './Header.js';
import { Timeline } from './Timeline.js';
import { StatusBar } from './StatusBar.js';
import { ScrollIndicator } from './ScrollIndicator.js';
import { useTimeline } from '../hooks/useTimeline.js';
import { useKeyboard } from '../hooks/useKeyboard.js';

export function App(): React.JSX.Element {
  const timelineState = useTimeline();

  // Calculate scroll indicator data
  const scrollData = useMemo(() => {
    const filteredPosts = timelineState.selectedAgent
      ? timelineState.posts.filter(post => post.agent_name === timelineState.selectedAgent)
      : timelineState.posts;

    const maxVisiblePosts = Math.max(1, timelineState.terminalHeight - 5);
    const isAtBottom = timelineState.scrollPosition === 0;
    const isAtTop = timelineState.scrollPosition >= filteredPosts.length - maxVisiblePosts;

    return {
      totalPosts: filteredPosts.length,
      visiblePosts: Math.min(filteredPosts.length, maxVisiblePosts),
      isAtTop,
      isAtBottom,
    };
  }, [
    timelineState.posts,
    timelineState.selectedAgent,
    timelineState.scrollPosition,
    timelineState.terminalHeight,
  ]);

  // Wire up keyboard handlers
  useKeyboard({
    onRefresh: timelineState.refresh,
    onToggleAutoUpdate: timelineState.toggleAutoUpdate,
    onFilter: () => {
      // TODO: Implement agent filtering UI
    },
    onLoadMore: timelineState.loadMore,
    onMarkAsRead: timelineState.markAsRead,
    onScrollUp: timelineState.scrollUp,
    onScrollDown: timelineState.scrollDown,
    onScrollToTop: timelineState.scrollToTop,
    onScrollToBottom: timelineState.scrollToBottom,
  });

  return (
    <Box flexDirection="column" height="100%">
      <Header />
      <ScrollIndicator
        totalPosts={scrollData.totalPosts}
        visiblePosts={scrollData.visiblePosts}
        scrollPosition={timelineState.scrollPosition}
        terminalHeight={timelineState.terminalHeight}
        isAtTop={scrollData.isAtTop}
        isAtBottom={scrollData.isAtBottom}
      />
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
