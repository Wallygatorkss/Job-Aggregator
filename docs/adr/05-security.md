# ADR 05 - Securite

## Decision
Couvrir les 6 axes du PDF avec un minimum viable robuste.

| Axe | Implementation | Code |
|-----|----------------|------|
| Gestion des secrets | `.env` (non commite) + injection Docker Compose | [.env.example](../../.env.example) (a fournir), [docker-compose.yml](../../docker-compose.yml) |
| Protection injection | Prisma ORM (requetes parametrees) + validation typee TS | [backend/src/services/*](../../backend/src/services/) |
| Anti brute-force | `express-rate-limit` (login 5/15min, register 3/h, upload 10/min) + verrouillage compte (`login_attempts`, `locked_until`) | [authMiddlewares.ts](../../backend/src/middlewares/authMiddlewares.ts), [authService.ts](../../backend/src/services/authService.ts) |
| Route / session / token | JWT signe (HS256), TTL 24 h, verification `userId` + `role` typee | [utils/jwt.ts](../../backend/src/utils/jwt.ts) |
| Auth flow | Mot de passe hash avec **argon2** (memoire-hard, recommande OWASP) + verification + lockout | [authService.ts](../../backend/src/services/authService.ts) |
| Donnees au repos / transit | DB isolee dans un reseau Docker prive ; CORS verrouille a `FRONTEND_URL` ; validation upload (taille, MIME) | [app.ts](../../backend/src/app.ts) |

## Why
- **JWT stateless** : pas de gestion de session serveur, scale plus simple.
- **Argon2** : preferable a bcrypt sur les machines modernes (resistance aux GPU/ASIC).
- **Rate-limit IP + lockout compte** : double couche, attaquant doit changer d'IP **ET** attendre.
- **CORS restreint** : empeche un site tiers d'appeler l'API depuis le navigateur d'un utilisateur logge.

## How
- `JWT_SECRET`, `API_KEY`, `DB_PASSWORD`, `DB_ROOT_PASSWORD` injectes via env, jamais en dur dans le code.
- Limite JSON `5mb`, validation MIME (`png|jpeg|webp|gif`) et taille (1.5 MB) sur les uploads d'avatar/banner.
- Middleware `requireAuth` / `isAdmin` applique sur toutes les routes sensibles.
- Verification de payload JWT renforcee : on contraint `userId` a etre un entier positif et `role` ∈ `{user, admin}`.

## Threats consideres
1. **Credential stuffing** -> rate-limit + lockout.
2. **Vol de cookie / token XSS** -> token transmis en `Authorization: Bearer`, jamais stocke en cookie non-httpOnly.
3. **Injection SQL** -> Prisma uniquement, pas de raw queries dynamiques.
4. **Force brute admin** -> meme rate-limit que user (admin doit aussi passer par `/login`).
5. **Upload abusif** -> validation MIME + taille + rate-limit upload.

## Trade-off
- JWT non revocable cote serveur (TTL court 24h compense). Une blocklist Redis serait propre mais ajoute un service.
- CORS permissif aux credentials sur `localhost:5173` en dev. En prod, changer `FRONTEND_URL`.

## A faire pour la prod (hors scope school)
- HTTPS via reverse proxy (Caddy / Traefik) + HSTS.
- Secrets dans un vault (pas `.env`).
- Rotation `JWT_SECRET`.

## Alternative rejetee
**Sessions serveur Redis** : plus de controle (revocation) mais demande un 5e service. Rejete, scope school ne justifie pas la complexite.

## Evidence
- [backend/src/middlewares/authMiddlewares.ts](../../backend/src/middlewares/authMiddlewares.ts)
- [backend/src/utils/jwt.ts](../../backend/src/utils/jwt.ts)
- [backend/src/services/authService.ts](../../backend/src/services/authService.ts)
