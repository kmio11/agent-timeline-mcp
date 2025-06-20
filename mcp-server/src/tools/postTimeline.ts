/**
 * Post timeline MCP tool implementation
 */

import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  PostTimelineResponse,
  ERROR_CODES,
  ErrorResponse,
  MCP_TOOLS,
  VALIDATION_RULES,
} from 'agent-timeline-shared';
import { validateSession } from '../session.js';
import { createPost } from '../database.js';

/**
 * Current session ID for the MCP server instance
 * This is set by the sign-in process and used for subsequent operations
 */
let currentSessionId: string | null = null;

/**
 * Set current session ID
 */
export function setCurrentSession(sessionId: string): void {
  currentSessionId = sessionId;
}

/**
 * Get current session ID
 */
export function getCurrentSession(): string | null {
  return currentSessionId;
}

/**
 * Clear current session ID
 */
export function clearCurrentSession(): void {
  currentSessionId = null;
}

/**
 * Post timeline tool handler
 * Creates a new timeline post from the signed-in agent
 */
export async function handlePostTimeline(request: CallToolRequest): Promise<PostTimelineResponse> {
  const { arguments: args } = request.params;

  // Validate parameters
  if (!args || typeof args !== 'object') {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invalid arguments provided',
    } as ErrorResponse;
  }

  const { content } = args as { content?: unknown };

  // Validate content
  if (typeof content !== 'string') {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'content must be a string',
      details: { provided: typeof content },
    } as ErrorResponse;
  }

  if (content.trim().length === 0) {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'content cannot be empty',
    } as ErrorResponse;
  }

  if (content.length > VALIDATION_RULES.CONTENT_MAX_LENGTH) {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: `content must be ${VALIDATION_RULES.CONTENT_MAX_LENGTH} characters or less`,
      details: { length: content.length, max: VALIDATION_RULES.CONTENT_MAX_LENGTH },
    } as ErrorResponse;
  }

  // Get session ID from arguments or environment
  const { session_id } = args as { content?: unknown; session_id?: unknown };
  const sessionId = session_id as string || currentSessionId;
  
  if (!sessionId || typeof sessionId !== 'string') {
    throw {
      error: ERROR_CODES.SESSION_ERROR,
      message: 'session_id is required. Please provide session_id from sign_in response.',
    } as ErrorResponse;
  }

  try {
    // Validate session is active
    const session = await validateSession(sessionId);

    // Create post
    const post = await createPost({
      agent_id: session.agent_id,
      content: content.trim(),
    });

    // Return success response
    const response: PostTimelineResponse = {
      post_id: post.id,
      timestamp: post.timestamp.toISOString(),
      agent_name: session.agent_name,
      display_name: session.display_name,
    };

    return response;
  } catch (error) {
    // Re-throw known errors
    if (typeof error === 'object' && error && 'error' in error) {
      throw error;
    }

    // Handle unexpected errors
    throw {
      error: ERROR_CODES.DATABASE_ERROR,
      message: `Post creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    } as ErrorResponse;
  }
}

/**
 * Tool definition for MCP server registration
 */
export const postTimelineTool = {
  name: MCP_TOOLS.POST_TIMELINE,
  description: 'Create a new timeline post from the signed-in agent',
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Post content text',
        minLength: 1,
        maxLength: VALIDATION_RULES.CONTENT_MAX_LENGTH,
      },
    },
    required: ['content'],
  },
} as const;