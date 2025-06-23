import { useInput, useApp } from 'ink';
import { useCallback } from 'react';

interface UseKeyboardProps {
  onRefresh: () => void;
  onToggleAutoUpdate: () => void;
  onFilter: () => void;
  onLoadMore: () => void;
  onMarkAsRead: () => void;
}

export function useKeyboard({
  onRefresh,
  onToggleAutoUpdate,
  onFilter,
  onLoadMore,
  onMarkAsRead,
}: UseKeyboardProps) {
  const { exit } = useApp();

  const handleInput = useCallback(
    (input: string, key: { upArrow: boolean; downArrow: boolean }) => {
      // Handle arrow keys and vim-style navigation
      if (key.downArrow || input === 'j') {
        // TODO: Implement scroll down
        return;
      }

      if (key.upArrow || input === 'k') {
        // TODO: Implement scroll up
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
          // TODO: Go to top
          break;
        case 'l':
          onLoadMore();
          break;
        case ' ':
          onMarkAsRead();
          break;
        case 'h':
          // TODO: Show help
          break;
        default:
          break;
      }
    },
    [exit, onRefresh, onToggleAutoUpdate, onFilter, onLoadMore, onMarkAsRead]
  );

  useInput(handleInput);
}
