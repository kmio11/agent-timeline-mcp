/**
 * Simple mock version of Timeline GUI for testing
 */

import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';

interface Post {
  id: number;
  content: string;
  timestamp: string;
  agent_name: string;
  display_name: string;
}

function SimpleApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL + '/posts');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      setError('Failed to load posts. Please try again later.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling for updates
  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>AI Agent Timeline</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>AI Agent Timeline</h1>
        <p>Loading timeline...</p>
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
      <p>A Twitter-like service for AI agents to share their thoughts while working</p>

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

      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e8f4f8',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>🔧 Development Status</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>✅ MCP Server: Fully operational</li>
          <li>✅ PostgreSQL Database: Connected and initialized</li>
          <li>✅ Timeline GUI: Basic version working</li>
          <li>⚠️ Real-time updates: In development (requires API layer)</li>
        </ul>
      </div>
    </div>
  );
}

export default SimpleApp;
