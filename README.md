# Belzir Employee Lifecycle Management Portal

Monorepo with:
- `backend/`: Express + MongoDB Atlas (Mongoose) API
- `frontend/`: Next.js portal UI

## 1) Prereqs
- Node.js 20 LTS recommended (minimum: Node 18.18+)
- A MongoDB Atlas connection string

## 2) Setup
```bash
npm install
```

Create env files:
- `backend/.env` from `backend/.env.example`
- `frontend/.env.local` from `frontend/.env.example`

## 3) Seed demo data
```bash
npm run seed
```

## 4) Run locally
```bash
npm run dev
```

- API: http://localhost:4000
- Web: http://localhost:3000

## Demo accounts (after seeding)
- Superadmin: `admin@belzir.dev` / `Password123!`
- Partner: `partner@belzir.dev` / `Password123!`
- Customer: `customer@belzir.dev` / `Password123!`

## Step-by-step build order (recommended)
1. Backend auth + RBAC
2. Backend models + workflow endpoints
3. Frontend login + role layouts
4. Employee lifecycle UI + devices

