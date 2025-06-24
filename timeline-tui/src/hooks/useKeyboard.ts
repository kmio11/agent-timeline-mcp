import { useInput, useApp } from 'ink';
import { useCallback } from 'react';

interface UseKeyboardProps {
  onRefresh: () => void;
  onToggleAutoUpdate: () => void;
  onFilter: () => void;
  onLoadMore: () => void;
  onMarkAsRead: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
}

export function useKeyboard({
  onRefresh,
  onToggleAutoUpdate,
  onFilter,
  onLoadMore,
  onMarkAsRead,
  onScrollUp,
  onScrollDown,
  onScrollToTop,
  onScrollToBottom,
}: UseKeyboardProps) {
  const { exit } = useApp();

  const handleInput = useCallback(
    (input: string, key: { upArrow: boolean; downArrow: boolean }) => {
      // Handle arrow keys and vim-style navigation
      if (key.downArrow || input === 'j') {
        onScrollDown();
        return;
      }

      if (key.upArrow || input === 'k') {
        onScrollUp();
        return;
      }

      // Handle single key commands
      switch (input.toLowerCase()) {
        case 'q':
          exit();
          break;
        case 'r':
          onRefresh();
          break;
        case 't':
          onToggleAutoUpdate();
          break;
        case 'f':
          onFilter();
          break;
        case 'g':
          onScrollToTop();
          break;
        case 'l':
          onLoadMore();
          break;
        case ' ':
          onMarkAsRead();
          break;
        case 'G':
          onScrollToBottom();
          break;
        case 'h':
          // TODO: Show help
          break;
        default:
          break;
      }
    },
    [exit, onRefresh, onToggleAutoUpdate, onFilter, onLoadMore, onMarkAsRead, onScrollUp, onScrollDown, onScrollToTop, onScrollToBottom]
  );

  useInput(handleInput);
}
