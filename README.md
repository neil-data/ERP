# FleetFlow — Logistics ERP

A role-based logistics ERP built with the MERN stack. FleetFlow manages fleet vehicles, trip dispatching, maintenance, expenses, and performance tracking across four distinct user roles.

## Tech Stack

- **Backend**: Node.js, Express 4, MongoDB (Mongoose)
- **Auth**: JWT (access + refresh tokens) via httpOnly cookies
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize
- **Frontend**: React (planned — Phase 4)
- **Deployment**: Vercel

## Roles & Access

| Section          | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
| ---------------- | :-----------: | :--------: | :------------: | :---------------: |
| Dashboard        |      ✅       |     ✅     |       ✅       |        ✅         |
| Vehicle Registry |      ✅       |     ✅     |       ❌       |        ❌         |
| Trip Dispatcher  |      ✅       |     ✅     |       ❌       |        ❌         |
| Maintenance      |      ✅       |     ✅     |       ❌       |        ❌         |
| Trip & Expense   |      ✅       |     ❌     |       ❌       |        ✅         |
| Performance      |      ✅       |     ❌     |       ✅       |        ❌         |
| Analytics        |      ✅       |     ❌     |       ❌       |        ✅         |
| User Management  |      ✅       |     ❌     |       ❌       |        ❌         |

## Project Structure

```
fleetflow-server/
├── config/
│   └── db.js               # MongoDB connection
├── models/
│   └── User.js              # User schema (hashed password, role enum)
├── middleware/
│   ├── auth.js               # verifyToken + requireRole (RBAC)
│   └── errorHandler.js       # centralized error handler
├── controllers/
│   └── authController.js     # register, login, refresh, logout, getMe
├── routes/
│   └── authRoutes.js
├── utils/
│   └── generateTokens.js     # JWT access/refresh token generation
├── server.js                 # app entrypoint, middleware stack
├── .env                       # secrets (not committed)
└── .gitignore
```

## Setup

```bash
cd fleetflow-server
npm install
```

Create a `.env` file with:

```
MONGO_URI=your_mongodb_atlas_uri
ACCESS_TOKEN_SECRET=random_32_byte_hex_string
REFRESH_TOKEN_SECRET=different_random_32_byte_hex_string
FRONTEND_URL=http://localhost:5173
PORT=5000
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run the server:

```bash
node server.js
```

## Auth Flow

- Login issues two JWTs, both set as **httpOnly cookies** (never exposed to JS, immune to XSS token theft):
  - `accessToken` — 15 min, sent on every request
  - `refreshToken` — 7 days, used only to silently reissue access tokens
- Refresh tokens are hashed (bcrypt) before being stored in the DB, so a DB leak alone can't be used to forge sessions.
- Every protected route re-checks the user's role server-side via `requireRole` — frontend route-guarding is UX only, not the actual security boundary.

## API Endpoints (Phase 1)

| Method | Route                | Auth Required       | Description                         |
| ------ | -------------------- | ------------------- | ----------------------------------- |
| POST   | `/api/auth/register` | No                  | Create a new user                   |
| POST   | `/api/auth/login`    | No (rate-limited)   | Login, sets auth cookies            |
| POST   | `/api/auth/refresh`  | No (refresh cookie) | Reissue access token                |
| POST   | `/api/auth/logout`   | Yes                 | Revoke refresh token, clear cookies |
| GET    | `/api/auth/me`       | Yes                 | Get current logged-in user          |

## Security Measures

- Passwords hashed with bcrypt (10 salt rounds)
- Helmet for security headers
- Rate limiting: global (100 req/15min) + stricter on `/login` (10 req/15min)
- `express-mongo-sanitize` to block NoSQL injection
- Generic error responses to clients; full error details logged server-side only
- Secrets loaded from environment variables, never committed

## Build Phases

- [x] **Phase 1** — Auth foundation: JWT, RBAC, hardened Express setup
- [x] **Phase 2** — Core CRUD: Vehicle Registry, Trip Dispatcher, Maintenance
- [x] **Phase 3** — Role-scoped features: Trip & Expense, Performance, Analytics, User Management
- [x] **Phase 4** — Frontend: landing page, login, role-based dashboards
- [x] **Phase 5** — Hardening & deployment to Vercel
