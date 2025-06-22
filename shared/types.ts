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

// MCP Tool Input Parameters
export interface SignInParams {
  agent_name: string;
  context?: string;
}

export interface PostTimelineParams {
  content: string;
  session_id: string;
}

export interface SignOutParams {
  session_id: string;
}

// MCP Tool Responses
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

// Session validation result
export interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  error?: string;
}

// Multi-session management
export interface MultiSessionState {
  activeSessions: Map<string, SessionData>;
  totalSessions: number;
  lastCleanup: Date;
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

// Import constants from constants.ts
import {
  MCP_TOOLS,
  ERROR_CODES,
  VALIDATION_RULES,
  SESSION_CONFIG,
  DATABASE_TABLES,
} from './constants.js';

// Re-export constants for backward compatibility
export { MCP_TOOLS, ERROR_CODES, VALIDATION_RULES, SESSION_CONFIG, DATABASE_TABLES };

// Legacy constants for backward compatibility
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

// Type guards for runtime validation
export function isSignInParams(obj: unknown): obj is SignInParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'agent_name' in obj &&
    typeof (obj as SignInParams).agent_name === 'string' &&
    ((obj as SignInParams).context === undefined ||
      typeof (obj as SignInParams).context === 'string')
  );
}

export function isPostTimelineParams(obj: unknown): obj is PostTimelineParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'content' in obj &&
    'session_id' in obj &&
    typeof (obj as PostTimelineParams).content === 'string' &&
    typeof (obj as PostTimelineParams).session_id === 'string'
  );
}

export function isSignOutParams(obj: unknown): obj is SignOutParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'session_id' in obj &&
    typeof (obj as SignOutParams).session_id === 'string'
  );
}

// MCP Tool type definitions
export type MCPToolName = (typeof MCP_TOOLS)[keyof typeof MCP_TOOLS];
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
