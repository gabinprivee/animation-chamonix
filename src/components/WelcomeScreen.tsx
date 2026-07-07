import React, { useState } from 'react';
import { ShieldCheck, User, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onJoin: (pseudo: string) => void;
  onAdminLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onJoin, onAdminLogin }) => {
  const [pseudo, setPseudo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pseudo.trim().length >= 2) {
      onJoin(pseudo.trim());
    }
  };

  return (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4 sm:p-6 text-white selection:bg-pink-500 selection:text-white font-sans relative overflow-hidden">
      
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-pink-600/30 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/30 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-md w-full bg-indigo-800/80 backdrop-blur-xl p-8 rounded-3xl border border-indigo-500/30 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 rotate-3">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tight mb-2">Bienvenue</h1>
          <p className="text-indigo-200 font-medium">Entrez votre pseudo pour rejoindre le classement</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-indigo-200 ml-1">VOTRE PSEUDO</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="text"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Ex: Midas..."
                className="w-full bg-indigo-900/50 border-2 border-indigo-500/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-indigo-400/50 font-bold focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all"
                autoFocus
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={pseudo.trim().length < 2}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border border-pink-400/50 font-black text-lg text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            Rejoindre la Partie
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-indigo-500/30 text-center">
          <button
            onClick={onAdminLogin}
            className="inline-flex items-center gap-2 text-indigo-300 hover:text-white font-bold text-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Je suis Animateur
          </button>
        </div>
      </div>
    </div>
  );
};
