package babel_test

import (
	"BabelBridge/backend"
	"context"
	"fmt"
	"sync"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/text/language"
)

func TestNewBabel(t *testing.T) {
	b := babel.NewBabel(babel.NewOpenAIDefaultLocalBackend())

	if b == nil {
		t.Fatal("expected Backend instance to be non-nil")
	}
}

func TestTranslationText(t *testing.T) {
	for name, engine := range map[string]babel.AISystem{
		"mock": babel.NewMockAISystem(),
		//"ollama": babel.NewOpenAIDefaultLocalBackend(),
		//"cohere": babel.NewCohereClient(os.Getenv("COHERE_API_KEY"), ""),
	} {
		t.Run(fmt.Sprintf("engine: %s", name), func(t *testing.T) {
			b := babel.NewBabel(engine)
			require.NotNil(t, b)

			for _, lang := range []language.Tag{
				language.Japanese,
				language.Spanish,
				language.German,
			} {
				t.Run(fmt.Sprintf("translation: %s", lang.String()), func(t *testing.T) {
					ctx := context.Background()
					translationContext, result, err := b.NewTranslation(ctx, "Hello. I like pizza.", lang)
					require.NoError(t, err)

					t.Run("inital translation", func(t *testing.T) {
						require.NotEmpty(t, result)
						t.Logf("Initial translation: %s", result)
					})

					t.Run("increase formality", func(t *testing.T) {
						result, err = translationContext.Improve(ctx, "Make it more formal")
						require.NoError(t, err)
						require.NotEmpty(t, result)
						t.Logf("Improved translation: %s", result)
					})

					t.Run("add details", func(t *testing.T) {
						result, err = translationContext.Improve(ctx, "Clarify that the reason I like pizza is because of the tomato and cheese")
						require.NoError(t, err)
						require.NotEmpty(t, result)
						t.Logf("Detailed translation: %s", result)
					})

					t.Run("convert back to very informal", func(t *testing.T) {
						result, err = translationContext.Improve(ctx, "Rewrite it very informal")
						require.NoError(t, err)
						require.NotEmpty(t, result)
						t.Logf("Very informal translation: %s", result)
					})
				})
			}
		})

	}
}

func TestLanguageIdentification(t *testing.T) {
	for name, engine := range map[string]babel.AISystem{
		"mock": babel.NewMockAISystem(),
		//"ollama": babel.NewOpenAIDefaultLocalBackend(),
		//"cohere": babel.NewCohereClient(os.Getenv("COHERE_API_KEY"), ""),
	} {
		t.Run(fmt.Sprintf("engine: %s", name), func(t *testing.T) {
			b := babel.NewBabel(engine)
			require.NotNil(t, b)

			for lang, input := range map[language.Tag]string{
				language.English:  "Hello. I like pizza.",
				language.Japanese: "こんにちは。ピザが好きです。",
				language.Spanish:  "Hola. Me gusta la pizza.",
				language.German:   "Hallo. Ich mag Pizza.",
			} {
				t.Run(fmt.Sprintf("language identification: %s", lang.String()), func(t *testing.T) {
					ctx := context.Background()
					identified, err := b.IdentifyLanguage(ctx, input)
					require.NoError(t, err)
					langBase, _ := lang.Base()
					identifiedBase, _ := identified.Base()

					require.Equal(t, langBase, identifiedBase, "expected identified language to match")
					t.Logf("Identified language: %s", identified.String())
				})
			}
		})

	}
}

func TestConcurrentTranslations(t *testing.T) {
	// Test that concurrent translations work properly with the mock
	mock := babel.NewMockAISystem()
	b := babel.NewBabel(mock)

	const numGoroutines = 10
	var wg sync.WaitGroup
	errors := make(chan error, numGoroutines)
	results := make(chan string, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			ctx := context.Background()
			_, result, err := b.NewTranslation(ctx, fmt.Sprintf("Hello %d", id), language.Japanese)

			if err != nil {
				errors <- err
				return
			}
			results <- result
		}(i)
	}

	wg.Wait()
	close(errors)
	close(results)

	// Check for errors
	for err := range errors {
		t.Errorf("Concurrent translation failed: %v", err)
	}

	// Check results
	resultCount := 0
	for range results {
		resultCount++
	}

	require.Equal(t, numGoroutines, resultCount, "Expected %d results, got %d", numGoroutines, resultCount)
}

func TestTranslationContextLifecycle(t *testing.T) {
	// Test that translation contexts can be used multiple times
	mock := babel.NewMockAISystem()
	b := babel.NewBabel(mock)

	ctx := context.Background()
	translationCtx, initialResult, err := b.NewTranslation(ctx, "Hello. I like pizza.", language.Japanese)
	require.NoError(t, err)
	require.NotEmpty(t, initialResult)

	// Test multiple improvements on the same context
	improvements := []string{
		"Make it more formal",
		"Add more detail",
		"Make it very casual",
	}

	for i, improvement := range improvements {
		result, err := translationCtx.Improve(ctx, improvement)
		require.NoError(t, err, "Improvement %d failed", i)
		require.NotEmpty(t, result, "Improvement %d returned empty result", i)
		t.Logf("Improvement %d result: %s", i, result)
	}
}

func TestLanguageIdentificationEdgeCases(t *testing.T) {
	mock := babel.NewMockAISystem()
	b := babel.NewBabel(mock)
	ctx := context.Background()

	testCases := []struct {
		input    string
		expected language.Tag
		name     string
	}{
		{"", language.English, "empty string"},
		{"   ", language.English, "whitespace only"},
		{"123", language.English, "numbers only"},
		{"Hello.", language.English, "english with period"},
		{"こんにちは。", language.Japanese, "japanese with period"},
		{"Hola.", language.Spanish, "spanish with period"},
		{"Hallo.", language.German, "german with period"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			identified, err := b.IdentifyLanguage(ctx, tc.input)
			require.NoError(t, err)

			expectedBase, _ := tc.expected.Base()
			identifiedBase, _ := identified.Base()

			require.Equal(t, expectedBase, identifiedBase,
				"Expected %s, got %s for input: %s", tc.expected, identified, tc.input)
		})
	}
}
