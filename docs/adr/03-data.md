# ADR 03 - Donnees & ingestion WeLoveDevs

## Decision
- WeLoveDevs (API officielle Epitech `https://epi-api.welovedevs.com/v1`) est la source **obligatoire et unique** pour la v1.
- Ingestion via un service worker dedie (`ingest`) qui appelle l'API page par page et persiste les offres normalisees dans MySQL.
- Re-ingestion idempotente grace a la contrainte unique `(external_id, source)` sur la table `offers`.
- Trigger manuel : `docker compose run --rm ingest` ou variables `INGEST_PAGE`/`INGEST_SIZE`.

## Why
- L'API WeLoveDevs renvoie une structure imbriquee (details, smallCompany, profession, geoloc, formattedPlaces, analytics). Normaliser dans plusieurs tables relationnelles facilite : recherche par ville, filtre par type de contrat, agregation salaires, etc.
- Une table `ingestion_logs` (source, status, counts, duration) trace chaque execution -> debug + preuve operationnelle.
- Rate limit officiel **1 req/sec/etudiant** respecte via `API_DELAY` (defaut 1000 ms) dans [backend/src/utils/delay.ts](../../backend/src/utils/delay.ts) et [services/getJobs.ts](../../backend/src/services/getJobs.ts).

## How
- `scripts/ingest.ts` : boucle paginee, applique `delay(API_DELAY)` entre chaque page, log dans `ingestion_logs`.
- `services/offerIngestion.ts` : fonction `upsertOfferFromApi` dans une transaction Prisma. Helpers `toEpochMs`, `toDate`, `toBigInt`, `toInt` normalisent les types heterogenes de l'API (timestamps en secondes/ms/us, valeurs string/number).
- Champs metier garantis : titre, description, entreprise (`offer_small_company`), localisation (`offer_formatted_place` + `offer_geoloc`), type de contrat (`offer_contract_type`), date (`published_at`), salaire (`offer_details.salary_*`).

## Trade-off
- 1 req/sec impose un ingest "long" (quelques minutes pour un catalogue complet). Acceptable car execute hors temps reel utilisateur.
- Donnees historiques limitees : on stocke le dernier snapshot par offre (`upsert`), pas un historique de revisions. Choix produit (focus sur offres actives).

## Source supplementaire
Non implementee. Une integration future possible : Adzuna, JSearch ou un scraper "Welcome to the Jungle". Toute source additionnelle devrait reutiliser la couche de normalisation et ajouter une nouvelle valeur dans `offers.source`.

## Alternative rejetee
**Stocker le JSON brut de l'API et requeter en JSON path** : plus simple a ingerer mais inefficace pour filtrer/sortir par champ. Rejete au profit d'une **vraie normalisation relationnelle**.

## Evidence
- [backend/src/services/offerIngestion.ts](../../backend/src/services/offerIngestion.ts)
- [backend/scripts/ingest.ts](../../backend/scripts/ingest.ts)
- Tests : [backend/tests/normalize.test.ts](../../backend/tests/normalize.test.ts)
