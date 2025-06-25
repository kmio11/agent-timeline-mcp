import React from 'react';
import { Box, Text } from 'ink';
import { getScrollBarChars } from '../utils/terminalCompat.js';

interface ScrollIndicatorProps {
  totalPosts: number;
  visiblePosts: number;
  maxVisiblePosts: number;
  scrollPosition: number;
  isAtTop: boolean;
  isAtBottom: boolean;
}

export function ScrollIndicator({
  totalPosts,
  visiblePosts: _visiblePosts,
  maxVisiblePosts,
  scrollPosition,
  isAtTop,
  isAtBottom,
}: ScrollIndicatorProps): React.JSX.Element {
  const showScrollIndicator = totalPosts > maxVisiblePosts;

  if (!showScrollIndicator) {
    return (
      <Box borderStyle="single" borderTop={true} paddingX={1}>
        <Text dimColor>{totalPosts} posts</Text>
      </Box>
    );
  }

  // Calculate current position info
  const currentStart = Math.max(0, totalPosts - maxVisiblePosts - scrollPosition) + 1;
  const currentEnd = totalPosts - scrollPosition;

  // Create visual scrollbar with terminal compatibility
  const scrollbarHeight = 8; // Fixed height for scrollbar
  const scrollbarPosition = totalPosts > maxVisiblePosts 
    ? Math.round((scrollPosition / (totalPosts - maxVisiblePosts)) * (scrollbarHeight - 1))
    : 0;

  const scrollBarChars = getScrollBarChars();
  const scrollbar = Array.from({ length: scrollbarHeight }, (_, i) => {
    if (totalPosts <= maxVisiblePosts) return scrollBarChars.empty; // No scroll needed
    if (i === scrollbarHeight - 1 - scrollbarPosition) return scrollBarChars.filled; // Current position
    return scrollBarChars.empty;
  }).join('');
  
  return (
    <Box borderStyle="single" borderTop={true} paddingX={1}>
      <Box justifyContent="space-between" width="100%">
        <Box>
          <Text dimColor>
            {totalPosts} posts
            {!isAtTop && ' • ↑ older above'}
            {!isAtBottom && ' • ↓ newer below'}
          </Text>
        </Box>
        <Box>
          <Text dimColor>
            {currentStart}-{currentEnd}/{totalPosts} [{scrollbar}]
          </Text>
        </Box>
      </Box>
    </Box>
  );
}