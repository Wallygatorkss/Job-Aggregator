# ADR 07 - Dashboard utilisateur

## Decision
Le dashboard est la page principale apres connexion ([frontend/src/pages/page_principale.tsx](../../frontend/src/pages/page_principale.tsx)). Il affiche **sans navigation supplementaire** :
- une **sortie data** : liste filtree des offres ingerees avec filtres dynamiques (ville, contrat, salaire) ;
- une **sortie IA** : pour chaque offre visible, le score de pertinence `relevance_score` et les keywords issus de `offer_ai_data`, ainsi qu'un bouton "Voir le pitch IA" qui redirige vers la page [Ia.tsx](../../frontend/src/pages/Ia.tsx).

Des widgets complementaires sont disponibles sur `MesEmplois.tsx` (offres sauvegardees) et `Analytics.tsx` (visualisations Recharts).

## Why
- Le PDF exige *"User dashboard displaying real ingested data, with at least one output from the data feature and one output from the AI feature visible without additional navigation"*.
- Le couplage "data + IA" sur la meme vue donne une **decision actionnable** : "voici les offres pertinentes pour toi, classees".

## Widgets et decision supportee
| Widget | Decision utilisateur |
|--------|----------------------|
| Filtres (FiltersBar) | Reduire le bruit, cibler une zone / contrat / range salarial |
| Liste d'offres (offers + card-offer) | Comparer rapidement plusieurs opportunites |
| Score IA / keywords | Estimer la pertinence sans lire toute l'annonce |
| Page Analytics | Comprendre les tendances marche (volumes, salaires) |
| MesEmplois | Suivre les favoris et leurs statuts d'application |

## How
- React + Tailwind, composants reutilisables sous [frontend/src/components/](../../frontend/src/components/).
- Donnees chargees via React Query / fetch depuis l'API REST.
- Recharts pour les visualisations (page Analytics).

## Trade-off
- Une seule page principale = simplicite mais densite d'information potentiellement forte. Mitige par pagination + cards compactes.

## Mesure de succes
- Taux d'utilisation du bouton "sauvegarder" sur les offres recommandees (proxy de pertinence).
- `ia_dislikes / vues` (cf. ADR 04).
- Temps avant premiere sauvegarde (objectif < 2 min sur la demo).

## Evidence
- [frontend/src/pages/page_principale.tsx](../../frontend/src/pages/page_principale.tsx)
- [frontend/src/components/FiltersBar.tsx](../../frontend/src/components/FiltersBar.tsx)
- [frontend/src/pages/Analytics.tsx](../../frontend/src/pages/Analytics.tsx)
