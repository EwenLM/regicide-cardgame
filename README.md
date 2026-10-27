# Viva la Revolution !

Jeu de cartes coopératif en ligne (1 à 4 joueurs) : renverser ensemble les 12 royaux de la cour.
Front **Svelte 5 + Vite**, back **Node.js + WebSocket** (serveur autoritaire), design system « Brut. Lisible. Collectif. ».

## Démarrage rapide

```bash
# 1. Back (port 3000)
cd server && npm install && npm start

# 2. Front en développement (port 5173, relaie /ws vers le back)
cd web && npm install && npm run dev
```

Production : `cd web && npm run build`, puis le serveur Node sert `web/dist` (voir [docs/DEPLOY.md](docs/DEPLOY.md)).

## Structure

```
server/server.js        moteur de règles, salles, WebSocket, nettoyage, fichiers statiques
web/src/lib/            game.svelte.js (état + WebSocket), cards.js, preview.js (aperçu des dégâts)
web/src/components/     Landing, Lobby, Table, Hand, Card, Royal, Rules
web/src/styles/         tokens.css (design system), base.css (éléments globaux)
Dockerfile, docker-compose.yml, Caddyfile
```

## Documentation

| Document | Contenu |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Vue d’ensemble, flux de données, décisions |
| [docs/PROTOCOL.md](docs/PROTOCOL.md) | Messages WebSocket client ↔ serveur |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Tokens, conventions CSS sans classes, composants |
| [docs/RULES.md](docs/RULES.md) | Règles implémentées et points à vérifier |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Déploiement VPS, variables, nettoyage des parties |

## Points d’attention

- Les **valeurs de couleur** du design system ont été estimées depuis des maquettes basse résolution : à corriger dans `web/src/styles/tokens.css`.
- Les règles (nombre de Bouffons, taille des mains…) sont à valider avec le livret officiel : voir `docs/RULES.md`.
- L’état des parties est en mémoire : un redémarrage du serveur ferme les salles.
