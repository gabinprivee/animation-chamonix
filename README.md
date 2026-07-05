# 🌟 Classement Live Animation - Guide de Publication & Déploiement

Cette application full-stack (React 19, Vite, Tailwind CSS, Recharts & Express) est prête à être **publiée en production** sur n'importe quel hébergeur ou plateforme cloud.

---

## 🚀 1. Publication avec Docker (Google Cloud Run / Render / Railway / Fly.io)

Le fichier `Dockerfile` inclus à la racine est optimisé en **multi-stage build** pour générer un conteneur ultraléger et performant.

### Étape A : Construire l'image Docker
```bash
docker build -t classement-live-animation .
```

### Étape B : Lancer le conteneur en local ou sur un serveur
```bash
docker run -d -p 3000:3000 -e NODE_ENV=production --name classement-app classement-live-animation
```
L'application sera accessible immédiatement sur `http://localhost:3000`.

---

## 🌐 2. Publication sur Google Cloud Run (Recommandé)

1. Connectez-vous à la console Google Cloud : [https://console.cloud.google.com](https://console.cloud.google.com)
2. Installez le Google Cloud SDK (`gcloud`).
3. Publiez l'application en une seule commande depuis la racine du projet :
```bash
gcloud run deploy classement-live --source . --port 3000 --allow-unauthenticated --region europe-west1
```

---

## 🚂 3. Publication sur Railway, Render ou Koyeb

1. Poussez ce code sur un dépôt **GitHub** ou **GitLab**.
2. Connectez le dépôt à votre plateforme cloud favorite (Railway, Render, Koyeb, etc.).
3. La plateforme détectera automatiquement le fichier **`Dockerfile`**.
4. Laissez le port par défaut sur **`3000`**. Le déploiement s'effectuera tout seul en 1 à 2 minutes !

---

## 📊 4. Exporter et Publier les Résultats des Tournois (CSV / JSON)

Depuis l'**Espace Animateur (Admin Panel)** :
- Accédez à la section **"Exporter / Publier les Résultats"**.
- Cliquez sur **"📊 Télécharger CSV"** pour ouvrir le classement directement sur Excel, Google Sheets ou Apple Numbers.
- Cliquez sur **"📁 Télécharger JSON"** pour une intégration ou une sauvegarde de vos bases de données de tournoi.

---

## 🛠️ Commandes de Développement Local

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement full-stack avec rechargement à chaud
npm run dev

# Compiler pour la production
npm run build

# Démarrer le serveur de production compilé
npm run start
```
