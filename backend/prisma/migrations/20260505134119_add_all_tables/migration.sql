CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "external_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_preview" TEXT,
    "raw_description" TEXT,
    "company_name" TEXT NOT NULL,
    "company_logo_url" TEXT,
    "company_website_url" TEXT,
    "location" TEXT NOT NULL,
    "contract_type" TEXT,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_currency" TEXT,
    "salary_recurrence" TEXT,
    "salary_max_per_year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "original_url" TEXT,
    "published_at" DATETIME NOT NULL,
    "expires_at" DATETIME,
    "ingested_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "OfferContractType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offer_id" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL,
    CONSTRAINT "OfferContractType_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OfferSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offer_id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "skill_value" REAL,
    CONSTRAINT "OfferSkill_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OfferApplicationStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offer_id" TEXT NOT NULL,
    "all_time_acceptance_rate" REAL,
    "all_time_reply_time" REAL,
    "last_30_days_acceptance_rate" REAL,
    "last_30_days_reply_time" REAL,
    "updated_at_epoch" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferApplicationStat_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OfferAnalytic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offer_id" TEXT NOT NULL,
    "applications" INTEGER,
    "apply_btn_clicks" INTEGER,
    "ats_applications" INTEGER,
    "cta" REAL,
    "ctr" REAL,
    "remote_applications" INTEGER,
    "total_applications" INTEGER,
    "visits_count" INTEGER,
    "updated_at_epoch" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferAnalytic_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SavedOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "offer_id" TEXT NOT NULL,
    "saved_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedOffer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedOffer_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OfferTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offer_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "OfferTag_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OfferAiData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offer_id" TEXT NOT NULL,
    "keywords" TEXT,
    "category" TEXT,
    "relevance_score" REAL,
    "summary" TEXT,
    "processed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferAiData_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password_hash", "role", "updatedAt", "username") SELECT "createdAt", "email", "id", "password_hash", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE UNIQUE INDEX "Offer_external_id_source_key" ON "Offer"("external_id", "source");

CREATE UNIQUE INDEX "OfferContractType_offer_id_contract_type_key" ON "OfferContractType"("offer_id", "contract_type");

CREATE UNIQUE INDEX "OfferSkill_offer_id_skill_name_key" ON "OfferSkill"("offer_id", "skill_name");

CREATE UNIQUE INDEX "OfferApplicationStat_offer_id_key" ON "OfferApplicationStat"("offer_id");

CREATE UNIQUE INDEX "OfferAnalytic_offer_id_key" ON "OfferAnalytic"("offer_id");

CREATE UNIQUE INDEX "SavedOffer_user_id_offer_id_key" ON "SavedOffer"("user_id", "offer_id");

CREATE UNIQUE INDEX "OfferTag_offer_id_tag_key" ON "OfferTag"("offer_id", "tag");

CREATE UNIQUE INDEX "OfferAiData_offer_id_key" ON "OfferAiData"("offer_id");
