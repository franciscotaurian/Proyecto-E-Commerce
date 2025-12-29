package consumer

import (
	"context"
	"encoding/json"
	"log"

	"audit-service/internal/domain"
	"audit-service/internal/repository"

	amqp "github.com/rabbitmq/amqp091-go"
)

// LogConsumer consumes log messages from RabbitMQ
type LogConsumer struct {
	channel *amqp.Channel
	repo    repository.LogRepository
}

// NewLogConsumer creates a new log consumer
func NewLogConsumer(rabbitmqURL string, repo repository.LogRepository) (*LogConsumer, error) {
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
		"logs_exchange",
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

	// Declare queue
	queue, err := channel.QueueDeclare(
		"system_logs",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return nil, err
	}

	// Bind queue to exchange
	err = channel.QueueBind(
		queue.Name,
		"system.log",
		"logs_exchange",
		false,
		nil,
	)
	if err != nil {
		return nil, err
	}

	return &LogConsumer{
		channel: channel,
		repo:    repo,
	}, nil
}

// Start starts consuming log messages
func (c *LogConsumer) Start() error {
	msgs, err := c.channel.Consume(
		"system_logs",
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	log.Println("Audit service started - consuming logs from RabbitMQ...")

	forever := make(chan bool)

	go func() {
		for msg := range msgs {
			c.processMessage(msg.Body)
		}
	}()

	<-forever
	return nil
}

// processMessage processes a single log message
func (c *LogConsumer) processMessage(body []byte) {
	var systemLog domain.SystemLog
	err := json.Unmarshal(body, &systemLog)
	if err != nil {
		log.Printf("Failed to unmarshal log message: %v", err)
		return
	}

	// Insert log into MongoDB
	ctx := context.Background()
	err = c.repo.Insert(ctx, &systemLog)
	if err != nil {
		log.Printf("Failed to insert log into database: %v", err)
		return
	}

	log.Printf("[%s] %s: %s", systemLog.Level, systemLog.Service, systemLog.Message)
}

// Close closes the channel
func (c *LogConsumer) Close() error {
	if c.channel != nil {
		return c.channel.Close()
	}
	return nil
}
