# Ticket Rush

Ticket Rush is a full-stack ticket-booking application built as a TypeScript monorepo. It combines a Next.js customer/admin frontend with a NestJS API backed by PostgreSQL and Redis.

The repository was consolidated from the latest frontend and backend development branches into one stable layout while preserving the original Git history.

## Features

### Customer
- Registration, login/logout, and authenticated profile flows
- Event discovery, filtering, featured events, and event details
- Seat selection and reservation flows designed for concurrent booking
- Ticket purchase, promo-code validation, booking history, and ticket details
- Responsive loading, error, and not-found states

### Admin
- Dashboard and operational views
- Event/showtime management
- Seat-template and seat-map management
- User administration
- Statistics/analytics views
- Ticket lookup and queue/reset controls

### Backend
- JWT authentication and role-based authorization
- User, role, ticket, and admin modules
- PostgreSQL persistence through TypeORM
- Redis-based locking/state and BullMQ queue processing
- Database seeders
- Swagger/OpenAPI documentation

## Tech stack

**Frontend:** TypeScript, Next.js 16, React 19, Tailwind CSS, shadcn/Radix UI, React Hook Form, Zod, Zustand, SWR.

**Backend:** TypeScript, Node.js, NestJS 11, TypeORM, PostgreSQL, Redis/ioredis, BullMQ, Passport/JWT, Swagger.

## Repository layout

```text
ticket_rush/
├── frontend/              # Next.js application
│   ├── src/app/           # App Router pages + BFF route handlers
│   ├── src/components/    # Customer/admin/UI components
│   ├── src/lib/           # Auth, API, formatting, booking helpers
│   ├── src/stores/        # Client state
│   └── documents/         # Frontend architecture/planning notes
├── backend/               # NestJS API
│   ├── src/modules/       # Auth, role, user, tickets, admin
│   ├── src/database/      # TypeORM database + seeders
│   ├── src/redis/         # Redis integration
│   ├── src/infrastructure/# BullMQ queue infrastructure
│   ├── docker-compose.yml # PostgreSQL + Redis for local development
│   └── dbdiagram.dbml     # Database model reference
└── README.md
```

## Architecture

```text
Browser
  │
  ▼
Next.js frontend (localhost:3001)
  │
  ├─ same-origin BFF routes: /api/*
  │
  └─ /api/nest/* rewrite
          │
          ▼
NestJS API (localhost:3000)
   │                 │
   ▼                 ▼
PostgreSQL         Redis
                    │
                    ▼
                  BullMQ
```

The Next.js layer acts as a BFF for authentication and customer-facing API calls. Requests requiring the core API are forwarded to NestJS. Redis supports authentication/cache state plus ticket-booking concurrency primitives such as locks and queue data.

## Local development

### Prerequisites
- Node.js
- pnpm
- Docker + Docker Compose

### 1. Start PostgreSQL and Redis

```bash
cd backend
docker compose up -d
```

The compose file exposes PostgreSQL on `localhost:5433` and Redis on `localhost:6379`.

### 2. Configure and run the backend

Create `backend/.env`:

```env
NODE_ENV=development
APP_PORT=3000
GLOBAL_PREFIX=api
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=ticket_rush
DB_HOST=localhost
DB_PORT=5433
DB_USER=ticket_rush
DB_PASSWORD=ticket_rush
DB_NAME=ticket_rush
JWT_SECRET=replace-with-a-development-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_TTL_SEC=604800
FRONTEND_ORIGIN=http://localhost:3001
```

```bash
cd backend
pnpm install
pnpm run seed
pnpm run start:dev
```

Backend API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/api/docs`

### 3. Configure and run the frontend

Create `frontend/.env.local`:

```env
BACKEND_URL=http://127.0.0.1:3000
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1
```

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3001`.

## Quality checks

Frontend:
```bash
cd frontend
pnpm lint
pnpm build
```

Backend:
```bash
cd backend
pnpm lint
pnpm build
pnpm test
pnpm run test:e2e
```

## Branch consolidation

The latest frontend line (`test_fe`) and backend line (`test`) are the authoritative implementations in this monorepo. Their earlier development branches are ancestors of those tips. The independent `concur` line is preserved in the merge history; its Redis/queue/concurrent-booking work is represented by the later backend implementation rather than duplicated as a second application tree.

