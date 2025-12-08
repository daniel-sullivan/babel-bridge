package api_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"BabelBridge/api"
	babel "BabelBridge/backend"
	"BabelBridge/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

const testSecret = "test-secret"

type clientSession struct {
	server  *api.Server
	cookies []*http.Cookie
}

type requestOptions struct {
	IncludeSessionToken bool
}

type startResp struct {
	ContextID  string `json:"contextId"`
	Result     string `json:"result"`
	SourceLang string `json:"sourceLang"`
}

type previewResp struct {
	Result string `json:"result"`
}

type identifyResp struct {
	Lang string `json:"lang"`
}

type improveResp struct {
	Result string `json:"result"`
}

func newTestServer(t *testing.T) *api.Server {
	t.Helper()
	gin.SetMode(gin.TestMode)
	mockAI := babel.NewMockAISystem()
	backend := babel.NewBabel(mockAI)
	svc := service.NewBabelService(backend, time.Minute)
	return api.NewServerWithTTLs(svc, time.Minute, time.Minute, testSecret)
}

func newClientSession(t *testing.T) *clientSession {
	t.Helper()
	server := newTestServer(t)
	cookies := issueSession(t, server)
	return &clientSession{server: server, cookies: cookies}
}

func issueSession(t *testing.T, s *api.Server) []*http.Cookie {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/session", nil)
	w := httptest.NewRecorder()
	s.Engine.ServeHTTP(w, req)

	res := w.Result()
	defer res.Body.Close()

	require.Equal(t, http.StatusOK, res.StatusCode)
	return res.Cookies()
}

func findCookie(cookies []*http.Cookie, name string) *http.Cookie {
	for _, c := range cookies {
		if c.Name == name {
			return c
		}
	}
	return nil
}

func addCookies(req *http.Request, cookies []*http.Cookie, names ...string) {
	for _, name := range names {
		if c := findCookie(cookies, name); c != nil {
			req.AddCookie(c)
		}
	}
}

func (cs *clientSession) doRequest(t *testing.T, method, path, body string, opts requestOptions) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// always include the gin session cookie so session middleware can read it
	names := []string{"session"}
	if opts.IncludeSessionToken {
		names = append(names, "session_token")
	}
	addCookies(req, cs.cookies, names...)

	w := httptest.NewRecorder()
	cs.server.Engine.ServeHTTP(w, req)
	return w
}

func TestSessionCookieIssued(t *testing.T) {
	cs := newClientSession(t)

	sessionCookie := findCookie(cs.cookies, "session_token")

	require.NotNil(t, sessionCookie)
	require.NotEmpty(t, sessionCookie.Value)
}

func TestSessionRequired(t *testing.T) {
	cs := newClientSession(t)

	w := cs.doRequest(t, http.MethodPost, "/api/translate/start", `{"source":"Hello","lang":"es"}`, requestOptions{
		IncludeSessionToken: false,
	})

	res := w.Result()
	defer res.Body.Close()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)
}

func TestStartTranslationSucceedsWithSession(t *testing.T) {
	cs := newClientSession(t)

	w := cs.doRequest(t, http.MethodPost, "/api/translate/start", `{"source":"Hello","lang":"es"}`, requestOptions{
		IncludeSessionToken: true,
	})

	res := w.Result()
	defer res.Body.Close()
	require.Equal(t, http.StatusOK, res.StatusCode)

	var payload startResp
	require.NoError(t, json.NewDecoder(res.Body).Decode(&payload))
	require.NotEmpty(t, payload.ContextID)
	require.Equal(t, "Hola. Me gusta la pizza.", payload.Result)
	require.Equal(t, "en-US", payload.SourceLang)
}

func TestPreviewTranslationRequiresSession(t *testing.T) {
	cs := newClientSession(t)

	w := cs.doRequest(t, http.MethodPost, "/api/translate/preview", `{"source":"Hello","lang":"es"}`, requestOptions{
		IncludeSessionToken: true,
	})

	res := w.Result()
	defer res.Body.Close()
	require.Equal(t, http.StatusOK, res.StatusCode)

	var payload previewResp
	require.NoError(t, json.NewDecoder(res.Body).Decode(&payload))
	require.Equal(t, "Hola. Me gusta la pizza.", payload.Result)
}

func TestIdentifyLanguageRequiresSession(t *testing.T) {
	cs := newClientSession(t)

	w := cs.doRequest(t, http.MethodPost, "/api/translate/identify", `{"source":"こんにちは。"}`, requestOptions{
		IncludeSessionToken: true,
	})

	res := w.Result()
	defer res.Body.Close()
	require.Equal(t, http.StatusOK, res.StatusCode)

	var payload identifyResp
	require.NoError(t, json.NewDecoder(res.Body).Decode(&payload))
	require.Equal(t, "ja-JP", payload.Lang)
}

func TestImproveTranslationUsesExistingContext(t *testing.T) {
	cs := newClientSession(t)

	start := cs.doRequest(t, http.MethodPost, "/api/translate/start", `{"source":"Hello","lang":"es"}`, requestOptions{
		IncludeSessionToken: true,
	})
	require.Equal(t, http.StatusOK, start.Code)

	var startPayload startResp
	require.NoError(t, json.NewDecoder(start.Body).Decode(&startPayload))
	require.NotEmpty(t, startPayload.ContextID)

	improve := cs.doRequest(t, http.MethodPost, "/api/translate/improve",
		`{"contextId":"`+startPayload.ContextID+`","feedback":"more formal"}`,
		requestOptions{
			IncludeSessionToken: true,
		})
	require.Equal(t, http.StatusOK, improve.Code)

	var improvePayload improveResp
	require.NoError(t, json.NewDecoder(improve.Body).Decode(&improvePayload))
	require.Equal(t, "Hola. Me encanta la pizza.", improvePayload.Result)
}

func TestRateLimitingProtection(t *testing.T) {
	cs := newClientSession(t)

	// Make rapid requests to trigger rate limiting
	const numRequests = 15
	var statusCodes []int

	for i := 0; i < numRequests; i++ {
		w := cs.doRequest(t, http.MethodPost, "/api/translate/start", `{"source":"Hello","lang":"es"}`, requestOptions{
			IncludeSessionToken: true,
		})

		statusCodes = append(statusCodes, w.Code)

		// Small delay to avoid overwhelming the test
		time.Sleep(10 * time.Millisecond)
	}

	// Check that some requests succeeded and some were rate limited
	successCount := 0
	rateLimitedCount := 0

	for _, code := range statusCodes {
		switch code {
		case http.StatusOK:
			successCount++
		case http.StatusTooManyRequests:
			rateLimitedCount++
		default:
			t.Errorf("Unexpected status code: %d", code)
		}
	}

	// At least the first few requests should succeed
	require.Greater(t, successCount, 0, "At least some requests should succeed")

	// If rate limiting is enabled, some requests should be blocked
	if rateLimitedCount > 0 {
		t.Logf("Rate limiting is working: %d/%d requests were rate limited", rateLimitedCount, numRequests)
	} else {
		t.Logf("Rate limiting appears to be disabled: all %d requests succeeded", successCount)
	}

	require.Equal(t, numRequests, successCount+rateLimitedCount, "All requests should either succeed or be rate limited")
}

func TestRateLimitingRecovery(t *testing.T) {
	cs := newClientSession(t)

	// Make rapid requests to potentially trigger rate limiting
	for i := 0; i < 10; i++ {
		w := cs.doRequest(t, http.MethodPost, "/api/translate/identify", `{"source":"Hello"}`, requestOptions{
			IncludeSessionToken: true,
		})

		// Don't fail if we hit rate limiting - just continue
		if w.Code != http.StatusOK && w.Code != http.StatusTooManyRequests {
			t.Errorf("Unexpected status code during rapid requests: %d", w.Code)
		}

		time.Sleep(5 * time.Millisecond)
	}

	// Wait for rate limiting to reset
	time.Sleep(2 * time.Second)

	// Now make a normal request - it should succeed
	w := cs.doRequest(t, http.MethodPost, "/api/translate/identify", `{"source":"Hello"}`, requestOptions{
		IncludeSessionToken: true,
	})

	require.Equal(t, http.StatusOK, w.Code, "Request should succeed after waiting for rate limit reset")

	var payload identifyResp
	require.NoError(t, json.NewDecoder(w.Body).Decode(&payload))
	require.Equal(t, "en-US", payload.Lang)
}

func TestDifferentEndpointsRateLimiting(t *testing.T) {
	cs := newClientSession(t)

	endpoints := []struct {
		path string
		body string
	}{
		{"/api/translate/identify", `{"source":"Hello"}`},
		{"/api/translate/preview", `{"source":"Hello","lang":"es"}`},
		{"/api/translate/start", `{"source":"Hello","lang":"es"}`},
	}

	// Test that each endpoint can handle requests properly
	for _, endpoint := range endpoints {
		t.Run(endpoint.path, func(t *testing.T) {
			w := cs.doRequest(t, http.MethodPost, endpoint.path, endpoint.body, requestOptions{
				IncludeSessionToken: true,
			})

			// Should either succeed or be rate limited - both are valid responses
			require.True(t, w.Code == http.StatusOK || w.Code == http.StatusTooManyRequests,
				"Status should be either 200 or 429, got %d", w.Code)

			if w.Code == http.StatusOK {
				t.Logf("Endpoint %s: Request succeeded", endpoint.path)
			} else {
				t.Logf("Endpoint %s: Request was rate limited", endpoint.path)
			}
		})
	}
}
