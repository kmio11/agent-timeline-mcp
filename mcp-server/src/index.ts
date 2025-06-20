#!/usr/bin/env node

/**
 * AI Agent Timeline MCP Server
 * Main entry point for the MCP server
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initializeDatabase, createTables, closeDatabase } from './database.js';
import { startSessionCleanup } from './session.js';
import {
  handleSignIn,
  handlePostTimeline,
  handleSignOut,
  signInTool,
  postTimelineTool,
  signOutTool,
  setCurrentSession,
} from './tools/index.js';
import { MCP_TOOLS, ErrorResponse } from 'agent-timeline-shared';

/**
 * Main server instance
 */
const server = new Server(
  {
    name: 'agent-timeline-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Session cleanup interval
 */
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Tool handlers mapping
 */
const toolHandlers = {
  [MCP_TOOLS.SIGN_IN]: handleSignIn,
  [MCP_TOOLS.POST_TIMELINE]: handlePostTimeline,
  [MCP_TOOLS.SIGN_OUT]: handleSignOut,
} as const;

/**
 * Available tools
 */
const tools = [signInTool, postTimelineTool, signOutTool];

/**
 * Handle list tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools,
  };
});

/**
 * Handle call tool request
 */
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name } = request.params;

  try {
    // Find handler for the tool
    const handler = toolHandlers[name as keyof typeof toolHandlers];
    if (!handler) {
      throw {
        error: 'ValidationError',
        message: `Unknown tool: ${name}`,
      } as ErrorResponse;
    }

    // Execute tool handler
    const result = await handler(request);

    // Handle sign-in special case - store session ID
    if (
      name === MCP_TOOLS.SIGN_IN &&
      result &&
      typeof result === 'object' &&
      'session_id' in result
    ) {
      setCurrentSession(result.session_id as string);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    // Handle structured errors
    if (typeof error === 'object' && error && 'error' in error) {
      const errorResponse = error as ErrorResponse;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
        isError: true,
      };
    }

    // Handle unexpected errors
    const unexpectedError: ErrorResponse = {
      error: 'DatabaseError',
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(unexpectedError, null, 2),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Initialize server
 */
async function initializeServer(): Promise<void> {
  try {
    console.error('Starting AI Agent Timeline MCP Server...');

    // Initialize database
    initializeDatabase();
    await createTables();
    console.error('Database initialized successfully');

    // Start session cleanup
    cleanupInterval = startSessionCleanup();
    console.error('Session cleanup started');

    console.error('MCP Server ready');
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

/**
 * Cleanup on exit
 */
async function cleanup(): Promise<void> {
  console.error('Shutting down server...');

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  try {
    await closeDatabase();
    console.error('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

/**
 * Handle process signals
 */
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

/**
 * Start server
 */
async function main(): Promise<void> {
  await initializeServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep the process running
  process.stdin.resume();
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
