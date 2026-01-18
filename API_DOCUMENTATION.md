# KeyTurn Backend API Documentation

This document describes all available API endpoints, authentication, roles, request/response shapes, and how to test using Postman.

## Quick Start (Postman)

- Create a Postman environment with:
  - `base_url` = `http://localhost:5001`
  - `token` = empty initially
- In the collection, set Authorization to **Bearer Token** and use `{{token}}`.
- Use **Auth > Login** to get a token and set `token` in the environment.

Example Postman steps for login:
- Method: `POST`
- URL: `{{base_url}}/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```
  {
    "email": "admin@example.com",
    "password": "your-password"
  }
  ```
- After response, copy `token` to the environment.



## Base URL:** `https://keyturn-backend-2.onrender.com`

## Authentication

This API uses JWT Bearer tokens.

- Send `Authorization: Bearer <token>` in every protected request.
- Tokens are issued via `/api/auth/login` or `/api/auth/register`.
- `/api/auth/logout` revokes the current token using a blacklist.

## Roles

Roles: `admin`, `agent`, `customer`.

Most endpoints require `admin` or `agent`. Some are `admin` only. Endpoints below list the required role(s).

## Common Response and Errors

Most successful responses return JSON objects. Errors generally return:
```
{ "message": "Human-readable error" }
```

Common statuses:
- `400` invalid input
- `401` missing/invalid token
- `403` forbidden by role
- `404` not found
- `409` conflict (e.g., duplicate email, license plate, unavailable vehicle)
- `500` server error

## Enums

- `Role`: `admin`, `agent`, `customer`
- `VehicleStatus`: `available`, `rented`, `maintenance`
- `ReservationStatus`: `active`, `completed`, `cancelled`
- `InvoiceStatus`: `draft`, `sent`, `paid`, `void`
- `DamageSeverity`: `low`, `medium`, `high`
- `DamageStatus`: `open`, `in_review`, `resolved`

## System/Docs

### GET `/api/health`
Check server health.

Postman:
- Method: `GET`
- URL: `{{base_url}}/api/health`

### GET `/api/docs`
Swagger UI (if enabled).

### GET `/api/docs.json`
Swagger JSON (if enabled).

## Auth

### POST `/api/auth/register`
Create an admin user (explicitly sets role to `admin`).

Body:
```
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:
```
{
  "message": "Registered successfully",
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "...", "role": "admin", "createdAt": "..." }
}
```

Postman:
- Method: `POST`
- URL: `{{base_url}}/api/auth/register`
- Headers: `Content-Type: application/json`
- Body: raw JSON as above

### POST `/api/auth/login`

Body:
```
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:
```
{
  "message": "Logged in successfully",
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "...", "role": "admin", "createdAt": "..." }
}
```

Postman:
- Method: `POST`
- URL: `{{base_url}}/api/auth/login`
- Headers: `Content-Type: application/json`
- Body: raw JSON as above

### POST `/api/auth/logout` (Auth required)
Revokes current token.

Postman:
- Method: `POST`
- URL: `{{base_url}}/api/auth/logout`
- Authorization: `Bearer {{token}}`

Response:
```
{ "message": "Logged out successfully" }
```

### GET `/api/auth/me` (Auth required)
Returns current user.

Postman:
- Method: `GET`
- URL: `{{base_url}}/api/auth/me`
- Authorization: `Bearer {{token}}`

Response:
```
{ "user": { "id": "...", "name": "...", "email": "...", "role": "...", "createdAt": "..." } }
```

## Agents (Admin only)

### GET `/api/agents`
List all agents.

Postman:
- Method: `GET`
- URL: `{{base_url}}/api/agents`
- Authorization: `Bearer {{token}}`

### POST `/api/agents`
Create a new agent user.

Body:
```
{
  "name": "Agent Name",
  "email": "agent@example.com",
  "password": "secret123"
}
```

Postman:
- Method: `POST`
- URL: `{{base_url}}/api/agents`
- Authorization: `Bearer {{token}}`
- Headers: `Content-Type: application/json`
- Body: raw JSON as above

### PUT `/api/agents/:id`
Update an agent. `role` and `passwordHash` are ignored.

Body (example):
```
{
  "name": "Updated Name",
  "email": "new-email@example.com"
}
```

Postman:
- Method: `PUT`
- URL: `{{base_url}}/api/agents/{{agent_id}}`
- Authorization: `Bearer {{token}}`
- Headers: `Content-Type: application/json`

### DELETE `/api/agents/:id`
Delete an agent.

Postman:
- Method: `DELETE`
- URL: `{{base_url}}/api/agents/{{agent_id}}`
- Authorization: `Bearer {{token}}`

## Customers (Admin, Agent)

### GET `/api/customers`
Query customers. Optional `q` searches by name, email, phone, or driver license.

Query params:
- `q` string (optional)

Postman:
- Method: `GET`
- URL: `{{base_url}}/api/customers?q=Ali`
- Authorization: `Bearer {{token}}`

### GET `/api/customers/:id`
Fetch single customer.

Postman:
- Method: `GET`
- URL: `{{base_url}}/api/customers/{{customer_id}}`
- Authorization: `Bearer {{token}}`

### POST `/api/customers`
Create a customer.

Body (example):
```
{
  "fullName": "Ali Khan",
  "email": "ali@example.com",
  "phone": "+1-555-0101",
  "driverLicense": "D1234567",
  "address": "123 Main St",
  "notes": "VIP"
}
```

Postman:
- Method: `POST`
- URL: `{{base_url}}/api/customers`
- Authorization: `Bearer {{token}}`
- Headers: `Content-Type: application/json`

### PUT `/api/customers/:id`
Update a customer.

Body: any customer fields

### DELETE `/api/customers/:id` (Admin only)
Delete a customer.

## Vehicles (Admin, Agent for read; Admin only for write)

### GET `/api/vehicles`
Filters: `status`, `category`, `q` (make/model/license plate).

Postman:
- Method: `GET`
- URL: `{{base_url}}/api/vehicles?status=available&category=SUV&q=Toyota`
- Authorization: `Bearer {{token}}`

### GET `/api/vehicles/:id`

### POST `/api/vehicles` (Admin only)
Body (example):
```
{
  "make": "Toyota",
  "model": "Corolla",
  "year": 2022,
  "color": "White",
  "licensePlate": "ABC-123",
  "mileage": 12000,
  "category": "Sedan",
  "status": "available",
  "dailyRate": 45.0,
  "features": ["bluetooth", "backup camera"],
  "nextServiceDate": "2026-02-01T00:00:00.000Z"
}
```

### PUT `/api/vehicles/:id` (Admin only)
Update any vehicle fields.

### DELETE `/api/vehicles/:id` (Admin only)

## Reservations (Auth required)

### GET `/api/reservations`
Filters: `status`, `vehicleId`, `customerId`.

Postman:
- Method: `GET`
- URL: `{{base_url}}/api/reservations?status=active`
- Authorization: `Bearer {{token}}`

### POST `/api/reservations`
Creates reservation and marks vehicle as `rented`.

Body:
```
{
  "vehicleId": "vehicle_id",
  "customerId": "customer_id",
  "startDate": "2026-01-18T10:00:00.000Z",
  "endDate": "2026-01-20T10:00:00.000Z",
  "notes": "Needs child seat"
}
```

### PUT `/api/reservations/:id`
Updates reservation. If `customerId` changes, snapshot fields update. Dates must be ISO strings.

### DELETE `/api/reservations/:id`
Cancels reservation and sets vehicle back to `available`.

## Invoices (Admin, Agent)

### GET `/api/invoices`
Filter by `status`.

### GET `/api/invoices/:id`

### POST `/api/invoices/from-reservation/:reservationId`
Builds an invoice based on reservation dates and vehicle daily rate.

Body (optional):
```
{
  "tax": 5,
  "discount": 10,
  "notes": "Promo code applied"
}
```

### PUT `/api/invoices/:id`
Updates invoice. If `status` becomes `paid` and `paidAt` is missing, it is set automatically.

Body (example):
```
{
  "status": "paid",
  "paidAt": "2026-01-21T12:00:00.000Z",
  "notes": "Paid in cash"
}
```

### DELETE `/api/invoices/:id` (Admin only)

## Damage Reports (Admin, Agent)

### GET `/api/damage-reports`
Filters: `status`, `severity`, `vehicleId`.

### POST `/api/damage-reports`
`reportedByUserId` is set automatically to the current user.

Body (example):
```
{
  "vehicleId": "vehicle_id",
  "reservationId": "reservation_id",
  "title": "Scratch on front bumper",
  "description": "Left side bumper scratched",
  "severity": "low",
  "status": "open",
  "costEstimate": 120,
  "photos": ["https://.../photo1.jpg"],
  "occurredAt": "2026-01-19T09:00:00.000Z"
}
```

### PUT `/api/damage-reports/:id`
Update report fields (including `status` and `severity`).

### DELETE `/api/damage-reports/:id` (Admin only)

## Rate Plans (Admin, Agent for read; Admin only for write)

### GET `/api/rate-plans`
Filter by `active=true|false`.

### POST `/api/rate-plans` (Admin only)
Body (example):
```
{
  "name": "Standard",
  "category": "Sedan",
  "baseDailyRate": 55,
  "weekendMultiplier": 1.2,
  "weeklyDiscountPercent": 10,
  "active": true,
  "notes": "Default pricing"
}
```

### PUT `/api/rate-plans/:id` (Admin only)
### DELETE `/api/rate-plans/:id` (Admin only)

## Settings (Admin, Agent for read; Admin only for write)

### GET `/api/settings`
Returns existing settings or creates defaults if none exist.

### PUT `/api/settings` (Admin only)
Body (example):
```
{
  "companyName": "KeyTurn Rentals",
  "currency": "USD",
  "taxRatePercent": 8.5,
  "invoicePrefix": "KT",
  "supportEmail": "support@keyturn.com",
  "supportPhone": "+1-555-0199"
}
```

## Analytics (Admin, Agent)

### GET `/api/analytics/summary`
Returns overall totals:
```
{
  "vehicles": 10,
  "reservations": 25,
  "invoices": 20,
  "activeReservations": 4,
  "availableVehicles": 6,
  "totalRevenue": 12450
}
```

## Note About Entry Points

`lib/app.js` mounts all routes listed above. `server.js` currently mounts only:
- `/api/auth`
- `/api/agents`
- `/api/protected` (simple auth test)

If you run `node server.js`, only those routes are available. If you need the full API, ensure the server uses `lib/app.js` or update the entry point accordingly.
