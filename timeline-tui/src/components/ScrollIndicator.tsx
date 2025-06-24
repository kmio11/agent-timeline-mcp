import React from 'react';
import { Box, Text } from 'ink';

interface ScrollIndicatorProps {
  totalPosts: number;
  visiblePosts: number;
  scrollPosition: number;
  terminalHeight: number;
  isAtTop: boolean;
  isAtBottom: boolean;
}

export function ScrollIndicator({
  totalPosts,
  visiblePosts: _visiblePosts,
  scrollPosition,
  terminalHeight,
  isAtTop,
  isAtBottom,
}: ScrollIndicatorProps): React.JSX.Element {
  const maxVisiblePosts = Math.max(1, Math.min(10, terminalHeight - 7)); // 最大10件まで表示
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

  // Create visual scrollbar
  const scrollbarHeight = 8; // Fixed height for scrollbar
  const scrollbarPosition = totalPosts > maxVisiblePosts 
    ? Math.round((scrollPosition / (totalPosts - maxVisiblePosts)) * (scrollbarHeight - 1))
    : 0;

  const scrollbar = Array.from({ length: scrollbarHeight }, (_, i) => {
    if (totalPosts <= maxVisiblePosts) return '░'; // No scroll needed
    if (i === scrollbarHeight - 1 - scrollbarPosition) return '█'; // Current position
    return '░';
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