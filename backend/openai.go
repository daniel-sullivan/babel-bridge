package babel

import (
	"context"
	"fmt"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

type OpenAIBackend struct {
	client openai.Client
	model  string
}

func NewOpenAIDefaultLocalBackend() *OpenAIBackend {
	return NewOpenAILocalBackend("", 0, "", "")
}

func NewOpenAILocalBackend(host string, port int, apiKey string, model string) *OpenAIBackend {
	if host == "" {
		host = "localhost"
	}
	if port == 0 {
		port = 11434
	}

	if model == "" {
		model = "aya-expanse:8b"
	}

	return &OpenAIBackend{
		client: openai.NewClient(
			option.WithBaseURL(fmt.Sprintf("http://%s:%d/v1", host, port)),
			option.WithAPIKey(apiKey),
		),
		model: model,
	}
}

func (o *OpenAIBackend) Chat(ctx context.Context, messages []openai.ChatCompletionMessageParamUnion) (string, error) {
	chatCompletion, err := o.client.Chat.Completions.New(
		ctx,
		openai.ChatCompletionNewParams{
			Model:    o.model,
			Messages: messages,
		},
	)
	if err != nil {
		return "", err
	}

	return chatCompletion.Choices[0].Message.Content, nil
}
