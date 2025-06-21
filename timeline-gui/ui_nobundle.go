//go:build !ui

package ui

import (
	"github.com/labstack/echo/v4"
)

func RegisterWebHandlers(e *echo.Echo) bool {
	// not bundle web pages if build tag "ui" is not specified
	return false
}
