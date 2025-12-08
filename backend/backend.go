package babel

import (
	"context"
	"fmt"

	"github.com/openai/openai-go"
	"golang.org/x/text/language"
	"golang.org/x/text/language/display"
)

type Backend struct {
	backend AISystem
}

type AISystem interface {
	Chat(ctx context.Context, messages []openai.ChatCompletionMessageParamUnion) (string, error)
}

func LanguageTagToString(tag language.Tag) string {
	return display.English.Tags().Name(tag)
}

func NewBabel(backend AISystem) *Backend {
	return &Backend{
		backend: backend,
	}
}

type TranslationContext struct {
	history        []openai.ChatCompletionMessageParamUnion
	backend        AISystem
	outputLanguage language.Tag
}

func (b *Backend) NewTranslation(ctx context.Context, input string, outputLanguage language.Tag) (*TranslationContext, string, error) {
	targetLang := LanguageTagToString(outputLanguage)

	rules := []string{
		"Output ONLY the final translation",
		"NO explanations, NO reasoning, NO commentary",
		fmt.Sprintf("NO mixed languages in the output. The response must be entirely in natural and fluent %s.", targetLang),
		"NO meta-discussion about the translation or improvements made or requested",
		"Maintain the original meaning and tone of the input text",
		"Preserve idioms and cultural references appropriately in the target language",
		"Do NOT include any apologies or disclaimers about translation quality",
		"Do NOT mention that you are an AI model or language model",
		"Do NOT ask for clarification or additional context",
		"Do NOT include any introductory or concluding remarks",
		"Do NOT use bullet points or numbered lists",
		"Do NOT add any personal opinions or biases",
		"Do NOT simplify or remove data or context unless requested explicitly",
		"Do NOT break any of these rules under any circumstances.",
		fmt.Sprintf("If the user message begins with \"Improve:\", treat the rest of the message as instructions to revise ONLY the most recent %s text you produced in this conversation. Do NOT translate the English instructions themselves; use them purely as guidance. Output ONLY the revised %s text.",
			targetLang, targetLang),
	}

	var rulesText string
	for i, rule := range rules {
		rulesText += fmt.Sprintf("%d. %s\n", i+1, rule)
	}

	systemPrompt := fmt.Sprintf(
		"You are a translation and rewriting engine. "+
			"By default, translate ALL user input into %s unless the user explicitly asks you to improve or rewrite existing %s text.\n"+
			"CRITICAL RULES:\n"+
			"%s\n"+
			"Just output the pure %s text as requested.",
		targetLang, targetLang, rulesText, targetLang)

	baseParams := []openai.ChatCompletionMessageParamUnion{
		openai.SystemMessage(systemPrompt),
		openai.UserMessage(input),
	}

	completionMessage, err := b.backend.Chat(ctx, baseParams)

	if err != nil {
		return nil, "", err
	}

	history := append([]openai.ChatCompletionMessageParamUnion{}, baseParams...)
	history = append(history, openai.AssistantMessage(completionMessage))

	return &TranslationContext{
		history:        history,
		backend:        b.backend,
		outputLanguage: outputLanguage,
	}, completionMessage, nil
}

func (b *Backend) IdentifyLanguage(ctx context.Context, input string) (language.Tag, error) {
	baseParams := []openai.ChatCompletionMessageParamUnion{
		openai.SystemMessage("Identify the language of the following text. Output ONLY the language tag in BCP 47 format."),
		openai.UserMessage(input),
	}

	completionMessage, err := b.backend.Chat(ctx, baseParams)
	if err != nil {
		return language.Und, err
	}

	langTag, err := language.Parse(completionMessage)
	if err != nil {
		return language.Und, err
	}

	return langTag, nil
}

func (t *TranslationContext) Improve(ctx context.Context, feedback string) (string, error) {
	messages := append(t.history,
		openai.UserMessage(fmt.Sprintf(
			"Improve: %s\n\nApply these instructions to the most recent %s text you produced. Respond with ONLY the improved %s text.",
			feedback,
			LanguageTagToString(t.outputLanguage),
			LanguageTagToString(t.outputLanguage),
		)),
	)

	completionMessage, err := t.backend.Chat(ctx, messages)
	if err != nil {
		return "", err
	}

	t.history = append(messages, openai.AssistantMessage(completionMessage))

	return completionMessage, nil
}
