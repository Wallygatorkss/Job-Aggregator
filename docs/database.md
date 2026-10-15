# Database Documentation

## ADR — Database Schema

### Why
Le projet necessite de stocker des utilisateurs avec gestion des roles, des offres d'emploi agregees depuis des sources externes (WeLoveDevs), et des donnees enrichies par le module IA. Le schema doit supporter les features de recherche/filtrage, les favoris utilisateur, et le suivi des ingestions.

### How
Base de donnees relationnelle **MySQL 8+** avec tables normalisees pour les objets imbriques (details, smallCompany, profession, geoloc, formattedPlaces), liees par des cles etrangeres et des contraintes d'integrite explicites.

### Trade-off
PostgreSQL offrait un type `UUID` natif et un support des arrays, mais MySQL a ete retenu pour la familiarite de l'equipe et la maturite de l'outillage disponible. Les arrays sont stockes dans des tables de relation ou en JSON selon le champ.

---

## Diagramme ERD

```mermaid
erDiagram
  USERS {
    int unsigned id PK
    varchar(255) email UK
    varchar(255) password_hash
    varchar(100) username UK
    enum        role
    boolean     is_active
    tinyint     login_attempts
    datetime    locked_until
    datetime    created_at
    datetime    updated_at
  }
  OFFERS {
    char(36)    id PK
    varchar(255) external_id
    varchar(50)  source
    varchar(255) source_object_id
    varchar(255) source_reference
    varchar(100) source_type
    datetime    source_created_at
    datetime    source_last_update_at
    varchar(255) creator_id
    varchar(255) company_id
    varchar(255) title
    text        description
    text        description_preview
    text        raw_description
    varchar(255) helmet_handle
    varchar(255) seo_alias
    varchar(50)  status
    boolean     application_30_days
    bigint      ranking
    boolean     premium_bool
    bigint      premium_int
    datetime    published_at
    datetime    ingested_at
    datetime    updated_at
    json        source_payload
  }
  OFFER_DETAILS {
    char(36)    id PK
    char(36)    offer_id FK
    varchar(50) accept_remote
    boolean     contract_permanent
    varchar(16) currency
    varchar(16) locale
    varchar(255) profession_id
    json        required_experience
    json        required_experience_pro
    varchar(100) start
    int         salary_min
    int         salary_max
    varchar(16) salary_currency
    varchar(50) salary_recurrence
    int         salary_max_per_year
    varchar(50) remote_policy_frequency
    tinyint     remote_policy_days_per_week
    json        places
  }
  OFFER_SMALL_COMPANY {
    char(36)    id PK
    char(36)    offer_id FK
    varchar(255) company_name
    varchar(255) handle
    varchar(255) external_id
    varchar(255) seo_alias
    varchar(255) gallery_handle
    bigint      company_type
    varchar(255) company_type_explicit
    varchar(512) fallback_gallery_url
  }
  OFFER_SMALL_COMPANY_SECTORS {
    char(36)    id PK
    char(36)    offer_id FK
    varchar(255) sector
  }
  OFFER_PROFESSION {
    char(36)    id PK
    char(36)    offer_id FK
    varchar(255) algolia_keyword
    json        lang_content
  }
  OFFER_GEOLOC {
    char(36)    id PK
    char(36)    offer_id FK
    int         position
    decimal     lat
    decimal     lng
  }
  OFFER_FORMATTED_PLACES {
    char(36)    id PK
    char(36)    offer_id FK
    int         position
    varchar(255) place
  }
  OFFER_CONTRACT_TYPES {
    char(36)    id PK
    char(36)    offer_id FK
    varchar(50) contract_type
  }
  OFFER_SKILLS {
    char(36)    id PK
    char(36)    offer_id FK
    varchar(255) skill_name
    double      skill_value
  }
  OFFER_APPLICATION_STATS {
    char(36)    id PK
    char(36)    offer_id FK
    double      all_time_acceptance_rate
    double      all_time_reply_time
    double      last_30_days_acceptance_rate
    double      last_30_days_reply_time
    bigint      updated_at_epoch
  }
  OFFER_ANALYTICS {
    char(36)    id PK
    char(36)    offer_id FK
    bigint      applications
    bigint      apply_btn_clicks
    bigint      ats_applications
    double      cta
    double      ctr
    bigint      remote_applications
    bigint      total_applications
    bigint      visits_count
    bigint      updated_at_epoch
  }
  SAVED_OFFERS {
    char(36)    id PK
    int unsigned user_id FK
    char(36)    offer_id FK
    datetime    saved_at
  }
  OFFER_TAGS {
    char(36)    id PK
    char(36)    offer_id FK
    varchar(50) tag
  }
  OFFER_AI_DATA {
    char(36)    id PK
    char(36)    offer_id FK
    text        keywords
    varchar(100) category
    float       relevance_score
    text        summary
    datetime    processed_at
  }
  INGESTION_LOGS {
    char(36)    id PK
    varchar(50) source
    enum        status
    int         offers_fetched
    int         offers_inserted
    int         offers_updated
    float       duration_avg_ms
    text        errors
    datetime    started_at
    datetime    ended_at
  }

  USERS ||--o{ SAVED_OFFERS : saves
  OFFERS ||--o{ SAVED_OFFERS : saved_in
  OFFERS ||--o{ OFFER_TAGS : has
  OFFERS ||--|{ OFFER_AI_DATA : enriched_by
  OFFERS ||--|| OFFER_DETAILS : details
  OFFERS ||--|| OFFER_SMALL_COMPANY : small_company
  OFFERS ||--o{ OFFER_SMALL_COMPANY_SECTORS : small_company_sector
  OFFERS ||--|| OFFER_PROFESSION : profession
  OFFERS ||--o{ OFFER_GEOLOC : geoloc
  OFFERS ||--o{ OFFER_FORMATTED_PLACES : formatted_places
  OFFERS ||--o{ OFFER_CONTRACT_TYPES : contract_types
  OFFERS ||--o{ OFFER_SKILLS : skills
  OFFERS ||--|| OFFER_APPLICATION_STATS : application_stats
  OFFERS ||--|| OFFER_ANALYTICS : analytics
```

---

## Description des tables

### `users`
Gere l'authentification et les roles d'acces.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, NOT NULL, AUTO_INCREMENT | Identifiant unique |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Email de connexion |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Mot de passe hashe |
| `username` | `VARCHAR(100)` | NOT NULL, UNIQUE | Nom d'affichage |
| `role` | `ENUM('user','admin')` | NOT NULL, DEFAULT 'user' | Role d'acces |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Compte actif ou desactive |
| `login_attempts` | `TINYINT UNSIGNED` | NOT NULL, DEFAULT 0 | Compteur de tentatives echouees |
| `locked_until` | `DATETIME` | NULL | Date de fin de blocage (brute-force) |
| `created_at` | `DATETIME` | NOT NULL, DEFAULT NOW() | Date de creation |
| `updated_at` | `DATETIME` | NOT NULL, AUTO UPDATE | Date de derniere modification |

---

### `offers`
Table centrale. Stocke les champs top-level du schema Job.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `external_id` | `VARCHAR(255)` | NOT NULL | ID de l'offre dans la source |
| `source` | `VARCHAR(50)` | NOT NULL | Nom de la source (ex: `welovedevs`) |
| `source_object_id` | `VARCHAR(255)` | NULL | ObjectID de la source |
| `source_reference` | `VARCHAR(255)` | NULL | Reference de la source |
| `source_type` | `VARCHAR(100)` | NULL | Type de job selon la source |
| `source_created_at` | `DATETIME` | NULL | Creation cote source |
| `source_last_update_at` | `DATETIME` | NULL | Derniere mise a jour cote source |
| `creator_id` | `VARCHAR(255)` | NULL | Createur cote source |
| `company_id` | `VARCHAR(255)` | NULL | ID entreprise cote source |
| `title` | `VARCHAR(255)` | NOT NULL | Intitule du poste |
| `description` | `MEDIUMTEXT` | NOT NULL | Description complete |
| `description_preview` | `TEXT` | NULL | Resume de la description |
| `raw_description` | `MEDIUMTEXT` | NULL | Description brute |
| `helmet_handle` | `VARCHAR(255)` | NULL | Handle helmet |
| `seo_alias` | `VARCHAR(255)` | NULL | Alias SEO |
| `status` | `VARCHAR(50)` | NULL | Statut de la source |
| `application_30_days` | `BOOLEAN` | NULL | Activation application 30 jours |
| `ranking` | `BIGINT` | NULL | Rang de l'offre |
| `premium_bool` | `BOOLEAN` | NULL | Premium booleen |
| `premium_int` | `BIGINT` | NULL | Premium entier |
| `published_at` | `DATETIME` | NOT NULL | Date de publication |
| `ingested_at` | `DATETIME` | NOT NULL, DEFAULT NOW() | Date d'ingestion en base |
| `updated_at` | `DATETIME` | NOT NULL, AUTO UPDATE | Date de derniere modification |
| `source_payload` | `JSON` | NULL | JSON brut de la source |

**Contrainte d'unicite :** `(external_id, source)` — empeche les doublons lors des ingestions repetees.

---

### `offer_details`
Details issus de `details.*` (contrats, salaire, remote policy, places, etc.).

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id), UNIQUE | Offre associee (1-1) |
| `accept_remote` | `VARCHAR(50)` | NULL | Mode remote accepte |
| `contract_permanent` | `BOOLEAN` | NULL | Contrat permanent |
| `currency` | `VARCHAR(16)` | NULL | Devise |
| `locale` | `VARCHAR(16)` | NULL | Locale |
| `profession_id` | `VARCHAR(255)` | NULL | ID de profession |
| `required_experience` | `JSON` | NULL | Experience requise |
| `required_experience_pro` | `JSON` | NULL | Experience pro requise |
| `start` | `VARCHAR(100)` | NULL | Date/texte de debut |
| `salary_min` | `INT UNSIGNED` | NULL | Salaire minimum |
| `salary_max` | `INT UNSIGNED` | NULL | Salaire maximum |
| `salary_currency` | `VARCHAR(16)` | NULL | Devise salaire |
| `salary_recurrence` | `VARCHAR(50)` | NULL | Recurrence salaire |
| `salary_max_per_year` | `INT UNSIGNED` | NULL | Salaire max/an |
| `remote_policy_frequency` | `VARCHAR(50)` | NULL | Frequence remote |
| `remote_policy_days_per_week` | `TINYINT UNSIGNED` | NULL | Jours remote/semaine |
| `places` | `JSON` | NULL | Places associees |

---

### `offer_small_company`
Informations `smallCompany.*`.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id), UNIQUE | Offre associee (1-1) |
| `company_name` | `VARCHAR(255)` | NULL | Nom de l'entreprise |
| `handle` | `VARCHAR(255)` | NULL | Handle |
| `external_id` | `VARCHAR(255)` | NULL | ID externe |
| `seo_alias` | `VARCHAR(255)` | NULL | Alias SEO |
| `gallery_handle` | `VARCHAR(255)` | NULL | Handle gallery |
| `company_type` | `BIGINT` | NULL | Type entreprise |
| `company_type_explicit` | `VARCHAR(255)` | NULL | Type explicite |
| `fallback_gallery_url` | `VARCHAR(512)` | NULL | URL fallback |

---

### `offer_small_company_sectors`
Liste des secteurs pour `smallCompany.sectors`.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id) | Offre associee |
| `sector` | `VARCHAR(255)` | NOT NULL | Secteur |

---

### `offer_profession`
Informations `profession.*`.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id), UNIQUE | Offre associee (1-1) |
| `algolia_keyword` | `VARCHAR(255)` | NULL | Mot-cle Algolia |
| `lang_content` | `JSON` | NULL | Contenu multilingue |

---

### `offer_geoloc`
Positions `_geoloc[]`.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id) | Offre associee |
| `position` | `INT UNSIGNED` | NOT NULL | Index dans la liste |
| `lat` | `DECIMAL(10,7)` | NULL | Latitude |
| `lng` | `DECIMAL(10,7)` | NULL | Longitude |

---

### `offer_formatted_places`
Liste `formattedPlaces[]`.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id) | Offre associee |
| `position` | `INT UNSIGNED` | NOT NULL | Index dans la liste |
| `place` | `VARCHAR(255)` | NOT NULL | Valeur |

---

### `offer_contract_types`
Types de contrat (liste).

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id) | Offre associee |
| `contract_type` | `VARCHAR(50)` | NOT NULL | Type de contrat |

---

### `offer_skills`
Competences associees.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id) | Offre associee |
| `skill_name` | `VARCHAR(255)` | NOT NULL | Nom de competence |
| `skill_value` | `DOUBLE` | NULL | Valeur/score |

---

### `offer_application_stats`
Statistiques d'application.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id), UNIQUE | Offre associee (1-1) |
| `all_time_acceptance_rate` | `DOUBLE` | NULL | Taux acceptation all time |
| `all_time_reply_time` | `DOUBLE` | NULL | Temps reponse all time |
| `last_30_days_acceptance_rate` | `DOUBLE` | NULL | Taux acceptation 30 jours |
| `last_30_days_reply_time` | `DOUBLE` | NULL | Temps reponse 30 jours |
| `updated_at_epoch` | `BIGINT UNSIGNED` | NULL | Epoch mise a jour |

---

### `offer_analytics`
Analytics d'offre.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id), UNIQUE | Offre associee (1-1) |
| `applications` | `BIGINT UNSIGNED` | NULL | Applications |
| `apply_btn_clicks` | `BIGINT UNSIGNED` | NULL | Clics bouton apply |
| `ats_applications` | `BIGINT UNSIGNED` | NULL | ATS applications |
| `cta` | `DOUBLE` | NULL | CTA |
| `ctr` | `DOUBLE` | NULL | CTR |
| `remote_applications` | `BIGINT UNSIGNED` | NULL | Applications remote |
| `total_applications` | `BIGINT UNSIGNED` | NULL | Total applications |
| `visits_count` | `BIGINT UNSIGNED` | NULL | Nombre de visites |
| `updated_at_epoch` | `BIGINT UNSIGNED` | NULL | Epoch mise a jour |

---

### `saved_offers`
Table de liaison pour les offres sauvegardees par les utilisateurs.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `user_id` | `INT UNSIGNED` | FK → users(id), CASCADE | Utilisateur |
| `offer_id` | `CHAR(36)` | FK → offers(id), CASCADE | Offre sauvegardee |
| `saved_at` | `DATETIME` | NOT NULL, DEFAULT NOW() | Date de sauvegarde |

**Contrainte d'unicite :** `(user_id, offer_id)` — un utilisateur ne peut sauvegarder la meme offre qu'une fois.

---

### `offer_tags`
Tags associes aux offres.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id), CASCADE | Offre associee |
| `tag` | `VARCHAR(50)` | NOT NULL | Valeur du tag (ex: `React`, `Remote`) |

**Contrainte d'unicite :** `(offer_id, tag)` — pas de doublon de tag sur une meme offre.

---

### `offer_ai_data`
Donnees enrichies produites par le module IA pour chaque offre.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `offer_id` | `CHAR(36)` | FK → offers(id), CASCADE, UNIQUE | Offre associee (1-1) |
| `keywords` | `TEXT` | NULL | Mots-cles extraits (JSON serialize) |
| `category` | `VARCHAR(100)` | NULL | Categorie detectee |
| `relevance_score` | `FLOAT` | NULL | Score de pertinence (0-1) |
| `summary` | `TEXT` | NULL | Resume genere |
| `processed_at` | `DATETIME` | NOT NULL, DEFAULT NOW() | Date de traitement |

---

### `ingestion_logs`
Trace chaque execution du pipeline d'ingestion pour le monitoring et le debug.

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | `CHAR(36)` | PK, NOT NULL | Identifiant unique UUID |
| `source` | `VARCHAR(50)` | NOT NULL | Source ingeree (ex: `welovedevs`) |
| `status` | `ENUM('success','partial','failed')` | NOT NULL, DEFAULT 'success' | Resultat de l'ingestion |
| `offers_fetched` | `INT UNSIGNED` | NOT NULL, DEFAULT 0 | Nombre d'offres recuperees |
| `offers_inserted` | `INT UNSIGNED` | NOT NULL, DEFAULT 0 | Nombre d'offres inserees |
| `offers_updated` | `INT UNSIGNED` | NOT NULL, DEFAULT 0 | Nombre d'offres mises a jour |
| `duration_avg_ms` | `FLOAT` | NULL | Duree moyenne de traitement par offre (ms) |
| `errors` | `TEXT` | NULL | Message d'erreur si echec |
| `started_at` | `DATETIME` | NOT NULL, DEFAULT NOW() | Debut de l'ingestion |
| `ended_at` | `DATETIME` | NULL | Fin de l'ingestion |

---

## Contraintes d'integrite resumees

| Table | Contrainte | Type |
|---|---|---|
| `users` | `email` unique | UNIQUE KEY |
| `users` | `username` unique | UNIQUE KEY |
| `offers` | `(external_id, source)` unique | UNIQUE KEY |
| `offer_details` | `offer_id` unique | UNIQUE KEY |
| `offer_small_company` | `offer_id` unique | UNIQUE KEY |
| `offer_small_company_sectors` | `(offer_id, sector)` unique | UNIQUE KEY |
| `offer_profession` | `offer_id` unique | UNIQUE KEY |
| `offer_geoloc` | `(offer_id, position)` unique | UNIQUE KEY |
| `offer_formatted_places` | `(offer_id, position)` unique | UNIQUE KEY |
| `offer_contract_types` | `(offer_id, contract_type)` unique | UNIQUE KEY |
| `offer_skills` | `(offer_id, skill_name)` unique | UNIQUE KEY |
| `offer_application_stats` | `offer_id` unique | UNIQUE KEY |
| `offer_analytics` | `offer_id` unique | UNIQUE KEY |
| `saved_offers` | `(user_id, offer_id)` unique | UNIQUE KEY |
| `saved_offers` | suppression en cascade si user/offre supprime | ON DELETE CASCADE |
| `offer_tags` | `(offer_id, tag)` unique | UNIQUE KEY |
| `offer_tags` | suppression en cascade si offre supprimee | ON DELETE CASCADE |
| `offer_ai_data` | une seule entree par offre | UNIQUE KEY |
| `offer_ai_data` | suppression en cascade si offre supprimee | ON DELETE CASCADE |
