# ADR 01 - Produit & utilisateurs cibles

## Contexte
Le projet Job Aggregator vise a centraliser les offres tech (stages, alternances, CDI) et a aider les candidats Epitech (et plus largement les developpeurs juniors) a explorer, comparer et postuler plus efficacement.

## Decision
- **Utilisateurs cibles** : etudiants/jeunes diplomes en informatique, en recherche active d'un premier ou deuxieme poste.
- **Pain points priorises** :
  1. Trop d'offres dispersees, pas de vue consolidee.
  2. Difficulte a juger la pertinence d'une offre vs. son profil.
  3. Personnalisation/CV repetitif a chaque candidature.
- **Valeur attendue** : un seul endroit pour decouvrir, filtrer, sauvegarder, generer un CV personnalise et suivre ses candidatures.

## Why
Le marche du recrutement tech est fragmente (LinkedIn, Welcome to the Jungle, WeLoveDevs, JobTeaser...). Un agregateur cible permet de gagner du temps et d'avoir une couche d'analyse propre (favoris, statistiques, matching IA) que les plateformes individuelles n'offrent pas a un candidat unique.

## How
- Frontend React/Tailwind avec parcours : Landing -> Inscription -> Page principale (offres ingerees) -> Detail -> Sauvegarde -> CV IA.
- Backend Express + Prisma exposant une API REST (`/api/auth`, `/api/offers`, `/api/saved-offers`, `/api/cv`, `/api/applications`, `/api/analytics`).
- Donnees reelles via l'API WeLoveDevs (partenariat Epitech).

## Trade-off
- Restreindre le scope a un public junior simplifie le matching (peu de seniorite a modeliser) mais limite l'audience.
- Pas de paiement / abonnement : pas de complexite Stripe, mais pas de modele de revenus dans le scope ecole.

## Alternative rejetee
**Reconstruire une plateforme de recrutement complete (cote entreprise + candidat)** : double interface, double cycle produit, hors budget temps ; rejete au profit d'une **experience candidat uniquement**, qui peut ensuite etre etendue.

## Evidence
- Wireframes : `docs/wireframe/Wireframe Principal.png`, `Wireframe Landing.png`, `Wireframe Connexion.png`.
- Pages frontend : [frontend/src/pages/](../../frontend/src/pages/).
