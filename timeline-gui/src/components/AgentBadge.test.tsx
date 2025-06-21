import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AgentBadge from './AgentBadge';

describe('AgentBadge', () => {
  const defaultProps = {
    agentName: 'test-agent',
    displayName: 'Test Agent',
  };

  describe('Avatar Generation', () => {
    it('should render avatar with initials from display name', () => {
      render(<AgentBadge {...defaultProps} />);
      
      const avatar = screen.getByTitle('Test Agent (@test-agent)');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent('TA');
    });

    it('should generate initials from multi-word display name', () => {
      render(
        <AgentBadge
          agentName="claude-assistant"
          displayName="Claude AI Assistant Helper"
        />
      );
      
      const avatar = screen.getByTitle('Claude AI Assistant Helper (@claude-assistant)');
      expect(avatar).toHaveTextContent('CA'); // First two initials
    });

    it('should generate initials from single word display name', () => {
      render(
        <AgentBadge
          agentName="bot"
          displayName="Bot"
        />
      );
      
      const avatar = screen.getByTitle('Bot (@bot)');
      expect(avatar).toHaveTextContent('B');
    });

    it('should generate consistent colors for same agent name', () => {
      const { rerender } = render(<AgentBadge {...defaultProps} />);
      
      const firstAvatar = screen.getByTitle('Test Agent (@test-agent)');
      const firstColorClass = Array.from(firstAvatar.classList).find(cls => cls.startsWith('bg-'));
      
      rerender(<AgentBadge {...defaultProps} />);
      
      const secondAvatar = screen.getByTitle('Test Agent (@test-agent)');
      const secondColorClass = Array.from(secondAvatar.classList).find(cls => cls.startsWith('bg-'));
      
      expect(firstColorClass).toBe(secondColorClass);
    });

    it('should generate different colors for different agent names', () => {
      const { rerender } = render(<AgentBadge {...defaultProps} />);
      
      const firstAvatar = screen.getByTitle('Test Agent (@test-agent)');
      const firstColorClass = Array.from(firstAvatar.classList).find(cls => cls.startsWith('bg-'));
      
      rerender(
        <AgentBadge
          agentName="different-agent"
          displayName="Different Agent"
        />
      );
      
      const secondAvatar = screen.getByTitle('Different Agent (@different-agent)');
      const secondColorClass = Array.from(secondAvatar.classList).find(cls => cls.startsWith('bg-'));
      
      expect(firstColorClass).not.toBe(secondColorClass);
    });

    it('should apply ring styling to avatar', () => {
      render(<AgentBadge {...defaultProps} />);
      
      const avatar = screen.getByTitle('Test Agent (@test-agent)');
      expect(avatar).toHaveClass('ring-2', 'ring-white/20');
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      render(<AgentBadge {...defaultProps} size="sm" />);
      
      const avatar = screen.getByTitle('Test Agent (@test-agent)');
      expect(avatar).toHaveClass('w-8', 'h-8', 'text-xs');
    });

    it('should render medium size correctly (default)', () => {
      render(<AgentBadge {...defaultProps} />);
      
      const avatar = screen.getByTitle('Test Agent (@test-agent)');
      expect(avatar).toHaveClass('w-10', 'h-10', 'text-sm');
    });

    it('should render large size correctly', () => {
      render(<AgentBadge {...defaultProps} size="lg" />);
      
      const avatar = screen.getByTitle('Test Agent (@test-agent)');
      expect(avatar).toHaveClass('w-12', 'h-12', 'text-base');
    });
  });

  describe('Agent Information Display', () => {
    it('should display agent display name', () => {
      render(<AgentBadge {...defaultProps} />);
      
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });

    it('should display agent handle when different from display name', () => {
      render(<AgentBadge {...defaultProps} />);
      
      expect(screen.getByText('@test-agent')).toBeInTheDocument();
    });

    it('should not display handle when showHandle is false', () => {
      render(<AgentBadge {...defaultProps} showHandle={false} />);
      
      expect(screen.queryByText('@test-agent')).not.toBeInTheDocument();
    });

    it('should not display handle when display name equals agent name', () => {
      render(
        <AgentBadge
          agentName="test-agent"
          displayName="test-agent"
        />
      );
      
      expect(screen.queryByText('@test-agent')).not.toBeInTheDocument();
    });

    it('should convert spaces to underscores in handle', () => {
      render(
        <AgentBadge
          agentName="test agent with spaces"
          displayName="Test Agent"
        />
      );
      
      expect(screen.getByText('@test_agent_with_spaces')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide meaningful title for avatar', () => {
      render(<AgentBadge {...defaultProps} />);
      
      const avatar = screen.getByTitle('Test Agent (@test-agent)');
      expect(avatar).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<AgentBadge {...defaultProps} />);
      
      // Should have flex container with avatar and text content
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('flex', 'items-center');
      
      // Should have avatar element
      const avatar = screen.getByTitle('Test Agent (@test-agent)');
      expect(avatar).toHaveClass('rounded-full', 'flex', 'items-center', 'justify-center');
      
      // Should have text container
      const textContainer = avatar.nextElementSibling;
      expect(textContainer).toHaveClass('flex', 'flex-col');
    });
  });
});