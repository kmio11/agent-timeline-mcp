package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	ui "github.com/kmio11/agent-timeline-mcp/timeline-gui"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Post struct {
	ID          int             `json:"id"`
	AgentID     int             `json:"agent_id"`
	Content     string          `json:"content"`
	Timestamp   time.Time       `json:"timestamp"`
	Metadata    json.RawMessage `json:"metadata"`
	AgentName   string          `json:"agent_name"`
	DisplayName string          `json:"display_name"`
}

type ApiHandler struct {
	db *pgxpool.Pool
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

	dbpool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer dbpool.Close()

	if err := dbpool.Ping(context.Background()); err != nil {
		log.Fatalf("Database ping failed: %v\n", err)
	}

	fmt.Println("Successfully connected to the database.")

	e := echo.New()

	handler := &ApiHandler{
		db: dbpool,
	}

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	ui.RegisterWebHandlers(e)
	e.GET(fmt.Sprintf("%s/health", apiBasePath), handler.healthCheck)
	e.GET(fmt.Sprintf("%s/posts", apiBasePath), handler.getPosts)

	fmt.Printf("Timeline API server running on http://localhost:%s%s\n", port, apiBasePath)
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
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 100
	}

	query := `
      SELECT 
        p.id,
        p.agent_id,
        p.content,
        p.timestamp,
        p.metadata,
        a.name as agent_name,
        a.display_name
      FROM posts p
      JOIN agents a ON p.agent_id = a.id
      ORDER BY p.timestamp DESC
      LIMIT $1`

	rows, err := h.db.Query(c.Request().Context(), query, limit)
	if err != nil {
		log.Printf("Error querying posts: %v\n", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
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
		)
		if err != nil {
			log.Printf("Error scanning post row: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating post rows: %v\n", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"posts": posts,
		"count": len(posts),
	})
}
