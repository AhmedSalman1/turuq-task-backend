# Turuq Task Backend

A modular, secure RESTful API for managing user profiles (Task 1: User Data Handling).

## Tech Stack

- **Runtime:** Node.js + TypeScript (Express 5)
- **Database:** MongoDB via Mongoose 9
- **Validation:** Zod 4
- **Auth:** JWT (bearer tokens) + bcrypt password hashing
- **Security:** Helmet, CORS, express-rate-limit, input sanitization, no dynamic query strings (MongoDB ⇒ no SQL injection surface)

## Getting Started

```bash
npm install
cp .env.example .env   # fill in PORT, NODE_ENV, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN
npm run dev
```

## Structure

```
src/
├── app.ts                 # express app, security middleware, rate limiting
├── server.ts              # bootstrap + graceful shutdown on unhandled rejection
├── config/                # env + MongoDB connection
├── controllers/           # auth + user CRUD handlers
├── middleware/            # protect (JWT), validate (Zod + sanitize), errorHandler, notFound, rateLimit
├── models/                # Mongoose schemas + indexes
├── routes/                # auth + user routers
├── utils/                 # AppError, asyncHandler, JWT helpers
├── validators/            # Zod schemas per endpoint
└── types/                 # shared TS interfaces
└── tests/                 # unit tests
```
