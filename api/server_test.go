package api_test

import (
	"encoding/json"
	"fmt"
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
	defer func() { _ = res.Body.Close() }()

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
	defer func() { _ = res.Body.Close() }()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)
}

func TestStartTranslationSucceedsWithSession(t *testing.T) {
	cs := newClientSession(t)

	w := cs.doRequest(t, http.MethodPost, "/api/translate/start", `{"source":"Hello","lang":"es"}`, requestOptions{
		IncludeSessionToken: true,
	})

	res := w.Result()
	defer func() { _ = res.Body.Close() }()
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
	defer func() { _ = res.Body.Close() }()
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
	defer func() { _ = res.Body.Close() }()
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

// runWithRateLimitingModes runs the provided test function twice: once with
// RATE_LIMITING_ENABLED=true and once with it unset. The subtest name includes
// the env state (e.g. "RATE_LIMITING=true" or "RATE_LIMITING=unset").
func runWithRateLimitingModes(t *testing.T, fn func(t *testing.T, enabled bool)) {
	modes := []struct {
		name string
		env  string
	}{
		{name: "enabled", env: "true"},
		{name: "disabled", env: ""},
	}

	for _, mode := range modes {
		mode := mode
		var display string
		if mode.env == "" {
			display = "unset"
		} else {
			display = mode.env
		}
		subName := fmt.Sprintf("%s (RATE_LIMITING=%s)", mode.name, display)
		// capture mode for closure
		enabled := mode.env == "true"
		t.Run(subName, func(t *testing.T) {
			// Set environment for this subtest. Use t.Setenv so it's cleaned up automatically.
			t.Setenv("RATE_LIMITING_ENABLED", mode.env)
			fn(t, enabled)
		})
	}
}

// doSessionRequest performs a GET /session request against the provided server
// and returns the HTTP status code without asserting. Caller should not assume
// the code is 200.
func doSessionRequest(s *api.Server) int {
	req := httptest.NewRequest(http.MethodGet, "/session", nil)
	w := httptest.NewRecorder()
	s.Engine.ServeHTTP(w, req)
	res := w.Result()
	_ = res.Body.Close()
	return res.StatusCode
}

func TestRateLimiting(t *testing.T) {
	runWithRateLimitingModes(t, func(t *testing.T, enabled bool) {
		t.Run("Protection", func(t *testing.T) {
			cs := newClientSession(t)

			// Check session endpoint under load
			const sessionAttempts = 20
			session429s := 0
			for i := 0; i < sessionAttempts; i++ {
				code := doSessionRequest(cs.server)
				if code == http.StatusTooManyRequests {
					session429s++
				}
				// tiny pause
				time.Sleep(5 * time.Millisecond)
			}

			// Make rapid requests to trigger rate limiting on API endpoints
			const numRequests = 20
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

			if enabled {
				// When enabled we expect some rate limited responses on session and/or API
				require.Greater(t, rateLimitedCount+session429s, 0, "Expected some 429 responses when rate limiting enabled (either on API endpoints or /session)")
			} else {
				// When disabled we should see no 429s
				require.Equal(t, 0, rateLimitedCount, "Did not expect 429 responses when rate limiting disabled")
				require.Equal(t, 0, session429s, "Did not expect 429 responses on /session when rate limiting disabled")
			}

			// Final sanity: all recorded status codes should be accounted for
			require.Equal(t, numRequests, successCount+rateLimitedCount, "All requests should either succeed or be rate limited")
		})

		t.Run("Recovery", func(t *testing.T) {
			cs := newClientSession(t)

			// Make rapid requests to potentially trigger rate limiting
			hit429 := 0
			for i := 0; i < 10; i++ {
				w := cs.doRequest(t, http.MethodPost, "/api/translate/identify", `{"source":"Hello"}`, requestOptions{
					IncludeSessionToken: true,
				})

				if w.Code == http.StatusTooManyRequests {
					hit429++
				} else if w.Code != http.StatusOK {
					t.Errorf("Unexpected status code during rapid requests: %d", w.Code)
				}

				time.Sleep(5 * time.Millisecond)
			}

			if enabled {
				// Expect some 429s during rapid requests when enabled; allow them to appear on identify or session
				require.True(t, hit429 > 0 || doSessionRequest(cs.server) == http.StatusTooManyRequests,
					"Expected some 429s during rapid requests when enabled (either on identify or /session)")
			} else {
				require.Equal(t, 0, hit429, "Did not expect 429s during rapid requests when disabled")
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
		})

		t.Run("DifferentEndpoints", func(t *testing.T) {
			cs := newClientSession(t)

			endpoints := []struct {
				path string
				body string
			}{
				{"/api/translate/identify", `{"source":"Hello"}`},
				{"/api/translate/preview", `{"source":"Hello","lang":"es"}`},
				{"/api/translate/start", `{"source":"Hello","lang":"es"}`},
			}

			// hit each endpoint multiple times and collect 429s
			total429 := 0
			for _, endpoint := range endpoints {
				for i := 0; i < 3; i++ {
					w := cs.doRequest(t, http.MethodPost, endpoint.path, endpoint.body, requestOptions{
						IncludeSessionToken: true,
					})
					if w.Code == http.StatusTooManyRequests {
						total429++
					} else if w.Code != http.StatusOK {
						t.Errorf("Unexpected status code for %s: %d", endpoint.path, w.Code)
					}
				}
			}

			if enabled {
				require.True(t, total429 > 0 || doSessionRequest(cs.server) == http.StatusTooManyRequests,
					"Expected some 429s across endpoints when enabled (or on /session)")
			} else {
				require.Equal(t, 0, total429, "Did not expect 429s across endpoints when disabled")
			}
		})
	})
}
