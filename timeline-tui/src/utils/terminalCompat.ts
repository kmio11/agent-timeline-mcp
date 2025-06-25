/**
 * Terminal compatibility utilities for cross-platform character rendering
 */

/**
 * Detect if terminal supports Unicode characters
 * Basic heuristic based on platform and environment variables
 */
function supportsUnicode(): boolean {
  // Windows Command Prompt typically has poor Unicode support
  if (process.platform === 'win32') {
    // Windows Terminal and newer terminals support Unicode
    return process.env.WT_SESSION !== undefined || 
           process.env.TERM_PROGRAM === 'vscode' ||
           process.env.TERM === 'xterm-256color';
  }
  
  // Most Unix-like systems support Unicode by default
  return true;
}

/**
 * Get appropriate scroll bar characters based on terminal capabilities
 */
export function getScrollBarChars(): { filled: string; empty: string } {
  if (supportsUnicode()) {
    return {
      filled: '█',  // Full block
      empty: '░',   // Light shade
    };
  } else {
    return {
      filled: '#',  // Hash symbol
      empty: '.',   // Period
    };
  }
}

/**
 * Get appropriate status indicator characters
 */
export function getStatusChars(): { connected: string; disconnected: string } {
  if (supportsUnicode()) {
    return {
      connected: '●',     // Bullet
      disconnected: '●',  // Bullet (color will differentiate)
    };
  } else {
    return {
      connected: '*',     // Asterisk
      disconnected: 'X',  // X mark
    };
  }
}

/**
 * Get appropriate navigation characters
 */
export function getNavChars(): { refresh: string; pause: string } {
  if (supportsUnicode()) {
    return {
      refresh: '↻',  // Anticlockwise rotation
      pause: '⏸',   // Pause symbol
    };
  } else {
    return {
      refresh: 'R',  // R for refresh
      pause: 'P',   // P for pause
    };
  }
}

/**
 * Detect if terminal supports true color (24-bit)
 */
function supportsTrueColor(): boolean {
  return process.env.COLORTERM === 'truecolor' || 
         process.env.COLORTERM === '24bit' ||
         process.env.TERM === 'xterm-256color';
}

/**
 * Get safe color names that work across terminals
 * Falls back to basic colors for better compatibility
 */
export function getSafeColors(): {
  success: string;
  error: string;
  warning: string;
  info: string;
  muted: string;
} {
  const trueColor = supportsTrueColor();
  
  return {
    success: 'green',    // Works in all terminals
    error: 'red',        // Works in all terminals  
    warning: 'yellow',   // Works in all terminals
    info: trueColor ? 'cyan' : 'blue',     // Fallback to blue
    muted: trueColor ? 'gray' : 'white',   // Fallback to white
  };
}