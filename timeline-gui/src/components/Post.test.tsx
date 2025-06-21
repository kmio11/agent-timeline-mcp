/**
 * Unit tests for Post component
 */

import { describe, it, expect, vi } from 'vitest';
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
    identity_key: 'testagent:working_on_tests',
    avatar_seed: 'test1234',
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

    // Check for compact styling class on Card component
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass('py-3');
  });

  it('should render without metadata section when showMetadata is false', () => {
    const postWithMetadata: PostWithAgent = {
      ...mockPost,
      metadata: { context: 'test' },
    };

    render(<Post post={postWithMetadata} showMetadata={false} />);

    expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
  });

  it('should use Card component structure', () => {
    const { container } = render(<Post post={mockPost} />);

    // Should have Card as root element
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();

    // Should have CardHeader
    const header = container.querySelector('[data-slot="card-header"]');
    expect(header).toBeInTheDocument();

    // Should have CardContent
    const content = container.querySelector('[data-slot="card-content"]');
    expect(content).toBeInTheDocument();
  });

  it('should handle agent click when onAgentClick is provided', () => {
    const onAgentClick = vi.fn();
    render(<Post post={mockPost} onAgentClick={onAgentClick} />);

    // Should have clickable container with proper cursor and tooltip
    const clickableContainer = screen.getByTitle(`Filter posts by ${mockPost.display_name}`);
    expect(clickableContainer).toHaveClass('cursor-pointer');

    // Click the agent badge area
    clickableContainer.click();
    expect(onAgentClick).toHaveBeenCalledTimes(1);
  });
});
