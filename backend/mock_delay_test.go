package babel_test

import (
	"BabelBridge/backend"
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"golang.org/x/text/language"
)

func TestMockAISystemWithDelay(t *testing.T) {
	// Test that delay works when configured
	mockWithDelay := babel.NewMockAISystemWithDelay(100 * time.Millisecond)
	backend := babel.NewBabel(mockWithDelay)

	start := time.Now()
	_, result, err := backend.NewTranslation(context.Background(), "Hello. I like pizza.", language.Spanish)
	elapsed := time.Since(start)

	require.NoError(t, err)
	require.Equal(t, "Hola. Me gusta la pizza.", result)
	require.GreaterOrEqual(t, elapsed, 100*time.Millisecond, "Expected at least 100ms delay")
	require.Less(t, elapsed, 200*time.Millisecond, "Delay should not be excessive")
}

func TestMockAISystemWithoutDelay(t *testing.T) {
	// Test that no delay works as expected
	mockWithoutDelay := babel.NewMockAISystem()
	backend := babel.NewBabel(mockWithoutDelay)

	start := time.Now()
	_, result, err := backend.NewTranslation(context.Background(), "Hello. I like pizza.", language.Spanish)
	elapsed := time.Since(start)

	require.NoError(t, err)
	require.Equal(t, "Hola. Me gusta la pizza.", result)
	require.Less(t, elapsed, 50*time.Millisecond, "Should be fast without delay")
}
