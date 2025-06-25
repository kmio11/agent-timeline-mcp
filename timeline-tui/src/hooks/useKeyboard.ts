import { useInput, useApp } from 'ink';
import { useCallback, useState } from 'react';
import type { KeyboardHandlers, KeyboardKey } from '../types/keyboard.js';

type UseKeyboardProps = KeyboardHandlers;

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
  onShowHelp,
  onQuit,
}: UseKeyboardProps) {
  const { exit } = useApp();
  const [showingHelp, setShowingHelp] = useState(false);

  const handleInput = useCallback(
    (input: string, key: Partial<KeyboardKey>) => {
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
          if (onShowHelp) {
            onShowHelp();
            setShowingHelp(prev => !prev);
          }
          break;
        case 'escape':
          if (showingHelp) {
            setShowingHelp(false);
          }
          break;
        default:
          break;
      }
    },
    [exit, onRefresh, onToggleAutoUpdate, onFilter, onLoadMore, onMarkAsRead, onScrollUp, onScrollDown, onScrollToTop, onScrollToBottom, onShowHelp, onQuit, showingHelp]
  );

  useInput(handleInput);
  
  return {
    showingHelp,
  };
}
