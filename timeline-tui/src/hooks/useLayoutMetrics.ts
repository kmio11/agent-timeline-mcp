import { useMemo } from 'react';

interface LayoutMetrics {
  headerHeight: number;
  statusBarHeight: number;
  scrollIndicatorHeight: number;
  maxVisiblePosts: number;
  reservedHeight: number;
}

/**
 * Calculate layout metrics for terminal UI components
 * Centralizes height calculations to avoid magic numbers
 */
export function useLayoutMetrics(terminalHeight: number): LayoutMetrics {
  return useMemo(() => {
    // Component heights (including borders)
    const headerHeight = 3; // Header with top/bottom borders
    const statusBarHeight = 3; // StatusBar with top/bottom borders  
    const scrollIndicatorHeight = 3; // ScrollIndicator with top/bottom borders
    
    const reservedHeight = headerHeight + statusBarHeight + scrollIndicatorHeight;
    
    // Calculate available space for timeline content
    const availableHeight = Math.max(1, terminalHeight - reservedHeight);
    
    // Limit to reasonable number of posts for readability
    const maxVisiblePosts = Math.max(1, Math.min(10, availableHeight));
    
    return {
      headerHeight,
      statusBarHeight,
      scrollIndicatorHeight,
      maxVisiblePosts,
      reservedHeight,
    };
  }, [terminalHeight]);
}