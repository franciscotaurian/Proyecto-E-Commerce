# Sistema de Notificaciones por Email - Ejemplo de Uso

Este documento muestra cómo enviar notificaciones de email usando el servicio de notificaciones.

## Estructura del Mensaje RabbitMQ

### 1. Email Simple (Texto Plano)

Para enviar un email simple sin plantilla HTML:

```json
{
  "to": "cliente@example.com",
  "subject": "Bienvenido a E-Commerce Platform",
  "body": "Gracias por registrarte. Tu cuenta ha sido creada exitosamente."
}
```

**Routing Key:** `notification.email`
**Exchange:** `notifications_exchange`

---

### 2. Email con Plantilla HTML (Confirmación de Orden)

Para enviar un email de confirmación de orden con plantilla HTML:

```json
{
  "to": "cliente@example.com",
  "subject": "✓ Confirmación de Pedido #ORD-12345",
  "template_name": "confirmation_email.html",
  "template_data": {
    "customer_name": "Juan Pérez",
    "order_id": "ORD-12345",
    "total": "$1,250.00 ARS",
    "products": [
      {
        "name": "Laptop Dell XPS 15",
        "quantity": 1,
        "price": "$800.00 ARS"
      },
      {
        "name": "Mouse Logitech MX Master 3",
        "quantity": 2,
        "price": "$225.00 ARS"
      }
    ],
    "shipping_info": {
      "address": "Av. Corrientes 1234, Piso 5, Depto B",
      "city": "Buenos Aires",
      "postal_code": "C1043",
      "country": "Argentina"
    }
  }
}
```

**Routing Key:** `notification.email`
**Exchange:** `notifications_exchange`

---

## Configuración de Variables de Entorno

Antes de usar el servicio, configura las siguientes variables en tu archivo `.env`:

```bash
# Gmail SMTP Configuration
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
SMTP_FROM_NAME=E-Commerce Platform
EMAIL_TEMPLATES_DIR=./templates

# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
```

### Cómo Obtener Gmail App Password

1. Ve a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecciona "Correo" y "Otro dispositivo personalizado"
3. Ingresa "E-Commerce Notifications" como nombre
4. Copia la contraseña de 16 caracteres generada
5. Úsala en `GMAIL_APP_PASSWORD` (sin espacios)

> **Nota:** Debes tener la verificación en dos pasos activada en tu cuenta de Gmail para poder crear contraseñas de aplicación.

---

## Ejemplo de Código para Publicar Mensajes

### Desde Go (Payment Service)

```go
import (
    "encoding/json"
    "proyecto-ecommerce/shared/messaging"
)

// Enviar email de confirmación
notification := map[string]interface{}{
    "to": order.CustomerEmail,
    "subject": "✓ Confirmación de Pedido #" + order.ID,
    "template_name": "confirmation_email.html",
    "template_data": map[string]interface{}{
        "customer_name": order.CustomerName,
        "order_id": order.ID,
        "total": fmt.Sprintf("$%.2f ARS", order.Total),
        "products": order.Items,
        "shipping_info": order.ShippingAddress,
    },
}

payload, _ := json.Marshal(notification)
publisher.Publish("notifications_exchange", "notification.email", payload)
```

---

## Plantillas Disponibles

### confirmation_email.html
Plantilla profesional para confirmación de pedidos con:
- Diseño responsive
- Tabla de productos
- Información de envío
- Diseño moderno con gradientes
- Compatible con clientes de email móviles

### Crear Nueva Plantilla

1. Crea un archivo `.html` en `notifications-service/templates/`
2. Usa sintaxis de Go templates: `{{.VariableName}}`
3. Puedes iterar listas: `{{range .Products}} ... {{end}}`
4. Accede a campos anidados: `{{.ShippingInfo.Address}}`

---

## Testing

### Probar con RabbitMQ Management

1. Abre [http://localhost:15672](http://localhost:15672) (guest/guest)
2. Ve a "Exchanges" → `notifications_exchange`
3. En "Publish message":
   - Routing key: `notification.email`
   - Payload: Copia uno de los JSON de ejemplo de arriba
4. Click "Publish message"
5. Revisa tu bandeja de entrada

---

## Logs y Debugging

El servicio logueará:
- ✓ Email enviado exitosamente
- ✗ Errores de SMTP (credenciales incorrectas, límite de tasa)
- ✗ Errores de plantilla (archivo no encontrado, variables faltantes)

Verifica los logs con:
```bash
docker logs ecommerce-notifications-service -f
```
