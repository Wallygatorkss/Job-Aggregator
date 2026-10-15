# Justification Innovation - Dashboard & Features Avancees

Pour chaque feature avancee (dashboard, feature data, feature IA), nous documentons : **probleme utilisateur**, **hypothese**, **pertinence de l'approche**, **mesure du succes**.

---

## 1. Dashboard (page principale)

### Probleme utilisateur
Un candidat junior consulte aujourd'hui 3 a 5 plateformes (LinkedIn, WTTJ, WeLoveDevs, Indeed, JobTeaser) pour ne pas rater une offre. Cela cree :
- de la duplication (memes offres a plusieurs endroits) ;
- du bruit (offres hors scope : seniorite, localisation, contrat) ;
- pas de vue d'ensemble sur ce qui a deja ete consulte/sauvegarde.

### Hypothese
Si on centralise les offres dans **une seule page filtrable** avec un score de pertinence par offre, le candidat trouvera et sauvegardera ses 3 premieres offres en moins de **2 minutes**.

### Pourquoi cette approche
- Une page unique (vs. onglets multiples) reduit la charge cognitive.
- Les filtres dynamiques laissent le candidat affiner sans recharger.
- Le score IA visible **avant** le clic evite d'ouvrir des offres non pertinentes.

### Mesure du succes
- **Quantitatif** : temps moyen jusqu'a la premiere sauvegarde (objectif < 2 min sur la demo).
- **Qualitatif** : ratio `offres sauvegardees / offres affichees` > 5 %.
- **Negatif** : taux d'`ia_dislikes / recommandations vues` < 30 %.

---

## 2. Feature Data : filtres avances + analytics

### Probleme utilisateur
Les agregateurs classiques offrent un filtre "ville + mot-cle", mais pas une **comparaison cross-offres** (salaire median par ville, volume d'offres par contrat, evolution temporelle).

### Hypothese
En offrant un onglet "Analytics" qui visualise les **tendances marche** (volume, salaires, types de contrat) sur les donnees WeLoveDevs ingerees, le candidat peut **calibrer ses attentes** (salaire demande, regions plus actives).

### Pourquoi cette approche
- Recharts permet des visualisations interactives sans dependance lourde.
- Les donnees etant deja normalisees (ADR 03), les agregations sont triviales en SQL via Prisma.
- C'est un usage data classique mais a forte valeur ajoutee individuelle.

### Mesure du succes
- Nombre de visites sur `Analytics.tsx` (proxy d'interet).
- Variance entre salaire demande dans la page profil et salaire median affiche (le candidat a-t-il ajuste son ask ?).
- Verification jury : les graphiques s'alimentent bien des donnees reelles ingerees.

---

## 3. Feature IA : matching + lettre de motivation generee

### Probleme utilisateur
Generer une lettre de motivation personnalisee prend **15-30 min par candidature**, ce qui decourage la quantite ou pousse au copier-coller generique.

### Hypothese
Si on extrait automatiquement (a) les skills communs entre profil et offre, et (b) les keywords-cle (agile, cloud, startup...), on peut generer une **lettre de 1-2 paragraphes** qui economise au moins **10 min par candidature** et reste suffisamment personnalisee pour ne pas etre rejetee.

### Pourquoi cette approche (et limites)
- **Contraintes consigne** : < 500 MB de modele, < 5 s par offre, pas d'API externe, pas de fine-tuning.
- **Choix retenu** : approche **rule-based + extraction lexicale**, totalement locale, 0 MB de modele, < 100 ms par offre.
- **Limite explicite** : pas de comprehension semantique ; mitige par un mecanisme de feedback (`ia_dislikes`) qui permet d'iterer sur les regles.
- Une amelioration future serait des embeddings locaux (sentence-transformers, ~80 MB), voir [adr/04-ai.md](adr/04-ai.md).

### Mesure du succes
- **Acceptation** : ratio `pitchs valides par l'utilisateur (sauvegardes ou exportes en CV) / pitchs generes` > 50 %.
- **Feedback negatif** : `ia_dislikes / total_pitches_vus` < 30 %.
- **Performance** : 100 % des recommandations generees en < 5 s (mesurable via les logs).

---

## Synthese

| Feature | Probleme | Mesure principale | Cible |
|---------|----------|-------------------|-------|
| Dashboard | Eparpillement des plateformes | Temps avant 1re sauvegarde | < 2 min |
| Data (filtres + analytics) | Pas de vue marche | Taux de visite Analytics | > 30 % users |
| IA (matching + pitch) | Lettres trop longues a ecrire | Taux d'acceptation pitch | > 50 % |
