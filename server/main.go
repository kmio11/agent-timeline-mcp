package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/kmio11/agent-timeline-mcp/internal/database"
	ui "github.com/kmio11/agent-timeline-mcp/timeline-gui"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// DatabaseInterface defines the methods required for database operations
type DatabaseInterface interface {
	Ping(ctx context.Context) error
	GetPosts(ctx context.Context, limit int, after *time.Time) ([]database.Post, error)
	Close()
}

// Ensure that *database.Database implements the DatabaseInterface
var _ DatabaseInterface = (*database.Database)(nil)

type ApiHandler struct {
	db DatabaseInterface
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
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	fmt.Println("Successfully connected to the database.")

	e := echo.New()
	e.HideBanner = true

	handler := &ApiHandler{
		db: db,
	}

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	withUI := ui.RegisterWebHandlers(e)
	e.GET(fmt.Sprintf("%s/health", apiBasePath), handler.healthCheck)
	e.GET(fmt.Sprintf("%s/posts", apiBasePath), handler.getPosts)

	fmt.Printf("Timeline API server running on http://localhost:%s%s\n", port, apiBasePath)
	if withUI {
		fmt.Printf("Timeline UI server running on http://localhost:%s/\n", port)
	}
	if err := e.Start(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
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
		log.Printf("Error querying posts: %v\n", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"posts": posts,
		"count": len(posts),
	})
}
