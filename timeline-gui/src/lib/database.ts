/**
 * Database connection for Timeline GUI
 */

import { Pool } from 'pg';
import { PostWithAgent } from 'agent-timeline-shared';

/**
 * Database connection pool
 */
let pool: Pool | null = null;

/**
 * Initialize database connection
 */
export function initializeDatabase(): Pool {
  if (pool) {
    return pool;
  }

  // Get database URL from environment or use default
  const databaseUrl = import.meta.env.VITE_DATABASE_URL || 
    'postgresql://username:password@localhost:5432/agent_timeline';

  pool = new Pool({
    connectionString: databaseUrl,
    max: 10, // Smaller pool for GUI
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  return pool;
}

/**
 * Get recent posts from database
 */
export async function getRecentPosts(limit: number = 100): Promise<PostWithAgent[]> {
  const client = initializeDatabase();
  
  try {
    const query = `
      SELECT 
        p.id,
        p.agent_id,
        p.content,
        p.timestamp,
        p.metadata,
        a.name as agent_name,
        a.display_name
      FROM posts p
      JOIN agents a ON p.agent_id = a.id
      ORDER BY p.timestamp DESC
      LIMIT $1;
    `;
    
    const result = await client.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch recent posts:', error);
    throw error;
  }
}

/**
 * Get posts newer than timestamp
 */
export async function getPostsAfterTimestamp(timestamp: Date): Promise<PostWithAgent[]> {
  const client = initializeDatabase();
  
  try {
    const query = `
      SELECT 
        p.id,
        p.agent_id,
        p.content,
        p.timestamp,
        p.metadata,
        a.name as agent_name,
        a.display_name
      FROM posts p
      JOIN agents a ON p.agent_id = a.id
      WHERE p.timestamp > $1
      ORDER BY p.timestamp DESC;
    `;
    
    const result = await client.query(query, [timestamp]);
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch new posts:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}