package messaging

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// NotificationProducer handles publishing notification messages to RabbitMQ
type NotificationProducer struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

// NewNotificationProducer creates a new notification producer
func NewNotificationProducer(rabbitmqURL string) (*NotificationProducer, error) {
	conn, err := amqp.Dial(rabbitmqURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	// Declare exchange (same as in notifications-service)
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
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}

	return &NotificationProducer{
		conn:    conn,
		channel: channel,
	}, nil
}

// PublishEmailNotification publishes an email notification to RabbitMQ
func (p *NotificationProducer) PublishEmailNotification(notification any) error {
	body, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = p.channel.PublishWithContext(
		ctx,
		"notifications_exchange", // exchange
		"notification.email",     // routing key
		false,                    // mandatory
		false,                    // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent, // Make message persistent
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	return nil
}

// PublishWhatsAppNotification publishes a WhatsApp notification to RabbitMQ

// Close closes the channel and connection
func (p *NotificationProducer) Close() error {
	if p.channel != nil {
		p.channel.Close()
	}
	if p.conn != nil {
		return p.conn.Close()
	}
	return nil
}
