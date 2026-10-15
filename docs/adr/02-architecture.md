# ADR 02 - Architecture & stack

## Decision
Architecture en monorepo, 4 services orchestres par Docker Compose :

| Service | Role | Stack |
|---------|------|-------|
| `frontend` | UI candidat | React 19, Vite, TypeScript, Tailwind, React Router, Recharts |
| `backend`  | API REST | Node 20, Express 5, Prisma 5, argon2, JWT, express-rate-limit |
| `database` | Persistance | MySQL 8.0 |
| `ingest`   | Worker batch | tsx + script `scripts/ingest.ts` |

## Why
- **Express + Prisma** : familier, ecosysteme mature, schema Prisma genere un client typescript sur des modeles relationnels (offres normalisees sur ~20 tables).
- **MySQL relationnel** : les offres ont une structure stable (titre, salaire, contrat, skills...) avec relations 1-N / N-N. Le relationnel est plus simple a interroger pour le dashboard que du JSON dans un document store.
- **React + Vite** : hot reload rapide en developpement, bundle leger.
- **Docker Compose** : un `docker compose up` lance toute la stack avec un seul volume persistant (`mysql_data`).

## How
- Frontend appelle l'API via `VITE_API_URL` (env var). CORS verrouille a `FRONTEND_URL`.
- Backend communique avec MySQL via Prisma (driver mysql8). Le worker `ingest` partage le meme client Prisma.
- Secrets (`JWT_SECRET`, `API_KEY`, mots de passe DB) injectes via `.env` racine, jamais en dur.

Voir [docker-compose.yml](../../docker-compose.yml) et [backend/Dockerfile](../../backend/Dockerfile).

## Trade-off
- Un seul process Express => simplicite mais pas de scalabilite horizontale fine. Acceptable pour le scope ecole, suffisant pour la demo.
- Pas de gateway / reverse proxy : moins de configuration mais expose directement les ports en dev.

## Alternative rejetee
**Backend en Python (FastAPI) + frontend Next.js** : tout-en-un avec SSR, mais ajoute une complexite de typage cross-langage (Python <-> TS) et duplique l'effort. Rejete au profit d'un **monolangage TypeScript** end-to-end.

## Evidence
- Structure : [backend/src/](../../backend/src/), [frontend/src/](../../frontend/src/).
- Prisma schema : [backend/prisma/schema.prisma](../../backend/prisma/schema.prisma).
