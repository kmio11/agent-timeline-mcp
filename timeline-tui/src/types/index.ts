export interface SSEMessage {
  type: 'connected' | 'new_post' | 'keepalive';
  client_id?: string;
  timestamp?: string;
  post_id?: number;
}

export interface TUIState {
  posts: import('agent-timeline-shared').PostWithAgent[];
  loading: boolean;
  connected: boolean;
  selectedAgent: string | null;
  scrollPosition: number;
  autoUpdate: boolean;
  newPostCount: number;
}

export interface KeyBinding {
  key: string;
  description: string;
  action: () => void;
}
