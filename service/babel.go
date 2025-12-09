package service

import (
	"context"
	"errors"
	"sync"
	"time"

	babel "BabelBridge/backend"

	"golang.org/x/text/language"
)

// BackendInterface defines the interface for translation backends
type BackendInterface interface {
	NewTranslation(ctx context.Context, input string, outputLanguage language.Tag) (*babel.TranslationContext, string, error)
	IdentifyLanguage(ctx context.Context, input string) (language.Tag, error)
}

// BabelService is the production adapter implementing TranslationService backed by BackendInterface
type BabelService struct {
	mu        sync.Mutex
	b         BackendInterface
	contexts  map[string]*babel.TranslationContext
	lastTouch map[string]time.Time
	ttl       time.Duration
}

func NewBabelService(b BackendInterface, ttl time.Duration) *BabelService {
	return &BabelService{
		b:         b,
		contexts:  make(map[string]*babel.TranslationContext),
		lastTouch: make(map[string]time.Time),
		ttl:       ttl,
	}
}

func (s *BabelService) NewTranslation(ctx context.Context, input string, output language.Tag) (string, string, error) {
	translationContext, result, err := s.b.NewTranslation(ctx, input, output)
	if err != nil {
		return "", "", err
	}
	id := RandomToken()
	s.mu.Lock()
	s.contexts[id] = translationContext
	s.lastTouch[id] = time.Now()
	s.mu.Unlock()
	return id, result, nil
}

func (s *BabelService) Improve(ctx context.Context, ctxID string, feedback string) (string, error) {
	s.mu.Lock()
	translationContext, ok := s.contexts[ctxID]
	if ok {
		if time.Since(s.lastTouch[ctxID]) > s.ttl {
			// expire
			delete(s.contexts, ctxID)
			delete(s.lastTouch, ctxID)
			ok = false
		}
	}
	s.mu.Unlock()
	if !ok {
		return "", errors.New("context expired or not found")
	}
	res, err := translationContext.Improve(ctx, feedback)
	if err != nil {
		return "", err
	}
	s.mu.Lock()
	s.lastTouch[ctxID] = time.Now()
	s.mu.Unlock()
	return res, nil
}

func (s *BabelService) Identify(ctx context.Context, input string) (language.Tag, error) {
	return s.b.IdentifyLanguage(ctx, input)
}

// Preview performs a stateless translation returning only the result without persisting context
func (s *BabelService) Preview(ctx context.Context, input string, output language.Tag) (string, error) {
	_, res, err := s.b.NewTranslation(ctx, input, output)
	if err != nil {
		return "", err
	}
	return res, nil
}
