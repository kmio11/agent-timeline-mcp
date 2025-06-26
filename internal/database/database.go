package database

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strconv"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Post represents a timeline post with associated agent information
type Post struct {
	ID          int             `json:"id"`
	AgentID     int             `json:"agent_id"`
	Content     string          `json:"content"`
	Timestamp   time.Time       `json:"timestamp"`
	Metadata    json.RawMessage `json:"metadata"`
	AgentName   string          `json:"agent_name"`
	DisplayName string          `json:"display_name"`
	IdentityKey string          `json:"identity_key"`
	AvatarSeed  string          `json:"avatar_seed"`
}

// NotificationPayload represents the data sent via PostgreSQL NOTIFY
type NotificationPayload struct {
	Timestamp time.Time `json:"timestamp"`
	Operation string    `json:"operation"`
	Table     string    `json:"table"`
	PostID    int       `json:"post_id"`
	AgentID   int       `json:"agent_id"`
	Content   string    `json:"content"`
}

// NotificationHandler handles incoming PostgreSQL notifications
type NotificationHandler func(payload *NotificationPayload) error

// Agent represents an agent record from the database
type Agent struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Context     *string   `json:"context"`
	DisplayName string    `json:"display_name"`
	IdentityKey string    `json:"identity_key"`
	AvatarSeed  string    `json:"avatar_seed"`
	SessionID   *string   `json:"session_id"`
	LastActive  time.Time `json:"last_active"`
	CreatedAt   time.Time `json:"created_at"`
}

// CreateAgentParams represents parameters for creating a new agent
type CreateAgentParams struct {
	Name        string  `json:"name"`
	Context     *string `json:"context"`
	DisplayName string  `json:"display_name"`
	IdentityKey string  `json:"identity_key"`
	AvatarSeed  string  `json:"avatar_seed"`
	SessionID   string  `json:"session_id"`
}

// CreatePostParams represents parameters for creating a new post
type CreatePostParams struct {
	AgentID  int             `json:"agent_id"`
	Content  string          `json:"content"`
	Metadata json.RawMessage `json:"metadata"`
}

// Database manages PostgreSQL database connections and operations
type Database struct {
	pool             *pgxpool.Pool
	notifyConn       *pgx.Conn
	notifyHandlers   map[string][]NotificationHandler
	notifyCancel     context.CancelFunc
	notifyDone       chan struct{}
	notifyMutex      sync.RWMutex
}

// NewDatabase creates a new Database instance with a connection pool
func NewDatabase(ctx context.Context, databaseURL string) (*Database, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	db := &Database{
		pool:           pool,
		notifyHandlers: make(map[string][]NotificationHandler),
		notifyDone:     make(chan struct{}),
	}

	// Create dedicated connection for notifications
	notifyConn, err := pgx.Connect(ctx, databaseURL)
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to create notification connection: %w", err)
	}
	db.notifyConn = notifyConn

	return db, nil
}

// Close closes the database connection pool
func (db *Database) Close() {
	db.StopNotifications()
	
	if db.notifyConn != nil {
		db.notifyConn.Close(context.Background())
	}
	
	if db.pool != nil {
		db.pool.Close()
	}
}

// Ping checks if the database connection is alive
func (db *Database) Ping(ctx context.Context) error {
	return db.pool.Ping(ctx)
}

// GetPosts retrieves posts from the database with optional filtering
func (db *Database) GetPosts(ctx context.Context, limit int, after *time.Time) ([]Post, error) {
	var query string
	var args []any

	if after != nil {
		query = `
			SELECT 
				p.id,
				p.agent_id,
				p.content,
				p.timestamp,
				p.metadata,
				a.name as agent_name,
				a.display_name,
				a.identity_key,
				a.avatar_seed
			FROM posts p
			JOIN agents a ON p.agent_id = a.id
			WHERE p.timestamp > $1
			ORDER BY p.timestamp DESC
			LIMIT $2`
		args = []any{*after, limit}
	} else {
		query = `
			SELECT 
				p.id,
				p.agent_id,
				p.content,
				p.timestamp,
				p.metadata,
				a.name as agent_name,
				a.display_name,
				a.identity_key,
				a.avatar_seed
			FROM posts p
			JOIN agents a ON p.agent_id = a.id
			ORDER BY p.timestamp DESC
			LIMIT $1`
		args = []any{limit}
	}

	rows, err := db.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post

	for rows.Next() {
		var post Post
		err := rows.Scan(
			&post.ID,
			&post.AgentID,
			&post.Content,
			&post.Timestamp,
			&post.Metadata,
			&post.AgentName,
			&post.DisplayName,
			&post.IdentityKey,
			&post.AvatarSeed,
		)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

// ParseTimeFilter parses a time string in RFC3339 format
func ParseTimeFilter(timeStr string) (*time.Time, error) {
	if timeStr == "" {
		return nil, nil
	}
	
	t, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		return nil, err
	}
	
	return &t, nil
}

// ParseLimit parses a limit string and returns a valid integer
func ParseLimit(limitStr string, defaultLimit int) int {
	if limitStr == "" {
		return defaultLimit
	}
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		return defaultLimit
	}
	
	return limit
}

// StartNotifications begins listening for PostgreSQL notifications
func (db *Database) StartNotifications(ctx context.Context) error {
	if db.notifyConn == nil {
		return fmt.Errorf("notification connection not initialized")
	}

	// Start listening to the timeline_posts channel
	_, err := db.notifyConn.Exec(ctx, "LISTEN timeline_posts")
	if err != nil {
		return fmt.Errorf("failed to start listening: %w", err)
	}

	// Create cancellable context for notification loop
	notifyCtx, cancel := context.WithCancel(ctx)
	db.notifyCancel = cancel

	go db.notificationLoop(notifyCtx)
	
	slog.Info("PostgreSQL LISTEN/NOTIFY started", "channel", "timeline_posts")
	return nil
}

// StopNotifications stops the notification listener
func (db *Database) StopNotifications() {
	if db.notifyCancel != nil {
		db.notifyCancel()
		<-db.notifyDone // Wait for notification loop to finish
	}
}

// AddNotificationHandler adds a handler for notifications on a specific channel
func (db *Database) AddNotificationHandler(channel string, handler NotificationHandler) {
	db.notifyMutex.Lock()
	defer db.notifyMutex.Unlock()
	db.notifyHandlers[channel] = append(db.notifyHandlers[channel], handler)
}

// notificationLoop handles incoming PostgreSQL notifications
func (db *Database) notificationLoop(ctx context.Context) {
	defer close(db.notifyDone)
	
	for {
		select {
		case <-ctx.Done():
			slog.Info("Notification loop stopping")
			return
		default:
			// Wait for notifications with timeout
			notification, err := db.notifyConn.WaitForNotification(ctx)
			if err != nil {
				if ctx.Err() != nil {
					// Context cancelled, exit gracefully
					return
				}
				slog.Error("Error waiting for notification", "error", err)
				continue
			}

			// Parse the notification payload
			var payload NotificationPayload
			if err := json.Unmarshal([]byte(notification.Payload), &payload); err != nil {
				slog.Error("Error parsing notification payload", "error", err, "payload", notification.Payload)
				continue
			}

			// Call handlers for this channel
			db.notifyMutex.RLock()
			handlers := db.notifyHandlers[notification.Channel]
			db.notifyMutex.RUnlock()
			
			for _, handler := range handlers {
				if err := handler(&payload); err != nil {
					slog.Error("Error in notification handler", "error", err, "channel", notification.Channel, "post_id", payload.PostID)
				}
			}
		}
	}
}

// CreateTables creates the necessary database tables and indexes
func (db *Database) CreateTables(ctx context.Context) error {
	// Create agents table
	agentsTable := `
		CREATE TABLE IF NOT EXISTS agents (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			context TEXT,
			display_name VARCHAR(255) NOT NULL,
			identity_key VARCHAR(255) NOT NULL,
			avatar_seed VARCHAR(255) NOT NULL,
			session_id VARCHAR(255) UNIQUE,
			last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_agents_session_id ON agents(session_id);
		CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
		CREATE INDEX IF NOT EXISTS idx_agents_display_name ON agents(display_name);
		CREATE INDEX IF NOT EXISTS idx_agents_identity_key ON agents(identity_key);
	`

	if _, err := db.pool.Exec(ctx, agentsTable); err != nil {
		return fmt.Errorf("failed to create agents table: %w", err)
	}

	// Create posts table
	postsTable := `
		CREATE TABLE IF NOT EXISTS posts (
			id SERIAL PRIMARY KEY,
			agent_id INTEGER NOT NULL REFERENCES agents(id),
			content TEXT NOT NULL CHECK (char_length(content) <= 280),
			timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			metadata JSONB DEFAULT '{}'
		);
		CREATE INDEX IF NOT EXISTS idx_posts_agent_id ON posts(agent_id);
		CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp DESC);
	`

	if _, err := db.pool.Exec(ctx, postsTable); err != nil {
		return fmt.Errorf("failed to create posts table: %w", err)
	}

	// Create notification trigger function
	triggerFunction := `
		CREATE OR REPLACE FUNCTION notify_timeline_posts()
		RETURNS TRIGGER AS $$
		BEGIN
			PERFORM pg_notify('timeline_posts', 
				json_build_object(
					'timestamp', EXTRACT(EPOCH FROM NEW.timestamp),
					'operation', TG_OP,
					'table', TG_TABLE_NAME,
					'post_id', NEW.id,
					'agent_id', NEW.agent_id,
					'content', NEW.content
				)::text
			);
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;
	`

	if _, err := db.pool.Exec(ctx, triggerFunction); err != nil {
		return fmt.Errorf("failed to create trigger function: %w", err)
	}

	// Create trigger
	trigger := `
		DROP TRIGGER IF EXISTS timeline_posts_notify ON posts;
		CREATE TRIGGER timeline_posts_notify
			AFTER INSERT ON posts
			FOR EACH ROW EXECUTE FUNCTION notify_timeline_posts();
	`

	if _, err := db.pool.Exec(ctx, trigger); err != nil {
		return fmt.Errorf("failed to create trigger: %w", err)
	}

	return nil
}

// ExecuteQuery executes a generic query with parameters and returns typed results
func (db *Database) ExecuteQuery(ctx context.Context, query string, args ...any) (pgx.Rows, error) {
	return db.pool.Query(ctx, query, args...)
}

// CreateAgent creates a new agent record
func (db *Database) CreateAgent(ctx context.Context, params CreateAgentParams) (*Agent, error) {
	query := `
		INSERT INTO agents (name, context, display_name, identity_key, avatar_seed, session_id, last_active)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
		RETURNING id, name, context, display_name, identity_key, avatar_seed, session_id, last_active, created_at
	`

	var agent Agent
	err := db.pool.QueryRow(ctx, query,
		params.Name,
		params.Context,
		params.DisplayName,
		params.IdentityKey,
		params.AvatarSeed,
		params.SessionID,
	).Scan(
		&agent.ID,
		&agent.Name,
		&agent.Context,
		&agent.DisplayName,
		&agent.IdentityKey,
		&agent.AvatarSeed,
		&agent.SessionID,
		&agent.LastActive,
		&agent.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create agent: %w", err)
	}

	return &agent, nil
}

// GetAgentBySessionID retrieves an agent by session ID
func (db *Database) GetAgentBySessionID(ctx context.Context, sessionID string) (*Agent, error) {
	query := `
		SELECT id, name, context, display_name, identity_key, avatar_seed, session_id, last_active, created_at
		FROM agents
		WHERE session_id = $1
	`

	var agent Agent
	err := db.pool.QueryRow(ctx, query, sessionID).Scan(
		&agent.ID,
		&agent.Name,
		&agent.Context,
		&agent.DisplayName,
		&agent.IdentityKey,
		&agent.AvatarSeed,
		&agent.SessionID,
		&agent.LastActive,
		&agent.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get agent by session ID: %w", err)
	}

	return &agent, nil
}

// GetAgentByIdentityKey retrieves the most recent agent by identity key
func (db *Database) GetAgentByIdentityKey(ctx context.Context, identityKey string) (*Agent, error) {
	query := `
		SELECT id, name, context, display_name, identity_key, avatar_seed, session_id, last_active, created_at
		FROM agents
		WHERE identity_key = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	var agent Agent
	err := db.pool.QueryRow(ctx, query, identityKey).Scan(
		&agent.ID,
		&agent.Name,
		&agent.Context,
		&agent.DisplayName,
		&agent.IdentityKey,
		&agent.AvatarSeed,
		&agent.SessionID,
		&agent.LastActive,
		&agent.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get agent by identity key: %w", err)
	}

	return &agent, nil
}

// UpdateAgentSessionID updates an agent's session ID and last active timestamp
func (db *Database) UpdateAgentSessionID(ctx context.Context, agentID int, sessionID string) error {
	query := `
		UPDATE agents
		SET session_id = $1, last_active = CURRENT_TIMESTAMP
		WHERE id = $2
	`

	_, err := db.pool.Exec(ctx, query, sessionID, agentID)
	if err != nil {
		return fmt.Errorf("failed to update agent session ID: %w", err)
	}

	return nil
}

// UpdateAgentLastActive updates an agent's last active timestamp
func (db *Database) UpdateAgentLastActive(ctx context.Context, sessionID string) error {
	query := `
		UPDATE agents
		SET last_active = CURRENT_TIMESTAMP
		WHERE session_id = $1
	`

	_, err := db.pool.Exec(ctx, query, sessionID)
	if err != nil {
		return fmt.Errorf("failed to update agent last active: %w", err)
	}

	return nil
}

// CreatePost creates a new timeline post
func (db *Database) CreatePost(ctx context.Context, params CreatePostParams) (*Post, error) {
	// Validate content length
	if len(params.Content) > 280 {
		return nil, fmt.Errorf("content exceeds 280 character limit")
	}

	if params.Metadata == nil {
		params.Metadata = json.RawMessage("{}")
	}

	query := `
		INSERT INTO posts (agent_id, content, metadata)
		VALUES ($1, $2, $3)
		RETURNING id, agent_id, content, timestamp, metadata
	`

	var post Post
	err := db.pool.QueryRow(ctx, query,
		params.AgentID,
		params.Content,
		params.Metadata,
	).Scan(
		&post.ID,
		&post.AgentID,
		&post.Content,
		&post.Timestamp,
		&post.Metadata,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	// Get agent information for the post
	agentQuery := `
		SELECT name, display_name, identity_key, avatar_seed
		FROM agents
		WHERE id = $1
	`

	err = db.pool.QueryRow(ctx, agentQuery, post.AgentID).Scan(
		&post.AgentName,
		&post.DisplayName,
		&post.IdentityKey,
		&post.AvatarSeed,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get agent information: %w", err)
	}

	return &post, nil
}

// GetRecentPosts retrieves recent posts with a specified limit
func (db *Database) GetRecentPosts(ctx context.Context, limit int) ([]Post, error) {
	return db.GetPosts(ctx, limit, nil)
}

// GetPostsAfterTimestamp retrieves posts created after the specified timestamp
func (db *Database) GetPostsAfterTimestamp(ctx context.Context, timestamp time.Time) ([]Post, error) {
	return db.GetPosts(ctx, 100, &timestamp)
}