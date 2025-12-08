package babel

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/openai/openai-go"
)

// MockAISystem is a simple mock that implements AISystem interface for testing. It returns a fixed result for all requests based on the expectations of the tests.
type MockAISystem struct {
	// Delay for simulating network latency and testing loading states
	Delay time.Duration
}

func NewMockAISystem() *MockAISystem {
	return &MockAISystem{
		Delay: 0, // No delay by default
	}
}

// NewMockAISystemWithDelay creates a mock with artificial delay for testing loading indicators
func NewMockAISystemWithDelay(delay time.Duration) *MockAISystem {
	return &MockAISystem{
		Delay: delay,
	}
}

func (m *MockAISystem) Chat(ctx context.Context, messages []openai.ChatCompletionMessageParamUnion) (string, error) {
	// Add artificial delay if configured
	if m.Delay > 0 {
		time.Sleep(m.Delay)
	}

	// identify the type of request based on the system message at the start
	systemMessage := messages[0].OfSystem.Content.OfString.String()
	if strings.Contains(systemMessage, "Identify the language of the following text") {
		// there should only be one message in this case
		sampleForIdentification := messages[1].OfUser.Content.OfString.String()
		if strings.Contains(sampleForIdentification, "Hello.") {
			return "en-US", nil
		}
		if strings.Contains(sampleForIdentification, "こんにちは。") {
			return "ja-JP", nil
		}
		if strings.Contains(sampleForIdentification, "Hola.") {
			return "es-ES", nil
		}
		if strings.Contains(sampleForIdentification, "Hallo.") {
			return "de-DE", nil
		}
		return "en-US", nil
	} else {
		// this is a translation request. Extract the target language of Japanese, German or Spanish from the system message
		if strings.Contains(systemMessage, "Japanese") {
			switch len(messages) {
			case 2: // initial translation
				return "こにちは。ピザがすきです。", nil
			case 4: // improve formality
				return "こんにちは。ピザが大好きです。", nil
			case 6: // add details
				return "こんにちは。トマトとチーズが入っているので、ピザが大好きです。", nil
			case 8: // convert back to very informal
				return "やあ、友よ！ピザって最高だよね！", nil
			}
		} else if strings.Contains(systemMessage, "Spanish") {
			switch len(messages) {
			case 2:
				return "Hola. Me gusta la pizza.", nil
			case 4:
				return "Hola. Me encanta la pizza.", nil
			case 6:
				return "Hola. Me encanta la pizza porque tiene tomate y queso.", nil
			case 8:
				return "¡Hola amigo! ¡La pizza es lo mejor!", nil
			}
		} else if strings.Contains(systemMessage, "German") {
			switch len(messages) {
			case 2:
				return "Hallo. Ich mag Pizza.", nil
			case 4:
				return "Hallo. Ich liebe Pizza.", nil
			case 6:
				return "Hallo. Ich liebe Pizza, weil sie Tomaten und Käse enthält.", nil
			case 8:
				return "Hallo Freund! Pizza ist das Beste!", nil
			}
		}
	}

	return "", fmt.Errorf("unexpected request: %v", messages)
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
