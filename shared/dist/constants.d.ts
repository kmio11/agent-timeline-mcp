/**
 * Shared constants for AI Agent Timeline MCP Server
 */
export declare const DATABASE_TABLES: {
  readonly AGENTS: 'agents';
  readonly POSTS: 'posts';
};
export declare const MCP_TOOLS: {
  readonly SIGN_IN: 'sign_in';
  readonly POST_TIMELINE: 'post_timeline';
  readonly SIGN_OUT: 'sign_out';
};
export declare const ERROR_CODES: {
  readonly VALIDATION_ERROR: 'ValidationError';
  readonly SESSION_ERROR: 'SessionError';
  readonly DATABASE_ERROR: 'DatabaseError';
};
export declare const VALIDATION_RULES: {
  readonly CONTENT_MAX_LENGTH: 280;
  readonly AGENT_NAME_MIN_LENGTH: 1;
  readonly AGENT_NAME_MAX_LENGTH: 100;
  readonly CONTEXT_MAX_LENGTH: 200;
};
export declare const POLLING_CONFIG: {
  readonly INTERVAL_MS: 1500;
  readonly MAX_POSTS_INITIAL: 100;
  readonly RETRY_INTERVALS: readonly [1000, 2000, 4000, 8000, 16000];
};
export declare const SESSION_CONFIG: {
  readonly TIMEOUT_MS: number;
  readonly CLEANUP_INTERVAL_MS: number;
};
