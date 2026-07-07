import React, { useState, useEffect } from 'react';
import { useLeaderboard } from './lib/useLeaderboard';
import { audioSynth } from './lib/audio';
import { apiFetch } from './lib/api';
import { Header } from './components/Header';
import { PlayerView } from './components/PlayerView';
import { AdminPanel } from './components/AdminPanel';
import { QrCodeModal } from './components/QrCodeModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AnimatePresence, motion } from 'motion/react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Sparkles, Trophy, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const { data, setData, isConnected, toasts, triggerConfettiBlast } = useLeaderboard();
  
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userPseudo, setUserPseudo] = useState<string | null>(() => sessionStorage.getItem('user_pseudo'));

  const currentAnimatorState = useState<{ name: string; avatar: string }>(() => {
    const savedName = localStorage.getItem('admin_animator_name') || 'mickey';
    const savedAvatar = localStorage.getItem('admin_animator_avatar') || '🐭';
    return { name: savedName, avatar: savedAvatar };
  });
  const currentAnimator = currentAnimatorState[0];
  const setCurrentAnimator = currentAnimatorState[1];

  useEffect(() => {
    // Check if previously logged in session token exists
    const token = localStorage.getItem('admin_session_token');
    if (token === 'admin-session-token-valid') {
      setIsAdminLoggedIn(true);
      setIsAdminView(true); // Open admin view directly if already admin
    }
  }, []);

  const handleJoinAsPlayer = async (pseudo: string) => {
    if (!data) return;
    const exists = data.players.some(p => p.name.toLowerCase() === pseudo.toLowerCase());
    if (!exists) {
      try {
        await apiFetch('/api/admin/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', player: { name: pseudo } })
        });
        handleRefresh();
      } catch (e) {
        console.error('Failed to create player', e);
      }
    }
    sessionStorage.setItem('user_pseudo', pseudo);
    setUserPseudo(pseudo);
  };

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    audioSynth.setMuted(!nextState);
  };

  const handleAdminSuccess = (animator?: { name: string; avatar: string }) => {
    const anim = animator || { name: 'mickey', avatar: '🐭' };
    setCurrentAnimator(anim);
    localStorage.setItem('admin_animator_name', anim.name);
    localStorage.setItem('admin_animator_avatar', anim.avatar);
    setIsAdminLoggedIn(true);
    setIsAdminView(true);
    localStorage.setItem('admin_session_token', 'admin-session-token-valid');
  };

  const handleLogoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setIsAdminView(false);
    localStorage.removeItem('admin_session_token');
  };

  const handleRefresh = async () => {
    try {
      const res = await apiFetch('/api/state');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Refresh error:', e);
    }
  };

  // If loading initial state
  if (!data) {
    return (
      <div className="min-h-screen bg-indigo-700 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-900 border-4 border-yellow-400 flex items-center justify-center shadow-2xl animate-pulse">
          <Trophy className="w-8 h-8 text-yellow-300" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black italic uppercase tracking-tight text-yellow-300">Chargement du Classement Live...</h2>
          <p className="text-xs font-bold text-indigo-200 mt-1 uppercase tracking-widest">Synchronisation en direct</p>
        </div>
      </div>
    );
  }

  // Render Admin Console if Active
  if (isAdminView) {
    return (
      <AdminPanel
        players={data.players}
        teams={data.teams}
        state={data.state}
        history={data.history}
        currentAnimator={currentAnimator}
        onSwitchAnimator={(newAnim?: { name: string; avatar: string }) => {
          if (newAnim) {
            setCurrentAnimator(newAnim);
            localStorage.setItem('admin_animator_name', newAnim.name);
            localStorage.setItem('admin_animator_avatar', newAnim.avatar);
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        onClose={() => setIsAdminView(false)}
        onLogout={handleLogoutAdmin}
        onRefresh={handleRefresh}
      />
    );
  }

  // Show Welcome Screen if not logged in as admin and no pseudo
  if (!userPseudo && !isAdminLoggedIn) {
    return (
      <>
        <WelcomeScreen onJoin={handleJoinAsPlayer} onAdminLogin={() => setIsAdminLoginOpen(true)} />
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={handleAdminSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-700 text-white flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      
      {/* Toast Notifications Container */}
      <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`p-4 rounded-2xl shadow-2xl border-4 backdrop-blur-md pointer-events-auto flex items-center gap-3 ${
                toast.type === 'points'
                  ? (toast.points && toast.points > 0 ? 'bg-yellow-400 border-yellow-600 text-indigo-950 font-black' : 'bg-pink-500 border-pink-700 text-white font-black')
                  : toast.type === 'alert'
                  ? 'bg-pink-600 border-white text-white font-black animate-bounce'
                  : 'bg-indigo-900 border-indigo-400 text-white font-bold'
              }`}
            >
              <div className="text-2xl shrink-0">
                {toast.player?.avatar || (toast.type === 'alert' ? '🚨' : toast.type === 'cheer' ? '🎉' : '⚡')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm leading-snug">{toast.message}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-bold mt-0.5">En direct de l'animation</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Header */}
      <Header
        state={data.state}
        isConnected={isConnected}
        onOpenQr={() => setIsQrOpen(true)}
        onOpenAdmin={() => {
          if (isAdminLoggedIn) {
            setIsAdminView(true);
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Player View */}
      <main className="flex-1">
        <PlayerView
          players={data.players}
          teams={data.teams}
          state={data.state}
          history={data.history}
          onOpenQr={() => setIsQrOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t-4 border-indigo-400 bg-indigo-900/80 text-center text-xs font-bold text-indigo-200 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="uppercase tracking-wider">🎮 {data.state?.title || "Tournoi en Direct"} — Classement officiel actualisé en temps réel</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsQrOpen(true)}
              className="hover:text-yellow-300 transition-colors underline font-black"
            >
              Afficher QR Code pour les joueurs
            </button>
            <button
              onClick={() => {
                if (isAdminLoggedIn) setIsAdminView(true);
                else setIsAdminLoginOpen(true);
              }}
              className="hover:text-pink-400 transition-colors underline font-black"
            >
              👑 Accès Animateur (Mickey, Iris, Midas, Seamko, Axel, Le_c, Nath)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        title={data.state?.title}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminSuccess}
      />

    </div>
  );
}
