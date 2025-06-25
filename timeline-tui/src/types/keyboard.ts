/**
 * Keyboard event types for Ink terminal interface
 * Based on the Key interface from @types/ink
 */
export interface KeyboardKey {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  pageUp: boolean;
  pageDown: boolean;
  return: boolean;
  escape: boolean;
  ctrl: boolean;
  shift: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  meta: boolean;
}

export interface KeyboardHandlers {
  onRefresh: () => void;
  onToggleAutoUpdate: () => void;
  onFilter: () => void;
  onLoadMore: () => void;
  onMarkAsRead: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
  onShowHelp?: () => void;
  onQuit?: () => void;
}