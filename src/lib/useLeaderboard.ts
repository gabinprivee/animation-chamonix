import { useState, useEffect, useRef, useCallback } from 'react';
import { LeaderboardData, Player } from '../types';
import { audioSynth } from './audio';
import { getApiUrl, getWsUrl } from './api';
import confetti from 'canvas-confetti';

export interface ToastAlert {
  id: string;
  message: string;
  type: 'points' | 'alert' | 'cheer' | 'ai';
  points?: number;
  player?: Player;
}

const DEFAULT_INITIAL_DATA: LeaderboardData = {
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

export function useLeaderboard() {
  const [data, setDataState] = useState<LeaderboardData | null>(() => {
    try {
      const cached = localStorage.getItem('leaderboard_live_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.state) return parsed;
      }
    } catch (e) {}
    return DEFAULT_INITIAL_DATA;
  });
  const [isConnected, setIsConnectedState] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const dataRef = useRef<LeaderboardData | null>(data);
  const isConnectedRef = useRef<boolean>(false);

  const setData = useCallback((newData: LeaderboardData | null) => {
    if (!newData || !newData.state) return;
    try {
      localStorage.setItem('leaderboard_live_data', JSON.stringify(newData));
    } catch (e) {}
    dataRef.current = newData;
    setDataState(newData);
  }, []);

  const setIsConnected = useCallback((status: boolean) => {
    isConnectedRef.current = status;
    setIsConnectedState(status);
  }, []);

  const addToast = useCallback((alert: Omit<ToastAlert, 'id'>) => {
    const id = 't_' + Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [{ ...alert, id }, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const fetchStateFallback = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/api/state?_t=${Date.now()}`), {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.state) {
          setData(json);
        }
      }
    } catch (err) {
      console.error('Fallback polling error:', err);
    }
  }, [setData]);

  const triggerConfettiBlast = useCallback(() => {
    try {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    } catch (e) {
      console.error('Confetti error:', e);
    }
  }, []);

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  useEffect(() => {
    let isMounted = true;

    const connectWs = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

      const wsUrl = getWsUrl();

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'INIT_STATE' || msg.type === 'STATE_UPDATED') {
              setData(msg.payload);
            } else if (msg.type === 'POINTS_ADDED') {
              const { playerId, points, reason, player } = msg.payload;
              if (player) {
                if (points >= 25) {
                  audioSynth.playBigFanfare();
                  triggerConfettiBlast();
                } else {
                  audioSynth.playPointSound(points);
                }
                addToast({
                  type: 'points',
                  message: `${player.avatar} ${player.name} : ${points >= 0 ? '+' : ''}${points} pts ! (${reason})`,
                  points,
                  player
                });
              }
            } else if (msg.type === 'POINTS_BATCH') {
              const { teamName, points, reason } = msg.payload;
              audioSynth.playPointSound(points);
              addToast({
                type: 'points',
                message: `Bonus de groupe (${teamName || 'Tous'}) : ${points >= 0 ? '+' : ''}${points} pts ! (${reason})`,
                points
              });
            } else if (msg.type === 'SPECIAL_EFFECT') {
              const { effectType, message } = msg.payload;
              if (effectType === 'confetti') {
                audioSynth.playBigFanfare();
                triggerConfettiBlast();
                if (message) addToast({ type: 'cheer', message });
              } else if (effectType === 'alert') {
                audioSynth.playAlertSound();
                if (message) addToast({ type: 'alert', message });
              }
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Try to reconnect in 3s
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWs();
            fetchStateFallback();
          }, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        if (!isMounted) return;
        setIsConnected(false);
        fetchStateFallback();
      }
    };

    connectWs();
    fetchStateFallback();

    // Polling backup every 2s unconditionally for guaranteed real-time sync in iframe / cloud proxy environments
    const pollInterval = setInterval(() => {
      fetchStateFallback();
    }, 2000);

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pollInterval);
    };
  }, [addToast, fetchStateFallback, triggerConfettiBlast, setData, setIsConnected]);

  return { data, setData, isConnected, toasts, triggerConfettiBlast, addToast };
}
