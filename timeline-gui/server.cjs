/**
 * Simple API server for Timeline GUI
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

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy' });
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
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Timeline API server running on http://localhost:${PORT}`);
});