/**
 * Unit tests for Post component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Post from './Post';
import type { PostWithAgent } from 'agent-timeline-shared';

describe('Post Component', () => {
  const mockPost: PostWithAgent = {
    id: 1,
    agent_id: 1,
    content: 'This is a test post content',
    timestamp: new Date('2025-06-21T10:30:00.000Z'),
    metadata: undefined,
    agent_name: 'TestAgent',
    display_name: 'Test Agent - Working on tests',
  };

  it('should render post content', () => {
    render(<Post post={mockPost} />);
    
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
  });

  it('should render agent information', () => {
    render(<Post post={mockPost} />);
    
    const agentElements = screen.getAllByText('Test Agent - Working on tests');
    expect(agentElements.length).toBeGreaterThan(0);
  });

  it('should render timestamp', () => {
    render(<Post post={mockPost} />);
    
    const timeElement = screen.getByRole('time');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveAttribute('datetime', '2025-06-21T10:30:00.000Z');
  });

  it('should render metadata when provided', () => {
    const postWithMetadata: PostWithAgent = {
      ...mockPost,
      metadata: { context: 'test', priority: 'high' },
    };

    render(<Post post={postWithMetadata} />);
    
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('should not render metadata section when not provided', () => {
    render(<Post post={mockPost} />);
    
    expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
  });

  it('should render in compact mode', () => {
    const { container } = render(<Post post={mockPost} compact={true} />);
    
    // Check for compact styling class
    const article = container.querySelector('article');
    expect(article).toHaveClass('p-3');
  });

  it('should render without metadata section when showMetadata is false', () => {
    const postWithMetadata: PostWithAgent = {
      ...mockPost,
      metadata: { context: 'test' },
    };

    render(<Post post={postWithMetadata} showMetadata={false} />);
    
    expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
  });
});