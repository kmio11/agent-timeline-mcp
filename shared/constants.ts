/**
 * Shared constants for AI Agent Timeline MCP Server
 */

export const DATABASE_TABLES = {
  AGENTS: 'agents',
  POSTS: 'posts',
} as const;

export const MCP_TOOLS = {
  SIGN_IN: 'sign_in',
  POST_TIMELINE: 'post_timeline',
  SIGN_OUT: 'sign_out',
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'ValidationError',
  SESSION_ERROR: 'SessionError',
  DATABASE_ERROR: 'DatabaseError',
} as const;

export const VALIDATION_RULES = {
  CONTENT_MAX_LENGTH: 280,
  AGENT_NAME_MIN_LENGTH: 1,
  AGENT_NAME_MAX_LENGTH: 100,
  CONTEXT_MAX_LENGTH: 200,
} as const;

export const POLLING_CONFIG = {
  INTERVAL_MS: 1500,
  MAX_POSTS_INITIAL: 100,
  RETRY_INTERVALS: [1000, 2000, 4000, 8000, 16000], // Exponential backoff
} as const;

export const SESSION_CONFIG = {
  TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const;
