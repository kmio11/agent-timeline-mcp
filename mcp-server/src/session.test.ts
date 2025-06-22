/**
 * Session management tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSession, validateSession, removeSession } from './session.js';
import * as database from './database.js';

// Mock database functions
vi.mock('./database.js', () => ({
  createAgent: vi.fn(),
  getAgentBySessionId: vi.fn(),
  updateAgentLastActive: vi.fn(),
  getAgentByIdentityKey: vi.fn(),
  updateAgentSessionId: vi.fn(),
}));

const mockDatabase = vi.mocked(database);

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create new session for new agent', async () => {
      // Mock that no existing agent is found
      mockDatabase.getAgentByIdentityKey.mockResolvedValue(null);

      // Mock agent creation
      const mockAgent = {
        id: 1,
        name: 'TestAgent',
        context: undefined,
        display_name: 'TestAgent',
        identity_key: 'test-key',
        avatar_seed: 'test-seed',
        session_id: 'session-123',
        last_active: new Date(),
        created_at: new Date(),
      };
      mockDatabase.createAgent.mockResolvedValue(mockAgent);

      const result = await createSession('TestAgent');

      expect(result.agent).toEqual(mockAgent);
      expect(result.sessionId).toBeDefined();
      expect(mockDatabase.getAgentByIdentityKey).toHaveBeenCalled();
      expect(mockDatabase.createAgent).toHaveBeenCalled();
    });

    it('should reuse existing agent for same identity_key', async () => {
      // Mock existing agent
      const existingAgent = {
        id: 1,
        name: 'TestAgent',
        context: undefined,
        display_name: 'TestAgent',
        identity_key: 'test-key',
        avatar_seed: 'test-seed',
        session_id: 'old-session',
        last_active: new Date(),
        created_at: new Date(),
      };
      mockDatabase.getAgentByIdentityKey.mockResolvedValue(existingAgent);

      // Mock session update
      const updatedAgent = { ...existingAgent, session_id: 'new-session' };
      mockDatabase.updateAgentSessionId.mockResolvedValue(updatedAgent);

      const result = await createSession('TestAgent');

      expect(result.agent.id).toBe(1);
      expect(mockDatabase.getAgentByIdentityKey).toHaveBeenCalled();
      expect(mockDatabase.updateAgentSessionId).toHaveBeenCalled();
      expect(mockDatabase.createAgent).not.toHaveBeenCalled();
    });

    it('should handle agent name with context', async () => {
      mockDatabase.getAgentByIdentityKey.mockResolvedValue(null);

      const mockAgent = {
        id: 1,
        name: 'TestAgent',
        context: 'test-context',
        display_name: 'TestAgent - test-context',
        identity_key: 'test-key-context',
        avatar_seed: 'test-seed',
        session_id: 'session-123',
        last_active: new Date(),
        created_at: new Date(),
      };
      mockDatabase.createAgent.mockResolvedValue(mockAgent);

      const result = await createSession('TestAgent', 'test-context');

      expect(result.agent.display_name).toBe('TestAgent - test-context');
      expect(result.agent.context).toBe('test-context');
    });

    it('should validate agent name length', async () => {
      const longName = 'a'.repeat(101);

      await expect(createSession(longName)).rejects.toMatchObject({
        error: 'ValidationError',
        message: 'Agent name must be 100 characters or less',
      });
    });

    it('should validate context length', async () => {
      const longContext = 'a'.repeat(201);

      await expect(createSession('TestAgent', longContext)).rejects.toMatchObject({
        error: 'ValidationError',
        message: 'Context must be 200 characters or less',
      });
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      const mockAgent = {
        id: 1,
        name: 'TestAgent',
        context: undefined,
        display_name: 'TestAgent',
        identity_key: 'test-key',
        avatar_seed: 'test-seed',
        session_id: 'session-123',
        last_active: new Date(),
        created_at: new Date(),
      };
      mockDatabase.getAgentBySessionId.mockResolvedValue(mockAgent);

      const result = await validateSession('session-123');

      expect(result).toMatchObject({
        agent_id: 1,
        agent_name: 'TestAgent',
      });
    });

    it('should reject invalid session', async () => {
      mockDatabase.getAgentBySessionId.mockResolvedValue(null);

      await expect(validateSession('invalid-session')).rejects.toMatchObject({
        error: 'SessionError',
        message: 'Invalid or expired session',
      });
    });

    it('should reject empty session ID', async () => {
      await expect(validateSession('')).rejects.toMatchObject({
        error: 'SessionError',
        message: 'Session ID is required',
      });
    });
  });

  describe('removeSession', () => {
    it('should remove session from cache', () => {
      // Test that removeSession doesn't throw
      expect(() => removeSession('session-123')).not.toThrow();
    });
  });
});
