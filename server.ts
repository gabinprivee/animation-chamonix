import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { LeaderboardData } from './src/types';

dotenv.config();

const PORT = 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// Initial default state with vibrant demo contestants for immediate engagement
let stateData: LeaderboardData = {
  players: [],
  teams: [],
  state: {
    title: "Tournoi des Champions 🌟",
    subtitle: "Grand Challenge en Direct",
    round: "Manche 1 : Démarrage",
    theme: "neon" as const,
    status: "active" as const,
    multiplier: 1,
    announcement: "🔥 Astuce : Répondez aux quiz de l'animateur pour des points bonus !",
    soundEnabled: true
  },
  history: []
};

const ANIMATORS_MAP: Record<string, { id: string; name: string; avatar: string }> = {
  '1': { id: '1', name: 'mickey', avatar: '🐭' },
  '0001': { id: '1', name: 'mickey', avatar: '🐭' },
  '1111': { id: '1', name: 'mickey', avatar: '🐭' },
  '849271': { id: '1', name: 'mickey', avatar: '🐭' },
  '1001': { id: '1', name: 'mickey', avatar: '🐭' },
  '1234': { id: '1', name: 'mickey', avatar: '🐭' },
  'mickey': { id: '1', name: 'mickey', avatar: '🐭' },
  'admin': { id: '1', name: 'mickey', avatar: '🐭' },

  '2': { id: '2', name: 'iris', avatar: '🌸' },
  '0002': { id: '2', name: 'iris', avatar: '🌸' },
  '2222': { id: '2', name: 'iris', avatar: '🌸' },
  '731904': { id: '2', name: 'iris', avatar: '🌸' },
  '2002': { id: '2', name: 'iris', avatar: '🌸' },
  'iris': { id: '2', name: 'iris', avatar: '🌸' },

  '3': { id: '3', name: 'midas', avatar: '👑' },
  '0003': { id: '3', name: 'midas', avatar: '👑' },
  '3333': { id: '3', name: 'midas', avatar: '👑' },
  '950482': { id: '3', name: 'midas', avatar: '👑' },
  '3003': { id: '3', name: 'midas', avatar: '👑' },
  'midas': { id: '3', name: 'midas', avatar: '👑' },

  '4': { id: '4', name: 'seamko', avatar: '⚡' },
  '0004': { id: '4', name: 'seamko', avatar: '⚡' },
  '4444': { id: '4', name: 'seamko', avatar: '⚡' },
  '618239': { id: '4', name: 'seamko', avatar: '⚡' },
  '4004': { id: '4', name: 'seamko', avatar: '⚡' },
  'seamko': { id: '4', name: 'seamko', avatar: '⚡' },

  '5': { id: '5', name: 'axel', avatar: '🔥' },
  '0005': { id: '5', name: 'axel', avatar: '🔥' },
  '5555': { id: '5', name: 'axel', avatar: '🔥' },
  '492751': { id: '5', name: 'axel', avatar: '🔥' },
  '5005': { id: '5', name: 'axel', avatar: '🔥' },
  'axel': { id: '5', name: 'axel', avatar: '🔥' },

  '6': { id: '6', name: 'le_c', avatar: '🎭' },
  '0006': { id: '6', name: 'le_c', avatar: '🎭' },
  '6666': { id: '6', name: 'le_c', avatar: '🎭' },
  '385160': { id: '6', name: 'le_c', avatar: '🎭' },
  '6006': { id: '6', name: 'le_c', avatar: '🎭' },
  'le_c': { id: '6', name: 'le_c', avatar: '🎭' },

  '7': { id: '7', name: 'nath', avatar: '⭐' },
  '0007': { id: '7', name: 'nath', avatar: '⭐' },
  '7777': { id: '7', name: 'nath', avatar: '⭐' },
  '274693': { id: '7', name: 'nath', avatar: '⭐' },
  '7007': { id: '7', name: 'nath', avatar: '⭐' },
  'nath': { id: '7', name: 'nath', avatar: '⭐' },

  '8': { id: '8', name: 'jeremy', avatar: '🚀' },
  '0008': { id: '8', name: 'jeremy', avatar: '🚀' },
  '8888': { id: '8', name: 'jeremy', avatar: '🚀' },
  '518294': { id: '8', name: 'jeremy', avatar: '🚀' },
  '8008': { id: '8', name: 'jeremy', avatar: '🚀' },
  'jeremy': { id: '8', name: 'jeremy', avatar: '🚀' },
};

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  app.use(express.json());

  // Prevent any caching on API routes
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Helper: Broadcast WebSocket message to all connected clients
  const broadcast = (type: string, payload?: any) => {
    const msg = JSON.stringify({ type, payload });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  };

  const addHistoryLog = (reason: string, points: number, playerId: string, playerName: string, playerAvatar: string, round: string, animator?: string) => {
    const newLog = {
      id: 'h_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      playerId,
      playerName,
      playerAvatar,
      points,
      reason,
      round: round || stateData.state.round || 'En cours',
      animator: animator || 'mickey'
    };
    stateData.history.unshift(newLog);
    if (stateData.history.length > 100) stateData.history = stateData.history.slice(0, 100);
    return newLog;
  };

  wss.on('connection', (ws) => {
    console.log('Client connected to real-time leaderboard WS');
    ws.send(JSON.stringify({ type: 'INIT_STATE', payload: stateData }));

    ws.on('error', (err) => console.error('WS client error:', err));
  });

  // --- API Endpoints ---

  // Get full leaderboard state
  app.get('/api/state', (req, res) => {
    res.json(stateData);
  });

  // Admin PIN verification
  app.post('/api/admin/verify-pin', (req, res) => {
    const { pin } = req.body;
    const cleanPin = String(pin || '').trim().toLowerCase();
    const match = ANIMATORS_MAP[cleanPin];
    if (match || cleanPin === ADMIN_PIN || cleanPin === 'admin' || cleanPin === '1234') {
      const animator = match || { id: '1', name: 'mickey', avatar: '🐭' };
      res.json({ success: true, token: 'admin-session-token-valid', animator });
    } else {
      res.status(401).json({ success: false, message: 'Code PIN Animateur incorrect' });
    }
  });

  // Add/Remove points in real-time
  app.post('/api/admin/points', (req, res) => {
    const { playerId, points, reason, round, animator } = req.body;
    const player = stateData.players.find(p => p.id === playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Joueur introuvable' });
    }

    const actualPoints = points * (stateData.state.multiplier || 1);
    player.score += actualPoints;
    player.recentChange = actualPoints;
    player.lastUpdated = Date.now();

    if (actualPoints > 0) {
      player.streak = (player.streak || 0) + 1;
    } else if (actualPoints < 0) {
      player.streak = 0;
    }

    // Add log with animator
    const newLog = addHistoryLog(
      reason || 'Ajout manuel',
      actualPoints,
      player.id,
      player.name,
      player.avatar,
      round || stateData.state.round || 'En cours',
      animator || 'mickey'
    );

    // Broadcast live event for float animations & sounds!
    broadcast('POINTS_ADDED', { playerId: player.id, points: actualPoints, reason: newLog.reason, player });
    broadcast('STATE_UPDATED', stateData);

    res.json({ success: true, player, log: newLog, stateData });
  });

  // Add points to ALL players or whole team
  app.post('/api/admin/points-batch', (req, res) => {
    const { teamName, points, reason, animator } = req.body;
    const actualPoints = points * (stateData.state.multiplier || 1);
    const updatedPlayers: any[] = [];

    stateData.players.forEach(player => {
      if (!teamName || teamName === 'ALL' || player.team === teamName) {
        player.score += actualPoints;
        player.recentChange = actualPoints;
        player.lastUpdated = Date.now();
        if (actualPoints > 0) player.streak = (player.streak || 0) + 1;
        if (actualPoints < 0) player.streak = 0;

        updatedPlayers.push(player);

        addHistoryLog(
          reason || `Bonus d'équipe (${teamName || 'Tous'})`,
          actualPoints,
          player.id,
          player.name,
          player.avatar,
          stateData.state.round,
          animator || 'mickey'
        );
      }
    });

    broadcast('POINTS_BATCH', { teamName, points: actualPoints, reason });
    broadcast('STATE_UPDATED', stateData);

    res.json({ success: true, count: updatedPlayers.length, stateData });
  });

  // Manage Players
  app.post('/api/admin/players', (req, res) => {
    const { action, player, id, animator } = req.body;
    if (action === 'create') {
      const newPlayer = {
        id: 'p_' + Date.now(),
        name: player.name || 'Nouveau Joueur',
        avatar: player.avatar || '⭐',
        color: player.color || '#3B82F6',
        score: Number(player.score) || 0,
        streak: 0,
        team: player.team || undefined,
        lastUpdated: Date.now()
      };
      stateData.players.push(newPlayer);
      addHistoryLog(`Création joueur : ${newPlayer.name}`, 0, newPlayer.id, newPlayer.name, newPlayer.avatar, stateData.state.round, animator || 'mickey');
    } else if (action === 'update') {
      const idx = stateData.players.findIndex(p => p.id === player.id);
      if (idx !== -1) {
        const updatedTeam = (player.team === "" || player.team === null || player.team === "AUCUNE") ? undefined : player.team;
        stateData.players[idx] = { ...stateData.players[idx], ...player, team: updatedTeam, lastUpdated: Date.now() };
        addHistoryLog(`Modification joueur : ${player.name || ''}`, 0, player.id || 'system', player.name || 'Système', player.avatar || '👤', stateData.state.round, animator || 'mickey');
      }
    } else if (action === 'delete') {
      const deletedPlayer = stateData.players.find(p => p.id === id);
      stateData.players = stateData.players.filter(p => p.id !== id);
      addHistoryLog(`Suppression joueur : ${deletedPlayer?.name || id}`, 0, 'system', 'Système', '🗑️', stateData.state.round, animator || 'mickey');
    }

    broadcast('STATE_UPDATED', stateData);
    res.json({ success: true, players: stateData.players, stateData });
  });

  // Manage Teams
  app.post('/api/admin/teams', (req, res) => {
    const { action, team, id, animator } = req.body;
    if (action === 'create') {
      stateData.teams.push({
        id: 't_' + Date.now(),
        name: team.name || 'Nouvelle Équipe',
        color: team.color || '#10B981',
        icon: team.icon || '🏆'
      });
      addHistoryLog(`Création équipe : ${team.name || ''}`, 0, 'system', 'Système', team.icon || '🏆', stateData.state.round, animator || 'mickey');
    } else if (action === 'delete') {
      const deletedTeam = stateData.teams.find(t => t.id === id);
      stateData.teams = stateData.teams.filter(t => t.id !== id);
      if (deletedTeam) {
        stateData.players.forEach(p => {
          if (p.team === deletedTeam.name) {
            p.team = undefined;
          }
        });
      }
      addHistoryLog(`Suppression équipe : ${deletedTeam?.name || id}`, 0, 'system', 'Système', '🗑️', stateData.state.round, animator || 'mickey');
    } else if (action === 'clear') {
      stateData.teams = [];
      stateData.players.forEach(p => {
        p.team = undefined;
      });
      addHistoryLog(`Suppression de TOUTES les équipes`, 0, 'system', 'Système', '💥', stateData.state.round, animator || 'mickey');
    }
    broadcast('STATE_UPDATED', stateData);
    res.json({ success: true, teams: stateData.teams, stateData });
  });

  // Update animation state & theme
  app.post('/api/admin/state', (req, res) => {
    const { state, animator } = req.body;
    stateData.state = { ...stateData.state, ...state };
    addHistoryLog(`Mise à jour paramètres du tournoi`, 0, 'system', 'Système', '⚙️', stateData.state.round, animator || 'mickey');
    broadcast('STATE_UPDATED', stateData);
    res.json({ success: true, state: stateData.state, stateData });
  });

  // Trigger Special Effects (Confetti, Fanfare, Alerte)
  app.post('/api/admin/trigger', (req, res) => {
    const { effectType, message } = req.body;
    broadcast('SPECIAL_EFFECT', { effectType, message });
    res.json({ success: true });
  });

  // Reset Leaderboard
  app.post('/api/admin/reset', (req, res) => {
    const { mode, animator } = req.body; // 'scores' or 'all'
    if (mode === 'scores') {
      stateData.players.forEach(p => {
        p.score = 0;
        p.streak = 0;
        p.recentChange = undefined;
      });
      stateData.history = [];
      stateData.state.round = "Manche 1 : Démarrage";
      addHistoryLog(`Remise à zéro des scores`, 0, 'system', 'Système', '🔄', stateData.state.round, animator || 'mickey');
    } else if (mode === 'all') {
      stateData.players = [];
      stateData.teams = [];
      stateData.history = [];
      stateData.state.round = "Manche 1 : Démarrage";
      addHistoryLog(`Remise à zéro complète (0 joueur, 0 équipe)`, 0, 'system', 'Système', '💥', stateData.state.round, animator || 'mickey');
    } else if (mode === 'sample') {
      // Re-seed demo players
      stateData.players = [
        { id: '1', name: 'Léo l\'Aventurier', avatar: '🦁', color: '#F59E0B', score: 140, streak: 3, team: 'Saphir 💎', recentChange: 20 },
        { id: '2', name: 'Chloé la Flèche', avatar: '⚡', color: '#3B82F6', score: 125, streak: 1, team: 'Saphir 💎', recentChange: 10 },
        { id: '3', name: 'Max le Magicien', avatar: '🎩', color: '#8B5CF6', score: 110, streak: 2, team: 'Rubis 🔥', recentChange: 15 },
        { id: '4', name: 'Zoe Super-Nova', avatar: '🚀', color: '#EC4899', score: 95, streak: 0, team: 'Rubis 🔥', recentChange: -5 },
        { id: '5', name: 'Hugo le Viking', avatar: '🛡️', color: '#10B981', score: 80, streak: 1, team: 'Émeraude 🌲', recentChange: 5 },
        { id: '6', name: 'Emma Capitaine', avatar: '👑', color: '#EF4444', score: 115, streak: 2, team: 'Émeraude 🌲', recentChange: 10 }
      ];
      stateData.history = [
        { id: 'h1', timestamp: new Date(Date.now() - 10000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), playerId: '1', playerName: "Léo l'Aventurier", playerAvatar: '🦁', points: 20, reason: "Réponse parfaite au Quiz", round: "Manche 2", animator: "mickey" },
        { id: 'h2', timestamp: new Date(Date.now() - 25000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), playerId: '2', playerName: "Chloé la Flèche", playerAvatar: '⚡', points: 10, reason: "Rapidité éclair", round: "Manche 2", animator: "iris" },
        { id: 'h3', timestamp: new Date(Date.now() - 40000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), playerId: '3', playerName: "Max le Magicien", playerAvatar: '🎩', points: 15, reason: "Défi créatif réussi", round: "Manche 2", animator: "midas" }
      ];
      addHistoryLog(`Rechargement données démo`, 0, 'system', 'Système', '🧪', stateData.state.round, animator || 'mickey');
    }
    broadcast('STATE_UPDATED', stateData);
    res.json({ success: true, stateData });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Live Animation Leaderboard Server running on http://localhost:${PORT}`);
  });
}

startServer();
