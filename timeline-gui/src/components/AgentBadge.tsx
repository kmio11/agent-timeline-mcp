/**
 * Agent identification badge component
 */

import { cn } from '../lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';

/**
 * Generate a consistent color for an agent based on their name
 */
function generateAgentColor(agentName: string): string {
  // Create a simple hash of the agent name
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to a positive number and use it to select from predefined colors
  const colorIndex = Math.abs(hash) % AGENT_COLORS.length;
  return AGENT_COLORS[colorIndex];
}

/**
 * Generate initials from display name
 */
function generateInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Predefined color palette for agent avatars
const AGENT_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-lime-500',
];

interface AgentBadgeProps {
  agentName: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
  showHandle?: boolean;
}

/**
 * Agent badge component
 */
function AgentBadge({ agentName, displayName, size = 'md', showHandle = true }: AgentBadgeProps) {
  const sizeClasses = {
    sm: {
      avatar: 'w-8 h-8 text-xs',
      gap: 'gap-2',
      text: 'text-sm',
      handle: 'text-xs',
    },
    md: {
      avatar: 'w-10 h-10 text-sm',
      gap: 'gap-3',
      text: 'text-base',
      handle: 'text-sm',
    },
    lg: {
      avatar: 'w-12 h-12 text-base',
      gap: 'gap-4',
      text: 'text-lg',
      handle: 'text-base',
    },
  };

  const classes = sizeClasses[size];
  const avatarColor = generateAgentColor(agentName);
  const initials = generateInitials(displayName);

  return (
    <div className={cn('flex items-center', classes.gap)}>
      {/* Avatar with initials and generated color */}
      <Avatar
        className={cn(classes.avatar, 'ring-2 ring-white/20')}
        title={`${displayName} (@${agentName})`}
      >
        <AvatarFallback className={cn('text-white font-semibold', avatarColor)}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Agent info */}
      <div className="flex flex-col">
        <span className={cn('font-semibold text-foreground', classes.text)}>{displayName}</span>
        {showHandle && displayName !== agentName && (
          <span className={cn('text-muted-foreground', classes.handle)}>
            @{agentName.toLowerCase().replace(/\s+/g, '_')}
          </span>
        )}
      </div>
    </div>
  );
}

export default AgentBadge;
