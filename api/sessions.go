package api

import (
	"sync"
	"time"
)

// In-memory session store with TTL
type sessionStore struct {
	mu   sync.Mutex
	ttl  time.Duration
	data map[string]time.Time
}

func newSessionStore(ttl time.Duration) *sessionStore {
	return &sessionStore{ttl: ttl, data: make(map[string]time.Time)}
}

func (s *sessionStore) Put(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[token] = time.Now()
}

func (s *sessionStore) Exists(token string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if t, ok := s.data[token]; ok {
		if time.Since(t) <= s.ttl {
			return true
		}
		delete(s.data, token)
	}
	return false
}

func (s *sessionStore) Touch(token string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if t, ok := s.data[token]; ok {
		if time.Since(t) <= s.ttl {
			s.data[token] = time.Now()
			return true
		}
		delete(s.data, token)
	}
	return false
}

// contextStore maps session -> contextID -> lastUpdated and tracks expiry status
type contextStore struct {
	mu      sync.Mutex
	ttl     time.Duration
	data    map[string]map[string]time.Time
	expired map[string]map[string]struct{}
}

func newContextStore(ttl time.Duration) *contextStore {
	return &contextStore{
		ttl:     ttl,
		data:    make(map[string]map[string]time.Time),
		expired: make(map[string]map[string]struct{}),
	}
}

func (c *contextStore) Put(session, ctxID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if _, ok := c.data[session]; !ok {
		c.data[session] = make(map[string]time.Time)
	}
	c.data[session][ctxID] = time.Now()
}

func (c *contextStore) Exists(session, ctxID string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	m := c.data[session]
	if m == nil {
		return false
	}
	if t, ok := m[ctxID]; ok {
		if time.Since(t) <= c.ttl {
			return true
		}
		// move to expired
		delete(m, ctxID)
		if _, ok := c.expired[session]; !ok {
			c.expired[session] = make(map[string]struct{})
		}
		c.expired[session][ctxID] = struct{}{}
	}
	return false
}

func (c *contextStore) Touch(session, ctxID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if m := c.data[session]; m != nil {
		if _, ok := m[ctxID]; ok {
			m[ctxID] = time.Now()
		}
	}
}

func (c *contextStore) wasExpired(session, ctxID string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if m := c.expired[session]; m != nil {
		_, ok := m[ctxID]
		return ok
	}
	return false
}
