CREATE TABLE IF NOT EXISTS User (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username      VARCHAR(100) NOT NULL,
    role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    professional_status ENUM('looking_for_work', 'employed') NOT NULL DEFAULT 'looking_for_work',

    login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until   DATETIME     NULL DEFAULT NULL,

    avatar_url     TEXT         NULL,
    banner_url     TEXT         NULL,

    phone          VARCHAR(32)  NULL,
    language       VARCHAR(16)  NULL,
    bio            TEXT         NULL,
    interests      JSON         NULL,
    formations     JSON         NULL,
    website        VARCHAR(512) NULL,
    location       VARCHAR(255) NULL,

    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skills (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    type        ENUM('hardskill', 'softskill') NOT NULL,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_skills_name (name),
    KEY idx_skills_type (type)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_skills (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id   INT UNSIGNED NOT NULL,
    skill_id  INT UNSIGNED NOT NULL,
    created_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_skills_user_skill (user_id, skill_id),
    KEY idx_user_skills_user (user_id),
    KEY idx_user_skills_skill (skill_id),
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experiences (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,
    company     VARCHAR(255) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NULL,
    description TEXT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_experiences_user (user_id),
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offers (
    id                              CHAR(36)      NOT NULL DEFAULT (UUID()),
    external_id                     VARCHAR(255)  NOT NULL,
    source                          VARCHAR(50)   NOT NULL,
    source_object_id                VARCHAR(255)  NULL,
    source_reference                VARCHAR(255)  NULL,
    source_type                     VARCHAR(100)  NULL,
    source_created_at               DATETIME      NULL,
    source_last_update_at           DATETIME      NULL,
    creator_id                      VARCHAR(255)  NULL,
    company_id                      VARCHAR(255)  NULL,

    title                           VARCHAR(255)  NOT NULL,
    description                     MEDIUMTEXT    NOT NULL,
    description_preview             TEXT          NULL,
    raw_description                 MEDIUMTEXT    NULL,
    helmet_handle                   VARCHAR(255)  NULL,
    seo_alias                       VARCHAR(255)  NULL,

    status                          VARCHAR(50)   NULL,
    application_30_days             BOOLEAN       NULL,
    ranking                         BIGINT        NULL,
    premium_bool                    BOOLEAN       NULL,
    premium_int                     BIGINT        NULL,

    published_at                    DATETIME      NOT NULL,
    ingested_at                     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    source_payload                  JSON          NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offers_external_source (external_id, source),
    KEY idx_offers_source_status (source, status),
    KEY idx_offers_published_at (published_at)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Application (
    id           CHAR(36)      NOT NULL DEFAULT (UUID()),
    offer_id     CHAR(36)      NOT NULL,
    offer_title  VARCHAR(255)  NOT NULL,
    company_name VARCHAR(255)  NOT NULL,
    location     VARCHAR(255)  NOT NULL,
    first_name   VARCHAR(100)  NOT NULL,
    last_name    VARCHAR(100)  NOT NULL,
    cv_url       VARCHAR(512)  NOT NULL,
    linkedin_url VARCHAR(512)  NULL,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id      INT UNSIGNED  NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_applications_offer_cv_name (offer_id, cv_url, first_name, last_name),
    KEY idx_applications_offer (offer_id),
    KEY idx_applications_user (user_id),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferDetails (
    id                         CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id                   CHAR(36)     NOT NULL,
    accept_remote              VARCHAR(50)  NULL,
    contract_permanent         BOOLEAN      NULL,
    currency                   VARCHAR(16)  NULL,
    locale                     VARCHAR(16)  NULL,
    profession_id              VARCHAR(255) NULL,
    required_experience        JSON         NULL,
    required_experience_pro    JSON         NULL,
    start                      VARCHAR(100) NULL,
    salary_min                 INT UNSIGNED NULL,
    salary_max                 INT UNSIGNED NULL,
    salary_currency            VARCHAR(16)  NULL,
    salary_recurrence          VARCHAR(50)  NULL,
    salary_max_per_year        INT UNSIGNED NULL,
    remote_policy_frequency    VARCHAR(50)  NULL,
    remote_policy_days_per_week TINYINT UNSIGNED NULL,
    places                     JSON         NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_details_offer (offer_id),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferSmallCompany (
    id                    CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id              CHAR(36)     NOT NULL,
    company_name          VARCHAR(255) NULL,
    handle                VARCHAR(255) NULL,
    external_id           VARCHAR(255) NULL,
    seo_alias             VARCHAR(255) NULL,
    gallery_handle        VARCHAR(255) NULL,
    company_type          BIGINT       NULL,
    company_type_explicit VARCHAR(255) NULL,
    fallback_gallery_url  VARCHAR(512) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_small_company_offer (offer_id),
    KEY idx_offer_small_company_name (company_name),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferSmallCompanySector (
    id       CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id CHAR(36)     NOT NULL,
    sector   VARCHAR(255) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_small_company_sector (offer_id, sector),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferProfession (
    id              CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id        CHAR(36)     NOT NULL,
    algolia_keyword VARCHAR(255) NULL,
    lang_content    JSON         NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_profession_offer (offer_id),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferGeoloc (
    id       CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id CHAR(36)     NOT NULL,
    position INT UNSIGNED NOT NULL,
    lat      DECIMAL(10,7) NULL,
    lng      DECIMAL(10,7) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_geoloc_offer_position (offer_id, position),
    KEY idx_offer_geoloc (lat, lng),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferFormattedPlace (
    id       CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id CHAR(36)     NOT NULL,
    position INT UNSIGNED NOT NULL,
    place    VARCHAR(255) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_formatted_places_offer_position (offer_id, position),
    KEY idx_offer_formatted_places_place (place),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferContractType (
    id            CHAR(36)    NOT NULL DEFAULT (UUID()),
    offer_id      CHAR(36)    NOT NULL,
    contract_type VARCHAR(50) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_contract_types_offer_contract (offer_id, contract_type),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferSkill (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id    CHAR(36)     NOT NULL,
    skill_name  VARCHAR(255) NOT NULL,
    skill_value DOUBLE       NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_skills_offer_name (offer_id, skill_name),
    KEY idx_offer_skills_name (skill_name),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferApplicationStat (
    id                           CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id                     CHAR(36)     NOT NULL,
    all_time_acceptance_rate     DOUBLE       NULL,
    all_time_reply_time          DOUBLE       NULL,
    last_30_days_acceptance_rate DOUBLE       NULL,
    last_30_days_reply_time      DOUBLE       NULL,
    updated_at_epoch             BIGINT UNSIGNED NULL,
    created_at                   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_application_stats_offer (offer_id),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferAnalytic (
    id                  CHAR(36)        NOT NULL DEFAULT (UUID()),
    offer_id            CHAR(36)        NOT NULL,
    applications        BIGINT UNSIGNED NULL,
    apply_btn_clicks    BIGINT UNSIGNED NULL,
    ats_applications    BIGINT UNSIGNED NULL,
    cta                 DOUBLE          NULL,
    ctr                 DOUBLE          NULL,
    remote_applications BIGINT UNSIGNED NULL,
    total_applications  BIGINT UNSIGNED NULL,
    visits_count        BIGINT UNSIGNED NULL,
    updated_at_epoch    BIGINT UNSIGNED NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_analytics_offer (offer_id),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS SavedOffer (
    id        CHAR(36)     NOT NULL DEFAULT (UUID()),
    user_id   INT UNSIGNED NOT NULL,
    offer_id  CHAR(36)     NOT NULL,
    saved_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_saved_offers_user_offer (user_id, offer_id),
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferTag (
    id        CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id  CHAR(36)     NOT NULL,
    tag       VARCHAR(50)  NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_tags_offer_tag (offer_id, tag),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS OfferAiData (
    id              CHAR(36)     NOT NULL DEFAULT (UUID()),
    offer_id        CHAR(36)     NOT NULL,
    keywords        TEXT         NULL,
    category        VARCHAR(100) NULL,
    relevance_score FLOAT        NULL,
    summary         TEXT         NULL,
    processed_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_offer_ai_data_offer (offer_id),
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS IngestionLog (
    id               CHAR(36)      NOT NULL DEFAULT (UUID()),
    source           VARCHAR(50)   NOT NULL,
    status           ENUM('success', 'partial', 'failed') NOT NULL DEFAULT 'success',
    offers_fetched   INT UNSIGNED  NOT NULL DEFAULT 0,
    offers_inserted  INT UNSIGNED  NOT NULL DEFAULT 0,
    offers_updated   INT UNSIGNED  NOT NULL DEFAULT 0,
    duration_avg_ms  FLOAT         NULL,
    errors           TEXT          NULL,
    started_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at         DATETIME      NULL,

    PRIMARY KEY (id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_contract_preferences (
    id int unsigned NOT NULL AUTO_INCREMENT,
    user_id int unsigned NOT NULL,
    contract_type varchar(50) NOT NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_contract_unique (user_id, contract_type),
    KEY idx_user_contract_user (user_id),
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_location_preferences (
    id int unsigned NOT NULL AUTO_INCREMENT,
    user_id int unsigned NOT NULL,
    location varchar(255) NOT NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_location_unique (user_id, location),
    KEY idx_user_location_user (user_id),
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS IaDislike (
    id        CHAR(36)     NOT NULL DEFAULT (UUID()),
    user_id   INT UNSIGNED NOT NULL,
    offer_id  CHAR(36)     NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_ia_dislike_user_offer (user_id, offer_id),
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
