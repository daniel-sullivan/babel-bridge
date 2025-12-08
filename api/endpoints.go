package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/text/language"
)

// startTranslation starts a new translation context
func (s *Server) startTranslation(c *gin.Context) {
	var req StartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	tag, err := language.Parse(req.Lang)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid language tag"})
		return
	}
	// identify source language
	identified, err := s.svc.Identify(c, req.Source)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctxID, result, err := s.svc.NewTranslation(c, req.Source, tag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Track context for the session
	sess, _ := c.Cookie(s.CookieName)
	s.contexts.Put(sess, ctxID)
	c.JSON(http.StatusOK, StartResponse{ContextID: ctxID, Result: result, SourceLang: identified.String()})
}

// improveTranslation improves a translation context
func (s *Server) improveTranslation(c *gin.Context) {
	var req ImproveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	sess, _ := c.Cookie(s.CookieName)
	if !s.contexts.Exists(sess, req.ContextID) {
		// Check if it existed but expired
		if s.contexts.wasExpired(sess, req.ContextID) {
			c.JSON(http.StatusGone, gin.H{"error": "context expired"})
		} else {
			c.JSON(http.StatusNotFound, gin.H{"error": "context not found"})
		}
		return
	}
	res, err := s.svc.Improve(c, req.ContextID, req.Feedback)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	s.contexts.Touch(sess, req.ContextID)
	c.JSON(http.StatusOK, ImproveResponse{Result: res})
}

// previewTranslation performs a stateless translation returning only the result without persisting context
func (s *Server) previewTranslation(c *gin.Context) {
	var req PreviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	tag, err := language.Parse(req.Lang)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid language tag"})
		return
	}
	res, err := s.svc.Preview(c, req.Source, tag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, PreviewResponse{Result: res})
}

// identifyLanguage identifies the language of the given source text
func (s *Server) identifyLanguage(c *gin.Context) {
	var req IdentifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	tag, err := s.svc.Identify(c, req.Source)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, IdentifyResponse{Lang: tag.String()})
}
