package database_test

import (
	"context"
	"testing"
	"time"

	"github.com/kmio11/agent-timeline-mcp/internal/database"
)

// MockDatabase is a mock implementation of database operations for testing
type MockDatabase struct {
	posts []database.Post
	err   error
}

func NewMockDatabase() *MockDatabase {
	return &MockDatabase{
		posts: []database.Post{
			{
				ID:          1,
				AgentID:     1,
				Content:     "Test post 1",
				Timestamp:   time.Now(),
				AgentName:   "TestAgent",
				DisplayName: "Test Agent 1",
				IdentityKey: "test-agent-1",
				AvatarSeed:  "seed1",
			},
			{
				ID:          2,
				AgentID:     2,
				Content:     "Test post 2",
				Timestamp:   time.Now().Add(-time.Hour),
				AgentName:   "TestAgent2",
				DisplayName: "Test Agent 2",
				IdentityKey: "test-agent-2",
				AvatarSeed:  "seed2",
			},
		},
	}
}

func (m *MockDatabase) Ping(ctx context.Context) error {
	return m.err
}

func (m *MockDatabase) GetPosts(ctx context.Context, limit int, after *time.Time) ([]database.Post, error) {
	if m.err != nil {
		return nil, m.err
	}

	var filteredPosts []database.Post
	for _, post := range m.posts {
		if after == nil || post.Timestamp.After(*after) {
			filteredPosts = append(filteredPosts, post)
		}
	}

	if len(filteredPosts) > limit {
		filteredPosts = filteredPosts[:limit]
	}

	return filteredPosts, nil
}

func (m *MockDatabase) Close() {
	// Mock implementation - no-op
}

func (m *MockDatabase) SetError(err error) {
	m.err = err
}

func TestParseTimeFilter(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		expectNil bool
		expectErr bool
	}{
		{
			name:      "empty string",
			input:     "",
			expectNil: true,
			expectErr: false,
		},
		{
			name:      "valid RFC3339 time",
			input:     "2023-06-21T12:00:00Z",
			expectNil: false,
			expectErr: false,
		},
		{
			name:      "invalid time format",
			input:     "invalid-time",
			expectNil: true,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := database.ParseTimeFilter(tt.input)

			if tt.expectErr && err == nil {
				t.Errorf("Expected error but got none")
			}
			if !tt.expectErr && err != nil {
				t.Errorf("Expected no error but got: %v", err)
			}
			if tt.expectNil && result != nil {
				t.Errorf("Expected nil result but got: %v", result)
			}
			if !tt.expectNil && !tt.expectErr && result == nil {
				t.Errorf("Expected non-nil result but got nil")
			}
		})
	}
}

func TestParseLimit(t *testing.T) {
	tests := []struct {
		name         string
		input        string
		defaultLimit int
		expected     int
	}{
		{
			name:         "empty string",
			input:        "",
			defaultLimit: 100,
			expected:     100,
		},
		{
			name:         "valid positive number",
			input:        "50",
			defaultLimit: 100,
			expected:     50,
		},
		{
			name:         "zero",
			input:        "0",
			defaultLimit: 100,
			expected:     100,
		},
		{
			name:         "negative number",
			input:        "-10",
			defaultLimit: 100,
			expected:     100,
		},
		{
			name:         "invalid string",
			input:        "invalid",
			defaultLimit: 100,
			expected:     100,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := database.ParseLimit(tt.input, tt.defaultLimit)
			if result != tt.expected {
				t.Errorf("Expected %d but got %d", tt.expected, result)
			}
		})
	}
}

// TestNewDatabase tests the database constructor with invalid connection string
func TestNewDatabase(t *testing.T) {
	ctx := context.Background()
	
	t.Run("invalid connection string", func(t *testing.T) {
		_, err := database.NewDatabase(ctx, "invalid-connection-string")
		if err == nil {
			t.Error("Expected error for invalid connection string but got nil")
		}
	})
}