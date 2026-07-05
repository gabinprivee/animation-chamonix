import React, {StrictMode, Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public props!: Props;
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in application:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-indigo-900 text-white flex flex-col items-center justify-center p-6 font-sans text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-pink-500 border-4 border-yellow-400 flex items-center justify-center shadow-2xl text-4xl animate-bounce">
            ⚠️
          </div>
          <div className="max-w-md space-y-2">
            <h1 className="text-2xl font-black uppercase italic tracking-tight text-yellow-300">
              Oups ! Une erreur est survenue
            </h1>
            <p className="text-sm font-bold text-indigo-200">
              Le navigateur ou le serveur a rencontré un problème d'affichage (écran blanc évité).
            </p>
            {this.state.error && (
              <div className="bg-black/40 p-3 rounded-xl border border-white/20 text-left text-xs font-mono text-pink-300 overflow-auto max-h-32 mt-4">
                {this.state.error.toString()}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black uppercase tracking-wider shadow-lg transition-transform hover:scale-105"
            >
              🔄 Recharger l'application
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-3 rounded-2xl bg-indigo-800 hover:bg-indigo-700 border-2 border-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105"
            >
              🧹 Réinitialiser le cache & Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

