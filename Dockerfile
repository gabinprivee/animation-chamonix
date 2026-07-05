# Étape 1 : Construction de l'application (Client & Serveur)
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les fichiers de gestion de dépendances
COPY package*.json ./
RUN npm ci

# Copier l'intégralité du code source
COPY . .

# Compiler l'application (Vite génère dist/ et esbuild compile le serveur dans dist/server.cjs)
RUN npm run build

# Étape 2 : Image de production optimisée et légère
FROM node:20-alpine AS runner
WORKDIR /app

# Configuration des variables d'environnement de production
ENV NODE_ENV=production
ENV PORT=3000

# Copie exclusive des assets compilés et des dépendances de production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Ouverture du port 3000 (standard requis par Google Cloud Run, Railway, Render, Docker)
EXPOSE 3000

# Démarrage du serveur Node.js en mode production
CMD ["npm", "run", "start"]
