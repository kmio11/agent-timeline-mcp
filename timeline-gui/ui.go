//go:build ui

package ui

import (
	"embed"
	"fmt"

	"github.com/labstack/echo/v4"
)

var (
	//go:embed all:dist
	dist embed.FS
	//go:embed dist/index.html
	indexHTML     embed.FS
	distDirFS     = echo.MustSubFS(dist, "dist")
	distIndexHtml = echo.MustSubFS(indexHTML, "dist")
)

func RegisterWebHandlers(e *echo.Echo) {
	fmt.Println("Registering web handlers for the UI...")
	e.FileFS("/", "index.html", distIndexHtml)
	e.StaticFS("/", distDirFS)
}
