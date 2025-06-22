/**
 * SignOut tool tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleSignOut } from './signOut.js';
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import * as session from '../session.js';

// Mock dependencies
vi.mock('../session.js', () => ({
  removeSession: vi.fn(),
}));

const mockSession = vi.mocked(session);

describe('SignOut Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (args: Record<string, unknown> | null): CallToolRequest => ({
    method: 'tools/call',
    params: {
      name: 'sign_out',
      arguments: args as Record<string, unknown> | undefined,
    },
  });

  describe('handleSignOut', () => {
    it('should sign out with valid session_id', async () => {
      const request = createRequest({
        session_id: 'session-123',
      });

      const result = await handleSignOut(request);

      expect(result).toMatchObject({
        message: 'Signed out successfully',
      });

      expect(mockSession.removeSession).toHaveBeenCalledWith('session-123');
    });

    it('should require session_id parameter', async () => {
      const request = createRequest({});

      await expect(handleSignOut(request)).rejects.toMatchObject({
        error: 'SessionError',
        message: 'session_id is required. Please provide session_id to sign out from.',
      });
    });

    it('should validate session_id is string', async () => {
      const request = createRequest({
        session_id: 123,
      });

      await expect(handleSignOut(request)).rejects.toMatchObject({
        error: 'SessionError',
        message: 'session_id is required. Please provide session_id to sign out from.',
      });
    });

    it('should validate arguments object', async () => {
      const request = createRequest(null);

      await expect(handleSignOut(request)).rejects.toMatchObject({
        error: 'ValidationError',
        message: 'Invalid arguments provided',
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      // Mock removeSession to throw an error
      mockSession.removeSession.mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      // Mock console.error to avoid output during test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = createRequest({
        session_id: 'session-123',
      });

      const result = await handleSignOut(request);

      expect(result).toMatchObject({
        message: 'Signed out successfully (with cleanup warnings)',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error during sign-out cleanup:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle empty session_id', async () => {
      const request = createRequest({
        session_id: '',
      });

      await expect(handleSignOut(request)).rejects.toMatchObject({
        error: 'SessionError',
        message: 'session_id is required. Please provide session_id to sign out from.',
      });
    });
  });
});
