/**
 * Session management for AI agents
 */

import { randomUUID } from 'node:crypto';
import {
  SessionData,
  Agent,
  ERROR_CODES,
  ErrorResponse,
  SESSION_CONFIG,
} from 'agent-timeline-shared';
import { createAgent, getAgentBySessionId, updateAgentLastActive } from './database.js';

/**
 * In-memory session cache for fast lookups
 */
const sessionCache = new Map<string, SessionData>();

/**
 * Generate display name with context
 */
function generateDisplayName(agentName: string, context?: string): string {
  if (!context) return agentName;
  return `${agentName} - ${context}`;
}

/**
 * Create new agent session
 */
export async function createSession(
  agentName: string,
  context?: string
): Promise<{ sessionId: string; agent: Agent }> {
  // Validate input
  if (!agentName.trim()) {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Agent name is required',
    } as ErrorResponse;
  }

  if (agentName.length > 100) {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Agent name must be 100 characters or less',
    } as ErrorResponse;
  }

  if (context && context.length > 200) {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Context must be 200 characters or less',
    } as ErrorResponse;
  }

  // Generate unique session ID
  const sessionId = randomUUID();
  const displayName = generateDisplayName(agentName, context);

  try {
    // Create agent in database
    const agent = await createAgent({
      name: agentName.trim(),
      context: context?.trim(),
      display_name: displayName,
      session_id: sessionId,
    });

    // Cache session data
    const sessionData: SessionData = {
      agent_id: agent.id,
      agent_name: agent.name,
      display_name: agent.display_name,
      last_active: new Date(),
    };
    sessionCache.set(sessionId, sessionData);

    return { sessionId, agent };
  } catch (error) {
    // Handle database errors
    if (typeof error === 'object' && error && 'error' in error) {
      throw error;
    }

    throw {
      error: ERROR_CODES.DATABASE_ERROR,
      message: `Failed to create session: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    } as ErrorResponse;
  }
}

/**
 * Get session data by session ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  // Check cache first
  const cached = sessionCache.get(sessionId);
  if (cached) {
    // Update last active
    cached.last_active = new Date();
    sessionCache.set(sessionId, cached);

    // Update database async
    updateAgentLastActive(sessionId).catch(console.error);

    return cached;
  }

  // Fallback to database
  try {
    const agent = await getAgentBySessionId(sessionId);
    if (!agent) return null;

    const sessionData: SessionData = {
      agent_id: agent.id,
      agent_name: agent.name,
      display_name: agent.display_name,
      last_active: new Date(),
    };

    // Cache for future use
    sessionCache.set(sessionId, sessionData);

    // Update last active
    await updateAgentLastActive(sessionId);

    return sessionData;
  } catch (error) {
    console.error('Failed to get session from database:', error);
    return null;
  }
}

/**
 * Validate session exists and is active
 */
export async function validateSession(sessionId: string): Promise<SessionData> {
  if (!sessionId) {
    throw {
      error: ERROR_CODES.SESSION_ERROR,
      message: 'Session ID is required',
    } as ErrorResponse;
  }

  const session = await getSession(sessionId);
  if (!session) {
    throw {
      error: ERROR_CODES.SESSION_ERROR,
      message: 'Invalid or expired session',
      session_id: sessionId,
    } as ErrorResponse;
  }

  // Check session timeout
  const now = new Date();
  const timeDiff = now.getTime() - session.last_active.getTime();

  if (timeDiff > SESSION_CONFIG.TIMEOUT_MS) {
    // Remove expired session from cache
    sessionCache.delete(sessionId);

    throw {
      error: ERROR_CODES.SESSION_ERROR,
      message: 'Session has expired',
      session_id: sessionId,
    } as ErrorResponse;
  }

  return session;
}

/**
 * Remove session (sign out)
 */
export function removeSession(sessionId: string): void {
  sessionCache.delete(sessionId);
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();
  const expiredSessions: string[] = [];

  for (const [sessionId, sessionData] of sessionCache.entries()) {
    const timeDiff = now.getTime() - sessionData.last_active.getTime();
    if (timeDiff > SESSION_CONFIG.TIMEOUT_MS) {
      expiredSessions.push(sessionId);
    }
  }

  // Remove expired sessions
  for (const sessionId of expiredSessions) {
    sessionCache.delete(sessionId);
  }

  if (expiredSessions.length > 0) {
    console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
  }
}

/**
 * Start periodic session cleanup
 */
export function startSessionCleanup(): NodeJS.Timeout {
  return setInterval(cleanupExpiredSessions, SESSION_CONFIG.CLEANUP_INTERVAL_MS);
}

/**
 * Get current session count (for monitoring)
 */
export function getActiveSessionCount(): number {
  return sessionCache.size;
}
