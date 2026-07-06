import React, { useState } from 'react';
import { Player, Team, AnimationState, HistoryLog, AdminTab, ThemeType, ANIMATORS_LIST, AnimatorProfile } from '../types';
import {
  Trophy, Users, Settings, Sparkles, Flame, Plus, Trash2, Edit3, Check, RefreshCw,
  Zap, Volume2, Award, ShieldAlert, ChevronRight, Play, MessageSquare,
  TrendingUp, Radio, AlertTriangle, ArrowLeft, LogOut, Download, Share2, FileText,
  Globe, Server
} from 'lucide-react';
import { getApiUrl, getRemoteServerUrl, setRemoteServerUrl, apiFetch } from '../lib/api';

interface AdminPanelProps {
  players: Player[];
  teams: Team[];
  state?: AnimationState;
  history: HistoryLog[];
  currentAnimator?: { name: string; avatar: string };
  onSwitchAnimator?: (animator?: { name: string; avatar: string }) => void;
  onClose: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  players,
  teams,
  state,
  history,
  currentAnimator,
  onSwitchAnimator,
  onClose,
  onLogout,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('live');
  const [animatorFilter, setAnimatorFilter] = useState<string>('ALL');
  const [selectedReason, setSelectedReason] = useState<string>('Bonne réponse au Quiz');
  const [customReason, setCustomReason] = useState<string>('');
  const [customPoints, setCustomPoints] = useState<string>('15');
  const [remoteUrlInput, setRemoteUrlInput] = useState<string>(getRemoteServerUrl());
  const [remoteSaveSuccess, setRemoteSaveSuccess] = useState<boolean>(false);

  // New Player state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAvatar, setNewPlayerAvatar] = useState('⭐');
  const [newPlayerColor, setNewPlayerColor] = useState('#3B82F6');
  const [newPlayerTeam, setNewPlayerTeam] = useState<string>('');

  // New Team state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamIcon, setNewTeamIcon] = useState('🏆');
  const [newTeamColor, setNewTeamColor] = useState('#10B981');

  // State settings
  const [editTitle, setEditTitle] = useState(state?.title || '');
  const [editRound, setEditRound] = useState(state?.round || '');
  const [editAnnouncement, setEditAnnouncement] = useState(state?.announcement || '');

  const funAvatars = ['⭐', '🦁', '⚡', '🎩', '🚀', '👑', '🛡️', '🎯', '🎸', '🍕', '🐉', '🤖', '🦊', '🦅', '🐬', '🔥'];
  const funColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  const quickReasons = [
    'Bonne réponse au Quiz 🧠',
    'Rapidité éclair ⚡',
    'Défi créatif réussi 🎨',
    'Participation du public 👏',
    'Bonus spécial VIP ⭐',
    'Pénalité de retard ⚠️'
  ];

  // API Call helper
  const addPoints = async (playerId: string, pts: number) => {
    const reason = customReason.trim() || selectedReason;
    try {
      await apiFetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, delta: pts, reason, round: state?.round, animator: currentAnimator?.name || 'mickey' }),
      });
      onRefresh();
    } catch (err) {
      console.error('Add points error:', err);
    }
  };

  const addBatchPoints = async (teamName: string, pts: number) => {
    const reason = customReason.trim() || selectedReason;
    try {
      await apiFetch('/api/admin/points-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, delta: pts, reason, animator: currentAnimator?.name || 'mickey' }),
      });
      onRefresh();
    } catch (err) {
      console.error('Batch points error:', err);
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    try {
      await apiFetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          player: { name: newPlayerName, avatar: newPlayerAvatar, color: newPlayerColor, team: newPlayerTeam || undefined },
          animator: currentAnimator?.name || 'mickey'
        })
      });
      setNewPlayerName('');
      onRefresh();
    } catch (err) {
      console.error('Create player error:', err);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      await apiFetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id, animator: currentAnimator?.name || 'mickey' })
      });
      onRefresh();
    } catch (err) {
      console.error('Delete player error:', err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await apiFetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          team: { name: newTeamName, icon: newTeamIcon, color: newTeamColor },
          animator: currentAnimator?.name || 'mickey'
        })
      });
      setNewTeamName('');
      onRefresh();
    } catch (err) {
      console.error('Create team error:', err);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      await apiFetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id, animator: currentAnimator?.name || 'mickey' })
      });
      onRefresh();
    } catch (err) {
      console.error('Delete team error:', err);
    }
  };

  const handleClearTeams = async () => {
    try {
      await apiFetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', animator: currentAnimator?.name || 'mickey' })
      });
      onRefresh();
    } catch (err) {
      console.error('Clear teams error:', err);
    }
  };

  const handleUpdatePlayerTeam = async (player: Player, teamName: string) => {
    try {
      await apiFetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          player: { ...player, team: teamName === 'AUCUNE' ? undefined : teamName },
          animator: currentAnimator?.name || 'mickey'
        })
      });
      onRefresh();
    } catch (err) {
      console.error('Update player team error:', err);
    }
  };

  const handleUpdateState = async (updates: Partial<AnimationState>) => {
    try {
      await apiFetch('/api/admin/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: updates, animator: currentAnimator?.name || 'mickey' })
      });
      onRefresh();
    } catch (err) {
      console.error('Update state error:', err);
    }
  };

  const handleTriggerEffect = async (effectType: string, message?: string) => {
    try {
      window.dispatchEvent(new CustomEvent('local-special-effect', { detail: { effectType, message } }));
    } catch (e) {}
    try {
      await apiFetch('/api/admin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ effectType, message })
      });
    } catch (err) {
      console.error('Trigger effect error:', err);
    }
  };

  const handleReset = async (mode: 'scores' | 'all' | 'sample') => {
    try {
      await apiFetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, animator: currentAnimator?.name || 'mickey' })
      });
      onRefresh();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const exportCSV = () => {
    const headers = ["Rang", "Avatar", "Nom", "Equipe", "Score", "Serie", "Dernier Changement"];
    const rows = players
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => [
        idx + 1,
        p.avatar,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.team || 'Indépendant').replace(/"/g, '""')}"`,
        p.score,
        p.streak,
        p.recentChange
      ].join(","));

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `classement-tournoi-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      tournoi: state?.title || "Tournoi en Cours",
      manche: state?.round || "Manche 1",
      date: new Date().toISOString(),
      equipes: teams,
      joueurs: players.slice().sort((a, b) => b.score - a.score),
      historique: history
    }, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `tournoi-archive-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-indigo-700 text-white flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      
      {/* Top Admin Bar */}
      <div className="bg-indigo-900 border-b-4 border-indigo-400 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-600 border border-indigo-500 text-white transition-colors flex items-center gap-1.5 text-xs font-black uppercase tracking-wider shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-yellow-300" />
            <span>Vue Spectateur</span>
          </button>
          <div className="h-6 w-px bg-indigo-400/40 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-500 text-white border border-pink-400 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Direct Admin
            </span>
            <h1 className="font-black text-lg sm:text-xl text-yellow-300 italic uppercase tracking-tighter">Console Animateur en Direct</h1>
          </div>
        </div>

        {/* Quick Effect Triggers & Logout */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Animator switcher badge */}
          <div className="flex items-center gap-1.5 bg-indigo-950/90 border-2 border-yellow-400 px-2.5 py-1.5 rounded-xl shadow-md">
            <span className="text-base">{currentAnimator?.avatar || '🐭'}</span>
            <select
              value={(currentAnimator?.name || 'mickey').toLowerCase()}
              onChange={(e) => {
                const found = ANIMATORS_LIST.find(a => a.name.toLowerCase() === e.target.value.toLowerCase());
                if (found && onSwitchAnimator) {
                  onSwitchAnimator(found);
                }
              }}
              className="bg-transparent text-yellow-300 font-black text-xs capitalize focus:outline-none cursor-pointer"
            >
              {ANIMATORS_LIST.map((anim) => (
                <option key={anim.id} value={anim.name.toLowerCase()} className="bg-indigo-950 text-white font-bold capitalize">
                  {anim.avatar} {anim.name} (Code: {anim.id})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleTriggerEffect('confetti', '🎉 Explosion de joie dans le public !')}
            className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all uppercase tracking-wider border border-yellow-200"
          >
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>Confettis</span>
          </button>
          <button
            onClick={() => handleTriggerEffect('alert', '🚨 Attention, sprint final de la manche !')}
            className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white border-2 border-white font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all uppercase tracking-wider shadow-lg"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-300" />
            <span>Alerte</span>
          </button>
          <button
            onClick={onLogout}
            title="Se déconnecter de l'interface admin"
            className="p-2 rounded-xl bg-indigo-800 hover:bg-pink-600 border border-indigo-500 text-gray-200 hover:text-white transition-colors shadow-md"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <div className="bg-indigo-900/50 border-4 border-indigo-400 rounded-3xl p-3 space-y-2 shadow-2xl">
            {[
              { id: 'live', label: 'Direct & Ajout Points', icon: Zap, badge: 'Hot' },
              { id: 'players', label: 'Joueurs & Équipes', icon: Users, count: players.length },
              { id: 'settings', label: 'Thèmes & Manche', icon: Settings },
              { id: 'history', label: 'Logs Animateurs', icon: MessageSquare, count: history.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-sm font-black transition-all ${
                    isActive
                      ? 'bg-pink-500 border-2 border-yellow-300 text-white shadow-xl scale-[1.02]'
                      : 'text-indigo-100 hover:text-white hover:bg-indigo-800 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-300' : 'text-pink-400'}`} />
                    <span>{tab.label}</span>
                  </span>
                  {tab.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-400 text-indigo-950 uppercase tracking-widest shadow-sm">
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-800 text-indigo-100 border border-indigo-600">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Round Status Box */}
          <div className="bg-gradient-to-br from-slate-900 to-purple-950/50 border border-purple-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span>MANCHE EN COURS</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-200">
                x{state?.multiplier || 1} Pts
              </span>
            </div>
            <p className="font-black text-white text-sm truncate">{state?.round || "Manche 1"}</p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-gray-400">Thème :</span>
              <span className="font-bold uppercase text-cyan-400">{state?.theme || 'neon'}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-indigo-900/50 border-4 border-indigo-400 rounded-3xl p-6 sm:p-8 shadow-2xl min-h-[550px]">
          
          {/* TAB: LIVE & POINT ADDITION */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              
              {/* Reason Selector */}
              <div className="bg-indigo-800/80 border-2 border-indigo-600 rounded-2xl p-5 space-y-3 shadow-md">
                <label className="block text-xs font-black uppercase tracking-wider text-yellow-300">
                  1. Motif du point ou du bonus (apparaît en direct sur l'écran public) :
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {quickReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => { setSelectedReason(reason); setCustomReason(''); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm ${
                        selectedReason === reason && !customReason
                          ? 'bg-yellow-400 text-indigo-950 font-black scale-105 border border-yellow-200'
                          : 'bg-indigo-900/80 hover:bg-indigo-700 text-indigo-100 border border-indigo-500'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ou écrivez un motif personnalisé (ex: Défi danse du robot gagné...)"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="flex-1 bg-indigo-950 border-2 border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-400 font-bold placeholder:text-indigo-300"
                  />
                  {customReason && (
                    <button
                      onClick={() => setCustomReason('')}
                      className="text-xs font-bold text-pink-400 hover:text-white px-3"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>

              {/* Batch / Team Addition Bar */}
              <div className="bg-gradient-to-r from-pink-600/30 via-indigo-900/80 to-indigo-900 border-2 border-pink-400 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="p-3 rounded-2xl bg-pink-500 text-white font-black shadow-md">
                    <Users className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-yellow-300 uppercase italic">Ajout de points groupés (Bonus Équipe)</h3>
                    <p className="text-xs font-bold text-indigo-200">Ajouter simultanément à toute une équipe ou à la salle entière</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => addBatchPoints('ALL', 10)}
                    className="px-4 py-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-xs shadow-lg transition-transform active:scale-95 uppercase tracking-wider border border-yellow-200"
                  >
                    +10 pts à TOUS
                  </button>
                  <button
                    onClick={() => addBatchPoints('ALL', -10)}
                    className="px-4 py-2.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-xs shadow-lg transition-transform active:scale-95 uppercase tracking-wider border border-red-300"
                  >
                    -10 pts à TOUS
                  </button>
                  {teams.map((t) => (
                    <div key={t.id} className="flex items-center gap-1">
                      <button
                        onClick={() => addBatchPoints(t.name, 15)}
                        style={{ backgroundColor: t.color || '#3b82f6' }}
                        className="px-3 py-2.5 rounded-l-2xl text-white font-black text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1 border-2 border-white/30 uppercase tracking-wider"
                      >
                        <span>{t.icon}</span>
                        <span>+15 {t.name}</span>
                      </button>
                      <button
                        onClick={() => addBatchPoints(t.name, -10)}
                        style={{ backgroundColor: t.color || '#3b82f6' }}
                        title={`Retirer 10 pts à ${t.name}`}
                        className="px-2 py-2.5 rounded-r-2xl text-white font-black text-xs shadow-lg transition-transform active:scale-95 border-2 border-l-0 border-white/30 hover:bg-red-600"
                      >
                        -10
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Player Cards Grid for Quick Addition & Removal */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-yellow-300 flex items-center justify-between">
                  <span>2. Cliquer pour ajouter / retirer des points en direct :</span>
                  <span className="text-xs bg-pink-500 text-white px-3 py-1 rounded-full font-black animate-pulse">Multiplicateur x{state?.state?.multiplier || 1} actif</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      style={{ borderLeftColor: player.color || '#facc15' }}
                      className="bg-indigo-800/80 hover:bg-indigo-800 border-2 border-indigo-600 border-l-8 rounded-2xl p-4 transition-all flex flex-col justify-between gap-4 shadow-lg group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-12 h-12 rounded-2xl bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform font-black shadow-sm">
                            {player.avatar}
                          </span>
                          <div>
                            <h4 className="font-black text-base text-white group-hover:text-yellow-300 transition-colors uppercase italic">
                              {player.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-indigo-200 font-bold mt-0.5">
                              {player.team && <span className="uppercase tracking-wider">{player.team}</span>}
                              {player.streak >= 2 && (
                                <span className="text-pink-400 font-black flex items-center gap-0.5">
                                  <Flame className="w-3.5 h-3.5 fill-current" />
                                  {player.streak}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-2xl text-yellow-300 block font-mono">{player.score}</span>
                          <span className="text-[10px] text-indigo-200 uppercase font-black tracking-wider -mt-1 block">pts</span>
                        </div>
                      </div>

                      {/* Quick action buttons - Row 1: Ajout (+), Row 2: Retrait (-) */}
                      <div className="space-y-1.5 pt-3 border-t-2 border-indigo-600/80">
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 5, 10, 20, 50].map((val) => (
                            <button
                              key={val}
                              onClick={() => addPoints(player.id, val)}
                              className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95"
                            >
                              +{val}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[-1, -5, -10, -20, -50].map((val) => (
                            <button
                              key={val}
                              onClick={() => addPoints(player.id, val)}
                              className="py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-bold text-xs transition-colors border border-red-500/30"
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: PLAYERS & TEAMS MANAGEMENT */}
          {activeTab === 'players' && (
            <div className="space-y-8">
              
              {/* Create Player Form */}
              <form onSubmit={handleCreatePlayer} className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un Nouveau Joueur / Candidat</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Nom du joueur / Surnom</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Lucas le Champion"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Équipe (Optionnel)</label>
                    <select
                      value={newPlayerTeam}
                      onChange={(e) => setNewPlayerTeam(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">Aucune (Individuel)</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.name}>{t.icon} {t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Couleur distinctive</label>
                    <div className="flex items-center gap-2 h-9">
                      {funColors.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewPlayerColor(col)}
                          style={{ backgroundColor: col }}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            newPlayerColor === col ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-70'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Avatar selector */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Choisir un avatar fun :</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {funAvatars.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewPlayerAvatar(emoji)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                          newPlayerAvatar === emoji
                            ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg'
                            : 'bg-white/5 hover:bg-white/10 text-white'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter ce joueur au direct</span>
                </button>
              </form>

              {/* List of Players with Delete */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  Joueurs Inscrits ({players.length}) :
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{player.avatar}</span>
                        <div>
                          <p className="font-bold text-white text-sm">{player.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <select
                              value={player.team || 'AUCUNE'}
                              onChange={(e) => handleUpdatePlayerTeam(player, e.target.value)}
                              className="bg-black/60 border border-white/20 rounded-lg px-2 py-0.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
                            >
                              <option value="AUCUNE">Individuel (Sans équipe)</option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.name}>{t.icon} {t.name}</option>
                              ))}
                            </select>
                            <span className="text-xs text-gray-400 font-mono">— {player.score} pts</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Supprimer du tournoi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* List of Teams with Delete & Clear */}
              <div className="space-y-3 pt-4 border-t border-white/15">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>Équipes & Factions Actives ({teams.length}) :</span>
                  </h3>
                  {teams.length > 0 && (
                    <button
                      onClick={handleClearTeams}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-red-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer Toutes les Équipes</span>
                    </button>
                  )}
                </div>
                {teams.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Aucune équipe créée pour le moment. Vous pouvez en créer une ci-dessous.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        style={{ borderLeftColor: team.color || '#06B6D4' }}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 border-l-4"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{team.icon}</span>
                          <div>
                            <p className="font-bold text-white text-sm">{team.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {players.filter(p => p.team === team.name).length} joueur(s)
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Supprimer cette équipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Team Form */}
              <form onSubmit={handleCreateTeam} className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4 pt-6 border-t border-white/15">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Créer une Nouvelle Équipe / Faction</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Nom de l'équipe</label>
                    <input
                      type="text"
                      placeholder="Ex: Diamant 💎"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Icône (Emoji)</label>
                    <input
                      type="text"
                      placeholder="Ex: ⚡"
                      value={newTeamIcon}
                      onChange={(e) => setNewTeamIcon(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-md transition-all"
                    >
                      Ajouter Équipe
                    </button>
                  </div>
                </div>
              </form>

            </div>
          )}

          {/* TAB: SETTINGS & THEMES */}
          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-3xl">
              
              {/* SOLUTION 2 : SERVEUR DISTANT (NETLIFY / 40 PC) */}
              <div className="bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-slate-900/80 border-2 border-indigo-500/50 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-yellow-300 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <span>Configuration du Serveur Distant (Solution 2 - Netlify / 40 PC)</span>
                    </h3>
                    <p className="text-xs text-indigo-200 leading-relaxed">
                      Sur <strong>Netlify</strong>, le site est statique et n'héberge pas le moteur Node.js. Pour synchroniser les 40 ordinateurs en direct : hébergez le serveur sur <strong>Render / Railway / Glitch</strong> et collez son adresse ici.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    URL du serveur distant (ex: https://mon-serveur.onrender.com) :
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={remoteUrlInput}
                      onChange={(e) => setRemoteUrlInput(e.target.value)}
                      placeholder="Laisser vide pour utiliser le serveur local par défaut..."
                      className="flex-1 bg-black/50 border border-indigo-400/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setRemoteServerUrl(remoteUrlInput);
                        setRemoteSaveSuccess(true);
                        setTimeout(() => setRemoteSaveSuccess(false), 3000);
                        onRefresh();
                        setTimeout(() => window.location.reload(), 800);
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                    >
                      <Server className="w-4 h-4" />
                      <span>{remoteSaveSuccess ? '✅ Connecté !' : 'Connecter & Relancer'}</span>
                    </button>
                    {getRemoteServerUrl() && (
                      <button
                        type="button"
                        onClick={() => {
                          setRemoteUrlInput('');
                          setRemoteServerUrl('');
                          onRefresh();
                          setTimeout(() => window.location.reload(), 500);
                        }}
                        className="px-4 py-2.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                </div>

                {getRemoteServerUrl() ? (
                  <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-4 py-2 text-xs text-emerald-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>🟢 <strong>Mode Solution 2 Actif</strong> — Connecté au serveur distant : <code>{getRemoteServerUrl()}</code></span>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-gray-400">
                    <span>💡 <strong>Mode Local par défaut</strong> — Utilisez cette case uniquement si votre site est publié sur Netlify ou hébergé sans serveur Node.js intégré.</span>
                  </div>
                )}
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>1. Ambiance Visuelle en Direct (Thème de l'Écran Public)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'neon', label: 'Cyberpunk Néon ⚡', desc: 'Ambiance futuriste violette & cyan avec reflets lumineux.' },
                    { id: 'gold', label: 'Trophée Or / Gala 🏆', desc: 'Prestige noir & or pour les soirées VIP et remises de prix.' },
                    { id: 'festival', label: 'Festival / Camp d\'été 🎪', desc: 'Couleurs vives et joyeuses pour les animations grand public.' },
                    { id: 'stadium', label: 'Stade / Tournoi Sportif ⚽', desc: 'Émeraude et acier pour les compétitions et tournois.' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleUpdateState({ theme: t.id as ThemeType })}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        state?.theme === t.id
                          ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-amber-400 shadow-xl scale-[1.02]'
                          : 'bg-black/30 border-white/10 hover:border-white/20 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-white">{t.label}</span>
                        {state?.theme === t.id && (
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs">
                            Actif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Round & Multiplier */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  2. Contrôle de la Manche & Multiplicateur
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Nom de la Manche actuelle :</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editRound}
                        onChange={(e) => setEditRound(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        onClick={() => handleUpdateState({ round: editRound })}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                      >
                        Ok
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Multiplicateur de points :</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((mult) => (
                        <button
                          key={mult}
                          onClick={() => handleUpdateState({ multiplier: mult })}
                          className={`flex-1 py-2 rounded-xl font-black text-sm transition-all ${
                            state?.multiplier === mult
                              ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg scale-105'
                              : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10'
                          }`}
                        >
                          x{mult} {mult > 1 ? '🔥' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Announcement Banner */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>3. Annonce spéciale en direct (Bandeau public)</span>
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 🚨 Prochain défi dans 2 minutes : Soyez prêts !"
                    value={editAnnouncement}
                    onChange={(e) => setEditAnnouncement(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleUpdateState({ announcement: editAnnouncement })}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Publier
                  </button>
                  {state?.announcement && (
                    <button
                      onClick={() => { setEditAnnouncement(''); handleUpdateState({ announcement: '' }); }}
                      className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold"
                    >
                      Masquer
                    </button>
                  )}
                </div>
              </div>

              {/* Export & Publication Control */}
              <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-yellow-300" />
                    <span>Exporter & Publier les Résultats</span>
                  </h4>
                  <p className="text-xs text-gray-400">Télécharger le classement et l'historique pour les réseaux sociaux ou vos archives</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportCSV}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>📊 Exporter CSV (Excel / Sheets)</span>
                  </button>
                  <button
                    onClick={exportJSON}
                    className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📁 Archive JSON complète</span>
                  </button>
                </div>
              </div>

              {/* Reset Control */}
              <div className="pt-6 border-t border-white/15 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Réinitialiser le Tournoi</h4>
                  <p className="text-xs text-gray-400">Remettre les scores à zéro pour lancer une nouvelle manche</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleReset('scores')}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Zéro Scores (Nouvelle Manche)</span>
                  </button>
                  <button
                    onClick={() => handleReset('all')}
                    className="px-4 py-2 rounded-xl bg-pink-600/30 hover:bg-pink-600/40 border border-pink-500/50 text-pink-200 font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Tout à Zéro (0 joueur, 0 équipe)</span>
                  </button>
                  <button
                    onClick={() => handleReset('sample')}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium"
                  >
                    Recharger Démo
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB: LOGS DES ANIMATEURS */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-400/30">
                <div>
                  <h2 className="text-lg font-black uppercase italic tracking-tight text-yellow-300 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-pink-500" />
                    <span>Journal des modifications des Animateurs</span>
                  </h2>
                  <p className="text-xs font-bold text-indigo-200 mt-0.5">
                    Toutes les actions (points, équipes, paramètres) sont associées à l'animateur en poste.
                  </p>
                </div>
                {/* Filter by Animator */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setAnimatorFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shrink-0 ${
                      animatorFilter === 'ALL' ? 'bg-yellow-400 text-indigo-950 shadow-md scale-105' : 'bg-indigo-800 text-indigo-200 hover:bg-indigo-700'
                    }`}
                  >
                    🌟 Tous ({history.length})
                  </button>
                  {ANIMATORS_LIST.map((anim) => {
                    const count = history.filter(h => (h.animator || 'mickey').toLowerCase() === anim.name.toLowerCase()).length;
                    return (
                      <button
                        key={anim.id}
                        onClick={() => setAnimatorFilter(anim.name.toLowerCase())}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-xs capitalize transition-all flex items-center gap-1 shrink-0 ${
                          animatorFilter === anim.name.toLowerCase() ? 'bg-yellow-400 text-indigo-950 font-black shadow-md scale-105' : 'bg-indigo-800/80 text-indigo-200 hover:bg-indigo-700'
                        }`}
                      >
                        <span>{anim.avatar} {anim.name}</span>
                        <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logs List */}
              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {history
                  .filter(h => animatorFilter === 'ALL' || (h.animator || 'mickey').toLowerCase() === animatorFilter)
                  .map((log) => {
                    const animProfile = ANIMATORS_LIST.find(a => a.name.toLowerCase() === (log.animator || 'mickey').toLowerCase()) || { name: log.animator || 'mickey', avatar: '🐭' };
                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-indigo-950/80 border-2 border-indigo-500/40 flex items-center justify-between gap-4 hover:border-yellow-400/50 transition-all shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-indigo-800 border border-indigo-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
                            {log.playerAvatar || '⚙️'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-white text-sm truncate">{log.playerName || 'Système'}</span>
                              <span className="px-2 py-0.5 rounded-md bg-purple-900/80 border border-purple-400/40 text-yellow-300 font-bold text-[11px] inline-flex items-center gap-1">
                                <span>🎮 {animProfile.avatar}</span>
                                <span className="capitalize">{animProfile.name}</span>
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">{log.timestamp}</span>
                            </div>
                            <p className="text-xs text-indigo-200 font-medium mt-0.5 truncate">
                              Motif : <strong className="text-white font-bold">{log.reason || "Modification"}</strong> ({log.round})
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm sm:text-base font-black font-mono shrink-0 px-3 py-1 rounded-xl ${
                          log.points > 0 ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40' :
                          log.points < 0 ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' :
                          'bg-indigo-800/40 text-gray-300 border border-indigo-600/40'
                        }`}>
                          {log.points > 0 ? `+${log.points} pts` : log.points < 0 ? `${log.points} pts` : 'Système'}
                        </div>
                      </div>
                    );
                  })}
                {history.filter(h => animatorFilter === 'ALL' || (h.animator || 'mickey').toLowerCase() === animatorFilter).length === 0 && (
                  <div className="text-center py-12 bg-indigo-950/40 rounded-2xl border-2 border-dashed border-indigo-600">
                    <p className="text-sm font-bold text-indigo-300">Aucun historique de modification pour cet animateur.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
