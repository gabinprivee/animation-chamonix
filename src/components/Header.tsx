import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, QrCode, Lock, ShieldAlert, Wifi, WifiOff, Sparkles, Trophy, Maximize, Minimize } from 'lucide-react';
import { AnimationState, ThemeType } from '../types';
import { audioSynth } from '../lib/audio';

interface HeaderProps {
  state?: AnimationState;
  isConnected: boolean;
  onOpenQr: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  isConnected,
  onOpenQr,
  onOpenAdmin,
  isAdminLoggedIn,
  soundEnabled,
  onToggleSound,
}) => {
  const theme = state?.theme || 'neon';
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error("Erreur plein écran:", e);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const getThemeStyles = (t: ThemeType) => {
    switch (t) {
      case 'gold':
        return 'bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-b-4 border-amber-500 text-amber-100 shadow-2xl';
      case 'festival':
        return 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 border-b-4 border-white/40 text-white shadow-2xl';
      case 'stadium':
        return 'bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 border-b-4 border-emerald-500 text-emerald-100 shadow-2xl';
      case 'neon':
      default:
        return 'bg-indigo-900/80 border-b-4 border-indigo-400 text-white shadow-2xl backdrop-blur-md';
    }
  };

  return (
    <header className={`w-full px-4 sm:px-6 py-4 transition-all duration-500 ${getThemeStyles(theme)}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Title & Round Badge */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400 border-2 border-indigo-900 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform shrink-0">
            <Trophy className="w-6 h-6 text-indigo-900 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-yellow-300 drop-shadow-md">
                {state?.title || "Tournoi des Champions"}
              </h1>
              {state?.multiplier && state.multiplier > 1 && (
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-pink-500 text-white shadow-md animate-pulse border border-white/20">
                  BONUS x{state.multiplier}!
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs font-bold mt-1 justify-center sm:justify-start">
              <span className="bg-indigo-800 px-3 py-1 rounded-xl border border-indigo-500 text-indigo-100 uppercase tracking-wider">
                {state?.round || "Manche en cours"}
              </span>
              <span className="flex items-center gap-1">
                {isConnected ? (
                  <span className="bg-pink-500 px-3 py-1 rounded-full text-xs font-bold text-white animate-pulse shadow-md flex items-center gap-1">
                    ● EN DIRECT
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-yellow-400 text-indigo-900 px-3 py-1 rounded-full font-black">
                    <WifiOff className="w-3 h-3" />
                    Synchro auto
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            className="p-3 rounded-2xl border-2 bg-indigo-800/80 border-indigo-500 text-gray-200 hover:text-white hover:bg-indigo-700 font-black shadow-lg transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
          >
            {isFullscreen ? <Minimize className="w-5 h-5 text-yellow-300" /> : <Maximize className="w-5 h-5 text-yellow-300" />}
            <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider">{isFullscreen ? "Quitter" : "Plein écran"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Couper le son" : "Activer le son"}
            className={`p-3 rounded-2xl border-2 transition-all font-black shadow-lg ${
              soundEnabled
                ? 'bg-yellow-400 border-yellow-600 text-indigo-900 hover:bg-yellow-300'
                : 'bg-indigo-800/80 border-indigo-600 text-gray-300 hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* QR Code Button */}
          <button
            onClick={onOpenQr}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 border-2 border-indigo-400 text-sm font-black text-white transition-all hover:scale-105 active:scale-95 shadow-lg uppercase tracking-wider"
          >
            <QrCode className="w-4 h-4 text-yellow-300" />
            <span className="hidden md:inline">Scanner & Jouer</span>
            <span className="md:hidden">QR</span>
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 border-2 ${
              isAdminLoggedIn
                ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-500/30 border-pink-300'
                : 'bg-yellow-400 hover:bg-yellow-300 text-indigo-950 shadow-yellow-400/20 border-yellow-200'
            }`}
          >
            {isAdminLoggedIn ? (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Animateur (VIP)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-indigo-900" />
                <span>Espace Animateur</span>
              </>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
