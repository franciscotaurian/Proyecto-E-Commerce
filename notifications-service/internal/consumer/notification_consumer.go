package consumer

import (
	"encoding/json"
	"log"

	"notifications-service/internal/email"
	"proyecto-ecommerce/shared/logger"

	amqp "github.com/rabbitmq/amqp091-go"
)

// EmailNotification represents an email notification message
// Supports both simple text emails and templated emails with dynamic data
type EmailNotification struct {
	To           string                 `json:"to"`
	Subject      string                 `json:"subject"`
	Body         string                 `json:"body"`          // For simple text emails
	TemplateName string                 `json:"template_name"` // Optional: template file name (e.g., "confirmation_email.html")
	TemplateData map[string]interface{} `json:"template_data"` // Optional: data to inject into template
}

// NotificationConsumer consumes notification messages from RabbitMQ
type NotificationConsumer struct {
	channel      *amqp.Channel
	emailService *email.EmailService
	logger       *logger.InternalLogger
}

// NewNotificationConsumer creates a new notification consumer
func NewNotificationConsumer(rabbitmqURL string, emailService *email.EmailService, internalLogger *logger.InternalLogger) (*NotificationConsumer, error) {
	conn, err := amqp.Dial(rabbitmqURL)
	if err != nil {
		return nil, err
	}

	channel, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	// Declare exchange
	err = channel.ExchangeDeclare(
		"notifications_exchange",
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return nil, err
	}

	// Declare email queue
	emailQueue, err := channel.QueueDeclare(
		"email_notifications",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return nil, err
	}

	// Bind email queue
	err = channel.QueueBind(
		emailQueue.Name,
		"notification.email",
		"notifications_exchange",
		false,
		nil,
	)
	if err != nil {
		return nil, err
	}

	// Declare shipping queue
	shippingQueue, err := channel.QueueDeclare(
		"shipping_notifications",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return nil, err
	}

	// Bind shipping queue
	err = channel.QueueBind(
		shippingQueue.Name,
		"notification.shipping",
		"notifications_exchange",
		false,
		nil,
	)
	if err != nil {
		return nil, err
	}

	return &NotificationConsumer{
		channel:      channel,
		emailService: emailService,
		logger:       internalLogger,
	}, nil
}

// Start starts consuming notification messages
func (c *NotificationConsumer) Start() error {
	// Consume email notifications
	emailMsgs, err := c.channel.Consume(
		"email_notifications",
		"",
		false, // Changed to manual ack for better error handling
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	// Consume shipping notifications
	shippingMsgs, err := c.channel.Consume(
		"shipping_notifications",
		"",
		false, // Changed to manual ack
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	log.Println("Notifications service started - consuming from RabbitMQ...")
	c.logger.Info("Notifications service started - consuming from RabbitMQ")

	forever := make(chan bool)

	go func() {
		for msg := range emailMsgs {
			success := c.processEmailNotification(msg.Body)
			if success {
				msg.Ack(false)
			} else {
				// Requeue the message if processing failed
				msg.Nack(false, true)
			}
		}
	}()

	go func() {
		for msg := range shippingMsgs {
			c.processShippingNotification(msg.Body)
			msg.Ack(false)
		}
	}()

	<-forever
	return nil
}

// processEmailNotification processes an email notification and sends the email
func (c *NotificationConsumer) processEmailNotification(body []byte) bool {
	var notification EmailNotification
	err := json.Unmarshal(body, &notification)
	if err != nil {
		log.Printf("Failed to unmarshal email notification: %v", err)
		c.logger.Error("Failed to unmarshal email notification: " + err.Error())
		return false
	}

	c.logger.Info("Processing email notification for: " + notification.To)

	// Determine if we should use a template or simple text email
	if notification.TemplateName != "" && notification.TemplateData != nil {
		// Send email with template
		err = c.sendTemplatedEmail(notification)
	} else {
		// Send simple text email
		err = c.emailService.SendSimpleEmail(notification.To, notification.Subject, notification.Body)
	}

	if err != nil {
		log.Printf("Failed to send email to %s: %v", notification.To, err)
		c.logger.Error("Failed to send email to " + notification.To + ": " + err.Error())
		return false
	}

	log.Printf("✓ Email sent successfully to %s (Subject: %s)", notification.To, notification.Subject)
	c.logger.Info("Email sent successfully to " + notification.To)
	return true
}

// sendTemplatedEmail sends an email using an HTML template
func (c *NotificationConsumer) sendTemplatedEmail(notification EmailNotification) error {
	// Convert template data to EmailData struct if it's an order confirmation
	// This allows for type-safe template rendering
	if notification.TemplateName == "confirmation_email.html" {
		emailData := c.convertToEmailData(notification.TemplateData)
		return c.emailService.SendEmail(notification.To, notification.Subject, notification.TemplateName, emailData)
	}

	// Handle verification email
	if notification.TemplateName == "verification_email.html" {
		verificationData := c.convertToVerificationEmailData(notification.TemplateData)
		return c.emailService.SendEmail(notification.To, notification.Subject, notification.TemplateName, verificationData)
	}

	if notification.TemplateName == "reset_password_email.html" {
		resetPasswordData := c.convertToResetPasswordEmailData(notification.TemplateData)
		return c.emailService.SendEmail(notification.To, notification.Subject, notification.TemplateName, resetPasswordData)
	}

	// For other templates, send raw data
	return c.emailService.SendEmail(notification.To, notification.Subject, notification.TemplateName, notification.TemplateData)
}

// convertToEmailData converts map data to EmailData struct for type-safe rendering
func (c *NotificationConsumer) convertToEmailData(data map[string]interface{}) email.EmailData {
	emailData := email.EmailData{}

	// Extract customer name
	if customerName, ok := data["customer_name"].(string); ok {
		emailData.CustomerName = customerName
	}

	// Extract order ID
	if orderID, ok := data["order_id"].(string); ok {
		emailData.OrderID = orderID
	}

	// Extract total
	if total, ok := data["total"].(string); ok {
		emailData.Total = total
	}

	// Extract products
	if productsData, ok := data["products"].([]interface{}); ok {
		for _, p := range productsData {
			if productMap, ok := p.(map[string]interface{}); ok {
				product := email.ProductItem{}
				if name, ok := productMap["name"].(string); ok {
					product.Name = name
				}
				if quantity, ok := productMap["quantity"].(float64); ok {
					product.Quantity = int(quantity)
				}
				if price, ok := productMap["price"].(string); ok {
					product.Price = price
				}
				emailData.Products = append(emailData.Products, product)
			}
		}
	}

	// Extract shipping info
	if shippingData, ok := data["shipping_info"].(map[string]interface{}); ok {
		if address, ok := shippingData["address"].(string); ok {
			emailData.ShippingInfo.Address = address
		}
		if number, ok := shippingData["number"].(string); ok {
			emailData.ShippingInfo.Number = number
		}
		if floor, ok := shippingData["floor"].(string); ok {
			emailData.ShippingInfo.Floor = floor
		}
		if apartment, ok := shippingData["apartment"].(string); ok {
			emailData.ShippingInfo.Apartment = apartment
		}
		if city, ok := shippingData["city"].(string); ok {
			emailData.ShippingInfo.City = city
		}
		if province, ok := shippingData["province"].(string); ok {
			emailData.ShippingInfo.Province = province
		}
		if postalCode, ok := shippingData["postal_code"].(string); ok {
			emailData.ShippingInfo.PostalCode = postalCode
		}
		if country, ok := shippingData["country"].(string); ok {
			emailData.ShippingInfo.Country = country
		}
	}

	return emailData
}

// convertToVerificationEmailData converts map data to VerificationEmailData struct
func (c *NotificationConsumer) convertToVerificationEmailData(data map[string]interface{}) email.VerificationEmailData {
	verificationData := email.VerificationEmailData{}

	// Extract user name
	if userName, ok := data["user_name"].(string); ok {
		verificationData.UserName = userName
	}

	// Extract verification link
	if verificationLink, ok := data["verification_link"].(string); ok {
		verificationData.VerificationLink = verificationLink
	}

	return verificationData
}

// processShippingNotification processes a shipping notification
func (c *NotificationConsumer) processShippingNotification(body []byte) {
	var notification map[string]interface{}
	err := json.Unmarshal(body, &notification)
	if err != nil {
		log.Printf("Failed to unmarshal shipping notification: %v", err)
		c.logger.Error("Failed to unmarshal shipping notification: " + err.Error())
		return
	}

	// TODO: Implement shipping notification logic (call Envio Pack, etc.)
	log.Printf("SHIPPING: %+v", notification)
	c.logger.Info("Shipping notification received (placeholder)")
}

// convertToResetPasswordEmailData converts map data to ResetPasswordEmailData struct
func (c *NotificationConsumer) convertToResetPasswordEmailData(data map[string]interface{}) email.ResetPasswordEmailData {
	resetPasswordData := email.ResetPasswordEmailData{}

	// Extract user name
	if userName, ok := data["user_name"].(string); ok {
		resetPasswordData.UserName = userName
	}

	// Extract reset password link
	if resetPasswordLink, ok := data["reset_password_link"].(string); ok {
		resetPasswordData.ResetPasswordLink = resetPasswordLink
	}

	return resetPasswordData
}

// Close closes the channel
func (c *NotificationConsumer) Close() error {
	if c.channel != nil {
		return c.channel.Close()
	}
	return nil
}
