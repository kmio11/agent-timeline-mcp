"use strict";
/**
 * Shared constants for AI Agent Timeline MCP Server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_CONFIG = exports.POLLING_CONFIG = exports.VALIDATION_RULES = exports.ERROR_CODES = exports.MCP_TOOLS = exports.DATABASE_TABLES = void 0;
exports.DATABASE_TABLES = {
    AGENTS: 'agents',
    POSTS: 'posts',
};
exports.MCP_TOOLS = {
    SIGN_IN: 'sign_in',
    POST_TIMELINE: 'post_timeline',
    SIGN_OUT: 'sign_out',
};
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'ValidationError',
    SESSION_ERROR: 'SessionError',
    DATABASE_ERROR: 'DatabaseError',
};
exports.VALIDATION_RULES = {
    CONTENT_MAX_LENGTH: 280,
    AGENT_NAME_MIN_LENGTH: 1,
    AGENT_NAME_MAX_LENGTH: 100,
    CONTEXT_MAX_LENGTH: 200,
};
exports.POLLING_CONFIG = {
    INTERVAL_MS: 1500,
    MAX_POSTS_INITIAL: 100,
    RETRY_INTERVALS: [1000, 2000, 4000, 8000, 16000], // Exponential backoff
};
exports.SESSION_CONFIG = {
    TIMEOUT_MS: 30 * 60 * 1000,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
};
