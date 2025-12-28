package logger

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// LogLevel represents the severity of a log message
type LogLevel string

const (
	LevelInfo  LogLevel = "INFO"
	LevelWarn  LogLevel = "WARN"
	LevelError LogLevel = "ERROR"
)

// LogMessage represents the structure of a log message
type LogMessage struct {
	Timestamp  time.Time `json:"timestamp"`
	Level      LogLevel  `json:"level"`
	Service    string    `json:"service"`
	Method     string    `json:"method,omitempty"`
	Endpoint   string    `json:"endpoint,omitempty"`
	Message    string    `json:"message"`
	UserID     string    `json:"user_id,omitempty"`
	StackTrace string    `json:"stack_trace,omitempty"`
}

// InternalLogger publishes log messages to RabbitMQ
type InternalLogger struct {
	serviceName string
	channel     *amqp.Channel
	exchange    string
	routingKey  string
}

// NewInternalLogger creates a new logger instance
func NewInternalLogger(serviceName string, rabbitmqURL string) (*InternalLogger, error) {
	conn, err := amqp.Dial(rabbitmqURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	// Declare the logs exchange
	err = channel.ExchangeDeclare(
		"logs_exchange", // name
		"topic",         // type
		true,            // durable
		false,           // auto-deleted
		false,           // internal
		false,           // no-wait
		nil,             // arguments
	)
	if err != nil {
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}

	return &InternalLogger{
		serviceName: serviceName,
		channel:     channel,
		exchange:    "logs_exchange",
		routingKey:  "system.log",
	}, nil
}

// publish sends a log message to RabbitMQ
func (l *InternalLogger) publish(level LogLevel, message, method, endpoint, userID, stackTrace string) {
	logMsg := LogMessage{
		Timestamp:  time.Now(),
		Level:      level,
		Service:    l.serviceName,
		Method:     method,
		Endpoint:   endpoint,
		Message:    message,
		UserID:     userID,
		StackTrace: stackTrace,
	}

	body, err := json.Marshal(logMsg)
	if err != nil {
		log.Printf("Failed to marshal log message: %v", err)
		return
	}

	err = l.channel.Publish(
		l.exchange,   // exchange
		l.routingKey, // routing key
		false,        // mandatory
		false,        // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
	if err != nil {
		log.Printf("Failed to publish log to RabbitMQ: %v", err)
	}
}

// Info logs an informational message
func (l *InternalLogger) Info(message string) {
	l.publish(LevelInfo, message, "", "", "", "")
}

// InfoWithContext logs an informational message with HTTP context
func (l *InternalLogger) InfoWithContext(message, method, endpoint, userID string) {
	l.publish(LevelInfo, message, method, endpoint, userID, "")
}

// Warn logs a warning message
func (l *InternalLogger) Warn(message string) {
	l.publish(LevelWarn, message, "", "", "", "")
}

// WarnWithContext logs a warning message with HTTP context
func (l *InternalLogger) WarnWithContext(message, method, endpoint, userID string) {
	l.publish(LevelWarn, message, method, endpoint, userID, "")
}

// Error logs an error message
func (l *InternalLogger) Error(message string) {
	l.publish(LevelError, message, "", "", "", "")
}

// ErrorWithContext logs an error message with full context including stack trace
func (l *InternalLogger) ErrorWithContext(message, method, endpoint, userID, stackTrace string) {
	l.publish(LevelError, message, method, endpoint, userID, stackTrace)
}

// Close closes the RabbitMQ channel
func (l *InternalLogger) Close() error {
	if l.channel != nil {
		return l.channel.Close()
	}
	return nil
}
