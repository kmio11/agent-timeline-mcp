package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/kmio11/agent-timeline-mcp/internal/database"
	ui "github.com/kmio11/agent-timeline-mcp/timeline-gui"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// SSEClient represents a connected SSE client
type SSEClient struct {
	ID       string
	Channel  chan []byte
	Request  *http.Request
	Response http.ResponseWriter
	Flusher  http.Flusher
}

// SSEBroadcaster manages SSE connections
type SSEBroadcaster struct {
	clients map[string]*SSEClient
	mutex   sync.RWMutex
}

// NewSSEBroadcaster creates a new SSE broadcaster
func NewSSEBroadcaster() *SSEBroadcaster {
	return &SSEBroadcaster{
		clients: make(map[string]*SSEClient),
	}
}

// AddClient adds a new SSE client
func (b *SSEBroadcaster) AddClient(client *SSEClient) {
	b.mutex.Lock()
	defer b.mutex.Unlock()
	b.clients[client.ID] = client
	slog.Info("SSE client connected", "client_id", client.ID)
}

// RemoveClient removes an SSE client
func (b *SSEBroadcaster) RemoveClient(clientID string) {
	b.mutex.Lock()
	defer b.mutex.Unlock()
	if client, exists := b.clients[clientID]; exists {
		close(client.Channel)
		delete(b.clients, clientID)
		slog.Info("SSE client disconnected", "client_id", clientID)
	}
}

// Broadcast sends data to all connected clients
func (b *SSEBroadcaster) Broadcast(data []byte) {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	for clientID, client := range b.clients {
		select {
		case client.Channel <- data:
			// Successfully sent
		default:
			// Client channel is full, remove client
			slog.Warn("SSE client channel full, removing", "client_id", clientID)
			go b.RemoveClient(clientID)
		}
	}
}

// DatabaseInterface defines the methods required for database operations
type DatabaseInterface interface {
	Ping(ctx context.Context) error
	GetPosts(ctx context.Context, limit int, after *time.Time) ([]database.Post, error)
	StartNotifications(ctx context.Context) error
	StopNotifications()
	AddNotificationHandler(channel string, handler database.NotificationHandler)
	Close()
}

// Ensure that *database.Database implements the DatabaseInterface
var _ DatabaseInterface = (*database.Database)(nil)

type ApiHandler struct {
	db          DatabaseInterface
	broadcaster *SSEBroadcaster
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
func mustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(fmt.Sprintf("Environment variable %s is required but not set", key))
	}
	return value
}

func main() {
	dbURL := mustGetEnv("DATABASE_URL")
	port := getEnv("TL_SERVER_PORT", "3001")
	apiBasePath := getEnv("TL_SERVER_BASE_PATH", "/api")

	db, err := database.NewDatabase(context.Background(), dbURL)
	if err != nil {
		slog.Error("Unable to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	slog.Info("Successfully connected to the database")

	// Create SSE broadcaster
	broadcaster := NewSSEBroadcaster()

	// Set up notification handler
	db.AddNotificationHandler("timeline_posts", func(payload *database.NotificationPayload) error {
		// Broadcast the notification to all SSE clients
		data, err := json.Marshal(map[string]interface{}{
			"type":      "new_post",
			"timestamp": payload.Timestamp,
			"post_id":   payload.PostID,
			"agent_id":  payload.AgentID,
			"content":   payload.Content,
		})
		if err != nil {
			return fmt.Errorf("failed to marshal notification: %w", err)
		}

		broadcaster.Broadcast(data)
		slog.Debug("Broadcasted new post notification", "post_id", payload.PostID, "agent_id", payload.AgentID)
		return nil
	})

	// Start listening for notifications
	if err := db.StartNotifications(context.Background()); err != nil {
		slog.Error("Failed to start notifications", "error", err)
		os.Exit(1)
	}

	e := echo.New()
	e.HideBanner = true

	handler := &ApiHandler{
		db:          db,
		broadcaster: broadcaster,
	}

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	withUI := ui.RegisterWebHandlers(e)
	e.GET(fmt.Sprintf("%s/health", apiBasePath), handler.healthCheck)
	e.GET(fmt.Sprintf("%s/posts", apiBasePath), handler.getPosts)
	e.GET(fmt.Sprintf("%s/events", apiBasePath), handler.sseHandler)

	slog.Info("Timeline API server starting", "port", port, "api_base_path", apiBasePath)
	if withUI {
		slog.Info("Timeline UI server enabled", "url", fmt.Sprintf("http://localhost:%s/", port))
	}
	slog.Info("SSE endpoint available", "url", fmt.Sprintf("http://localhost:%s%s/events", port, apiBasePath))
	if err := e.Start(":" + port); err != nil {
		slog.Error("Error starting server", "error", err)
		os.Exit(1)
	}
}

func (h *ApiHandler) healthCheck(c echo.Context) error {
	if err := h.db.Ping(c.Request().Context()); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status": "unhealthy",
			"error":  err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
}

func (h *ApiHandler) getPosts(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	limit := database.ParseLimit(limitStr, 100)

	// Support for "after" timestamp parameter for polling
	afterStr := c.QueryParam("after")
	after, err := database.ParseTimeFilter(afterStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid after timestamp format. Use RFC3339 format."})
	}

	posts, err := h.db.GetPosts(c.Request().Context(), limit, after)
	if err != nil {
		slog.Error("Error querying posts", "error", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"posts": posts,
		"count": len(posts),
	})
}

// SSE handler for real-time updates
func (h *ApiHandler) sseHandler(c echo.Context) error {
	// Set SSE headers
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("Access-Control-Allow-Origin", "*")

	// Check if response writer supports flushing
	flusher, ok := c.Response().Writer.(http.Flusher)
	if !ok {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Server-Sent Events not supported",
		})
	}

	// Create client
	clientID := fmt.Sprintf("client_%d", time.Now().UnixNano())
	client := &SSEClient{
		ID:       clientID,
		Channel:  make(chan []byte, 100), // Buffer for 100 messages
		Request:  c.Request(),
		Response: c.Response().Writer,
		Flusher:  flusher,
	}

	// Add client to broadcaster
	h.broadcaster.AddClient(client)
	defer h.broadcaster.RemoveClient(clientID)

	// Send initial connection confirmation
	fmt.Fprintf(c.Response(), "data: {\"type\":\"connected\",\"client_id\":\"%s\"}\n\n", clientID)
	flusher.Flush()

	// Create keepalive ticker to avoid memory leaks
	keepaliveTicker := time.NewTicker(30 * time.Second)
	defer keepaliveTicker.Stop()

	// Listen for client disconnect and messages
	clientGone := c.Request().Context().Done()

	for {
		select {
		case <-clientGone:
			slog.Debug("SSE client disconnected", "client_id", clientID)
			return nil
		case data := <-client.Channel:
			// Send data to client
			fmt.Fprintf(c.Response(), "data: %s\n\n", string(data))
			flusher.Flush()
		case <-keepaliveTicker.C:
			// Send keepalive every 30 seconds
			fmt.Fprintf(c.Response(), "data: {\"type\":\"keepalive\"}\n\n")
			flusher.Flush()
		}
	}
}
