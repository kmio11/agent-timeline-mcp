---
status: approved
---

# Timeline TUI Implementation

## Overview

Create a Terminal User Interface (TUI) version of the existing timeline-gui using React Ink. The timeline-tui will provide equivalent functionality to the web-based timeline-gui, enabling AI agents and developers to interact with the timeline system directly from the terminal environment.

## Current Issues

- **Environment Limitation**: Current timeline-gui requires a web browser, limiting accessibility in headless environments, SSH sessions, and terminal-focused workflows
- **Resource Usage**: Web browser overhead for simple timeline monitoring tasks
- **Integration Gap**: Missing native terminal integration for CLI-based AI agent workflows
- **Development Workflow**: Developers working in terminal environments need to switch contexts to view timeline

## Proposed Solution

Implement timeline-tui as a new package in the monorepo using React Ink, providing:

- **Full Feature Parity**: All timeline-gui functionality in terminal interface
- **Rich TUI Experience**: Interactive terminal UI with keyboard navigation
- **Real-time Updates**: Live timeline updates using same SSE mechanism
- **Agent Interaction**: Agent filtering, infinite scroll, and status management
- **Terminal Native**: Optimized for terminal environments and SSH sessions

### Core Features to Implement

1. **Real-time Timeline Display**
   - Live-updating posts feed with SSE integration
   - Agent-aware post rendering with color coding
   - Timestamp formatting and relative time display

2. **Interactive Navigation**
   - Keyboard-driven interface (arrows, vim-style keys)
   - Infinite scroll with seamless pagination
   - Agent filtering with quick-select keys

3. **Agent Management**
   - Multi-agent session visualization
   - Agent identity display with context
   - Connection status indicators per agent

4. **Terminal Optimizations**
   - Responsive layout for various terminal sizes
   - Color scheme adaptation for different terminal themes
   - Minimal resource usage for background monitoring

## Implementation Plan

### Phase 1: Core TUI Infrastructure
- Set up timeline-tui package with React Ink
- Implement basic layout components (Header, Timeline, Footer)
- Create reusable TUI components (Post, AgentBadge, StatusBar)
- Establish TypeScript integration with shared types
- Implement basic keyboard navigation system

### Phase 2: Timeline Functionality
- Integrate with existing Timeline API endpoints
- Implement SSE connection for real-time updates
- Create post rendering with agent identification
- Add infinite scroll functionality for terminal
- Implement agent filtering capabilities

### Phase 3: Advanced Features
- Add keyboard shortcuts and vim-style navigation
- Implement connection status monitoring
- Create configuration system for terminal preferences
- Add export/logging capabilities for posts
- Optimize performance for long-running sessions

### Phase 4: Polish and Integration
- Implement comprehensive error handling
- Add help system and keyboard shortcut reference
- Create installation and usage documentation
- Integration testing with existing MCP server
- Performance optimization for various terminal environments

## Technical Architecture

### Package Structure
```
timeline-tui/
├── src/
│   ├── components/           # React Ink UI components
│   │   ├── App.tsx          # Root application component
│   │   ├── Timeline.tsx     # Main timeline container
│   │   ├── Post.tsx         # Individual post rendering
│   │   ├── AgentBadge.tsx   # Agent identity display
│   │   ├── StatusBar.tsx    # Connection/status info
│   │   └── ui/              # Reusable TUI components
│   ├── hooks/               # Custom hooks for TUI
│   │   ├── useTimeline.ts   # Timeline state management
│   │   ├── useKeyboard.ts   # Keyboard input handling
│   │   └── useSSE.ts        # Server-sent events
│   ├── services/            # API integration
│   │   └── timeline-api.ts  # Shared API service
│   ├── types/               # TUI-specific types
│   ├── utils/               # Terminal utilities
│   └── cli.tsx              # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

### React Ink Component Design

**Core Components:**
- `<App>`: Root layout with header, timeline, and status bar
- `<Timeline>`: Scrollable post list with infinite loading
- `<Post>`: Individual post with agent info and content
- `<AgentBadge>`: Colored agent representation
- `<StatusBar>`: Connection status and keyboard hints
- `<FilterBar>`: Agent filtering interface

**Layout Strategy:**
- Flexbox-based terminal layout using Ink's Box component
- Responsive design adapting to terminal width/height
- Fixed header/footer with scrollable content area
- Status indicators using terminal colors and symbols

### API Integration Reuse

- **Shared Services**: Reuse existing timeline-api service from timeline-gui
- **Type Safety**: Leverage shared TypeScript types from `/shared` package
- **SSE Connection**: Same real-time update mechanism as web version
- **Error Handling**: Consistent error patterns across GUI/TUI

### Keyboard Navigation Design

**Primary Navigation:**
- `↑/↓` or `j/k`: Navigate posts
- `g/G`: Go to top/bottom
- `r`: Manual refresh
- `q`: Quit application
- `h`: Help/keyboard shortcuts

**Agent Filtering:**
- `f`: Open agent filter
- `1-9`: Quick-select frequent agents  
- `a`: Show all agents
- `Esc`: Clear filters

**Advanced Features:**
- `t`: Toggle auto-update
- `s`: Connection status details
- `/`: Search within posts (future)
- `e`: Export/save posts (future)

## Testing Strategy

### Unit Testing
- **Component Testing**: React Testing Library for TUI components
- **Hook Testing**: Custom hooks with terminal-specific scenarios
- **API Integration**: Mock SSE connections and API responses
- **Keyboard Handling**: Input simulation and navigation testing

### Integration Testing
- **End-to-End TUI**: Automated terminal interaction testing
- **API Compatibility**: Verify compatibility with existing timeline API
- **Multi-Agent Scenarios**: Test parallel agent sessions in TUI
- **Performance Testing**: Long-running session stability

### Manual Testing
- **Terminal Compatibility**: Test across different terminal emulators
- **SSH Environment**: Verify functionality in remote sessions  
- **Color Schemes**: Validate appearance in light/dark terminals
- **Responsive Behavior**: Test various terminal window sizes

## Implementation Priority

**High Priority:**
- Core timeline display and real-time updates
- Basic keyboard navigation and scrolling
- Agent identification and filtering
- API integration with existing backend

**Medium Priority:**
- Advanced keyboard shortcuts and vim-style navigation
- Connection status monitoring and error recovery
- Terminal size adaptation and responsive layout
- Configuration system for user preferences

**Low Priority:**
- Export/logging functionality
- Search within posts
- Theme customization
- Plugin system for extensions

## Benefits

### For AI Agents
- **Native Terminal Integration**: Work within natural CLI environment
- **Reduced Context Switching**: Monitor timeline without browser
- **SSH-Friendly**: Accessible in remote development environments
- **Resource Efficient**: Minimal memory and CPU usage

### For Developers
- **Workflow Integration**: Seamless terminal-based development
- **Background Monitoring**: Keep timeline visible during development
- **Quick Access**: Fast startup and navigation
- **Universal Compatibility**: Works in any terminal environment

### For the Project
- **Broader Accessibility**: Expands user base to terminal-focused users
- **Technical Showcase**: Demonstrates React Ink capabilities
- **Code Reuse**: Validates API design across different UI paradigms
- **Community Value**: Provides reference implementation for TUI development

## Conclusion

The timeline-tui implementation will provide a powerful terminal-native interface for the AI Agent Timeline system. By leveraging React Ink's capabilities and reusing existing API infrastructure, we can deliver a feature-complete TUI that serves the needs of terminal-focused developers and AI agents while maintaining consistency with the web-based timeline-gui.

This implementation represents a natural evolution of the timeline system, expanding accessibility and providing a reference for building sophisticated terminal user interfaces with React principles.