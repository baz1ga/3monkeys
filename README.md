# 3monkeys

Monorepo: Vue 3 + Vite + Tailwind (client) / Fastify + TypeScript + Prisma + SQLite (server).

## Quick start
```bash
npm install
cp .env.example .env
# edit .env with Discord OAuth credentials

cd server
npx prisma migrate dev --name init

cd ..
npm run dev
```

## Auth Discord
Server routes:
- `GET /auth/discord/login`
- `GET /auth/discord/callback`
- `POST /auth/logout`
- `GET /auth/me`

Client pages:
- `/login`
- `/settings`

## Structure
- `client/` Vue 3 app
- `server/` Fastify API
- `server/prisma/` Prisma schema & SQLite
