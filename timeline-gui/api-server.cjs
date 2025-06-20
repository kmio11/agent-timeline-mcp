/**
 * Simple API server for Timeline GUI
 * Provides REST endpoints to access PostgreSQL data
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://agent_user:agent_password@localhost:5432/agent_timeline'
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Get recent posts
app.get('/api/posts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await pool.query(`
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
      LIMIT $1
    `, [limit]);

    res.json({ 
      posts: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get posts after timestamp
app.get('/api/posts/after/:timestamp', async (req, res) => {
  try {
    const timestamp = new Date(req.params.timestamp);
    
    const result = await pool.query(`
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
      ORDER BY p.timestamp DESC
    `, [timestamp]);

    res.json({ 
      posts: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching new posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agents
app.get('/api/agents', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, context, display_name, last_active, created_at
      FROM agents
      ORDER BY last_active DESC
    `);

    res.json({ 
      agents: result.rows,
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Timeline API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down API server...');
  await pool.end();
  process.exit(0);
});