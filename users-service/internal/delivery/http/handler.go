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

// VerifyEmail handles email verification via token
func (h *Handler) VerifyEmail(c *gin.Context) {
	token := c.Param("token")

	if token == "" {
		c.HTML(http.StatusBadRequest, "", gin.H{
			"content": `
				<!DOCTYPE html>
				<html>
				<head><title>Error de Verificación</title></head>
				<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
					<h1 style="color: #dc2626;">❌ Token Inválido</h1>
					<p>El link de verificación es inválido.</p>
				</body>
				</html>
			`,
		})
		return
	}

	// Verify email using token
	err := h.emailUseCase.VerifyEmail(c.Request.Context(), token)
	if err != nil {
		c.Data(http.StatusNotFound, "text/html; charset=utf-8", []byte(`
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Error de Verificación</title>
				<style>
					body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f4f4f4; }
					.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
					h1 { color: #dc2626; }
					p { color: #666; font-size: 16px; }
				</style>
			</head>
			<body>
				<div class="container">
					<h1>❌ Error de Verificación</h1>
					<p>El token de verificación es inválido o ya ha sido utilizado.</p>
					<p>Si necesitas ayuda, contacta a soporte.</p>
				</div>
			</body>
			</html>
		`))
		return
	}

	// Success response
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Email Verificado</title>
			<style>
				body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f4f4f4; }
				.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
				h1 { color: #16a34a; }
				p { color: #666; font-size: 16px; }
				.checkmark { font-size: 60px; color: #16a34a; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="checkmark">✓</div>
				<h1>¡Email Verificado!</h1>
				<p>Tu email ha sido verificado exitosamente.</p>
				<p>Ya puedes iniciar sesión en tu cuenta.</p>
			</div>
		</body>
		</html>
	`))
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
		c.Data(http.StatusBadRequest, "text/html; charset=utf-8", []byte(`
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Error</title>
				<style>
					body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f4f4f4; }
					.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
					h1 { color: #dc2626; }
					p { color: #666; font-size: 16px; }
				</style>
			</head>
			<body>
				<div class="container">
					<h1>❌ Link Inválido</h1>
					<p>El link de restablecimiento de contraseña es inválido.</p>
				</div>
			</body>
			</html>
		`))
		return
	}

	// Display password reset form
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(`
		<!DOCTYPE html>
		<html lang="es">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Restablecer Contraseña</title>
			<style>
				body {
					font-family: 'Helvetica Neue', Arial, sans-serif;
					line-height: 1.6;
					color: #333;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					margin: 0;
					padding: 20px;
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.container {
					max-width: 500px;
					width: 100%;
					background: #ffffff;
					border-radius: 12px;
					overflow: hidden;
					box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
				}

				.header {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: #ffffff;
					padding: 30px 20px;
					text-align: center;
				}

				.header h1 {
					margin: 0;
					font-size: 28px;
					font-weight: 600;
				}

				.content {
					padding: 40px 30px;
				}

				.form-group {
					margin-bottom: 25px;
				}

				label {
					display: block;
					margin-bottom: 8px;
					color: #333;
					font-weight: 600;
					font-size: 14px;
				}

				input[type="password"] {
					width: 100%;
					padding: 12px 15px;
					border: 2px solid #e0e0e0;
					border-radius: 8px;
					font-size: 16px;
					transition: border-color 0.3s;
					box-sizing: border-box;
				}

				input[type="password"]:focus {
					outline: none;
					border-color: #667eea;
				}

				.button {
					width: 100%;
					padding: 15px;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: #ffffff;
					border: none;
					border-radius: 25px;
					font-size: 16px;
					font-weight: 600;
					cursor: pointer;
					transition: transform 0.2s, box-shadow 0.2s;
				}

				.button:hover {
					transform: translateY(-2px);
					box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
				}

				.button:active {
					transform: translateY(0);
				}

				.button:disabled {
					opacity: 0.6;
					cursor: not-allowed;
					transform: none;
				}

				.message {
					padding: 12px;
					border-radius: 8px;
					margin-bottom: 20px;
					display: none;
					text-align: center;
				}

				.message.success {
					background: #d1fae5;
					color: #065f46;
					border: 1px solid #10b981;
				}

				.message.error {
					background: #fee2e2;
					color: #991b1b;
					border: 1px solid #dc2626;
				}

				.info-box {
					background: #f8f9fa;
					border-left: 4px solid #667eea;
					padding: 15px;
					margin-bottom: 20px;
					border-radius: 4px;
					font-size: 14px;
					color: #666;
				}

				@media only screen and (max-width: 600px) {
					.container {
						margin: 0;
						border-radius: 8px;
					}

					.content {
						padding: 30px 20px;
					}
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>🔑 Restablecer Contraseña</h1>
				</div>

				<div class="content">
					<div class="info-box">
						Por favor, ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
					</div>

					<div id="message" class="message"></div>

					<form id="resetForm">
						<div class="form-group">
							<label for="password">Nueva Contraseña</label>
							<input type="password" id="password" name="password" required minlength="6" 
								placeholder="Ingresa tu nueva contraseña">
						</div>

						<div class="form-group">
							<label for="confirmPassword">Confirmar Contraseña</label>
							<input type="password" id="confirmPassword" name="confirmPassword" required minlength="6"
								placeholder="Confirma tu nueva contraseña">
						</div>

						<button type="submit" class="button" id="submitBtn">
							Restablecer Contraseña
						</button>
					</form>
				</div>
			</div>

			<script>
				const form = document.getElementById('resetForm');
				const messageDiv = document.getElementById('message');
				const submitBtn = document.getElementById('submitBtn');
				const token = '`+token+`';

				form.addEventListener('submit', async (e) => {
					e.preventDefault();
					
					const password = document.getElementById('password').value;
					const confirmPassword = document.getElementById('confirmPassword').value;

					// Validate passwords match
					if (password !== confirmPassword) {
						showMessage('Las contraseñas no coinciden', 'error');
						return;
					}

					// Validate password length
					if (password.length < 6) {
						showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
						return;
					}

					// Disable button and show loading
					submitBtn.disabled = true;
					submitBtn.textContent = 'Procesando...';

					try {
						const response = await fetch('/api/v1/auth/reset-password', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								token: token,
								password: password
							})
						});

						const data = await response.json();

						if (response.ok) {
							showMessage('¡Contraseña restablecida exitosamente! Redirigiendo...', 'success');
							setTimeout(() => {
								// Redirect to login or home page
								window.location.href = '/';
							}, 2000);
						} else {
							showMessage(data.error || 'Error al restablecer la contraseña', 'error');
							submitBtn.disabled = false;
							submitBtn.textContent = 'Restablecer Contraseña';
						}
					} catch (error) {
						showMessage('Error de conexión. Por favor, intenta nuevamente.', 'error');
						submitBtn.disabled = false;
						submitBtn.textContent = 'Restablecer Contraseña';
					}
				});

				function showMessage(text, type) {
					messageDiv.textContent = text;
					messageDiv.className = 'message ' + type;
					messageDiv.style.display = 'block';
				}
			</script>
		</body>
		</html>
	`))
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
