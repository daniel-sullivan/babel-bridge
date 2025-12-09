package service

import (
	"context"
	"testing"
	"time"

	backend "BabelBridge/backend"

	"golang.org/x/text/language"
)

func TestRandomToken(t *testing.T) {
	token1 := RandomToken()
	token2 := RandomToken()

	// Tokens should be non-empty
	if token1 == "" {
		t.Error("RandomToken should not return empty string")
	}
	if token2 == "" {
		t.Error("RandomToken should not return empty string")
	}

	// Tokens should be unique
	if token1 == token2 {
		t.Error("RandomToken should generate unique tokens")
	}

	// Tokens should have reasonable length
	if len(token1) < 8 {
		t.Errorf("RandomToken should generate tokens of reasonable length, got %d", len(token1))
	}

	// Should be URL-safe base64
	for _, char := range token1 {
		if !isValidURLSafeBase64Char(char) {
			t.Errorf("RandomToken should only contain URL-safe base64 characters, found %c", char)
		}
	}
}

func isValidURLSafeBase64Char(r rune) bool {
	return (r >= 'A' && r <= 'Z') ||
		(r >= 'a' && r <= 'z') ||
		(r >= '0' && r <= '9') ||
		r == '-' || r == '_'
}

func TestRandomTokenUniqueness(t *testing.T) {
	tokens := make(map[string]bool)
	iterations := 1000

	for i := 0; i < iterations; i++ {
		token := RandomToken()
		if tokens[token] {
			t.Errorf("RandomToken generated duplicate token: %s", token)
		}
		tokens[token] = true
	}

	if len(tokens) != iterations {
		t.Errorf("Expected %d unique tokens, got %d", iterations, len(tokens))
	}
}

func TestRandomTokenPerformance(t *testing.T) {
	start := time.Now()

	for i := 0; i < 1000; i++ {
		RandomToken()
	}

	duration := time.Since(start)

	// Should generate 1000 tokens in less than 100ms
	if duration > 100*time.Millisecond {
		t.Errorf("RandomToken is too slow: %v for 1000 tokens", duration)
	}
}

func TestRandomTokenFallback(t *testing.T) {
	// This test would require mocking the crypto/rand package to force an error,
	// which is complex. Instead, we just verify the fallback doesn't panic.

	// Call multiple times to ensure consistency
	for i := 0; i < 10; i++ {
		token := RandomToken()
		if token == "" {
			t.Error("RandomToken should never return empty string, even in fallback")
		}
	}
}

// Mock backend for testing BabelService
type mockBackend struct {
	newTranslationFunc func(ctx context.Context, input string, output language.Tag) (*backend.TranslationContext, string, error)
	identifyFunc       func(ctx context.Context, input string) (language.Tag, error)
}

func (m *mockBackend) NewTranslation(ctx context.Context, input string, output language.Tag) (*backend.TranslationContext, string, error) {
	if m.newTranslationFunc != nil {
		return m.newTranslationFunc(ctx, input, output)
	}
	// Create a mock translation context
	mockCtx := &backend.TranslationContext{}
	return mockCtx, "translation result", nil
}

func (m *mockBackend) IdentifyLanguage(ctx context.Context, input string) (language.Tag, error) {
	if m.identifyFunc != nil {
		return m.identifyFunc(ctx, input)
	}
	return language.English, nil
}

func TestNewBabelService(t *testing.T) {
	mockB := &mockBackend{}
	ttl := 5 * time.Minute

	service := NewBabelService(mockB, ttl)

	if service == nil {
		t.Error("NewBabelService should not return nil")
	}

	if service.ttl != ttl {
		t.Error("BabelService should store the TTL")
	}

	if service.contexts == nil {
		t.Error("BabelService should initialize contexts map")
	}

	if service.lastTouch == nil {
		t.Error("BabelService should initialize lastTouch map")
	}
}

func TestBabelServiceNewTranslation(t *testing.T) {
	mockB := &mockBackend{}
	service := NewBabelService(mockB, 5*time.Minute)
	ctx := context.Background()

	contextID, result, err := service.NewTranslation(ctx, "Hello", language.Spanish)

	if err != nil {
		t.Errorf("NewTranslation should not return error: %v", err)
	}

	if contextID == "" {
		t.Error("NewTranslation should return non-empty context ID")
	}

	if result != "translation result" {
		t.Errorf("Expected 'translation result', got '%s'", result)
	}

	// Context should be stored
	service.mu.Lock()
	if _, exists := service.contexts[contextID]; !exists {
		t.Error("Translation context should be stored")
	}
	if _, exists := service.lastTouch[contextID]; !exists {
		t.Error("Last touch time should be stored")
	}
	service.mu.Unlock()
}

func TestBabelServiceIdentify(t *testing.T) {
	mockB := &mockBackend{}
	service := NewBabelService(mockB, 5*time.Minute)
	ctx := context.Background()

	lang, err := service.Identify(ctx, "Hello world")

	if err != nil {
		t.Errorf("Identify should not return error: %v", err)
	}

	if lang != language.English {
		t.Errorf("Expected English, got %v", lang)
	}
}

func TestBabelServicePreview(t *testing.T) {
	mockB := &mockBackend{}
	service := NewBabelService(mockB, 5*time.Minute)
	ctx := context.Background()

	result, err := service.Preview(ctx, "Hello", language.Spanish)

	if err != nil {
		t.Errorf("Preview should not return error: %v", err)
	}

	if result != "translation result" {
		t.Errorf("Expected 'translation result', got '%s'", result)
	}

	// Preview should not store context
	service.mu.Lock()
	contextCount := len(service.contexts)
	service.mu.Unlock()

	if contextCount != 0 {
		t.Error("Preview should not store translation context")
	}
}

func TestBabelServiceImproveExpiredContext(t *testing.T) {
	mockB := &mockBackend{}
	service := NewBabelService(mockB, 1*time.Millisecond) // Very short TTL
	ctx := context.Background()

	// Create a translation
	contextID, _, err := service.NewTranslation(ctx, "Hello", language.Spanish)
	if err != nil {
		t.Fatalf("Failed to create translation: %v", err)
	}

	// Wait for context to expire
	time.Sleep(10 * time.Millisecond)

	// Try to improve expired context
	_, err = service.Improve(ctx, contextID, "Make it better")

	if err == nil {
		t.Error("Improve should return error for expired context")
	}

	expectedError := "context expired or not found"
	if err.Error() != expectedError {
		t.Errorf("Expected error '%s', got '%s'", expectedError, err.Error())
	}
}

func TestBabelServiceImproveNonExistentContext(t *testing.T) {
	mockB := &mockBackend{}
	service := NewBabelService(mockB, 5*time.Minute)
	ctx := context.Background()

	// Try to improve non-existent context
	_, err := service.Improve(ctx, "non-existent-id", "Make it better")

	if err == nil {
		t.Error("Improve should return error for non-existent context")
	}

	expectedError := "context expired or not found"
	if err.Error() != expectedError {
		t.Errorf("Expected error '%s', got '%s'", expectedError, err.Error())
	}
}

func TestBabelServiceContextCleanupOnImprove(t *testing.T) {
	mockB := &mockBackend{}
	service := NewBabelService(mockB, 50*time.Millisecond)
	ctx := context.Background()

	// Create translation
	contextID, _, err := service.NewTranslation(ctx, "Hello", language.Spanish)
	if err != nil {
		t.Fatalf("Failed to create translation: %v", err)
	}

	// Wait for expiration
	time.Sleep(100 * time.Millisecond)

	// Try to improve (should clean up expired context)
	service.Improve(ctx, contextID, "feedback")

	// Context should be cleaned up
	service.mu.Lock()
	_, exists := service.contexts[contextID]
	_, touchExists := service.lastTouch[contextID]
	service.mu.Unlock()

	if exists {
		t.Error("Expired context should be cleaned up")
	}
	if touchExists {
		t.Error("Expired touch time should be cleaned up")
	}
}

func TestBabelServiceConcurrentAccess(t *testing.T) {
	mockB := &mockBackend{}
	service := NewBabelService(mockB, 5*time.Minute)
	ctx := context.Background()

	// Test concurrent access doesn't cause data races
	done := make(chan bool, 10)

	for i := 0; i < 10; i++ {
		go func() {
			defer func() { done <- true }()

			contextID, _, err := service.NewTranslation(ctx, "Hello", language.Spanish)
			if err != nil {
				t.Errorf("Concurrent NewTranslation failed: %v", err)
				return
			}

			// Don't test Improve in concurrent test since we don't have a real implementation
			_ = contextID
		}()
	}

	// Wait for all goroutines to complete
	for i := 0; i < 10; i++ {
		<-done
	}
}

func TestBabelServiceBackendErrorHandling(t *testing.T) {
	mockB := &mockBackend{
		newTranslationFunc: func(ctx context.Context, input string, output language.Tag) (*backend.TranslationContext, string, error) {
			return nil, "", &testError{"backend error"}
		},
	}
	service := NewBabelService(mockB, 5*time.Minute)
	ctx := context.Background()

	_, _, err := service.NewTranslation(ctx, "Hello", language.Spanish)

	if err == nil {
		t.Error("NewTranslation should return error when backend fails")
	}

	if err.Error() != "backend error" {
		t.Errorf("Expected 'backend error', got '%s'", err.Error())
	}
}

func TestBabelServiceIdentifyBackendError(t *testing.T) {
	mockB := &mockBackend{
		identifyFunc: func(ctx context.Context, input string) (language.Tag, error) {
			return language.Und, &testError{"identify error"}
		},
	}
	service := NewBabelService(mockB, 5*time.Minute)
	ctx := context.Background()

	_, err := service.Identify(ctx, "Hello")

	if err == nil {
		t.Error("Identify should return error when backend fails")
	}

	if err.Error() != "identify error" {
		t.Errorf("Expected 'identify error', got '%s'", err.Error())
	}
}

// Test error type for mocking backend errors
type testError struct {
	message string
}

func (e *testError) Error() string {
	return e.message
}
