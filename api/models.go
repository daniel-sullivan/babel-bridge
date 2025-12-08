package api

// startTranslation request and response models
type StartRequest struct {
	Source string `json:"source" binding:"required"`
	Lang   string `json:"lang" binding:"required"`
}
type StartResponse struct {
	ContextID  string `json:"contextId"`
	Result     string `json:"result"`
	SourceLang string `json:"sourceLang"`
}

// improveTranslation request and response models
type ImproveRequest struct {
	ContextID string `json:"contextId" binding:"required"`
	Feedback  string `json:"feedback" binding:"required"`
}
type ImproveResponse struct {
	Result string `json:"result"`
}

// previewTranslation request and response models
type PreviewRequest struct {
	Source string `json:"source" binding:"required"`
	Lang   string `json:"lang" binding:"required"`
}
type PreviewResponse struct {
	Result string `json:"result"`
}

// identifyLanguage request and response models
type IdentifyRequest struct {
	Source string `json:"source" binding:"required"`
}
type IdentifyResponse struct {
	Lang string `json:"lang"`
}
