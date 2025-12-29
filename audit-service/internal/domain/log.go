package domain

import (
	"time"
)

// LogLevel represents log severity
type LogLevel string

const (
	LevelInfo  LogLevel = "INFO"
	LevelWarn  LogLevel = "WARN"
	LevelError LogLevel = "ERROR"
)

// SystemLog represents a system log entry
type SystemLog struct {
	Timestamp  time.Time `bson:"timestamp" json:"timestamp"`
	Level      LogLevel  `bson:"level" json:"level"`
	Service    string    `bson:"service" json:"service"`
	Method     string    `bson:"method,omitempty" json:"method,omitempty"`
	Endpoint   string    `bson:"endpoint,omitempty" json:"endpoint,omitempty"`
	Message    string    `bson:"message" json:"message"`
	UserID     string    `bson:"user_id,omitempty" json:"user_id,omitempty"`
	StackTrace string    `bson:"stack_trace,omitempty" json:"stack_trace,omitempty"`
}
