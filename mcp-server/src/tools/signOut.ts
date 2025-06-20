/**
 * Sign-out MCP tool implementation
 */

import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { SignOutResponse, MCP_TOOLS } from 'agent-timeline-shared';
import { removeSession } from '../session.js';
import { getCurrentSession, clearCurrentSession } from './postTimeline.js';

/**
 * Sign-out tool handler
 * Ends the current agent session
 */
export async function handleSignOut(request: CallToolRequest): Promise<SignOutResponse> {
  const { arguments: args } = request.params;

  // Get session ID from arguments or current session
  const { session_id } = (args as { session_id?: unknown }) || {};
  const sessionId = (session_id as string) || getCurrentSession();

  if (!sessionId) {
    // Not an error - just return success message
    return {
      message: 'No active session to sign out from',
    };
  }

  try {
    // Remove session from cache
    removeSession(sessionId);

    // Clear current session if it matches
    if (getCurrentSession() === sessionId) {
      clearCurrentSession();
    }

    return {
      message: 'Signed out successfully',
    };
  } catch (error) {
    // Even if cleanup fails, we should still clear the session
    if (getCurrentSession() === sessionId) {
      clearCurrentSession();
    }

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
        description: 'Session ID to sign out (optional, will use current session if not provided)',
      },
    },
    required: [],
  },
} as const;
