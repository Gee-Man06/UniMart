# UniMart Project

## 📦 Project Overview
UniMart is a full‑stack web application built with Node.js, Express.js, Prisma ORM, PostgreSQL, and React + Vite.

## 🗂 Directory Structure
frontend/src/{assets,components,context,hooks,pages,utils}
backend/src/{config,controllers,middleware,routes,services}

## 🚀 Getting Started
1. Clone the repo: `git clone <repo-url>`
2. Install dependencies:
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && npm install`
3. Create `.env` in backend:
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/unimart"
  JWT_SECRET="your-secret-key"
  PORT=5000
 4. Setup database:
    npx prisma migrate dev
    npx prisma generate
 5. Run servers:
- Frontend: `npm run dev`
- Backend: `npm run dev`

## 📖 Collaboration Notes
- Don’t commit `node_modules` or `generated/`.
- Commit `package.json`, `package-lock.json`, and `prisma/schema.prisma`.
- Use `.gitkeep` for empty folders.
- Run `npm install` after pulling changes.

## 🛠 Common Commands
- Install dependency: `npm install <package>`
- Run backend dev: `npm run dev`
- Run frontend dev: `npm run dev`
- Prisma migrate: `npx prisma migrate dev`
- Prisma generate: `npx prisma generate`

## 🗄 PostgreSQL Setup (Windows)
1. Download PostgreSQL from official site.
2. Install and set password for `postgres` user.
3. Add PostgreSQL to PATH.
4. Create database: `createdb unimart`
5. Update `.env` with connection string.

## 👥 Next Steps
- Implement React Router in `frontend/src/pages`.
- Build authentication hooks in `frontend/src/hooks`.
- Add API routes in `backend/src/routes`.
- Write controllers and services for business logic.


