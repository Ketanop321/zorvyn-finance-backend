# Zorvyn FinTech — Finance Data Processing & Access Control API

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A production-grade REST API backend for a financial dashboard system. Built for the **Zorvyn FinTech Backend Intern Assignment** — demonstrating security-first design, audit trails, role-based access control, and compliance-aware architecture.

---

## 🟢 Live Deployment
The API is currently deployed and running live on Render:
**👉 [https://zorvyn-finance-backend-xpm1.onrender.com](https://zorvyn-finance-backend-xpm1.onrender.com)**

*(You can verify it by clicking the link above to hit the `/health` endpoint).*

---

## 📋 Project Overview

This backend powers a multi-role finance dashboard for startups and SMEs. It handles:

- **Secure authentication** with JWT access tokens (15min TTL) and rotating refresh tokens stored in the database
- **Role-based access control** enforcing the principle of least privilege across all endpoints
- **Transaction lifecycle management** with idempotency keys to prevent duplicate charges
- **Financial audit trail** — every mutating action is logged with IP, user agent, and metadata diff
- **Soft deletes** — financial records are never hard-deleted (regulatory requirement)
- **Dashboard aggregations** — real-time income/expense summaries using DB-level GROUP BY

---

## 🔧 Tech Stack

| Technology | Choice | Reason |
|---|---|---|
| **Runtime** | Node.js v20+ | LTS with native async/await, widely deployed in FinTech |
| **Framework** | Express.js | Minimal, flexible, battle-tested; easy to layer security middleware |
| **Database** | PostgreSQL 16 | ACID compliance, relational integrity, Decimal support for money |
| **ORM** | Prisma | Type-safe queries, migrations, Decimal native support |
| **Auth** | JWT + httpOnly Cookies | Short-lived access tokens + secure refresh token storage |
| **Validation** | Zod | Schema-first, TypeScript-friendly, .strict() for mass-assignment protection |
| **Password Hashing** | bcryptjs (rounds=12) | Industry standard; rounds=12 balances security vs. latency |
| **Logging** | Winston + Morgan | Structured JSON logs (Winston) + HTTP access logs (Morgan) |
| **Testing** | Jest + Supertest | Integration tests against real Express app without port conflicts |
| **Security** | Helmet + CORS + rate-limit | HTTP security headers, origin whitelist, brute-force protection |

> **Why PostgreSQL over MongoDB?** Financial data is inherently relational (users ↔ transactions ↔ audit logs). PostgreSQL's ACID guarantees and `NUMERIC`/`DECIMAL` type (exact money arithmetic) make it the correct choice. MongoDB's document model and approximate float arithmetic are inappropriate for financial records.

> **Why Decimal and not Float for money?** IEEE 754 floating-point: `0.1 + 0.2 = 0.30000000000000004`. A 1-paisa discrepancy per transaction becomes a massive reconciliation problem at scale. `DECIMAL(15,2)` is exact.

---

## 🏗 Architecture

```mermaid
flowchart TD
    Client([Client / Postman])

    subgraph Security Layer
        RL[Rate Limiter\n100 req/15min global\n5 req/15min on auth]
        HLM[Helmet CSP Headers]
        CORS[CORS Whitelist]
    end

    subgraph Auth Layer
        AM[Auth Middleware\nJWT Verify + Active User Check]
        RG[Role Guard\nroleGuard allowedRoles]
    end

    subgraph Request Processing
        VM[Validate Middleware\nZod Schema Strict]
        CTRL[Controller\nHTTP concern only]
        SVC[Service Layer\nBusiness Logic]
        ORM[Prisma ORM\nSoft-delete middleware]
    end

    subgraph Data
        DB[(PostgreSQL\nzorvyn_finance)]
    end

    subgraph Cross-Cutting
        AL[Audit Log Middleware\nWrites after successful response]
        EH[Global Error Handler\nNo stack trace leak in prod]
    end

    Client --> HLM --> CORS --> RL
    RL --> AM --> RG --> VM --> AL --> CTRL --> SVC --> ORM --> DB
    DB --> ORM --> SVC --> CTRL --> Client
    CTRL -. on error .-> EH
    AL -. async write .-> DB
```

---

## ⚡ Quick Start

> Get the server running in **under 5 minutes**

### Prerequisites
- Node.js v20+
- PostgreSQL 16 running locally
- `npm` or `yarn`

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd zorvyn
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env — update DATABASE_URL with your Postgres credentials
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database

```bash
npm run seed
```

This creates **3 users** and **25 realistic transactions**:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@zorvyn.dev` | `Admin@123` |
| Analyst | `analyst@zorvyn.dev` | `Analyst@123` |
| Viewer | `viewer@zorvyn.dev` | `Viewer@123` |

### 5. Start the Server

```bash
npm run dev
```

Server starts at: `http://localhost:3000`

Health check: `GET http://localhost:3000/health`

---

## 🔑 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/zorvyn_finance` |
| `TEST_DATABASE_URL` | Separate test database | `postgresql://user:pass@localhost:5432/zorvyn_finance_test` |
| `JWT_ACCESS_SECRET` | Access token signing secret (min 32 chars) | `random-secret-min-32-chars` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (min 32 chars) | `another-random-secret` |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `ALLOWED_ORIGINS` | Comma-separated CORS whitelist | `http://localhost:3000,http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window (global) | `100` |
| `AUTH_RATE_LIMIT_MAX` | Max requests per window (auth routes) | `5` |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor | `12` |

> ⚠️ **Never commit `.env` to version control.** The `.gitignore` excludes it. Use `.env.example` as the template.

---

## 📡 API Reference

### Base URL: `http://localhost:3000/api`

### Authentication

All protected routes require: `Authorization: Bearer <accessToken>`

---

#### Auth Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | ❌ Public | — | Register new user |
| `POST` | `/auth/login` | ❌ Public | — | Login, get access token |
| `POST` | `/auth/refresh` | 🍪 Cookie | — | Refresh access token |
| `POST` | `/auth/logout` | 🍪 Cookie | — | Revoke refresh token |

<details>
<summary>📤 POST /auth/register — Sample</summary>

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass@123",
  "role": "ANALYST"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "ANALYST",
      "status": "ACTIVE"
    },
    "accessToken": "eyJ..."
  }
}
```
</details>

<details>
<summary>📤 POST /auth/login — Sample</summary>

**Request:**
```json
{
  "email": "admin@zorvyn.dev",
  "password": "Admin@123"
}
```

**Response (200):** Access token in body + refresh token as `httpOnly` cookie
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "name": "Arjun Sharma", "role": "ADMIN" },
    "accessToken": "eyJ..."
  }
}
```
</details>

---

#### User Endpoints (ADMIN only)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/users` | ✅ JWT | ADMIN | List all users (paginated) |
| `POST` | `/users` | ✅ JWT | ADMIN | Create new user |
| `PUT` | `/users/:id` | ✅ JWT | ADMIN | Update user details |
| `PATCH` | `/users/:id/status` | ✅ JWT | ADMIN | Toggle ACTIVE/INACTIVE |

Query params for `GET /users`: `page`, `limit`, `role`, `status`

---

#### Transaction Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/transactions` | ✅ JWT | ADMIN | Create transaction (requires `X-Idempotency-Key` header) |
| `GET` | `/transactions` | ✅ JWT | ADMIN, ANALYST | List with filters + pagination |
| `GET` | `/transactions/:id` | ✅ JWT | ADMIN, ANALYST | Get single transaction |
| `PUT` | `/transactions/:id` | ✅ JWT | ADMIN | Update transaction |
| `DELETE` | `/transactions/:id` | ✅ JWT | ADMIN | Soft delete |

**Query filters for `GET /transactions`:** `type`, `category`, `dateFrom`, `dateTo`, `page`, `limit`

<details>
<summary>📤 POST /transactions — Sample</summary>

**Headers:**
```
Authorization: Bearer eyJ...
X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

**Request:**
```json
{
  "amount": 450000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-03-01T00:00:00.000Z",
  "description": "Monthly payroll — March 2024"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": "uuid",
    "amount": "450000.00",
    "type": "INCOME",
    "category": "Salary",
    "idempotencyKey": "550e8400...",
    "isDeleted": false
  }
}
```
</details>

---

#### Dashboard Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/dashboard/summary` | ✅ JWT | ALL | Total income, expenses, net balance |
| `GET` | `/dashboard/category-breakdown` | ✅ JWT | ALL | Totals by category |
| `GET` | `/dashboard/monthly-trend` | ✅ JWT | ALL | Last 6 months income vs expense |
| `GET` | `/dashboard/recent-activity` | ✅ JWT | ALL | Last 10 transactions |

<details>
<summary>📊 GET /dashboard/summary — Sample Response</summary>

```json
{
  "success": true,
  "message": "Dashboard summary retrieved",
  "data": {
    "totalIncome": 1906500,
    "totalExpenses": 858000,
    "netBalance": 1048500,
    "transactionCount": 25,
    "breakdown": {
      "incomeCount": 8,
      "expenseCount": 17
    }
  }
}
```
</details>

<details>
<summary>📊 GET /dashboard/monthly-trend — Sample Response</summary>

```json
{
  "success": true,
  "data": [
    { "month": "2023-10", "income": 0, "expenses": 0, "net": 0 },
    { "month": "2023-11", "income": 0, "expenses": 0, "net": 0 },
    { "month": "2023-12", "income": 500000, "expenses": 145000, "net": 355000 },
    { "month": "2024-01", "income": 1039000, "expenses": 360000, "net": 679000 },
    { "month": "2024-02", "income": 825000, "expenses": 378000, "net": 447000 },
    { "month": "2024-03", "income": 542500, "expenses": 120000, "net": 422500 }
  ]
}
```
</details>

---

#### Standard Error Response

```json
{
  "success": false,
  "message": "Validation failed. Please check your input.",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number" },
    { "field": "type", "message": "Type must be either 'INCOME' or 'EXPENSE'" }
  ]
}
```

**Error Codes:** `UNAUTHORIZED` | `FORBIDDEN` | `NOT_FOUND` | `BAD_REQUEST` | `CONFLICT` | `VALIDATION_ERROR` | `DUPLICATE_IDEMPOTENCY_KEY` | `RATE_LIMIT_EXCEEDED` | `INTERNAL_ERROR`

---

## 🔐 Role-Based Access Control

| Endpoint | VIEWER | ANALYST | ADMIN |
|---|:---:|:---:|:---:|
| `POST /auth/*` | ✅ | ✅ | ✅ |
| `GET /dashboard/*` | ✅ | ✅ | ✅ |
| `GET /transactions` | ❌ | ✅ | ✅ |
| `GET /transactions/:id` | ❌ | ✅ | ✅ |
| `POST /transactions` | ❌ | ❌ | ✅ |
| `PUT /transactions/:id` | ❌ | ❌ | ✅ |
| `DELETE /transactions/:id` | ❌ | ❌ | ✅ |
| `GET /users` | ❌ | ❌ | ✅ |
| `POST /users` | ❌ | ❌ | ✅ |
| `PUT /users/:id` | ❌ | ❌ | ✅ |
| `PATCH /users/:id/status` | ❌ | ❌ | ✅ |

Implementation: `roleGuard(['ADMIN', 'ANALYST'])` factory in `src/middleware/role.middleware.js`

---

## 🛡️ Security

### Implemented Controls

- **Helmet.js** — Sets 10+ HTTP security headers including strict Content-Security-Policy, X-Frame-Options: DENY, X-XSS-Protection, HSTS
- **CORS whitelist** — Only `ALLOWED_ORIGINS` from `.env` can make requests; wildcard `*` is never used
- **Rate limiting (3 tiers)**
  - Global: 100 requests / 15 minutes / IP
  - Auth routes: 5 requests / 15 minutes / IP (brute-force protection)
  - Dashboard routes: 30 requests / 15 minutes / IP (expensive query protection)
- **bcrypt (rounds=12)** — Password hashing; 12 rounds chosen for security/performance balance
- **JWT rotation** — Access tokens expire in 15min; refresh tokens rotate on each use (stolen tokens become invalid)
- **httpOnly + Secure + SameSite=Strict cookies** — Refresh tokens inaccessible to JavaScript; CSRF protected
- **Zod `.strict()` schemas** — Unknown fields are rejected; prevents mass assignment attacks
- **Global error handler** — Stack traces and internal messages never reach clients in production
- **Audit log middleware** — Every mutating request (POST/PUT/DELETE) is logged with userId, IP, user agent, and request metadata
- **Idempotency keys** — Duplicate transaction submissions detected and rejected before DB insert
- **Soft deletes** — Financial records are never hard-deleted; `isDeleted` + `deletedAt` + `deletedBy` preserved
- **Timing-safe login** — Dummy bcrypt compare runs even for non-existent emails, preventing user enumeration
- **Body size limit** — JSON bodies limited to 10KB; prevents payload flooding
- **Sensitive field redaction** — `password`, `token`, `secret` are redacted `[REDACTED]` in all audit logs

> Security controls inspired by FinTech compliance principles including PCI-DSS awareness, OWASP Top 10, and audit trail requirements.

---

## 🗄️ Database Schema

```mermaid
erDiagram
    User {
        uuid id PK
        string name
        string email UK
        string password
        enum role "ADMIN|ANALYST|VIEWER"
        enum status "ACTIVE|INACTIVE"
        datetime createdAt
        datetime updatedAt
    }

    Transaction {
        uuid id PK
        decimal amount "DECIMAL 15 2 - never Float"
        enum type "INCOME|EXPENSE"
        string category
        datetime date
        string description
        string idempotencyKey UK
        boolean isDeleted "soft delete"
        datetime deletedAt
        uuid createdBy FK
        uuid deletedBy FK
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        uuid id PK
        string token UK
        uuid userId FK
        datetime expiresAt
        boolean revoked
        datetime createdAt
    }

    AuditLog {
        uuid id PK
        string action
        uuid performedBy FK
        string targetId
        string targetType
        string ipAddress
        string userAgent
        json metadata
        datetime createdAt
    }

    User ||--o{ Transaction : "creates"
    User ||--o{ Transaction : "deletes (soft)"
    User ||--o{ RefreshToken : "owns"
    User ||--o{ AuditLog : "performs"
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests (sequentially — Supertest needs sequential for DB state)
npm test

# Run with coverage report
npm run test:coverage
```

### ✅ Test Results (Live)

```
Test Suites: 4 passed, 4 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        ~14s
```

**Line Coverage: 81.93%** (target was 60%) ✅

### Test Coverage Areas

| Suite | Tests | What's Covered |
|---|---|---|
| `auth.test.js` | 9 | Register success, duplicate email, weak password, mass assignment rejection, login success + httpOnly cookie, wrong password 401, missing fields |
| `rbac.test.js` | 11 | Full permission matrix — VIEWER/ANALYST/ADMIN across all endpoint types |
| `transaction.test.js` | 8 | Validation (missing amount, negative, zero, invalid type), idempotency dedup, soft delete hidden from list + 404 |
| `dashboard.test.js` | 6 | Summary math verification, 6-month trend completeness, category breakdown structure, recent activity |

> **Test database:** Tests use a completely separate `zorvyn_finance_test` database. The setup file auto-runs migrations before tests and each suite cleans up its own data — tests never pollute each other.

---

## 🖥️ Live API Screenshots

### Health Check Endpoint
![Health Check](docs/screenshots/health-check.png)

### Authentication Protection (Protected Route Without Token)
> Shows the consistent error envelope — `success: false`, machine-readable `code: "UNAUTHORIZED"`

![Auth Protection](docs/screenshots/auth-protection.png)

---

## 🚀 Assumptions & Design Decisions

1. **Register is public** — For demo/assignment purposes. In production, user creation would be ADMIN-only with an invite flow.

2. **Soft deletes via Prisma middleware** — The `isDeleted=false` filter is applied at the ORM level in `src/config/db.js`, not in every query. This ensures no developer can accidentally expose deleted records by forgetting the filter.

3. **Refresh token rotation** — On every `/auth/refresh`, the old refresh token is revoked and a new one issued. This means a stolen refresh token becomes invalid the moment the legitimate user refreshes. This pattern is from the OAuth 2.0 Security BCP (RFC 9700).

4. **Idempotency key in header, not body** — Following REST best practices, idempotency is a request property, not a business property. The `X-Idempotency-Key` header is the HTTP-standard approach used by Stripe, Braintree, and PayPal.

5. **Raw SQL for soft delete** — The Prisma middleware auto-appends `isDeleted=false` to all queries. To execute a soft delete UPDATE, we use `$executeRaw` to bypass the middleware intentionally. This friction is by design — it forces explicit intent when dealing with deleted records.

6. **No Redis** — For this assignment scope, in-memory rate limiting is sufficient. In production, `ioredis` would be added as the rate-limit store for multi-instance deployments.

---

## 🔮 Future Improvements

Given more time, the following would be added to make this production-ready:

- **Redis** — Token blacklist, distributed rate limiting, response caching for dashboard queries
- **WebSocket** — Real-time transaction alerts and live dashboard updates
- **Docker + docker-compose** — Containerize app + Postgres for one-command deployment
- **CI/CD pipeline** — GitHub Actions: lint → test → build → deploy on every PR
- **KYC integration** — User identity verification via Aadhaar/PAN API
- **Cursor-based pagination** — More efficient than offset pagination for large transaction tables
- **Encryption at rest** — AES-256 for sensitive fields in the database
- **2FA** — TOTP-based two-factor authentication for ADMIN accounts
- **API versioning** — `/api/v1/` prefix for backward-compatible evolution
- **OpenAPI/Swagger** — Auto-generated API documentation from route definitions
