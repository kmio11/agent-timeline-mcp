# Implementation Guide

## Code Quality Standards

### Development Rules
- **Zero Tolerance Policy**: No ESLint warnings or errors allowed in commits
- **Automatic Formatting**: All code must be formatted with Prettier
- **Pre-commit Checks**: All quality checks must pass before commit
- **TypeScript Strict Mode**: Full type safety required

### Required Tools
- **ESLint**: Static analysis and code quality
- **Prettier**: Consistent code formatting  
- **TypeScript**: Full type checking
- **Pre-commit Hooks**: Automated quality gates

### Commit Prerequisites
1. `pnpm lint` - Zero errors/warnings
2. `pnpm format` - Code properly formatted
3. `pnpm typecheck` - TypeScript compilation success
4. `pnpm test` - All tests passing
5. `pnpm check` - All quality gates passed

## Development Phases

### Phase 1: Project Setup
1. Initialize pnpm workspace
2. Set up TypeScript configuration
3. Create project structure
4. Install dependencies

### Phase 2: Database & Core MCP Server
1. Create SQLite database schema
2. Implement database operations
3. Set up session management
4. Implement MCP tools (sign_in, post_timeline, sign_out)

### Phase 3: React GUI Setup
1. Set up Vite + React + TypeScript
2. Configure TailwindCSS v4 and shadcn/ui
3. Implement Timeline and Post components
4. Add SQLite database polling
5. Implement agent identification UI

### Phase 4: Database Polling Integration
1. Implement SQLite read operations in GUI
2. Set up periodic polling (1-2 second intervals)
3. Handle database connection errors
4. Optimize polling queries for performance

### Phase 5: Integration & Testing
1. Connect all components
2. Test multi-agent scenarios
3. Add comprehensive error handling
4. Performance optimization
5. Documentation updates

## Development Commands

### Initial Setup
```bash
# Initialize workspace
pnpm init
echo 'packages:\n  - "mcp-server"\n  - "timeline-gui"\n  - "shared"' > pnpm-workspace.yaml

# Install global dev dependencies
pnpm add -D typescript @types/node eslint prettier

# Install ESLint and Prettier configs
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D eslint-config-prettier eslint-plugin-prettier

# Create package directories
mkdir -p mcp-server/src timeline-gui/src shared
```

### MCP Server Development
```bash
cd mcp-server
pnpm init
pnpm add @modelcontextprotocol/sdk sqlite3 ws
pnpm add -D @types/sqlite3 @types/ws tsx nodemon

# Add to package.json scripts:
# "dev": "nodemon --exec tsx src/index.ts"
# "build": "tsc"
```

### Timeline GUI Development
```bash
cd timeline-gui
pnpm create vite . --template react-ts
pnpm add @tailwindcss/vite tailwindcss@next
pnpm add lucide-react class-variance-authority clsx tailwind-merge
pnpm add sqlite3 better-sqlite3

# Set up shadcn/ui
npx shadcn-ui@latest init
```

### Development Workflow
```bash
# Start MCP server
pnpm --filter mcp-server dev

# Start GUI (in another terminal)
pnpm --filter timeline-gui dev

# Or run both in parallel
pnpm dev
```

### Code Quality Commands
```bash
# Lint all packages
pnpm lint

# Format all packages
pnpm format

# Type checking
pnpm typecheck

# Run all quality checks
pnpm check

# Pre-commit workflow (required before commit)
pnpm lint && pnpm format && pnpm typecheck && pnpm test
```

## Key Implementation Areas

### MCP Server Structure
- Main server setup with MCP TypeScript SDK
- Tool registration for sign_in, post_timeline, sign_out
- Session management and database integration
- Standard stdio communication protocol

### Database Polling Strategy
- Timeline GUI reads SQLite database directly
- Periodic polling every 1-2 seconds for near real-time updates
- Efficient queries to get new posts since last check
- Error handling with exponential backoff

### React Timeline Components
- Main Timeline component with polling hook
- Individual Post components with agent identification
- Loading states and error handling
- Responsive design with TailwindCSS v4

## Testing Strategy

### Unit Tests
- Database operations and schema validation
- MCP tool functions and session management
- Database polling logic and error handling
- React component rendering and user interactions

### Integration Tests
- MCP server with database
- Database polling and data consistency
- Full workflow: sign_in → post_timeline → GUI polling update

### Manual Testing
- Multiple agent sessions
- Database polling verification (1-2 second updates)
- Error handling scenarios (database connection issues)
- UI responsiveness with polling

## Deployment Considerations

### MCP Server
- Package as standalone Node.js application
- Include SQLite database in deployment
- Configure MCP stdio communication

### Timeline GUI
- Build static assets with Vite
- Serve from any web server
- Configure SQLite database path for polling

### Development vs Production
- Use different SQLite database paths
- Environment-specific polling intervals
- Logging levels and error handling
- Database file permissions and access