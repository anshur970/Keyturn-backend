# KeyTurn Backend

Backend API for a car-rental style system. It manages users/agents, customers, vehicles, reservations, invoices, damage reports, rate plans, settings, and analytics. The API uses JWT auth and PostgreSQL via Prisma.

## Features

- JWT auth (register, login, logout, me)
- Role-based access control (`admin`, `agent`)
- Customers, vehicles, reservations, invoices, damage reports
- Rate plans and settings management
- Analytics summary endpoint
- Prisma ORM with PostgreSQL

## Tech Stack

- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT authentication

## Project Structure

- `server.js` - current entry point (mounts only auth + agents + /api/protected)
- `lib/app.js` - full API app with all routes and Swagger endpoints
- `routes/` - REST endpoints
- `middleware/` - auth, roles, error handling
- `prisma/` - Prisma schema
- `lib/` - Prisma client and app wiring

## Getting Started

### 1) Install dependencies

```
npm install
```

### 2) Configure environment

Create a `.env` file:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

### 3) Prisma setup

```
npm run db:generate
npm run db:push
```

### 4) Run the server

```
npm start
```

Default URL: `http://localhost:5001`

## API Documentation

Detailed API docs with Postman examples are in `API_DOCUMENTATION.md`.

## Swagger (optional)

If the server is running from `lib/app.js`, these are available:

- `GET /api/docs` (Swagger UI)
- `GET /api/docs.json` (Swagger JSON)

## Scripts

- `npm start` - starts `server.js`
- `npm run db:generate` - Prisma client generation
- `npm run db:push` - push schema to DB
- `npm run studio` - Prisma Studio

## Notes / Known Behavior

- `server.js` currently mounts only `/api/auth` and `/api/agents` plus `/api/protected`.
- `lib/app.js` mounts the full API (`/api/vehicles`, `/api/reservations`, etc).
- If you need the full API, run the app from `lib/app.js` or update the entry point.

## Support

If you need changes to endpoints or want a Postman collection export, let me know.