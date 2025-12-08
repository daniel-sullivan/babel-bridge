package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"time"

	"golang.org/x/text/language"
)

// TranslationService abstracts the translation engine for ease of testing.
type TranslationService interface {
	NewTranslation(ctx context.Context, input string, output language.Tag) (ctxID string, initial string, err error)
	Improve(ctx context.Context, ctxID string, feedback string) (string, error)
	Identify(ctx context.Context, input string) (language.Tag, error)
	Preview(ctx context.Context, input string, output language.Tag) (string, error)
}

func RandomToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		// fallback, should never happen
		return base64.RawURLEncoding.EncodeToString([]byte(time.Now().String()))
	}
	return base64.RawURLEncoding.EncodeToString(b)
}
