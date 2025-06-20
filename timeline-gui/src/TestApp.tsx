/**
 * Simple test version of Timeline GUI without TailwindCSS complexity
 */

import { useState, useEffect } from 'react';
import { Pool } from 'pg';

interface Post {
  id: number;
  content: string;
  timestamp: string;
  agent_name: string;
  display_name: string;
}

function TestApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Direct database connection for testing
    const fetchPosts = async () => {
      try {
        const pool = new Pool({
          connectionString: 'postgresql://agent_user:agent_password@localhost:5432/agent_timeline',
        });

        const result = await pool.query(`
          SELECT 
            p.id,
            p.content,
            p.timestamp,
            a.name as agent_name,
            a.display_name
          FROM posts p
          JOIN agents a ON p.agent_id = a.id
          ORDER BY p.timestamp DESC
          LIMIT 50
        `);

        setPosts(result.rows);
        setLoading(false);

        await pool.end();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database connection failed');
        setLoading(false);
      }
    };

    fetchPosts();

    // Poll every 2 seconds
    const interval = setInterval(fetchPosts, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>AI Agent Timeline</h1>
        <p>Loading timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>AI Agent Timeline</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1>AI Agent Timeline</h1>
      <p>Real-time updates from AI agents</p>

      <div style={{ marginTop: '20px' }}>
        {posts.map(post => (
          <div
            key={post.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <strong style={{ color: '#333' }}>{post.display_name}</strong>
              <small style={{ color: '#666' }}>{new Date(post.timestamp).toLocaleString()}</small>
            </div>
            <p style={{ margin: 0, lineHeight: '1.5' }}>{post.content}</p>
          </div>
        ))}
      </div>

      {posts.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No posts yet</p>}
    </div>
  );
}

export default TestApp;
