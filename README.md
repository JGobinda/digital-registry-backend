# Digital Registry Backend

A production-ready REST API built with **Express.js**, **MongoDB**, **JWT authentication**, and **Swagger UI** documentation.

## Tech Stack

- **Runtime**: Node.js ≥ 18
- **Framework**: Express.js 4
- **Database**: MongoDB via Mongoose 8
- **Auth**: JWT (access + refresh tokens), bcryptjs password hashing
- **Docs**: Swagger UI (`/api-docs`)
- **Security**: Helmet, CORS, express-rate-limit, express-validator

---

## Project Structure

```
digital-registry-backend/
├── src/
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   └── swagger.js         # OpenAPI 3.0 spec
│   ├── controllers/
│   │   ├── authController.js  # Register, login, refresh, logout, me
│   │   └── registryController.js  # CRUD for registry entries
│   ├── middleware/
│   │   ├── auth.js            # protect + restrict (role-based)
│   │   ├── validate.js        # express-validator error handler
│   │   └── errorHandler.js    # Global 404 + error handler
│   ├── models/
│   │   ├── User.js            # User schema with bcrypt hooks
│   │   └── RegistryEntry.js   # Registry entry schema
│   ├── routes/
│   │   ├── authRoutes.js      # /api/v1/auth/*
│   │   ├── registryRoutes.js  # /api/v1/entries/*
│   │   └── healthRoutes.js    # /api/v1/health
│   ├── utils/
│   │   ├── jwt.js             # Token generation & verification
│   │   └── response.js        # sendSuccess / sendError helpers
│   ├── app.js                 # Express app setup
│   └── server.js              # Entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Start the server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `MONGODB_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | Access token secret |
| `JWT_EXPIRES_IN` | `7d` | Access token TTL |
| `JWT_REFRESH_SECRET` | — | Refresh token secret |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token TTL |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Register new user |
| `POST` | `/auth/login` | — | Login → tokens |
| `POST` | `/auth/refresh` | — | Refresh access token |
| `POST` | `/auth/logout` | ✅ | Logout (invalidate refresh token) |
| `GET` | `/auth/me` | ✅ | Get current user profile |
| `PATCH` | `/auth/change-password` | ✅ | Change password |

### Registry Entries (CRUD)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/entries` | ✅ | List entries (paginated, filterable) |
| `POST` | `/entries` | ✅ | Create entry |
| `GET` | `/entries/:id` | ✅ | Get entry by ID |
| `PATCH` | `/entries/:id` | ✅ | Update entry |
| `DELETE` | `/entries/:id` | ✅ | Soft-delete entry |
| `GET` | `/entries/stats` | ✅ Admin | Aggregated statistics |

### Other
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api-docs` | Swagger UI |
| `GET` | `/api-docs.json` | Raw OpenAPI JSON |

---

## Query Parameters for `GET /entries`

| Param | Type | Description |
|-------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 10, max: 100) |
| `category` | string | Filter by category |
| `status` | string | Filter by status |
| `search` | string | Full-text search |
| `sortBy` | string | Field to sort by |
| `sortOrder` | `asc`/`desc` | Sort direction |
| `startDate` | date | Filter created after |
| `endDate` | date | Filter created before |

---

## Authentication Flow

```
1. POST /auth/register  →  { accessToken, refreshToken }
2. Use accessToken in header: Authorization: Bearer <token>
3. When expired → POST /auth/refresh  →  { accessToken, refreshToken }
4. POST /auth/logout  →  invalidates refresh token in DB
```

---

## Registry Entry Categories
`business` · `property` · `vehicle` · `person` · `asset` · `other`

## Registry Entry Statuses
`active` · `inactive` · `pending` · `expired`
