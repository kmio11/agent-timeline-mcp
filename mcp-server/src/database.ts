/**
 * Database connection and operations for PostgreSQL
 */

import pkg from 'pg';
const { Pool } = pkg;
import type { Pool as PoolType, PoolClient } from 'pg';
import {
  Agent,
  Post,
  PostWithAgent,
  CreateAgentParams,
  CreatePostParams,
  DATABASE_TABLES,
  ERROR_CODES,
  ErrorResponse,
} from 'agent-timeline-shared';

/**
 * Database connection pool
 */
let pool: PoolType | null = null;

/**
 * Initialize database connection pool
 */
export function initializeDatabase(connectionString?: string): PoolType {
  if (pool) {
    return pool;
  }

  const databaseUrl = connectionString || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Handle pool errors
  pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

/**
 * Get database connection pool
 */
export function getPool(): PoolType {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute query with error handling
 */
async function executeQuery<T>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = getPool();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    const dbError: ErrorResponse = {
      error: ERROR_CODES.DATABASE_ERROR,
      message: `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      query: text,
    };
    throw dbError;
  }
}

/**
 * Create database tables if they don't exist
 */
export async function createTables(): Promise<void> {
  const createAgentsTable = `
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.AGENTS} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      context TEXT,
      display_name TEXT NOT NULL,
      session_id TEXT UNIQUE NOT NULL,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLES.POSTS} (
      id SERIAL PRIMARY KEY,
      agent_id INTEGER NOT NULL,
      content TEXT NOT NULL CHECK (LENGTH(content) <= 280),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB,
      FOREIGN KEY (agent_id) REFERENCES ${DATABASE_TABLES.AGENTS} (id)
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_agents_session_id ON ${DATABASE_TABLES.AGENTS}(session_id);
    CREATE INDEX IF NOT EXISTS idx_agents_name ON ${DATABASE_TABLES.AGENTS}(name);
    CREATE INDEX IF NOT EXISTS idx_agents_display_name ON ${DATABASE_TABLES.AGENTS}(display_name);
    CREATE INDEX IF NOT EXISTS idx_posts_agent_id ON ${DATABASE_TABLES.POSTS}(agent_id);
    CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON ${DATABASE_TABLES.POSTS}(timestamp DESC);
  `;

  await executeQuery(createAgentsTable);
  await executeQuery(createPostsTable);
  await executeQuery(createIndexes);
}

/**
 * Create new agent session
 */
export async function createAgent(params: CreateAgentParams): Promise<Agent> {
  const query = `
    INSERT INTO ${DATABASE_TABLES.AGENTS} (name, context, display_name, session_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  
  const result = await executeQuery<Agent>(
    query,
    [params.name, params.context, params.display_name, params.session_id]
  );

  if (result.length === 0) {
    throw {
      error: ERROR_CODES.DATABASE_ERROR,
      message: 'Failed to create agent',
    } as ErrorResponse;
  }

  return result[0];
}

/**
 * Get agent by session ID
 */
export async function getAgentBySessionId(sessionId: string): Promise<Agent | null> {
  const query = `
    SELECT * FROM ${DATABASE_TABLES.AGENTS}
    WHERE session_id = $1;
  `;
  
  const result = await executeQuery<Agent>(query, [sessionId]);
  return result.length > 0 ? result[0] : null;
}

/**
 * Update agent last active timestamp
 */
export async function updateAgentLastActive(sessionId: string): Promise<void> {
  const query = `
    UPDATE ${DATABASE_TABLES.AGENTS}
    SET last_active = CURRENT_TIMESTAMP
    WHERE session_id = $1;
  `;
  
  await executeQuery(query, [sessionId]);
}

/**
 * Create new post
 */
export async function createPost(params: CreatePostParams): Promise<Post> {
  const query = `
    INSERT INTO ${DATABASE_TABLES.POSTS} (agent_id, content)
    VALUES ($1, $2)
    RETURNING *;
  `;
  
  const result = await executeQuery<Post>(
    query,
    [params.agent_id, params.content]
  );

  if (result.length === 0) {
    throw {
      error: ERROR_CODES.DATABASE_ERROR,
      message: 'Failed to create post',
    } as ErrorResponse;
  }

  return result[0];
}

/**
 * Get recent posts with agent information
 */
export async function getRecentPosts(limit: number = 100): Promise<PostWithAgent[]> {
  const query = `
    SELECT 
      p.id,
      p.agent_id,
      p.content,
      p.timestamp,
      p.metadata,
      a.name as agent_name,
      a.display_name
    FROM ${DATABASE_TABLES.POSTS} p
    JOIN ${DATABASE_TABLES.AGENTS} a ON p.agent_id = a.id
    ORDER BY p.timestamp DESC
    LIMIT $1;
  `;
  
  return executeQuery<PostWithAgent>(query, [limit]);
}

/**
 * Get posts newer than timestamp
 */
export async function getPostsAfterTimestamp(timestamp: Date): Promise<PostWithAgent[]> {
  const query = `
    SELECT 
      p.id,
      p.agent_id,
      p.content,
      p.timestamp,
      p.metadata,
      a.name as agent_name,
      a.display_name
    FROM ${DATABASE_TABLES.POSTS} p
    JOIN ${DATABASE_TABLES.AGENTS} a ON p.agent_id = a.id
    WHERE p.timestamp > $1
    ORDER BY p.timestamp DESC;
  `;
  
  return executeQuery<PostWithAgent>(query, [timestamp]);
}