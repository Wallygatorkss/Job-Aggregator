import json
import os
import re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

try:
    from weasyprint import HTML, CSS
except ModuleNotFoundError:  # pragma: no cover - runtime environment dependent
    msg = (
        "WeasyPrint n\'est pas installé. Pour générer le PDF, installez-le:\n"
        "Sur Debian/Ubuntu:\n"
        "  sudo apt update && sudo apt install -y libpango-1.0-0 libgdk-pixbuf2.0-0 libffi-dev libcairo2\n"
        "Ensuite installez le paquet Python dans un virtualenv:\n"
        "  python3 -m venv .venv && source .venv/bin/activate\n"
        "  pip install --upgrade pip\n"
        "  pip install WeasyPrint\n"
        "Ou utilisez 'pip install -r requirements.txt' si fourni.\n"
    )
    raise ModuleNotFoundError(msg)



DEFAULT_PROFIL = {
    "prenom":    "Sophie",
    "nom":       "Martin",
    "poste":     "Développeuse Full-Stack",
    "email":     "sophie.martin@email.com",
    "telephone": "+33 6 12 34 56 78",
    "ville":     "Paris, France",
    "linkedin":  "linkedin.com/in/sophiemartin",

    "summary": (
        "Développeuse Full-Stack passionnée avec 5 ans d'expérience "
        "dans la conception d'applications web modernes. Spécialisée React/Node.js, "
        "j'aime résoudre des problèmes complexes et livrer des produits propres "
        "et performants en équipe agile."
    ),

    "skills": [
        ("React / Next.js",  90),
        ("Node.js / Express", 85),
        ("TypeScript",        80),
        ("PostgreSQL",        75),
        ("Docker / CI-CD",   70),
        ("Python",            65),
    ],

    "langues": [
        ("Français",  "Natif"),
        ("Anglais",   "Courant"),
        ("Espagnol",  "Notions"),
    ],

    "interets": ["Open Source", "UX Design", "Escalade", "Podcasts Tech"],

    "experiences": [
        {
            "titre":    "Développeuse Full-Stack Senior",
            "societe":  "TechCorp",
            "lieu":     "Paris",
            "dates":    "2022 – Présent",
            "bullets": [
                "Conception et développement d'une plateforme SaaS (React + Node.js) "
                "servant 50 000 utilisateurs mensuels",
                "Réduction du temps de chargement de 40 % via SSR (Next.js) et optimisation BDD",
                "Lead technique d'une équipe de 4 développeurs en méthode Scrum",
            ],
        },
        {
            "titre":    "Développeuse Front-End",
            "societe":  "StartupXYZ",
            "lieu":     "Lyon",
            "dates":    "2019 – 2022",
            "bullets": [
                "Refonte complète de l'interface utilisateur (React + TypeScript)",
                "Intégration d'APIs RESTful et mise en place de tests E2E (Cypress)",
                "Amélioration du taux de conversion de 25 % sur le tunnel d'achat",
            ],
        },
    ],

    "formations": [
        {
            "diplome": "Master Informatique – Génie Logiciel",
            "ecole":   "Université Paris-Saclay",
            "dates":   "2017 – 2019",
        },
        {
            "diplome": "Licence Informatique",
            "ecole":   "Université Lyon 1",
            "dates":   "2014 – 2017",
        },
    ],
}



DEFAULT_OFFRE = {
    "titre":    "Développeur·se Full-Stack React / Node.js",
    "societe":  "Fintech Innovate",
    "mots_cles": ["React", "Node.js", "TypeScript", "PostgreSQL", "API REST", "Agile"],

    "offer_match": (
        "Mon expérience de 5 ans sur React et Node.js en environnement SaaS "
        "correspond exactement à votre stack. J'ai déjà travaillé dans le secteur "
        "fintech et j'apprécie particulièrement les équipes qui pratiquent l'agilité."
    ),
}



DEFAULT_SKILL_LEVEL = 70

EMPTY_PROFIL = {
    "prenom": "",
    "nom": "",
    "poste": "",
    "email": "",
    "telephone": "",
    "ville": "",
    "linkedin": "",
    "summary": "",
    "skills": [],
    "langues": [],
    "interets": [],
    "experiences": [],
    "formations": [],
}


def load_json_file(path: str) -> dict:
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Fichier JSON introuvable: {file_path}")
    return json.loads(file_path.read_text(encoding="utf-8"))


def merge_profile(base: dict, override: dict) -> dict:
    merged = {**base}
    for key, value in override.items():
        if value is not None:
            merged[key] = value
    return merged


def fetch_json(url: str, token: str | None = None) -> dict | list:
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(url, headers=headers)
    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise RuntimeError(f"Erreur HTTP {exc.code} lors de l'appel {url}") from exc
    except URLError as exc:
        raise RuntimeError(f"Impossible de joindre {url}: {exc.reason}") from exc


def split_username(username: str | None) -> tuple[str, str]:
    if not username:
        return "", ""
    parts = username.replace("_", " ").replace("-", " ").split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def map_skills(user_skills: list) -> list:
    skills = []
    for index, item in enumerate(user_skills):
        skill_name = item.get("skill", {}).get("name") if isinstance(item, dict) else None
        if skill_name:
            level = max(50, DEFAULT_SKILL_LEVEL - index * 2)
            skills.append((skill_name, level))
    return skills


def format_experience_dates(start_date: str | None, end_date: str | None) -> str:
    if start_date and end_date:
        return f"{start_date[:4]} – {end_date[:4]}"
    if start_date:
        return f"{start_date[:4]} – Présent"
    return ""


def map_experiences(experiences: list, fallback_city: str) -> list:
    mapped = []
    for exp in experiences:
        if not isinstance(exp, dict):
            continue
        description = exp.get("description")
        bullets = [description] if description else []
        mapped.append(
            {
                "titre": exp.get("title", ""),
                "societe": exp.get("company", ""),
                "lieu": fallback_city,
                "dates": format_experience_dates(exp.get("startDate"), exp.get("endDate")),
                "bullets": bullets,
            }
        )
    return mapped


def build_profile_from_api(base: dict, api_base_url: str, token: str | None) -> dict:
    base_url = api_base_url.rstrip("/")
    user = fetch_json(f"{base_url}/api/auth/me", token)
    user_skills = fetch_json(f"{base_url}/api/skills/user", token)
    experiences = fetch_json(f"{base_url}/api/experiences/me", token)

    prenom, nom = split_username(user.get("username") if isinstance(user, dict) else None)

    profile = {**base}
    profile.update(
        {
            "prenom": user.get("first_name", prenom) if isinstance(user, dict) else base["prenom"],
            "nom": user.get("last_name", nom) if isinstance(user, dict) else base["nom"],
            "email": user.get("email", base["email"]) if isinstance(user, dict) else base["email"],
        }
    )

    mapped_skills = map_skills(user_skills if isinstance(user_skills, list) else [])
    if mapped_skills:
        profile["skills"] = mapped_skills

    mapped_experiences = map_experiences(
        experiences if isinstance(experiences, list) else [], profile.get("ville", "")
    )
    if mapped_experiences:
        profile["experiences"] = mapped_experiences

    return profile


def load_profile_data() -> dict:
    profile_json_path = os.environ.get("CV_PROFILE_JSON")
    api_base_url = os.environ.get("CV_API_BASE_URL")
    api_token = os.environ.get("CV_API_TOKEN")

    if profile_json_path:
        profile = merge_profile(EMPTY_PROFIL, load_json_file(profile_json_path))
    elif api_base_url:
        profile = build_profile_from_api(EMPTY_PROFIL, api_base_url, api_token)
    else:
        profile = DEFAULT_PROFIL

    return profile


def load_offer_data() -> dict:
    offer = DEFAULT_OFFRE
    offer_json_path = os.environ.get("CV_OFFER_JSON")
    if offer_json_path:
        offer = {**offer, **load_json_file(offer_json_path)}
    return offer



def render_skills(skills):
    html = ""
    for name, level in skills:
        html += f"""
        <div class="skill-item">
          <div class="skill-name"><span>{name}</span></div>
          <div class="skill-bar">
            <div class="skill-fill" style="width:{level}%"></div>
          </div>
        </div>"""
    return html


def render_langues(langues):
    html = ""
    for lang, niveau in langues:
        html += f"""
        <div class="lang-item">
          <span class="lang-name">{lang}</span>
          <span class="lang-level">{niveau}</span>
        </div>"""
    return html


def render_interets(interets):
    return "".join(f'<span class="tag">{i}</span>' for i in interets)


def render_experiences(experiences):
    html = ""
    for exp in experiences:
        bullets = "".join(f"<li>{b}</li>" for b in exp["bullets"])
        html += f"""
        <div class="experience-item">
          <div class="exp-header">
            <span class="exp-title">{exp['titre']}</span>
            <span class="exp-date">{exp['dates']}</span>
          </div>
          <div class="exp-company">
            <span>{exp['societe']}</span> · {exp['lieu']}
          </div>
          <ul class="exp-bullets">{bullets}</ul>
        </div>"""
    return html


def render_formations(formations):
    html = ""
    for f in formations:
        html += f"""
        <div class="edu-item">
          <div>
            <div class="edu-degree">{f['diplome']}</div>
            <div class="edu-school">{f['ecole']}</div>
          </div>
          <span class="edu-date">{f['dates']}</span>
        </div>"""
    return html



def personalize_skills(skills, mots_cles):
    """Monte en tête les compétences qui matchent l'offre."""
    mots_lower = [m.lower() for m in mots_cles]
    priority, rest = [], []
    for skill in skills:
        name_lower = skill[0].lower()
        if any(m in name_lower for m in mots_lower):
            priority.append(skill)
        else:
            rest.append(skill)
    return priority + rest


def get_initials(prenom: str, nom: str) -> str:
    prenom_initial = prenom.strip()[:1] if prenom else ""
    nom_initial = nom.strip()[:1] if nom else ""
    initials = f"{prenom_initial}{nom_initial}".strip()
    return initials or "?"



def generate_cv_pdf(profil: dict, offre: dict, output_path: str):
    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    skills_perso = personalize_skills(profil["skills"], offre["mots_cles"])

    template_path = Path(__file__).parent / "cv_template.html"
    html = template_path.read_text(encoding="utf-8")

    avatar_html = get_initials(profil.get("prenom", ""), profil.get("nom", ""))
    avatar_src = profil.get("avatar_url") or profil.get("avatar") or None
    if avatar_src and isinstance(avatar_src, str) and avatar_src.strip():
        avatar_html = f'<img src="{avatar_src}" alt="photo" />'

    replacements = {
    "{{INITIALES}}":  avatar_html,
        "{{PRENOM}}":     profil["prenom"],
        "{{NOM}}":        profil["nom"],
        "{{POSTE}}":      profil["poste"],
        "{{EMAIL}}":      profil["email"],
        "{{TELEPHONE}}":  profil["telephone"],
        "{{VILLE}}":      profil["ville"],
        "{{LINKEDIN}}":   profil["linkedin"],
        "{{SUMMARY}}":    profil["summary"],
        "{{OFFER_MATCH}}": offre["offer_match"],
        "{{SKILLS}}":     render_skills(skills_perso),
        "{{LANGUES}}":    render_langues(profil["langues"]),
        "{{INTERETS}}":   render_interets(profil["interets"]),
        "{{EXPERIENCES}}": render_experiences(profil["experiences"]),
        "{{FORMATIONS}}": render_formations(profil["formations"]),
    }

    for placeholder, value in replacements.items():
        html = html.replace(placeholder, value)

    HTML(string=html, base_url=str(Path(__file__).parent)).write_pdf(str(out_path))
    print(f"✅ CV généré : {output_path}")



if __name__ == "__main__":
    profil = load_profile_data()
    offre = load_offer_data()
    nom_fichier = (
        f"CV_{profil['prenom']}_{profil['nom']}_"
        f"{offre['societe'].replace(' ', '_')}.pdf"
    )
    out_dir = os.environ.get("CV_OUTPUT_DIR", None)
    if not out_dir:
        out_dir = Path(__file__).parent / "outputs"
    generate_cv_pdf(profil, offre, str(Path(out_dir) / nom_fichier))
