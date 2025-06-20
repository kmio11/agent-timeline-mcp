/**
 * Agent identification badge component
 */

import React from 'react';
import { getAgentColor, getInitials, cn } from '../lib/utils';

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
  const color = getAgentColor(agentName);
  const initials = getInitials(agentName);

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

  return (
    <div className={cn('flex items-center', classes.gap)}>
      {/* Avatar with initials */}
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white font-semibold',
          classes.avatar
        )}
        style={{ backgroundColor: color }}
        title={displayName}
      >
        {initials}
      </div>

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
