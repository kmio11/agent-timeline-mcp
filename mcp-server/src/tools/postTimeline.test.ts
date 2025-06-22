/**
 * PostTimeline tool tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handlePostTimeline } from './postTimeline.js';
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import * as session from '../session.js';
import * as database from '../database.js';

// Mock dependencies
vi.mock('../session.js', () => ({
  validateSession: vi.fn(),
}));

vi.mock('../database.js', () => ({
  createPost: vi.fn(),
}));

const mockSession = vi.mocked(session);
const mockDatabase = vi.mocked(database);

describe('PostTimeline Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (args: Record<string, unknown> | null): CallToolRequest => ({
    method: 'tools/call',
    params: {
      name: 'post_timeline',
      arguments: args as Record<string, unknown> | undefined,
    },
  });

  describe('handlePostTimeline', () => {
    it('should create post with valid session_id', async () => {
      const sessionData = {
        agent_id: 1,
        agent_name: 'TestAgent',
        display_name: 'TestAgent',
        identity_key: 'test-key',
        avatar_seed: 'test-seed',
        last_active: new Date(),
      };
      mockSession.validateSession.mockResolvedValue(sessionData);

      const mockPost = {
        id: 1,
        agent_id: 1,
        content: 'Test content',
        timestamp: new Date(),
        metadata: undefined,
      };
      mockDatabase.createPost.mockResolvedValue(mockPost);

      const request = createRequest({
        content: 'Test content',
        session_id: 'session-123',
      });

      const result = await handlePostTimeline(request);

      expect(result).toMatchObject({
        post_id: 1,
        agent_name: 'TestAgent',
        display_name: 'TestAgent',
        identity_key: 'test-key',
        avatar_seed: 'test-seed',
      });

      expect(mockSession.validateSession).toHaveBeenCalledWith('session-123');
      expect(mockDatabase.createPost).toHaveBeenCalledWith({
        agent_id: 1,
        content: 'Test content',
      });
    });

    it('should require session_id parameter', async () => {
      const request = createRequest({
        content: 'Test content',
      });

      await expect(handlePostTimeline(request)).rejects.toMatchObject({
        error: 'SessionError',
        message: 'session_id is required. Please provide session_id from sign_in response.',
      });
    });

    it('should validate content is string', async () => {
      const request = createRequest({
        content: 123,
        session_id: 'session-123',
      });

      await expect(handlePostTimeline(request)).rejects.toMatchObject({
        error: 'ValidationError',
        message: 'content must be a string',
      });
    });

    it('should validate content is not empty', async () => {
      const request = createRequest({
        content: '   ',
        session_id: 'session-123',
      });

      await expect(handlePostTimeline(request)).rejects.toMatchObject({
        error: 'ValidationError',
        message: 'content cannot be empty',
      });
    });

    it('should validate content length', async () => {
      const longContent = 'a'.repeat(281);
      const request = createRequest({
        content: longContent,
        session_id: 'session-123',
      });

      await expect(handlePostTimeline(request)).rejects.toMatchObject({
        error: 'ValidationError',
        message: 'content must be 280 characters or less',
      });
    });

    it('should handle invalid session', async () => {
      mockSession.validateSession.mockRejectedValue({
        error: 'SessionError',
        message: 'Invalid or expired session',
      });

      const request = createRequest({
        content: 'Test content',
        session_id: 'invalid-session',
      });

      await expect(handlePostTimeline(request)).rejects.toMatchObject({
        error: 'SessionError',
        message: 'Invalid or expired session',
      });
    });

    it('should validate arguments object', async () => {
      const request = createRequest(null);

      await expect(handlePostTimeline(request)).rejects.toMatchObject({
        error: 'ValidationError',
        message: 'Invalid arguments provided',
      });
    });

    it('should trim content before processing', async () => {
      const sessionData = {
        agent_id: 1,
        agent_name: 'TestAgent',
        display_name: 'TestAgent',
        identity_key: 'test-key',
        avatar_seed: 'test-seed',
        last_active: new Date(),
      };
      mockSession.validateSession.mockResolvedValue(sessionData);

      const mockPost = {
        id: 1,
        agent_id: 1,
        content: 'Test content',
        timestamp: new Date(),
        metadata: undefined,
      };
      mockDatabase.createPost.mockResolvedValue(mockPost);

      const request = createRequest({
        content: '  Test content  ',
        session_id: 'session-123',
      });

      await handlePostTimeline(request);

      expect(mockDatabase.createPost).toHaveBeenCalledWith({
        agent_id: 1,
        content: 'Test content',
      });
    });
  });
});
