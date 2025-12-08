package main

import (
	"BabelBridge/service"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"BabelBridge/api"
	"BabelBridge/backend"
)

func main() {
	var aiBackend babel.AISystem
	engine := os.Getenv("ENGINE")
	switch engine {
	case "mock":
		slog.Info("Using mock backend for testing")
		aiBackend = babel.NewMockAISystem()
	case "openai":
		key := os.Getenv("OPENAI_API_KEY")
		if key == "" {
			slog.Warn("OPENAI_API_KEY not set, using without authentication")
		}
		host := os.Getenv("OPENAI_HOST")
		if host == "" {
			slog.Error("OPENAI_HOST not set, defaulting to localhost")
		}
		portStr := os.Getenv("OPENAI_PORT")
		port, err := strconv.Atoi(portStr)
		if err != nil {
			slog.Error("invalid OPENAI_PORT, defaulting to 11434", "error", err)
		}
		model := os.Getenv("OPENAI_MODEL")
		if model == "" {
			slog.Error("OPENAI_MODEL not set, defaulting to 'aya-expanse:8b'")
		}

		aiBackend = babel.NewOpenAILocalBackend(host, port, model, key)
	case "cohere":
		apiKey := os.Getenv("COHERE_API_KEY")
		if apiKey == "" {
			slog.Error("COHERE_API_KEY not set, unable to start")
			os.Exit(1)
		}
		model := os.Getenv("COHERE_MODEL")
		if model == "" {
			slog.Error("COHERE_MODEL not set, defaulting to 'c4ai-aya-expanse-8b'")
		}
		aiBackend = babel.NewCohereClient(apiKey, model)
	default:
		slog.Error("ENGINE not set, must be 'mock', 'openai' or 'cohere'")
		os.Exit(1)
	}

	secretKey := os.Getenv("SECRET_KEY")
	if secretKey != "" {
		slog.Info("Using secret key", "key", secretKey)
	} else {
		slog.Warn("SECRET_KEY not set, generating random one")
		secretKey = service.RandomToken()
	}

	b := babel.NewBabel(aiBackend)
	svc := service.NewBabelService(b, 7*24*time.Hour)
	server := api.NewServer(svc, secretKey)

	addr := ":8080"
	if v := os.Getenv("PORT"); v != "" {
		addr = ":" + v
	}
	log.Printf("Starting server on %s", addr)
	if err := server.Engine.Run(addr); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}
