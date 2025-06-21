package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/kmio11/agent-timeline-mcp/internal/database"
	"github.com/labstack/echo/v4"
)

// MockDatabase implements DatabaseInterface for testing
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
				Timestamp:   time.Date(2023, 6, 21, 12, 0, 0, 0, time.UTC),
				AgentName:   "TestAgent",
				DisplayName: "Test Agent 1",
				IdentityKey: "test-agent-1",
				AvatarSeed:  "seed1",
			},
			{
				ID:          2,
				AgentID:     2,
				Content:     "Test post 2",
				Timestamp:   time.Date(2023, 6, 21, 11, 0, 0, 0, time.UTC),
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

func TestApiHandler_healthCheck(t *testing.T) {
	tests := []struct {
		name           string
		dbError        error
		expectedStatus int
		expectedBody   map[string]string
	}{
		{
			name:           "healthy database",
			dbError:        nil,
			expectedStatus: http.StatusOK,
			expectedBody:   map[string]string{"status": "healthy"},
		},
		{
			name:           "unhealthy database",
			dbError:        errors.New("database connection failed"),
			expectedStatus: http.StatusInternalServerError,
			expectedBody:   map[string]string{"status": "unhealthy", "error": "database connection failed"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockDB := NewMockDatabase()
			mockDB.SetError(tt.dbError)
			handler := &ApiHandler{db: mockDB}

			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/health", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			// Execute
			err := handler.healthCheck(c)

			// Assert
			if err != nil {
				t.Errorf("Expected no error, got %v", err)
			}

			if rec.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, rec.Code)
			}

			var response map[string]string
			if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
				t.Errorf("Failed to unmarshal response: %v", err)
			}

			for key, expectedValue := range tt.expectedBody {
				if actualValue, exists := response[key]; !exists || actualValue != expectedValue {
					t.Errorf("Expected %s=%s, got %s=%s", key, expectedValue, key, actualValue)
				}
			}
		})
	}
}

func TestApiHandler_getPosts(t *testing.T) {
	tests := []struct {
		name           string
		queryParams    string
		dbError        error
		expectedStatus int
		expectedCount  int
	}{
		{
			name:           "get all posts",
			queryParams:    "",
			dbError:        nil,
			expectedStatus: http.StatusOK,
			expectedCount:  2,
		},
		{
			name:           "get posts with limit",
			queryParams:    "?limit=1",
			dbError:        nil,
			expectedStatus: http.StatusOK,
			expectedCount:  1,
		},
		{
			name:           "get posts after timestamp",
			queryParams:    "?after=2023-06-21T11:30:00Z",
			dbError:        nil,
			expectedStatus: http.StatusOK,
			expectedCount:  1,
		},
		{
			name:           "invalid after timestamp",
			queryParams:    "?after=invalid-timestamp",
			dbError:        nil,
			expectedStatus: http.StatusBadRequest,
			expectedCount:  0,
		},
		{
			name:           "database error",
			queryParams:    "",
			dbError:        errors.New("database query failed"),
			expectedStatus: http.StatusInternalServerError,
			expectedCount:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockDB := NewMockDatabase()
			mockDB.SetError(tt.dbError)
			handler := &ApiHandler{db: mockDB}

			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/posts"+tt.queryParams, nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			// Execute
			err := handler.getPosts(c)

			// Assert
			if err != nil {
				t.Errorf("Expected no error, got %v", err)
			}

			if rec.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, rec.Code)
			}

			if tt.expectedStatus == http.StatusOK {
				var response map[string]any
				if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
					t.Errorf("Failed to unmarshal response: %v", err)
				}

				count, ok := response["count"].(float64)
				if !ok {
					t.Errorf("Expected count to be a number")
				}

				if int(count) != tt.expectedCount {
					t.Errorf("Expected count %d, got %d", tt.expectedCount, int(count))
				}

				posts, ok := response["posts"].([]any)
				if !ok {
					t.Errorf("Expected posts to be an array")
				}

				if len(posts) != tt.expectedCount {
					t.Errorf("Expected %d posts, got %d", tt.expectedCount, len(posts))
				}
			}
		})
	}
}

func TestGetEnv(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		fallback string
		envValue string
		expected string
	}{
		{
			name:     "environment variable exists",
			key:      "TEST_VAR",
			fallback: "default",
			envValue: "actual",
			expected: "actual",
		},
		{
			name:     "environment variable does not exist",
			key:      "NON_EXISTENT_VAR",
			fallback: "default",
			envValue: "",
			expected: "default",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			if tt.envValue != "" {
				t.Setenv(tt.key, tt.envValue)
			}

			// Execute
			result := getEnv(tt.key, tt.fallback)

			// Assert
			if result != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, result)
			}
		})
	}
}

func TestMustGetEnv(t *testing.T) {
	t.Run("environment variable exists", func(t *testing.T) {
		// Setup
		key := "TEST_MUST_VAR"
		expected := "test_value"
		t.Setenv(key, expected)

		// Execute
		result := mustGetEnv(key)

		// Assert
		if result != expected {
			t.Errorf("Expected %s, got %s", expected, result)
		}
	})

	t.Run("environment variable does not exist", func(t *testing.T) {
		// Setup
		key := "NON_EXISTENT_MUST_VAR"

		// Execute & Assert
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("Expected panic for non-existent environment variable")
			}
		}()

		mustGetEnv(key)
	})
}