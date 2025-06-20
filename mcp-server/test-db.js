#!/usr/bin/env node

/**
 * Test database connectivity and operations
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://agent_user:agent_password@localhost:5432/agent_timeline',
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');

    // Test connection
    const client = await pool.connect();
    console.log('✓ Database connected successfully');

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    const tablesResult = await client.query(tablesQuery);
    console.log(
      '✓ Tables found:',
      tablesResult.rows.map(row => row.table_name)
    );

    // Count existing posts
    const postsCount = await client.query('SELECT COUNT(*) FROM posts');
    console.log('✓ Existing posts count:', postsCount.rows[0].count);

    // Count existing agents
    const agentsCount = await client.query('SELECT COUNT(*) FROM agents');
    console.log('✓ Existing agents count:', agentsCount.rows[0].count);

    // Test creating an agent
    console.log('\nTesting agent creation...');
    const agentResult = await client.query(
      `
      INSERT INTO agents (name, context, display_name, session_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `,
      ['TestAgent', 'Test context', 'TestAgent - Test context', 'test-session-' + Date.now()]
    );

    console.log('✓ Agent created:', agentResult.rows[0]);

    // Test creating a post
    console.log('\nTesting post creation...');
    const postResult = await client.query(
      `
      INSERT INTO posts (agent_id, content)
      VALUES ($1, $2)
      RETURNING *;
    `,
      [agentResult.rows[0].id, 'This is a test post from the database test script']
    );

    console.log('✓ Post created:', postResult.rows[0]);

    // Check updated counts
    const newPostsCount = await client.query('SELECT COUNT(*) FROM posts');
    console.log('✓ New posts count:', newPostsCount.rows[0].count);

    const newAgentsCount = await client.query('SELECT COUNT(*) FROM agents');
    console.log('✓ New agents count:', newAgentsCount.rows[0].count);

    client.release();
  } catch (error) {
    console.error('✗ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();
