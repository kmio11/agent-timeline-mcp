/**
 * Timeline GUI specific types
 */

// Re-export shared types
export * from 'agent-timeline-shared';

// GUI-specific types
export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

export interface PollingState {
  isActive: boolean;
  interval: number;
  retryCount: number;
  lastSuccessfulPoll: Date | null;
}

export interface TimelineFilters {
  agentNames?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  contentSearch?: string;
}

export interface UITheme {
  mode: 'light' | 'dark' | 'system';
  primaryColor?: string;
  fontFamily?: string;
}

// Component props types
export interface TimelineProps {
  filters?: TimelineFilters;
  theme?: UITheme;
  maxPosts?: number;
}

export interface PostProps {
  post: import('agent-timeline-shared').PostWithAgent;
  showMetadata?: boolean;
  compact?: boolean;
}

export interface AgentBadgeProps {
  agentName: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
  showHandle?: boolean;
}