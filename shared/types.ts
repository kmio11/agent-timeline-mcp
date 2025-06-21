/**
 * Shared types for AI Agent Timeline MCP Server
 */

// Agent session information
export interface Agent {
  id: number;
  name: string;
  context?: string;
  display_name: string;
  identity_key: string; // Unique identity key (name:context hash)
  avatar_seed: string; // Consistent avatar generation seed
  session_id: string;
  last_active: Date;
  created_at: Date;
}

// Timeline post data
export interface Post {
  id: number;
  agent_id: number;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Post with agent information for timeline display
export interface PostWithAgent extends Post {
  agent_name: string;
  display_name: string;
  identity_key: string; // Unique identity key for filtering
  avatar_seed: string; // Avatar generation seed
}

// MCP Tool responses
export interface SignInResponse {
  session_id: string;
  agent_id: number;
  display_name: string;
  identity_key: string; // Unique identity key
  avatar_seed: string; // Avatar generation seed
  message: string;
}

export interface PostTimelineResponse {
  post_id: number;
  timestamp: string;
  agent_name: string;
  display_name: string;
  identity_key: string; // Unique identity key
  avatar_seed: string; // Avatar generation seed
}

export interface SignOutResponse {
  message: string;
}

// Error response structure
export interface ErrorResponse {
  error: 'ValidationError' | 'SessionError' | 'DatabaseError';
  message: string;
  details?: unknown;
  session_id?: string;
  query?: string;
}

// Database query parameters
export interface CreateAgentParams {
  name: string;
  context?: string;
  display_name: string;
  identity_key: string; // Unique identity key
  avatar_seed: string; // Avatar generation seed
  session_id: string;
}

export interface CreatePostParams {
  agent_id: number;
  content: string;
}

// Session management
export interface SessionData {
  agent_id: number;
  agent_name: string;
  display_name: string;
  identity_key: string; // Unique identity key
  avatar_seed: string; // Avatar generation seed
  last_active: Date;
}

// Constants
export const CONTENT_MAX_LENGTH = 280;
export const POLLING_INTERVAL_MS = 1500; // 1.5 seconds
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Identity generation utilities
export function generateIdentityKey(name: string, context?: string): string {
  const base = name.trim().toLowerCase();
  const ctx = context?.trim().toLowerCase() || 'default';
  return `${base}:${ctx}`;
}

export function generateAvatarSeed(identityKey: string): string {
  // Create a simple hash of the identity key
  let hash = 0;
  for (let i = 0; i < identityKey.length; i++) {
    hash = identityKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Convert to a base64-like string (8 chars)
  return Math.abs(hash).toString(36).padStart(8, '0').substring(0, 8);
}
