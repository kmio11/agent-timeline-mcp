package database

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

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

// Database manages PostgreSQL database connections and operations
type Database struct {
	pool *pgxpool.Pool
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

	return &Database{
		pool: pool,
	}, nil
}

// Close closes the database connection pool
func (db *Database) Close() {
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