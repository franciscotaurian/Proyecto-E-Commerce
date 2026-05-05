# Proyecto E-Commerce 🛍️

A scalable, resilient, and high-performance full-stack clothing e-commerce platform. Built with a robust microservices architecture to handle high traffic, real-time operations, and seamless third-party integrations.

## 🚀 Overview

This project is a complete end-to-end e-commerce solution tailored for a clothing store. The backend is powered by **Go (Golang)** microservices communicating via **RabbitMQ** and storing data in **MongoDB**, ensuring high availability and scalability. The frontend is built with **React**, providing a smooth and responsive user interface.

## ✨ Key Features

*   **Microservices Architecture**: Independently scalable and maintainable backend services written in Go.
*   **Real-time Stock Reservation**: Prevents overselling by locking inventory momentarily during the checkout process.
*   **Secure Authentication**: Implements JSON Web Tokens (JWT) for secure user sessions and route protection.
*   **Asynchronous Logging**: High-performance, non-blocking logging mechanism across all microservices using RabbitMQ.
*   **Seamless Payments**: Integrated with **Mercado Pago** for secure and localized payment processing.
*   **Logistics & Shipping**: Integrated with **Envio Pack** for real-time shipping rates and logistics management.
*   **Dockerized Deployment**: Fully containerized environment for consistent deployment across development, testing, and production.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React.js
*   **Styling**: Tailwind CSS

### Backend
*   **Language**: Go (Golang)
*   **Architecture**: Microservices
*   **Database**: MongoDB
*   **Message Broker**: RabbitMQ

### Infrastructure & DevOps
*   **Containerization**: Docker & Docker Compose
*   **Payment Gateway**: Mercado Pago API
*   **Logistics**: Envio Pack API

## 🏗️ Architecture

The backend is composed of several microservices Users, Products, Payments. They communicate asynchronously using **RabbitMQ**, which ensures that the system remains resilient even during high loads. 
*   **MongoDB** is used as the primary database due to its flexibility with product catalogs and order documents.
*   **Async Logging** is handled by a dedicated worker that consumes log messages from a RabbitMQ queue, ensuring that I/O operations do not block main application threads.

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
*   [Docker](https://www.docker.com/get-started) and Docker Compose
*   [Go](https://golang.org/dl/) (v1.18+ recommended)
*   [Node.js](https://nodejs.org/) and npm/yarn

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/franciscotaurian/Proyecto-E-Commerce.git](https://github.com/franciscotaurian/Proyecto-E-Commerce.git)
   cd Proyecto-E-Commerce
