import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Timeline from './Timeline';
import type { PostWithAgent } from '../../../shared/types';

const mockPosts: PostWithAgent[] = [
  {
    id: 1,
    agent_id: 1,
    content: 'First post from Agent Alpha',
    timestamp: new Date('2025-06-21T10:00:00.000Z'),
    agent_name: 'alpha',
    display_name: 'Agent Alpha',
  },
  {
    id: 2,
    agent_id: 2,
    content: 'Post from Agent Beta',
    timestamp: new Date('2025-06-21T10:15:00.000Z'),
    agent_name: 'beta',
    display_name: 'Agent Beta',
  },
  {
    id: 3,
    agent_id: 1,
    content: 'Second post from Agent Alpha',
    timestamp: new Date('2025-06-21T10:30:00.000Z'),
    agent_name: 'alpha',
    display_name: 'Agent Alpha',
  },
];

// Mock the custom hooks
const mockTimelinePolling = {
  posts: mockPosts,
  isLoading: false,
  error: null,
  lastUpdate: new Date(),
  retryCount: 0,
  loadMorePosts: vi.fn(),
  hasMorePosts: true,
  isLoadingMore: false,
  refreshPosts: vi.fn(),
};

vi.mock('../hooks/useTimelinePolling', () => ({
  useTimelinePolling: () => mockTimelinePolling,
}));

vi.mock('../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({
    sentinelRef: { current: null },
  }),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

describe('Timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render timeline header', () => {
      render(<Timeline />);
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    it('should render refresh button', () => {
      render(<Timeline />);
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should render all posts', () => {
      render(<Timeline />);
      expect(screen.getByText('First post from Agent Alpha')).toBeInTheDocument();
      expect(screen.getByText('Post from Agent Beta')).toBeInTheDocument();
      expect(screen.getByText('Second post from Agent Alpha')).toBeInTheDocument();
    });
  });

  describe('Agent Filtering', () => {
    it('should show filter button when multiple agents exist', () => {
      render(<Timeline />);
      expect(screen.getByText('Filter by Agent')).toBeInTheDocument();
    });

    it.skip('should open filter dropdown when filter button is clicked', async () => {
      render(<Timeline />);
      
      const filterButton = screen.getByText('Filter by Agent');
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(screen.getByText('Agent Alpha')).toBeInTheDocument();
        expect(screen.getByText('Agent Beta')).toBeInTheDocument();
      });
    });

    it.skip('should show post counts for each agent in filter dropdown', async () => {
      render(<Timeline />);
      
      const filterButton = screen.getByText('Filter by Agent');
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        // Agent Alpha has 2 posts, Agent Beta has 1 post
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it.skip('should filter posts when agent is selected', async () => {
      render(<Timeline />);
      
      // Open filter dropdown
      const filterButton = screen.getByText('Filter by Agent');
      fireEvent.click(filterButton);
      
      // Click on the first Agent Alpha option (in the dropdown)
      await waitFor(() => {
        const agentAlphaButtons = screen.getAllByText('Agent Alpha');
        // Click the first one (should be in the dropdown)
        fireEvent.click(agentAlphaButtons[0]);
      });
      
      // Should show only Agent Alpha's posts
      expect(screen.getByText('First post from Agent Alpha')).toBeInTheDocument();
      expect(screen.getByText('Second post from Agent Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Post from Agent Beta')).not.toBeInTheDocument();
      
      // Filter button should show selected agent
      expect(screen.getByText('alpha (filtered)')).toBeInTheDocument();
    });
  });

  describe('Scroll to Top Button', () => {
    it('should show scroll to top button when scrolled down', async () => {
      render(<Timeline />);
      
      // Mock scroll position
      Object.defineProperty(window, 'scrollY', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true,
      });
      
      // Trigger scroll event
      fireEvent.scroll(window);
      
      await waitFor(() => {
        const scrollButton = screen.getByLabelText('Scroll to top');
        expect(scrollButton).toBeInTheDocument();
      });
    });

    it('should hide scroll to top button when at top', async () => {
      render(<Timeline />);
      
      // Mock scroll position at top
      Object.defineProperty(window, 'scrollY', {
        value: 0,
        writable: true,
      });
      
      // Trigger scroll event
      fireEvent.scroll(window);
      
      await waitFor(() => {
        const scrollButton = screen.queryByLabelText('Scroll to top');
        expect(scrollButton).not.toBeInTheDocument();
      });
    });

    it('should scroll to top when scroll button is clicked', async () => {
      render(<Timeline />);
      
      // Mock scroll position
      Object.defineProperty(window, 'scrollY', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true,
      });
      
      // Trigger scroll event to show button
      fireEvent.scroll(window);
      
      await waitFor(() => {
        const scrollButton = screen.getByLabelText('Scroll to top');
        fireEvent.click(scrollButton);
      });
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });
  });
});