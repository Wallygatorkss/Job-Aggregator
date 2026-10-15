# Job Aggregator

> Une plateforme intelligente qui centralise les offres tech et aide les candidats à trouver les opportunités les plus pertinentes.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

## Aperçu du projet

Job Aggregator est un agrégateur d’offres d’emploi destiné aux profils tech à la recherche d’un stage, d’une alternance ou d’un CDI. L’application collecte des offres depuis l’API WeLoveDevs, les normalise dans une base MySQL, puis les présente dans une interface de recherche centralisée.

La plateforme associe recherche, filtres, sauvegarde d’offres, suivi des candidatures, analytics et recommandations personnalisées. Un moteur de matching local compare le profil d’un utilisateur aux exigences d’une offre et peut générer un pitch ou une lettre de motivation adaptée.

## Fonctionnalités clés

- **Recherche centralisée** d’offres tech avec filtres par localisation, contrat, compétences et critères de pertinence.
- **Matching local** entre le profil candidat et les offres grâce à une analyse déterministe des compétences et mots-clés.
- **Gestion du parcours candidat** : offres sauvegardées, candidatures, profil, expériences et préférences.
- **Analytics du marché** : tendances sur les volumes d’offres, les contrats et les salaires.
- **Génération de CV et de contenus de candidature** à partir des informations du profil.
- **Sécurisation de l’API** avec authentification JWT, mots de passe hashés avec Argon2, limitation de débit et contrôle des uploads.

## Architecture

Le projet est organisé en monorepo et exécuté par Docker Compose :

| Service | Responsabilité | Technologies |
| --- | --- | --- |
| `frontend` | Interface candidat et navigation | React 19, Vite, TypeScript, Tailwind CSS, React Router |
| `backend` | API REST et logique métier | Node.js 20, Express 5, TypeScript, Prisma |
| `database` | Persistance des utilisateurs, offres et candidatures | MySQL 8.0 |
| `ingest` | Import et normalisation des offres | TypeScript, Prisma, API WeLoveDevs |

```text
.
├── frontend/                # Application React/Vite
│   └── src/
│       ├── components/      # Composants réutilisables
│       ├── pages/           # Vues de l’application
│       ├── context/         # États partagés
│       └── hook/            # Hooks métier
├── backend/                 # API Express
│   ├── prisma/              # Schéma et migrations Prisma
│   ├── src/
│   │   ├── controllers/     # Contrôleurs HTTP
│   │   ├── routes/          # Routes API
│   │   ├── services/        # Logique métier et matching
│   │   └── middlewares/     # Authentification et protections
│   ├── scripts/             # Scripts d’ingestion et d’analyse
│   └── tests/               # Tests Vitest
├── IA/                      # Génération de CV et templates
├── docs/                    # ADR, modèle de données et wireframes
├── docker-compose.yml       # Orchestration des services
└── init.sql                 # Initialisation de la base
```

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose ;
- une clé API WeLoveDevs pour l’ingestion des offres ;
- Git, si vous souhaitez cloner le projet.

## Installation et lancement

### 1. Récupérer le projet

```bash
git clone <url-du-depot>
cd Job-Aggregator
```

### 2. Configurer les variables d’environnement

Créez un fichier `.env` à la racine du projet. Les valeurs ci-dessous sont des exemples : remplacez les secrets et la clé API par vos propres valeurs.

```dotenv
DB_NAME=jobaggregator
DB_USER=jobaggregator
DB_PASSWORD=changez_ce_mot_de_passe
DB_ROOT_PASSWORD=changez_ce_mot_de_passe_root
JWT_SECRET=changez_cette_cle_jwt
API_KEY=votre_cle_api_welovedevs
API_DELAY=1000
INGEST_PAGE=1
INGEST_SIZE=100
VITE_API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

> Ne versionnez jamais votre fichier `.env`. Il contient des identifiants et des secrets d’application.

### 3. Démarrer la stack complète

```bash
docker compose up --build
```

Le premier démarrage construit les images, attend que MySQL soit disponible, génère le client Prisma et lance automatiquement l’ingestion initiale.

Une fois les services prêts :

- interface web : <http://localhost:5173>
- API backend : <http://localhost:3000>
- MySQL : `localhost:3306`

Pour arrêter les services :

```bash
docker compose down
```

Pour supprimer également les données MySQL persistées en local :

```bash
docker compose down -v
```

### 4. Relancer une ingestion manuellement

L’ingestion est lancée automatiquement par Compose. Pour l’exécuter à nouveau :

```bash
docker compose run --rm ingest
```

Les variables `INGEST_PAGE`, `INGEST_SIZE` et `API_DELAY` permettent respectivement de choisir la page de départ, le nombre d’offres par page et le délai entre les requêtes.

## Développement et tests

Les commandes suivantes s’exécutent depuis le dossier concerné :

```bash
# Backend : installer les dépendances, lancer les tests et le lint
cd backend
npm install
npm test
npm run lint
```

```bash
# Frontend : installer les dépendances, lancer le serveur Vite
cd frontend
npm install
npm run dev
```

Le backend utilise Vitest pour tester la normalisation des données d’ingestion et plusieurs routes protégées par JWT. Pour vérifier le build de production du frontend :

```bash
cd frontend
npm run build
```

## Ce que j’ai appris / Défis techniques

### Concevoir une architecture full-stack cohérente

Ce projet m’a permis de structurer une application complète en TypeScript, du frontend React jusqu’à l’API Express et à la couche de persistance Prisma. La séparation entre contrôleurs, routes, services et middlewares facilite l’évolution du produit tout en gardant une logique métier testable.

### Normaliser des données provenant d’une API externe

Les offres issues d’une source externe peuvent contenir des formats, champs optionnels et informations incomplètes. La mise en place d’un worker d’ingestion et de fonctions de normalisation permet de transformer ces données en un modèle relationnel fiable, réutilisable par la recherche et les analytics.

### Construire une IA explicable sous contrainte

Plutôt que de dépendre d’une API de modèle externe, le matching repose sur une approche locale, rule-based et fondée sur l’extraction lexicale. Ce choix respecte les contraintes de taille et de temps d’exécution, tout en rendant le score de pertinence compréhensible et mesurable. Le compromis est une compréhension sémantique plus limitée que celle d’un modèle d’embeddings.

### Sécuriser un parcours d’authentification

L’application combine JWT, Argon2, limitation de débit, verrouillage après plusieurs tentatives, validation des données et CORS configuré. Cette approche m’a appris à considérer la sécurité comme une responsabilité répartie sur toute la chaîne : stockage, API, fichiers uploadés et communication entre services.

### Orchestrer un environnement reproductible

Docker Compose permet de lancer le frontend, le backend, la base de données et le worker avec une procédure unique. Les healthchecks, les volumes et les variables d’environnement rendent l’environnement de démonstration plus reproductible pour les développeurs et les évaluateurs.

## Documentation complémentaire

- [Documentation de la base de données](docs/database.md)
- [Architecture et décisions techniques](docs/adr/README.md)
- [Innovation et critères de mesure](docs/innovation.md)
- [Wireframes](docs/wireframe/)

## Équipe

Projet réalisé par l’équipe **Les MaxiBossTropForts**.
