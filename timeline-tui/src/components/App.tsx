import React, { useMemo } from 'react';
import { Box } from 'ink';
import { Header } from './Header.js';
import { Timeline } from './Timeline.js';
import { StatusBar } from './StatusBar.js';
import { ScrollIndicator } from './ScrollIndicator.js';
import { HelpModal } from './HelpModal.js';
import { useTimeline } from '../hooks/useTimeline.js';
import { useKeyboard } from '../hooks/useKeyboard.js';
import { useLayoutMetrics } from '../hooks/useLayoutMetrics.js';

export function App(): React.JSX.Element {
  const timelineState = useTimeline();
  const layoutMetrics = useLayoutMetrics(timelineState.terminalHeight);

  // Calculate scroll indicator data
  const scrollData = useMemo(() => {
    const filteredPosts = timelineState.selectedAgent
      ? timelineState.posts.filter(post => post.agent_name === timelineState.selectedAgent)
      : timelineState.posts;

    const { maxVisiblePosts } = layoutMetrics;
    const isAtBottom = timelineState.scrollPosition === 0;
    const isAtTop = timelineState.scrollPosition >= filteredPosts.length - maxVisiblePosts;

    return {
      totalPosts: filteredPosts.length,
      visiblePosts: Math.min(filteredPosts.length, maxVisiblePosts),
      maxVisiblePosts,
      isAtTop,
      isAtBottom,
    };
  }, [
    timelineState.posts,
    timelineState.selectedAgent,
    timelineState.scrollPosition,
    layoutMetrics,
  ]);

  // Wire up keyboard handlers
  const keyboardState = useKeyboard({
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
    onShowHelp: () => {
      // Toggle help is handled in useKeyboard hook
    },
  });

  return (
    <Box flexDirection="column" height="100%">
      <Header />
      <Box flexGrow={1}>
        <Timeline {...timelineState} />
      </Box>
      <ScrollIndicator
        totalPosts={scrollData.totalPosts}
        visiblePosts={scrollData.visiblePosts}
        maxVisiblePosts={scrollData.maxVisiblePosts}
        scrollPosition={timelineState.scrollPosition}
        isAtTop={scrollData.isAtTop}
        isAtBottom={scrollData.isAtBottom}
      />
      <StatusBar
        connected={timelineState.connected}
        newPostCount={timelineState.newPostCount}
        autoUpdate={timelineState.autoUpdate}
      />
      <HelpModal isVisible={keyboardState.showingHelp} />
    </Box>
  );
}
