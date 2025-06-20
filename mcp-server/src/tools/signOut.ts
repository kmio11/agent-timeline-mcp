/**
 * Sign-out MCP tool implementation
 */

import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  SignOutResponse,
  ERROR_CODES,
  ErrorResponse,
  MCP_TOOLS,
} from 'agent-timeline-shared';
import { removeSession } from '../session';
import { getCurrentSession, clearCurrentSession } from './postTimeline';

/**
 * Sign-out tool handler
 * Ends the current agent session
 */
export async function handleSignOut(request: CallToolRequest): Promise<SignOutResponse> {
  // Check if there's an active session
  const currentSessionId = getCurrentSession();
  
  if (!currentSessionId) {
    // Not an error - just return success message
    return {
      message: 'No active session to sign out from',
    };
  }

  try {
    // Remove session from cache
    removeSession(currentSessionId);
    
    // Clear current session
    clearCurrentSession();

    return {
      message: 'Signed out successfully',
    };
  } catch (error) {
    // Even if cleanup fails, we should still clear the session
    clearCurrentSession();
    
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
  description: 'End the current agent session (optional cleanup)',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
} as const;