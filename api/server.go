package api

import (
	"BabelBridge/service"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	limiterpkg "github.com/ulule/limiter/v3"
	ginlimiter "github.com/ulule/limiter/v3/drivers/middleware/gin"
	memory "github.com/ulule/limiter/v3/drivers/store/memory"
)

// Session duration for contexts and access
const sessionTTL = 7 * 24 * time.Hour

type Server struct {
	Engine         *gin.Engine
	svc            service.TranslationService
	sessions       *sessionStore
	contexts       *contextStore
	CookieName     string
	cookieSecure   bool
	cookieSameSite http.SameSite
}

// NewServer builds a new server with default 1-week TTLs.
func NewServer(svc service.TranslationService, secretKey string) *Server {
	return NewServerWithTTLs(svc, sessionTTL, sessionTTL, secretKey)
}

// NewServerWithTTLs builds a new server with custom TTLs.
func NewServerWithTTLs(svc service.TranslationService, sessTTL, ctxTTL time.Duration, secretKey string) *Server {
	r := gin.Default()

	// load the secret key from the environment. if it doesn't exist, generate a random one.
	if len(secretKey) == 0 {
		slog.Warn("SECRET_KEY not set, generating random one")
		secretKey = service.RandomToken()
	}

	store := cookie.NewStore([]byte(secretKey))
	r.Use(sessions.Sessions("session", store))

	s := &Server{
		Engine:         r,
		svc:            svc,
		sessions:       newSessionStore(sessTTL),
		contexts:       newContextStore(ctxTTL),
		CookieName:     "session_token",
		cookieSecure:   false,
		cookieSameSite: http.SameSiteLaxMode,
	}

	// rate limiting setup
	memStore := memory.NewStore()
	limiterSession := limiterpkg.New(memStore, limiterpkg.Rate{Period: time.Minute, Limit: 5})
	limiterAPI := limiterpkg.New(memStore, limiterpkg.Rate{Period: time.Minute, Limit: 30})
	limiterSessionMW := ginlimiter.NewMiddleware(limiterSession)
	limiterAPIMW := ginlimiter.NewMiddleware(limiterAPI)

	// serve static assets for the frontend
	r.Static("/assets", "frontend/dist/assets")

	// Root: ensure session and serve SPA
	r.GET("/", func(c *gin.Context) {
		s.issueSessionHandler(c)
		if c.IsAborted() {
			return
		}
		serveSPAIndex(c)
	})

	// manual session creation endpoint when front-end is running on a separate service
	r.GET("/session", limiterSessionMW, func(c *gin.Context) {
		s.issueSessionHandler(c)
		if c.IsAborted() {
			return
		}
		c.Data(http.StatusOK, "text/plain; charset=utf-8", []byte("OK"))
	})

	api := r.Group("/api")
	api.Use(limiterAPIMW)
	api.Use(s.sessionMiddleware())
	{
		api.POST("/translate/start", s.startTranslation)
		api.POST("/translate/improve", s.improveTranslation)
		api.POST("/translate/preview", s.previewTranslation)
		api.POST("/translate/identify", s.identifyLanguage)
	}

	return s
}

// issueSessionHandler ensures a session token cookie is present.
func (s *Server) issueSessionHandler(c *gin.Context) {
	token, err := c.Cookie(s.CookieName)
	if err != nil || !s.sessions.Exists(token) {
		token = service.RandomToken()
		s.sessions.Put(token)
		c.SetSameSite(s.cookieSameSite)
		c.SetCookie(s.CookieName, token, int(sessionTTL.Seconds()), "/", "", s.cookieSecure, true)
	}
	// this is a session wrapper, so the writing will come later
}

// serveSPAIndex serves the SPA index.html or a 500 error if not built.
func serveSPAIndex(c *gin.Context) {
	if f, err := http.Dir("frontend/dist").Open("index.html"); err == nil {
		_ = f.Close()
		c.File("frontend/dist/index.html")
		return
	}
	c.String(http.StatusInternalServerError, "Error: Frontend build not found. Please run 'npm run build' in the frontend directory.")
}

// sessionMiddleware ensures a valid session cookie is present.
func (s *Server) sessionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(s.CookieName)
		if err != nil || !s.sessions.Touch(token) {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		c.Next()
	}
}
