package email

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"path/filepath"
)

// EmailService handles email sending via SMTP
type EmailService struct {
	smtpHost     string
	smtpPort     string
	fromEmail    string
	fromName     string
	appPassword  string
	templatesDir string
}

// EmailData represents dynamic data to inject into email templates
type EmailData struct {
	CustomerName string
	OrderID      string
	Products     []ProductItem
	Total        string
	ShippingInfo ShippingInfo
}

// ProductItem represents a product in the order
type ProductItem struct {
	Name     string
	Quantity int
	Price    string
}

// ShippingInfo represents shipping details
type ShippingInfo struct {
	Address    string
	Number     string
	Floor      string
	Apartment  string
	City       string
	Province   string
	PostalCode string
	Country    string
}

// VerificationEmailData represents data for email verification template
type VerificationEmailData struct {
	UserName         string
	VerificationLink string
}

// ResetPasswordEmailData represents data for reset password template
type ResetPasswordEmailData struct {
	UserName          string
	ResetPasswordLink string
}

// NewEmailService creates a new email service
func NewEmailService() (*EmailService, error) {
	// Try GMAIL_USER first, then SMTP_USERNAME
	smtpUser := getEnv("GMAIL_USER", os.Getenv("SMTP_USERNAME"))
	// Try GMAIL_APP_PASSWORD first, then SMTP_PASSWORD
	smtpPassword := getEnv("GMAIL_APP_PASSWORD", os.Getenv("SMTP_PASSWORD"))

	fromName := getEnv("SMTP_FROM_NAME", "E-Commerce Platform")
	smtpHost := getEnv("SMTP_HOST", "smtp.gmail.com")
	smtpPort := getEnv("SMTP_PORT", "587")

	if smtpUser == "" {
		return nil, fmt.Errorf("GMAIL_USER or SMTP_USERNAME environment variable is required")
	}
	if smtpPassword == "" {
		return nil, fmt.Errorf("GMAIL_APP_PASSWORD or SMTP_PASSWORD environment variable is required")
	}

	// Get templates directory (relative to the service root)
	templatesDir := getEnv("EMAIL_TEMPLATES_DIR", "./templates")

	return &EmailService{
		smtpHost:     smtpHost,
		smtpPort:     smtpPort,
		fromEmail:    smtpUser,
		fromName:     fromName,
		appPassword:  smtpPassword,
		templatesDir: templatesDir,
	}, nil
}

// SendEmail sends an email with the specified template and data
func (s *EmailService) SendEmail(to, subject, templateName string, data interface{}) error {
	// Render the HTML body from template
	body, err := s.renderTemplate(templateName, data)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	// Prepare email message
	message := s.buildEmailMessage(to, subject, body)

	// Connect to SMTP server and send
	auth := smtp.PlainAuth("", s.fromEmail, s.appPassword, s.smtpHost)
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)

	err = smtp.SendMail(addr, auth, s.fromEmail, []string{to}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// SendSimpleEmail sends a plain text email without template
func (s *EmailService) SendSimpleEmail(to, subject, body string) error {
	message := s.buildEmailMessage(to, subject, body)

	auth := smtp.PlainAuth("", s.fromEmail, s.appPassword, s.smtpHost)
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)

	err := smtp.SendMail(addr, auth, s.fromEmail, []string{to}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// renderTemplate loads and renders an HTML template with the given data
func (s *EmailService) renderTemplate(templateName string, data interface{}) (string, error) {
	// Construct full path to template file
	templatePath := filepath.Join(s.templatesDir, templateName)

	// Check if file exists
	if _, err := os.Stat(templatePath); os.IsNotExist(err) {
		return "", fmt.Errorf("template file not found: %s", templatePath)
	}

	// Parse the template
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	// Execute template with data
	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// buildEmailMessage constructs the email message with headers
func (s *EmailService) buildEmailMessage(to, subject, body string) string {
	from := fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail)

	message := fmt.Sprintf("From: %s\r\n", from)
	message += fmt.Sprintf("To: %s\r\n", to)
	message += fmt.Sprintf("Subject: %s\r\n", subject)
	message += "MIME-Version: 1.0\r\n"
	message += "Content-Type: text/html; charset=UTF-8\r\n"
	message += "\r\n"
	message += body

	return message
}

// getEnv gets environment variable or returns default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
