package worker

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"products-service/internal/domain"
	"products-service/internal/repository"

	amqp "github.com/rabbitmq/amqp091-go"
)

// UserCreatedEvent represents a user creation event
type UserCreatedEvent struct {
	UserID    string    `json:"user_id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// CartWorker handles cart-related background tasks
type CartWorker struct {
	cartRepo repository.CartRepository
	channel  *amqp.Channel
}

// NewCartWorker creates a new cart worker
func NewCartWorker(cartRepo repository.CartRepository, rabbitmqURL string) (*CartWorker, error) {
	// Connect to RabbitMQ
	conn, err := amqp.Dial(rabbitmqURL)
	if err != nil {
		return nil, err
	}

	channel, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	// Declare exchange for user events
	err = channel.ExchangeDeclare(
		"user_events_exchange", // name
		"topic",                // type
		true,                   // durable
		false,                  // auto-deleted
		false,                  // internal
		false,                  // no-wait
		nil,                    // arguments
	)
	if err != nil {
		return nil, err
	}

	return &CartWorker{
		cartRepo: cartRepo,
		channel:  channel,
	}, nil
}

// Start begins listening for user events
func (w *CartWorker) Start() error {
	// Declare queue for cart service
	queue, err := w.channel.QueueDeclare(
		"cart_user_events", // name
		true,               // durable
		false,              // delete when unused
		false,              // exclusive
		false,              // no-wait
		nil,                // arguments
	)
	if err != nil {
		return err
	}

	// Bind queue to exchange
	err = w.channel.QueueBind(
		queue.Name,             // queue name
		"user.created",         // routing key
		"user_events_exchange", // exchange
		false,
		nil,
	)
	if err != nil {
		return err
	}

	// Start consuming messages
	msgs, err := w.channel.Consume(
		queue.Name, // queue
		"",         // consumer
		false,      // auto-ack
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // args
	)
	if err != nil {
		return err
	}

	log.Println("Cart worker started, waiting for user.created events...")

	// Process messages in goroutine
	go func() {
		for msg := range msgs {
			w.handleUserCreated(msg)
		}
	}()

	return nil
}

// handleUserCreated handles user creation events
func (w *CartWorker) handleUserCreated(msg amqp.Delivery) {
	var event UserCreatedEvent

	err := json.Unmarshal(msg.Body, &event)
	if err != nil {
		log.Printf("Failed to unmarshal user.created event: %v", err)
		msg.Nack(false, false)
		return
	}

	log.Printf("Received user.created event for user: %s", event.UserID)

	// Create cart for new user
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Import domain package at the top if not already done
	// We need to use the usecase to create the cart properly
	// For now, create directly using repository
	cart := &domain.Cart{
		UserID:    event.UserID,
		Items:     []domain.CartItem{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = w.cartRepo.Create(ctx, cart)
	if err != nil {
		log.Printf("Failed to create cart for user %s: %v", event.UserID, err)
		msg.Nack(false, true) // Requeue message
		return
	}

	log.Printf("Cart created successfully for user: %s", event.UserID)
	msg.Ack(false)
}

// Close closes the worker
func (w *CartWorker) Close() {
	if w.channel != nil {
		w.channel.Close()
	}
}
