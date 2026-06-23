package http

import (
	"embed"
	"html/template"
	"net/http"

	"proyecto-ecommerce/shared/jwt"
	"users-service/internal/domain"
	"users-service/internal/usecase"

	"github.com/gin-gonic/gin"
)

//go:embed templates
var templateFiles embed.FS

// Handler handles HTTP requests for users
type Handler struct {
	authUseCase  *usecase.AuthUseCase
	emailUseCase *usecase.EmailUseCase
	jwtSecret    string
}

// NewHandler creates a new HTTP handler
func NewHandler(authUseCase *usecase.AuthUseCase, emailUseCase *usecase.EmailUseCase, jwtSecret string) *Handler {
	return &Handler{
		authUseCase:  authUseCase,
		emailUseCase: emailUseCase,
		jwtSecret:    jwtSecret,
	}
}

// RegisterRequest represents registration request body
type RegisterRequest = domain.RegisterRequest

// LoginRequest represents login request body
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Token string              `json:"token"`
	User  domain.UserResponse `json:"user"`
}

// Register handles user registration
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := &domain.User{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		DNI:       req.DNI,
		Email:     req.Email,
		Phone:     req.Phone,
		Address: domain.Address{
			Street:    req.Street,
			Number:    req.Number,
			Floor:     req.Floor,
			Apartment: req.Apartment,
			City:      req.City,
			Province:  req.Province,
			Country:   req.Country,
			ZipCode:   req.ZipCode,
		},
		Password: req.Password,
	}

	createdUser, err := h.authUseCase.Register(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    createdUser.ToResponse(),
	})
}

// Login handles user login
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.authUseCase.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Generate JWT token
	token, err := jwt.GenerateToken(user.ID.Hex(), user.IsAdmin, h.jwtSecret, 24) // 24 hours
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  user.ToResponse(),
	})
}

// GetProfile retrieves user profile
func (h *Handler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.authUseCase.GetProfile(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

func (h *Handler) GetUserInformation(c *gin.Context) {

	userID := c.Param("id")

	user, err := h.authUseCase.GetUserInformation(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)

}

// UpdateProfile updates user profile
func (h *Handler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req domain.UpdateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedUser, err := h.authUseCase.UpdateProfile(c.Request.Context(), userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    updatedUser,
	})
}

func (h *Handler) IsVerifiedUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user ID is required"})
		return
	}

	isVerified, err := h.authUseCase.IsVerifiedUser(c.Request.Context(), userID)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"isVerified": isVerified,
	})
}

// ResendVerificationEmail handles re-sending the verification email
func (h *Handler) ResendVerificationEmail(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.authUseCase.ResendVerificationEmail(c.Request.Context(), req.Email)
	if err != nil {
		if err.Error() == "email already verified" {
			c.JSON(http.StatusConflict, gin.H{"error": "El email ya fue verificado"})
			return
		}
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email de verificación reenviado exitosamente"})
}

// VerifyEmail handles email verification via token
func (h *Handler) VerifyEmail(c *gin.Context) {
	token := c.Param("token")

	if token == "" {
		content, _ := templateFiles.ReadFile("templates/verify_email_invalid_token.html")
		c.Data(http.StatusBadRequest, "text/html; charset=utf-8", content)
		return
	}

	// Verify email using token
	err := h.emailUseCase.VerifyEmail(c.Request.Context(), token)
	if err != nil {
		content, _ := templateFiles.ReadFile("templates/verify_email_error.html")
		c.Data(http.StatusNotFound, "text/html; charset=utf-8", content)
		return
	}

	// Success response
	content, _ := templateFiles.ReadFile("templates/verify_email_success.html")
	c.Data(http.StatusOK, "text/html; charset=utf-8", content)
}

func (h *Handler) SendResetPasswordEmail(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.authUseCase.SendResetPasswordEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reset password email sent successfully"})
}

func (h *Handler) ShowResetPasswordForm(c *gin.Context) {
	token := c.Param("token")

	if token == "" {
		content, _ := templateFiles.ReadFile("templates/reset_password_invalid.html")
		c.Data(http.StatusBadRequest, "text/html; charset=utf-8", content)
		return
	}

	// Display password reset form with token injected
	tmpl, err := template.ParseFS(templateFiles, "templates/reset_password_form.html")
	if err != nil {
		c.Data(http.StatusInternalServerError, "text/html; charset=utf-8", []byte("Error loading template"))
		return
	}

	c.Status(http.StatusOK)
	c.Header("Content-Type", "text/html; charset=utf-8")
	tmpl.Execute(c.Writer, gin.H{"Token": token})
}

func (h *Handler) ResetPassword(c *gin.Context) {
	var req struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.authUseCase.ResetPassword(c.Request.Context(), req.Token, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
