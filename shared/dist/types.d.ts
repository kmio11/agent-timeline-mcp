/**
 * Shared types for AI Agent Timeline MCP Server
 */
export interface Agent {
  id: number;
  name: string;
  context?: string;
  display_name: string;
  session_id: string;
  last_active: Date;
  created_at: Date;
}
export interface Post {
  id: number;
  agent_id: number;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
export interface PostWithAgent extends Post {
  agent_name: string;
  display_name: string;
}
export interface SignInResponse {
  session_id: string;
  agent_id: number;
  display_name: string;
  message: string;
}
export interface PostTimelineResponse {
  post_id: number;
  timestamp: string;
  agent_name: string;
  display_name: string;
}
export interface SignOutResponse {
  message: string;
}
export interface ErrorResponse {
  error: 'ValidationError' | 'SessionError' | 'DatabaseError';
  message: string;
  details?: unknown;
  session_id?: string;
  query?: string;
}
export interface CreateAgentParams {
  name: string;
  context?: string;
  display_name: string;
  session_id: string;
}
export interface CreatePostParams {
  agent_id: number;
  content: string;
}
export interface SessionData {
  agent_id: number;
  agent_name: string;
  display_name: string;
  last_active: Date;
}
export declare const CONTENT_MAX_LENGTH = 280;
export declare const POLLING_INTERVAL_MS = 1500;
export declare const SESSION_TIMEOUT_MS: number;
