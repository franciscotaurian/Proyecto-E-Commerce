package messaging

// EmailNotification represents an email notification message
// This structure matches the consumer's expectation in notifications-service
type EmailNotificationConfirmed struct {
	To           string                `json:"to"`
	Subject      string                `json:"subject"`
	Body         string                `json:"body"`          // For simple text emails
	TemplateName string                `json:"template_name"` // Optional: template file name
	TemplateData PaymentConfirmedEvent `json:"template_data"` // Optional: data to inject into template
}

type EmailNotificationSend struct {
	To           string    `json:"to"`
	Subject      string    `json:"subject"`
	Body         string    `json:"body"`          // For simple text emails
	TemplateName string    `json:"template_name"` // Optional: template file name
	TemplateData SendEvent `json:"template_data"` // Optional: data to inject into template
}

type EmailNotificationDelivered struct {
	To           string         `json:"to"`
	Subject      string         `json:"subject"`
	Body         string         `json:"body"`          // For simple text emails
	TemplateName string         `json:"template_name"` // Optional: template file name
	TemplateData DeliveredEvent `json:"template_data"` // Optional: data to inject into template
}

// PaymentConfirmedEvent represents the event data for a confirmed payment
type PaymentConfirmedEvent struct {
	OrderID       string        `json:"order_id"`
	CustomerName  string        `json:"customer_name"`
	CustomerEmail string        `json:"customer_email"`
	Total         string        `json:"total"`
	Products      []ProductItem `json:"products"`
	ShippingInfo  ShippingInfo  `json:"shipping_info"`
}

// ProductItem represents a product in the order
type ProductItem struct {
	Name     string `json:"name"`
	Quantity int    `json:"quantity"`
	Price    string `json:"price"`
}

type SendEvent struct {
	OrderID       string        `json:"order_id"`
	CustomerName  string        `json:"customer_name"`
	CustomerEmail string        `json:"customer_email"`
	TrackID       string        `json:"track_id"`
	Products      []ProductItem `json:"products"`
	ShippingInfo  ShippingInfo  `json:"shipping_info"`
}

type DeliveredEvent struct {
	OrderID       string        `json:"order_id"`
	CustomerName  string        `json:"customer_name"`
	CustomerEmail string        `json:"customer_email"`
	Products      []ProductItem `json:"products"`
	WhatsAppURL   string        `json:"whatsapp_url"`
}

// ShippingInfo represents shipping information for the order
type ShippingInfo struct {
	Address    string `json:"address"`
	Number     string `json:"number"`
	Floor      string `json:"floor"`
	Apartment  string `json:"apartment"`
	City       string `json:"city"`
	Province   string `json:"province"`
	PostalCode string `json:"postal_code"`
	Country    string `json:"country"`
}

// WhatsAppNotification represents a WhatsApp notification message
type WhatsAppNotification struct {
	Message string `json:"message"` // Message content
}
