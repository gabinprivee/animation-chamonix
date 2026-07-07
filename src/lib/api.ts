import { LeaderboardData, ANIMATORS_LIST } from '../types';

/**
 * Helper de configuration pour la Solution 2 (Serveur à part / Netlify / 40 PC)
 * Permet au frontend statique hébergé sur Netlify de se connecter à votre serveur backend distant
 * (ex: hébergé sur Render, Railway, Glitch, Cloud Run, ou en local via ngrok).
 */

const STORAGE_KEY = 'remote_server_url';

export function getRemoteServerUrl(): string {
  // 1. Priorité au paramètre configuré en direct dans l'interface par l'utilisateur
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored.trim() !== '') {
    return stored.trim().replace(/\/+$/, ''); // retire le slash de fin
  }
  // 2. Variable d'environnement au build (si VITE_API_URL a été défini sur Netlify)
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv.VITE_API_URL) {
    return String(metaEnv.VITE_API_URL).replace(/\/+$/, '');
  }
  // 3. Par défaut : chemin relatif local (si le serveur Express et le frontend sont hébergés au même endroit)
  return '';
}

export function setRemoteServerUrl(url: string): void {
  if (!url || url.trim() === '') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
}

export function getApiUrl(endpoint: string): string {
  const baseUrl = getRemoteServerUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

export function getWsUrl(): string {
  const baseUrl = getRemoteServerUrl();
  if (baseUrl) {
    // Convertir http:// ou https:// en ws:// ou wss://
    if (baseUrl.startsWith('https://')) {
      return baseUrl.replace('https://', 'wss://') + '/ws';
    } else if (baseUrl.startsWith('http://')) {
      return baseUrl.replace('http://', 'ws://') + '/ws';
    } else {
      // Si pas de protocole, on assume wss ou ws selon la page
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${baseUrl}/ws`;
    }
  } else {
    // Mode local standard
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
}

// --- MOTEUR DE FALLBACK OFFLINE / STATIQUE (NETLIFY SANS SERVEUR) ---
function getLocalStateData(): LeaderboardData {
  const stored = localStorage.getItem('leaderboard_live_data');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return {
    players: [],
    teams: [],
    state: {
      title: "Tournoi des Champions 🌟",
      subtitle: "Grand Challenge en Direct",
      round: "Manche 1 : Démarrage",
      theme: "neon",
      status: "active",
      multiplier: 1,
      announcement: "🔥 Astuce : Répondez aux quiz de l'animateur pour des points bonus !",
      soundEnabled: true
    },
    history: []
  };
}

function saveLocalStateData(data: LeaderboardData) {
  try {
    localStorage.setItem('leaderboard_live_data', JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('local-state-updated', { detail: data }));
  } catch (e) {}
}

/**
 * Fonction API unifiée qui garantit le fonctionnement sur un hébergement statique (Netlify) sans serveur Node.js,
 * tout en supportant un serveur distant (Render/Railway/Local) s'il est disponible.
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const targetUrl = getApiUrl(endpoint);
  try {
    const res = await fetch(targetUrl, options);
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res;
    }
  } catch (err) {
    // Erreur réseau ou CORS, bascule automatique sur le mode local/offline Netlify
  }

  // Fallback Local / Statique
  let data = getLocalStateData();
  let body: any = {};
  if (options?.body && typeof options.body === 'string') {
    try { body = JSON.parse(options.body); } catch (e) {}
  }

  const cleanPath = endpoint.split('?')[0];

  if (cleanPath === '/api/state') {
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (cleanPath === '/api/admin/verify-pin') {
    const pin = body.pin;
    const cleanPin = String(pin || '').trim().toLowerCase();
    const animMatch = ANIMATORS_LIST.find(a => a.pin === cleanPin);
    
    if (animMatch) {
      return new Response(JSON.stringify({ success: true, animator: { name: animMatch.name, avatar: animMatch.avatar }, token: 'admin-session-token-valid' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
    const isValid = cleanPin === '1234' || cleanPin === 'admin' || cleanPin === 'mickey' || cleanPin === '1' || cleanPin === '0000';
    if (isValid) {
      return new Response(JSON.stringify({ success: true, animator: { name: 'mickey', avatar: '🐭' }, token: 'admin-session-token-valid' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Code incorrect' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (cleanPath === '/api/admin/players') {
    const { action, player, id, animator } = body;
    if (action === 'create') {
      const newPlayer = {
        id: 'p_' + Date.now() + Math.random().toString(36).substring(2, 5),
        name: player?.name || 'Nouveau Joueur',
        avatar: player?.avatar || '⭐',
        color: player?.color || '#3B82F6',
        score: Number(player?.score) || 0,
        streak: 0,
        team: player?.team || undefined,
        lastUpdated: Date.now()
      };
      data.players.push(newPlayer);
      data.history.unshift({
        id: 'h_' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        playerId: newPlayer.id,
        playerName: newPlayer.name,
        playerAvatar: newPlayer.avatar,
        points: 0,
        reason: `Création joueur : ${newPlayer.name}`,
        round: data.state.round || 'En cours',
        animator: animator || 'mickey'
      });
    } else if (action === 'update') {
      const idx = data.players.findIndex(p => p.id === player.id);
      if (idx !== -1) {
        const updatedTeam = (player.team === "" || player.team === null || player.team === "AUCUNE") ? undefined : player.team;
        data.players[idx] = { ...data.players[idx], ...player, team: updatedTeam, lastUpdated: Date.now() };
      }
    } else if (action === 'delete') {
      data.players = data.players.filter(p => p.id !== id);
    }
    saveLocalStateData(data);
    return new Response(JSON.stringify({ success: true, players: data.players, stateData: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (cleanPath === '/api/admin/teams') {
    const { action, team, id, animator } = body;
    if (action === 'create') {
      data.teams.push({
        id: 't_' + Date.now() + Math.random().toString(36).substring(2, 5),
        name: team?.name || 'Nouvelle Équipe',
        color: team?.color || '#10B981',
        icon: team?.icon || '🏆'
      });
    } else if (action === 'delete') {
      const deletedTeam = data.teams.find(t => t.id === id);
      data.teams = data.teams.filter(t => t.id !== id);
      if (deletedTeam) {
        data.players.forEach(p => { if (p.team === deletedTeam.name) p.team = undefined; });
      }
    } else if (action === 'clear') {
      data.teams = [];
      data.players.forEach(p => { p.team = undefined; });
    }
    saveLocalStateData(data);
    return new Response(JSON.stringify({ success: true, teams: data.teams, stateData: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (cleanPath === '/api/admin/points') {
    const { id, delta, reason, animator } = body;
    const idx = data.players.findIndex(p => p.id === id);
    let actualDelta = 0;
    if (idx !== -1) {
      actualDelta = Number(delta) * (data.state.multiplier || 1);
      data.players[idx].score += actualDelta;
      data.players[idx].lastUpdated = Date.now();
      data.history.unshift({
        id: 'h_' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        playerId: data.players[idx].id,
        playerName: data.players[idx].name,
        playerAvatar: data.players[idx].avatar,
        points: actualDelta,
        reason: reason || 'Bonus',
        round: data.state.round || 'En cours',
        animator: animator || 'mickey'
      });
    }
    saveLocalStateData(data);
    if (idx !== -1) {
      try {
        window.dispatchEvent(new CustomEvent('local-points-update', {
          detail: {
            points: actualDelta,
            reason: reason || 'Bonus',
            player: data.players[idx]
          }
        }));
      } catch (e) {}
    }
    return new Response(JSON.stringify({ success: true, players: data.players, stateData: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (cleanPath === '/api/admin/points-batch') {
    const { teamName, points, reason, animator } = body;
    const actualDelta = Number(points) * (data.state.multiplier || 1);
    data.players.forEach(p => {
      if (!teamName || teamName === 'ALL' || p.team === teamName) {
        p.score += actualDelta;
        p.lastUpdated = Date.now();
      }
    });
    data.history.unshift({
      id: 'h_' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      playerId: 'batch',
      playerName: teamName || 'Tous les joueurs',
      playerAvatar: '👥',
      points: actualDelta,
      reason: `Groupe ${teamName || 'Tous'} (${reason || 'Bonus'})`,
      round: data.state.round || 'En cours',
      animator: animator || 'mickey'
    });
    saveLocalStateData(data);
    try {
      window.dispatchEvent(new CustomEvent('local-points-batch', {
        detail: {
          teamName,
          points: actualDelta,
          reason: reason || 'Bonus'
        }
      }));
    } catch (e) {}
    return new Response(JSON.stringify({ success: true, players: data.players, stateData: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (cleanPath === '/api/admin/state') {
    const { state: updates } = body;
    if (updates) {
      data.state = { ...data.state, ...updates };
    }
    saveLocalStateData(data);
    return new Response(JSON.stringify({ success: true, state: data.state, stateData: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (cleanPath === '/api/admin/reset') {
    const { mode } = body;
    if (mode === 'scores') {
      data.players.forEach(p => { p.score = 0; });
    } else if (mode === 'all') {
      data.players = [];
      data.teams = [];
      data.history = [];
    } else if (mode === 'sample') {
      data.teams = [
        { id: 't1', name: 'Équipe Saphir', color: '#3B82F6', icon: '💎' },
        { id: 't2', name: 'Équipe Rubis', color: '#EF4444', icon: '🔥' },
        { id: 't3', name: 'Équipe Émeraude', color: '#10B981', icon: '⚡' }
      ];
      data.players = [
        { id: 'p1', name: 'Gabin (Capitaine)', avatar: '🦊', color: '#3B82F6', score: 150, streak: 3, team: 'Équipe Saphir' },
        { id: 'p2', name: 'Chloé', avatar: '🐱', color: '#EF4444', score: 120, streak: 2, team: 'Équipe Rubis' },
        { id: 'p3', name: 'Lucas', avatar: '🦁', color: '#10B981', score: 95, streak: 0, team: 'Équipe Émeraude' },
        { id: 'p4', name: 'Emma', avatar: '🐼', color: '#F59E0B', score: 110, streak: 1, team: 'Équipe Saphir' }
      ];
    }
    saveLocalStateData(data);
    return new Response(JSON.stringify({ success: true, stateData: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (cleanPath === '/api/admin/trigger') {
    const { effectType, message } = body;
    try {
      window.dispatchEvent(new CustomEvent('local-special-effect', { detail: { effectType, message } }));
    } catch (e) {}
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: false, error: 'Offline endpoint not mocked' }), { status: 404 });
}
