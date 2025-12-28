package http

import (
	"net/http"

	"proyecto-ecommerce/shared/jwt"
	"users-service/internal/domain"
	"users-service/internal/usecase"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for users
type Handler struct {
	authUseCase *usecase.AuthUseCase
	jwtSecret   string
}

// NewHandler creates a new HTTP handler
func NewHandler(authUseCase *usecase.AuthUseCase, jwtSecret string) *Handler {
	return &Handler{
		authUseCase: authUseCase,
		jwtSecret:   jwtSecret,
	}
}

// RegisterRequest represents registration request body
type RegisterRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	DNI       string `json:"dni" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Phone     string `json:"phone" binding:"required"`
	Street    string `json:"street"`
	Number    string `json:"number"`
	Floor     string `json:"floor"`
	Apartment string `json:"apartment"`
	City      string `json:"city"`
	Province  string `json:"province"`
	Country   string `json:"country"`
	ZipCode   string `json:"zip_code"`
	Password  string `json:"password" binding:"required,min=6"`
}

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
	token, err := jwt.GenerateToken(user.ID.Hex(), h.jwtSecret, 24) // 24 hours
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

	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Phone     string `json:"phone"`
		Street    string `json:"street"`
		Number    string `json:"number"`
		Floor     string `json:"floor"`
		Apartment string `json:"apartment"`
		City      string `json:"city"`
		Province  string `json:"province"`
		Country   string `json:"country"`
		ZipCode   string `json:"zip_code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing user
	user, err := h.authUseCase.GetProfile(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update fields
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Street != "" {
		user.Address.Street = req.Street
	}
	if req.Number != "" {
		user.Address.Number = req.Number
	}
	if req.Floor != "" {
		user.Address.Floor = req.Floor
	}
	if req.Apartment != "" {
		user.Address.Apartment = req.Apartment
	}
	if req.City != "" {
		user.Address.City = req.City
	}
	if req.Province != "" {
		user.Address.Province = req.Province
	}
	if req.Country != "" {
		user.Address.Country = req.Country
	}
	if req.ZipCode != "" {
		user.Address.ZipCode = req.ZipCode
	}
	err = h.authUseCase.UpdateProfile(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    user.ToResponse(),
	})
}
