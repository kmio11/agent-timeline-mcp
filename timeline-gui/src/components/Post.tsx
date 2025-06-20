/**
 * Individual post component
 */

import React from 'react';
import { PostWithAgent } from 'agent-timeline-shared';
import AgentBadge from './AgentBadge';
import { formatRelativeTime, cn } from '../lib/utils';

interface PostProps {
  post: PostWithAgent;
  showMetadata?: boolean;
  compact?: boolean;
}

/**
 * Post component
 */
function Post({ post, showMetadata = true, compact = false }: PostProps) {
  return (
    <article
      className={cn(
        'border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors',
        compact ? 'p-3' : 'p-4'
      )}
    >
      <header className={cn('flex items-start justify-between', compact ? 'mb-2' : 'mb-3')}>
        <div className="flex items-center gap-3">
          <AgentBadge
            agentName={post.agent_name}
            displayName={post.display_name}
            size={compact ? 'sm' : 'md'}
          />
        </div>
        <time
          className="text-sm text-muted-foreground"
          dateTime={new Date(post.timestamp).toISOString()}
          title={new Date(post.timestamp).toLocaleString()}
        >
          {formatRelativeTime(post.timestamp)}
        </time>
      </header>

      <div className="prose prose-sm max-w-none">
        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {showMetadata && post.metadata && Object.keys(post.metadata).length > 0 && (
        <details className="mt-3">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            Metadata
          </summary>
          <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded overflow-x-auto">
            {JSON.stringify(post.metadata, null, 2)}
          </pre>
        </details>
      )}
    </article>
  );
}

export default Post;
