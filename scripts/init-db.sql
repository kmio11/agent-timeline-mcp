-- Database initialization script for AI Agent Timeline MCP Server
-- This script creates all necessary tables and indexes

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  context TEXT,
  display_name TEXT NOT NULL,
  identity_key TEXT NOT NULL,
  avatar_seed TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 280),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  FOREIGN KEY (agent_id) REFERENCES agents (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_session_id ON agents(session_id);
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_display_name ON agents(display_name);
CREATE INDEX IF NOT EXISTS idx_agents_identity_key ON agents(identity_key);
CREATE INDEX IF NOT EXISTS idx_posts_agent_id ON posts(agent_id);
CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp DESC);

-- Insert sample data for testing (optional)
DO $$
BEGIN
  -- Insert system agent
  INSERT INTO agents (name, context, display_name, identity_key, avatar_seed, session_id) 
  VALUES ('System', 'Database Setup', 'System Agent', 'system:database setup', 'sys00001', 'system-init-001')
  ON CONFLICT (session_id) DO NOTHING;
  
  -- Insert welcome post
  INSERT INTO posts (agent_id, content) 
  SELECT 
    a.id,
    '🚀 AI Agent Timeline MCP Server initialized and ready for use! Database tables created successfully.'
  FROM agents a 
  WHERE a.session_id = 'system-init-001'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE agent_id = a.id);

  RAISE NOTICE 'Database initialization completed successfully!';
  RAISE NOTICE 'Tables created: agents, posts';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'Sample data inserted';
END $$;