# Génération de CV (IA)

Ce script génère un CV PDF à partir d’un template HTML et d’un profil utilisateur.

## Démarrage rapide

- Lancer le script : `python3 GenerateCV.py`
- Le PDF est généré dans `IA/outputs/` (ou `CV_OUTPUT_DIR` si défini).

## Sources de données supportées

Le script charge le profil dans cet ordre :

1. `CV_PROFILE_JSON` (fichier JSON)
2. `CV_API_BASE_URL` + `CV_API_TOKEN` (API backend)
3. Valeurs par défaut dans le script

### Variables d’environnement

- `CV_PROFILE_JSON` : chemin vers un JSON de profil.
- `CV_OFFER_JSON` : chemin vers un JSON d’offre.
- `CV_API_BASE_URL` : URL de l’API backend (ex. `http://localhost:3000`).
- `CV_API_TOKEN` : token JWT (Bearer) pour accéder au profil/skills/expériences.
- `CV_OUTPUT_DIR` : dossier de sortie pour le PDF.

### Exemple de JSON profil

```json
{
  "prenom": "Sophie",
  "nom": "Martin",
  "poste": "Développeuse Full-Stack",
  "email": "sophie.martin@email.com",
  "telephone": "+33 6 12 34 56 78",
  "ville": "Paris, France",
  "linkedin": "linkedin.com/in/sophiemartin",
  "summary": "Profil court...",
  "skills": [["React", 90], ["Node.js", 85]],
  "langues": [["Français", "Natif"], ["Anglais", "Courant"]],
  "interets": ["Open Source", "UX Design"],
  "experiences": [
    {
      "titre": "Dev Full-Stack",
      "societe": "TechCorp",
      "lieu": "Paris",
      "dates": "2022 – Présent",
      "bullets": ["Bullet 1", "Bullet 2"]
    }
  ],
  "formations": [
    {
      "diplome": "Master Informatique",
      "ecole": "Université X",
      "dates": "2017 – 2019"
    }
  ]
}
```

### Exemple de JSON offre

```json
{
  "titre": "Développeur·se Full-Stack React / Node.js",
  "societe": "Fintech Innovate",
  "mots_cles": ["React", "Node.js", "TypeScript"],
  "offer_match": "Mon expérience correspond..."
}
```
