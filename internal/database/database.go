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