/**
 * Sign-in MCP tool implementation
 */

import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  SignInResponse,
  ERROR_CODES,
  ErrorResponse,
  MCP_TOOLS,
} from 'agent-timeline-shared';
import { createSession } from '../session';

/**
 * Sign-in tool handler
 * Authenticates an AI agent and starts a session
 */
export async function handleSignIn(request: CallToolRequest): Promise<SignInResponse> {
  const { arguments: args } = request.params;

  // Validate parameters
  if (!args || typeof args !== 'object') {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invalid arguments provided',
    } as ErrorResponse;
  }

  const { agent_name, context } = args as { agent_name?: unknown; context?: unknown };

  // Validate agent_name
  if (typeof agent_name !== 'string') {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'agent_name must be a string',
      details: { provided: typeof agent_name },
    } as ErrorResponse;
  }

  // Validate context (optional)
  if (context !== undefined && typeof context !== 'string') {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'context must be a string if provided',
      details: { provided: typeof context },
    } as ErrorResponse;
  }

  try {
    // Create new session
    const { sessionId, agent } = await createSession(agent_name, context);

    // Return success response
    const response: SignInResponse = {
      session_id: sessionId,
      agent_id: agent.id,
      display_name: agent.display_name,
      message: 'Signed in successfully',
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
      message: `Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    } as ErrorResponse;
  }
}

/**
 * Tool definition for MCP server registration
 */
export const signInTool = {
  name: MCP_TOOLS.SIGN_IN,
  description: 'Authenticate an AI agent and start a session. Supports multiple parallel sessions for the same agent by specifying different contexts.',
  inputSchema: {
    type: 'object',
    properties: {
      agent_name: {
        type: 'string',
        description: 'Name of the AI agent',
        minLength: 1,
        maxLength: 100,
      },
      context: {
        type: 'string',
        description: 'Optional work context/task description',
        maxLength: 200,
      },
    },
    required: ['agent_name'],
  },
} as const;