package babel

import (
	"context"

	cohere "github.com/cohere-ai/cohere-go/v2"
	client "github.com/cohere-ai/cohere-go/v2/client"
	"github.com/openai/openai-go"
)

type CohereClient struct {
	client *client.Client
	model  string
}

func NewCohereClient(apiKey string, model string) *CohereClient {
	c := client.NewClient(client.WithToken(apiKey))

	if model == "" {
		model = "c4ai-aya-expanse-8b"
	}

	return &CohereClient{
		client: c,
		model:  model,
	}
}

func (c *CohereClient) Chat(ctx context.Context, messages []openai.ChatCompletionMessageParamUnion) (string, error) {
	// convert the openai format to the cohere format
	chatRequest := cohere.ChatRequest{
		Model: &c.model,
	}

	for idx, m := range messages {
		if m.OfSystem != nil {
			s := m.OfSystem.Content.OfString.String()
			chatRequest.Preamble = &s
		}
		if m.OfAssistant != nil {
			s := m.OfAssistant.Content.OfString.String()
			chatRequest.ChatHistory = append(chatRequest.ChatHistory, &cohere.Message{Chatbot: &cohere.ChatMessage{Message: s}})
		}
		if m.OfUser != nil {
			if idx == len(messages)-1 {
				chatRequest.Message = m.OfUser.Content.OfString.String()
			} else {
				s := m.OfUser.Content.OfString.String()
				chatRequest.ChatHistory = append(chatRequest.ChatHistory, &cohere.Message{User: &cohere.ChatMessage{Message: s}})
			}
		}
	}

	chatResponse, err := c.client.Chat(ctx, &chatRequest)
	if err != nil {
		return "", err
	}
	return chatResponse.Text, nil
}
