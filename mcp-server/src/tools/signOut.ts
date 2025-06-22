/**
 * Sign-out MCP tool implementation
 */

import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { SignOutResponse, ERROR_CODES, ErrorResponse, MCP_TOOLS } from 'agent-timeline-shared';
import { removeSession } from '../session.js';

/**
 * Sign-out tool handler
 * Ends the specified agent session
 */
export async function handleSignOut(request: CallToolRequest): Promise<SignOutResponse> {
  const { arguments: args } = request.params;

  // Validate parameters
  if (!args || typeof args !== 'object') {
    throw {
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invalid arguments provided',
    } as ErrorResponse;
  }

  const { session_id } = args as { session_id?: unknown };

  // Validate session_id
  if (!session_id || typeof session_id !== 'string') {
    throw {
      error: ERROR_CODES.SESSION_ERROR,
      message: 'session_id is required. Please provide session_id to sign out from.',
    } as ErrorResponse;
  }

  try {
    // Remove session from cache
    removeSession(session_id);

    return {
      message: 'Signed out successfully',
    };
  } catch (error) {
    // Log the error but don't fail the sign-out
    console.error('Error during sign-out cleanup:', error);

    return {
      message: 'Signed out successfully (with cleanup warnings)',
    };
  }
}

/**
 * Tool definition for MCP server registration
 */
export const signOutTool = {
  name: MCP_TOOLS.SIGN_OUT,
  description: 'End the agent session (optional cleanup)',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: {
        type: 'string',
        description: 'Session ID to sign out',
      },
    },
    required: ['session_id'],
  },
} as const;
