import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, Team, AnimationState, HistoryLog, ThemeType } from '../types';
import { Trophy, Flame, Award, Sparkles, TrendingUp, Zap, Clock, Users, History, ListFilter, User, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PlayerViewProps {
  players: Player[];
  teams: Team[];
  state?: AnimationState;
  history: HistoryLog[];
  onOpenQr: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ players, teams, state, history, onOpenQr }) => {
  const theme = state?.theme || 'neon';
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'details' | 'stats'>('leaderboard');
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>('ALL');
  const [selectedChartPlayerId, setSelectedChartPlayerId] = useState<string>('');

  // Sort players by score descending
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  // Compute team scores
  const teamScores = useMemo(() => {
    const scores: Record<string, number> = {};
    teams.forEach(t => scores[t.name] = 0);
    players.forEach(p => {
      if (p.team && scores[p.team] !== undefined) {
        scores[p.team] += p.score;
      }
    });
    const maxScore = Math.max(...Object.values(scores), 1);
    return teams.map(t => ({
      ...t,
      score: scores[t.name] || 0,
      percent: Math.min(100, Math.round(((scores[t.name] || 0) / maxScore) * 100))
    })).sort((a, b) => b.score - a.score);
  }, [players, teams]);

  const topThree = sortedPlayers.slice(0, 3);
  const restPlayers = sortedPlayers.slice(3);

  // Selected player for chart and their points trajectory
  const selectedChartPlayer = useMemo(() => {
    return players.find(p => p.id === selectedChartPlayerId) || sortedPlayers[0] || null;
  }, [players, sortedPlayers, selectedChartPlayerId]);

  const playerChartData = useMemo(() => {
    if (!selectedChartPlayer) return [];
    
    // History logs for this player, sorted chronologically (oldest first)
    const playerLogs = [...history]
      .filter(h => h.playerId === selectedChartPlayer.id || h.playerName?.toLowerCase() === selectedChartPlayer.name?.toLowerCase())
      .reverse();

    if (playerLogs.length === 0) {
      return [
        { step: 'Début', points: 0, reason: 'Lancement du tournoi', change: '0' },
        { step: 'Score Actuel', points: selectedChartPlayer.score, reason: 'Score en direct', change: `${selectedChartPlayer.score}` }
      ];
    }

    const totalLogged = playerLogs.reduce((acc, l) => acc + (l.points || 0), 0);
    const initialScore = selectedChartPlayer.score - totalLogged;

    let running = initialScore;
    const data = [
      { step: 'Début', points: initialScore, reason: 'Baseline initiale', change: '0' }
    ];

    playerLogs.forEach((log, idx) => {
      running += (log.points || 0);
      data.push({
        step: log.round || `Action ${idx + 1}`,
        points: running,
        reason: log.reason || 'Modification de score',
        change: log.points > 0 ? `+${log.points}` : `${log.points}`
      });
    });

    // Ensure final point matches exact current score if there's any discrepancy
    if (running !== selectedChartPlayer.score) {
      data.push({
        step: 'Score Actuel',
        points: selectedChartPlayer.score,
        reason: 'Score synchronisé en direct',
        change: '0'
      });
    }

    return data;
  }, [selectedChartPlayer, history]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-indigo-950/95 border-2 border-yellow-400 p-3.5 rounded-2xl shadow-2xl text-left backdrop-blur-md z-50">
          <p className="font-black text-yellow-300 text-xs uppercase tracking-wider">{label}</p>
          <p className="text-white font-black text-xl mt-1">
            {data.points} <span className="text-xs text-indigo-300 font-normal">points</span>
          </p>
          {data.change && data.change !== '0' && (
            <p className={`text-xs font-bold mt-0.5 ${data.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              Évolution : {data.change} pts
            </p>
          )}
          <p className="text-xs text-indigo-200 font-medium mt-1">
            Motif : <strong className="text-white">{data.reason}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const getThemeBackground = (t: ThemeType) => {
    switch (t) {
      case 'gold':
        return 'bg-gradient-to-b from-zinc-950 via-amber-950/20 to-zinc-950 text-amber-50';
      case 'festival':
        return 'bg-gradient-to-b from-purple-950 via-indigo-950/40 to-slate-950 text-white';
      case 'stadium':
        return 'bg-gradient-to-b from-slate-950 via-emerald-950/30 to-slate-950 text-emerald-50';
      case 'neon':
      default:
        return 'bg-indigo-700 text-white';
    }
  };

  return (
    <div className={`min-h-[calc(100vh-76px)] py-8 px-4 sm:px-6 transition-all duration-700 ${getThemeBackground(theme)}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Live Announcement Banner */}
        {state?.announcement && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-pink-500 border-4 border-yellow-400 shadow-2xl flex items-center justify-between gap-4 text-white"
          >
            <div className="flex items-center gap-4">
              <span className="p-3 rounded-2xl bg-yellow-400 text-indigo-900 font-black animate-bounce shadow-lg">
                <Zap className="w-6 h-6 fill-current" />
              </span>
              <div>
                <p className="text-xs uppercase font-black tracking-widest text-yellow-300">Annonce de l'Animateur en direct</p>
                <p className="text-base sm:text-lg font-black italic mt-0.5">{state.announcement}</p>
              </div>
            </div>
            <button
              onClick={onOpenQr}
              className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-indigo-900 text-sm font-black uppercase tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Rejoindre
            </button>
          </motion.div>
        )}

        {/* Navigation Tabs for Player View */}
        <div className="flex justify-center">
          <div className="bg-black/40 p-1.5 rounded-2xl border-2 border-white/20 inline-flex gap-2 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-950 shadow-lg scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 Classement & Podium</span>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                activeTab === 'details'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span>📋 Détails des Points</span>
              {history.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>📈 Graphique (Recharts)</span>
            </button>
          </div>
        </div>

        {activeTab === 'leaderboard' && (
          <div className="space-y-8">
            {/* Team Battle Progress Bars */}
        {teams.length > 0 && (
          <div className="bg-indigo-900/50 border-4 border-indigo-400 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-yellow-300">
                <Users className="w-6 h-6 text-pink-400" />
                <span>Bataille des Équipes</span>
              </h2>
              <span className="bg-pink-500 px-4 py-1 rounded-full text-xs font-bold animate-pulse text-white uppercase tracking-wider hidden sm:inline-block">● EN DIRECT</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teamScores.map((t, idx) => (
                <div key={t.id} className="bg-indigo-800/80 rounded-2xl p-4 border-2 border-indigo-600 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold flex items-center gap-2 text-white uppercase text-base">
                      <span className="text-xl">{t.icon}</span>
                      <span>{t.name}</span>
                    </span>
                    <span className="font-black text-yellow-300 text-lg">{t.score} pts</span>
                  </div>
                  <div className="w-full h-3 bg-indigo-950 rounded-full overflow-hidden border border-indigo-500">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.percent}%` }}
                      transition={{ duration: 1, type: 'spring' }}
                      style={{ backgroundColor: t.color || '#facc15' }}
                      className="h-full rounded-full shadow-md"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PODIUM VIP TOP 3 */}
        <div className="py-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase text-yellow-300 flex items-center justify-center gap-3 drop-shadow-md">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-pink-400" />
              <span>Podium des Champions</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-indigo-200 mt-1">Les leaders de la {state?.round || "Manche actuelle"}</p>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-16 bg-indigo-900/50 rounded-3xl border-4 border-indigo-400 shadow-2xl">
              <Trophy className="w-12 h-12 text-yellow-300 mx-auto mb-3 opacity-80 animate-bounce" />
              <p className="text-white font-black text-lg">Aucun joueur dans le classement pour le moment.</p>
              <p className="text-xs font-bold text-indigo-300 mt-1 uppercase tracking-wider">L'animateur peut ajouter des joueurs ou des équipes depuis son interface.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-4xl mx-auto px-2">
              
              {/* 2nd Place (Silver) */}
              {topThree[1] ? (
                <motion.div
                  layoutId={topThree[1].id}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-300 text-indigo-900 border-4 border-slate-500 flex items-center justify-center text-3xl sm:text-4xl shadow-xl transform -rotate-3 hover:rotate-0 transition-transform font-black">
                      {topThree[1].avatar}
                    </div>
                    <span className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-slate-400 text-indigo-950 font-black text-sm flex items-center justify-center shadow-lg border-2 border-white">
                      2
                    </span>
                  </div>
                  <p className="font-black text-sm sm:text-base text-white uppercase truncate max-w-[120px] sm:max-w-[160px] text-center">
                    {topThree[1].name}
                  </p>
                  {topThree[1].team && (
                    <span className="text-[11px] text-yellow-300 font-bold uppercase tracking-wider">{topThree[1].team}</span>
                  )}
                  <div className="mt-3 w-full bg-slate-300 text-indigo-900 rounded-t-3xl border-t-8 border-slate-500 p-4 sm:p-6 text-center shadow-2xl min-h-[140px] flex flex-col justify-end">
                    <span className="font-black text-xl sm:text-3xl text-indigo-950">{topThree[1].score}</span>
                    <span className="text-[10px] sm:text-xs text-indigo-800 uppercase tracking-widest font-black">points</span>
                  </div>
                </motion.div>
              ) : <div className="h-40" />}

              {/* 1st Place (Gold) - VIP Center */}
              {topThree[0] ? (
                <motion.div
                  layoutId={topThree[0].id}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex flex-col items-center z-10 -mt-6"
                >
                  <div className="relative mb-3">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce">
                      <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">👑</span>
                    </div>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-yellow-400 text-indigo-900 border-4 border-yellow-600 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl transform hover:scale-105 transition-transform font-black">
                      {topThree[0].avatar}
                    </div>
                    <span className="absolute -bottom-2 right-0 w-9 h-9 rounded-full bg-pink-500 text-white font-black text-base flex items-center justify-center shadow-lg border-2 border-white">
                      1
                    </span>
                    {topThree[0].streak >= 2 && (
                      <span className="absolute -top-2 -left-2 px-2.5 py-0.5 rounded-full bg-pink-600 text-white font-black text-xs flex items-center gap-0.5 shadow-md animate-pulse border border-white">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {topThree[0].streak}
                      </span>
                    )}
                  </div>
                  <p className="font-black text-base sm:text-xl text-yellow-300 uppercase italic truncate max-w-[140px] sm:max-w-[180px] text-center drop-shadow">
                    {topThree[0].name}
                  </p>
                  {topThree[0].team && (
                    <span className="text-xs text-pink-300 font-black uppercase tracking-wider">{topThree[0].team}</span>
                  )}
                  <div className="mt-3 w-full bg-yellow-400 text-indigo-900 rounded-t-3xl border-t-8 border-yellow-600 p-6 sm:p-8 text-center shadow-2xl min-h-[180px] sm:min-h-[200px] flex flex-col justify-end relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                    <span className="font-black text-3xl sm:text-5xl text-indigo-950 tracking-tight drop-shadow-sm">{topThree[0].score}</span>
                    <span className="text-xs sm:text-sm text-indigo-900 uppercase tracking-widest font-black">points</span>
                  </div>
                </motion.div>
              ) : <div className="h-48" />}

              {/* 3rd Place (Bronze) */}
              {topThree[2] ? (
                <motion.div
                  layoutId={topThree[2].id}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-400 text-indigo-900 border-4 border-orange-600 flex items-center justify-center text-3xl sm:text-4xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform font-black">
                      {topThree[2].avatar}
                    </div>
                    <span className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white">
                      3
                    </span>
                  </div>
                  <p className="font-black text-sm sm:text-base text-white uppercase truncate max-w-[120px] sm:max-w-[160px] text-center">
                    {topThree[2].name}
                  </p>
                  {topThree[2].team && (
                    <span className="text-[11px] text-yellow-300 font-bold uppercase tracking-wider">{topThree[2].team}</span>
                  )}
                  <div className="mt-3 w-full bg-orange-400 text-indigo-900 rounded-t-3xl border-t-8 border-orange-600 p-4 sm:p-6 text-center shadow-2xl min-h-[110px] flex flex-col justify-end">
                    <span className="font-black text-xl sm:text-3xl text-indigo-950">{topThree[2].score}</span>
                    <span className="text-[10px] sm:text-xs text-indigo-900 uppercase tracking-widest font-black">points</span>
                  </div>
                </motion.div>
              ) : <div className="h-32" />}

            </div>
          )}
        </div>

        {/* REST OF LEADERBOARD TABLE / CARDS */}
        {restPlayers.length > 0 && (
          <div className="bg-indigo-900/50 border-4 border-indigo-400 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-sm uppercase font-black tracking-wider text-yellow-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <span>Suite du Classement (Rang 4 à {sortedPlayers.length})</span>
            </h3>

            <div className="space-y-3">
              <AnimatePresence>
                {restPlayers.map((player, index) => {
                  const actualRank = index + 4;
                  return (
                    <motion.div
                      key={player.id}
                      layoutId={player.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-indigo-800/80 hover:bg-indigo-800 border-2 border-indigo-600 transition-all group shadow-md"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4">
                        <span className="w-8 text-center font-black text-yellow-300 text-base sm:text-lg">
                          #{actualRank}
                        </span>
                        <div
                          style={{ borderColor: player.color || '#facc15' }}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-900 border-2 flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform font-black"
                        >
                          {player.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base sm:text-lg text-white group-hover:text-yellow-300 transition-colors uppercase italic">
                              {player.name}
                            </span>
                            {player.streak >= 2 && (
                              <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white border border-white/20 text-xs font-black flex items-center gap-0.5 shadow-md">
                                <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
                                {player.streak}
                              </span>
                            )}
                          </div>
                          {player.team && (
                            <span className="text-xs text-indigo-200 font-bold uppercase tracking-wider">{player.team}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {player.recentChange !== undefined && player.recentChange !== 0 && (
                          <motion.span
                            key={player.lastUpdated || Date.now()}
                            initial={{ opacity: 0, y: -10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`text-xs sm:text-sm font-black px-3 py-1 rounded-xl shadow-md border ${
                              player.recentChange > 0
                                ? 'bg-yellow-400 text-indigo-950 border-yellow-600'
                                : 'bg-pink-500 text-white border-pink-700'
                            }`}
                          >
                            {player.recentChange > 0 ? `+${player.recentChange}` : player.recentChange}
                          </motion.span>
                        )}
                        <div className="text-right min-w-[80px]">
                          <span className="font-black text-xl sm:text-2xl text-yellow-300 tracking-tight font-mono">{player.score}</span>
                          <span className="block text-[10px] text-indigo-200 uppercase font-black tracking-wider -mt-1">pts</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* LIVE ACTIVITY TICKER (Fil d'actualité) */}
        {history.length > 0 && (
          <div className="bg-indigo-900/50 border-4 border-indigo-400 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-yellow-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-400" />
                <span>Dernières Actions en Direct</span>
              </h3>
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Mise à jour automatique</span>
            </div>
            <div className="space-y-2.5">
              {history.slice(0, 3).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs sm:text-sm p-3 rounded-2xl bg-indigo-800/80 border border-indigo-600 shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-lg">{log.playerAvatar}</span>
                    <span className="font-black text-white uppercase italic truncate">{log.playerName}</span>
                    <span className="text-indigo-200 hidden sm:inline font-medium">— {log.reason}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-black px-2.5 py-1 rounded-xl text-xs shadow-sm ${
                      log.points >= 0 ? 'bg-yellow-400 text-indigo-950 font-black' : 'bg-pink-500 text-white font-black'
                    }`}>
                      {log.points >= 0 ? `+${log.points}` : log.points} pts
                    </span>
                    <span className="text-[11px] font-bold text-indigo-300">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        )}

        {/* TAB 2: DÉTAILS DES POINTS (CHRONOLOGICAL HISTORY BY PLAYER) */}
        {activeTab === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="bg-indigo-900/60 border-4 border-cyan-400 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-indigo-500/50 pb-6 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-cyan-300 flex items-center gap-3">
                    <History className="w-8 h-8 text-yellow-300" />
                    <span>Détails Chronologiques des Points</span>
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-indigo-200 mt-1">
                    Consultez l'historique complet et détaillé des gains et retraits de points pour chaque participant.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/15">
                  <ListFilter className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Total : {history.length} action(s)
                  </span>
                </div>
              </div>

              {/* Player Filter Badges */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-yellow-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Filtrer par joueur :</span>
                </p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 py-1 custom-scrollbar">
                  <button
                    onClick={() => setSelectedPlayerFilter('ALL')}
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-2 ${
                      selectedPlayerFilter === 'ALL'
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-lg scale-105'
                        : 'bg-indigo-950/80 text-white/80 border-indigo-600 hover:border-cyan-400 hover:text-white'
                    }`}
                  >
                    <span>🌟 Tous les joueurs</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-mono">
                      {history.length}
                    </span>
                  </button>
                  {sortedPlayers.map((p) => {
                    const count = history.filter(h => h.playerId === p.id || h.playerName === p.name).length;
                    const isSelected = selectedPlayerFilter === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlayerFilter(p.id)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border-2 ${
                          isSelected
                            ? 'bg-yellow-400 text-indigo-950 border-yellow-300 shadow-lg scale-105'
                            : 'bg-indigo-950/80 text-white/80 border-indigo-600 hover:border-yellow-400 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{p.avatar}</span>
                        <span className="truncate max-w-[120px]">{p.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isSelected ? 'bg-black/20 text-indigo-950' : 'bg-white/10 text-cyan-300'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Player Summary Banner */}
              {selectedPlayerFilter !== 'ALL' && (
                (() => {
                  const selectedP = players.find(p => p.id === selectedPlayerFilter);
                  if (!selectedP) return null;
                  const actionsCount = history.filter(h => h.playerId === selectedP.id || h.playerName === selectedP.name).length;
                  return (
                    <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border-2 border-yellow-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl p-3 rounded-2xl bg-black/40 border border-yellow-400/40 shadow-inner">
                          {selectedP.avatar}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-white">{selectedP.name}</h3>
                            {selectedP.team && (
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold uppercase tracking-wider text-yellow-300 border border-indigo-400">
                                {selectedP.team}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-indigo-200 mt-0.5">
                            Série active : <span className="text-yellow-300 font-bold">{selectedP.streak}🔥</span> • {actionsCount} action(s) enregistrée(s)
                          </p>
                        </div>
                      </div>
                      <div className="bg-black/60 px-5 py-3 rounded-2xl border border-yellow-400/40 text-right shrink-0">
                        <span className="text-xs uppercase font-bold text-gray-400 block -mb-1">Score Actuel</span>
                        <span className="text-3xl font-black text-yellow-300 font-mono">{selectedP.score} pts</span>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Chronological List of Actions */}
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-yellow-300 flex items-center justify-between">
                  <span>Chronologie des changements de points :</span>
                  <span className="text-xs text-indigo-200 font-normal normal-case">Du plus récent au plus ancien</span>
                </h3>

                {(() => {
                  const filteredHistory = selectedPlayerFilter === 'ALL'
                    ? history
                    : history.filter(h => {
                        const selectedP = players.find(p => p.id === selectedPlayerFilter);
                        return h.playerId === selectedPlayerFilter || (selectedP && h.playerName === selectedP.name);
                      });

                  if (filteredHistory.length === 0) {
                    return (
                      <div className="text-center py-12 bg-black/30 rounded-2xl border-2 border-dashed border-white/20">
                        <History className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-60" />
                        <p className="text-white font-bold text-base">Aucun historique de points trouvé</p>
                        <p className="text-xs text-indigo-300 mt-1">Les modifications de points attribuées par l'animateur apparaîtront ici chronologiquement.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      {filteredHistory.map((log, index) => {
                        const isPositive = log.points >= 0;
                        return (
                          <motion.div
                            key={log.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border-l-8 bg-indigo-950/80 border border-white/10 shadow-lg gap-3 ${
                              isPositive ? 'border-l-emerald-400' : 'border-l-red-500'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 overflow-hidden">
                              <div className={`p-2.5 rounded-xl shrink-0 ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-lg">{log.playerAvatar || '👤'}</span>
                                  <span className="font-black text-white text-base uppercase italic tracking-tight">{log.playerName}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-black uppercase text-indigo-200 border border-white/10">
                                    {log.round || state?.round || "Manche 1"}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-cyan-200 font-medium mt-1 truncate">
                                  Motif : <span className="text-white font-bold">{log.reason || "Ajout de points direct"}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 shrink-0">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 font-mono">
                                <Clock className="w-3.5 h-3.5 text-pink-400" />
                                <span>{log.timestamp || "Récemment"}</span>
                              </div>
                              <span className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black font-mono shadow-md ${
                                isPositive
                                  ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950'
                                  : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                              }`}>
                                {isPositive ? `+${log.points}` : log.points} pts
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 py-4"
          >
            <div className="bg-indigo-900/60 border-4 border-yellow-400/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center max-w-5xl mx-auto relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 font-bold text-xs uppercase tracking-wider mb-4 shadow-inner">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>Analytique en Direct • Recharts</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black italic tracking-tight uppercase text-yellow-300 drop-shadow-lg flex items-center justify-center gap-3">
                <span>Évolution des Points</span>
              </h2>
              <p className="text-sm sm:text-base font-bold text-indigo-200 mt-2 max-w-xl mx-auto">
                Visualisez la progression et la dynamique de score de chaque joueur au cours des différentes manches du tournoi.
              </p>

              {players.length === 0 ? (
                <div className="mt-10 p-8 rounded-2xl bg-indigo-950/80 border-2 border-dashed border-indigo-500 text-indigo-300 font-bold">
                  Aucun joueur dans le tournoi. Ajoutez des champions depuis l'espace animateur pour visualiser leurs graphiques en temps réel !
                </div>
              ) : (
                <div className="mt-8 space-y-6">
                  {/* Player Selector */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3">
                      Sélectionnez un joueur pour analyser sa courbe :
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto p-2">
                      {sortedPlayers.map((p) => {
                        const isSelected = (selectedChartPlayerId === p.id) || (!selectedChartPlayerId && p.id === sortedPlayers[0]?.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedChartPlayerId(p.id)}
                            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border-2 transition-all ${
                              isSelected
                                ? 'bg-yellow-400 text-indigo-950 border-white font-black shadow-lg scale-105'
                                : 'bg-indigo-950/80 text-indigo-200 border-indigo-500/40 hover:bg-indigo-800'
                            }`}
                          >
                            <span className="text-base">{p.avatar}</span>
                            <span>{p.name}</span>
                            <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                              isSelected ? 'bg-indigo-950 text-yellow-300' : 'bg-black/30 text-yellow-300'
                            }`}>
                              {p.score} pts
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recharts Chart Area */}
                  {selectedChartPlayer && (
                    <div className="bg-indigo-950/90 border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-6 shadow-xl text-left">
                      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-800 border-2 border-yellow-400 flex items-center justify-center text-2xl shadow-inner">
                            {selectedChartPlayer.avatar}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                              Courbe de {selectedChartPlayer.name}
                            </h3>
                            <p className="text-xs text-indigo-300 font-bold">
                              Équipe : {selectedChartPlayer.team || 'Indépendant'} • Score actuel : <strong className="text-yellow-300 font-mono">{selectedChartPlayer.score} pts</strong>
                            </p>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 font-bold text-xs flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Progression en direct</span>
                          </span>
                        </div>
                      </div>

                      <div className="h-[320px] sm:h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={playerChartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis
                              dataKey="step"
                              stroke="#a5f3fc"
                              tick={{ fill: '#c4b5fd', fontSize: 11, fontWeight: 'bold' }}
                              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                            />
                            <YAxis
                              stroke="#fde047"
                              tick={{ fill: '#fde047', fontSize: 12, fontWeight: 'bold' }}
                              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '15px', fontWeight: 'bold', color: '#fff' }} />
                            <Line
                              type="monotone"
                              dataKey="points"
                              name={`Points de ${selectedChartPlayer.name}`}
                              stroke="#f43f5e"
                              strokeWidth={4}
                              dot={{ r: 6, fill: '#fde047', stroke: '#f43f5e', strokeWidth: 2 }}
                              activeDot={{ r: 9, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
                              animationDuration={1000}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
