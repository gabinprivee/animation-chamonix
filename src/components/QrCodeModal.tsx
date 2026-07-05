import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Share2, Copy, Check } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, title }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ai.studio';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-indigo-900 border-4 border-pink-400 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 text-white">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-indigo-800 hover:bg-pink-500 text-gray-200 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-indigo-900 flex items-center justify-center mx-auto shadow-lg font-black border-2 border-indigo-950">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black italic tracking-tight uppercase text-yellow-300">Rejoindre l'Animation</h3>
          <p className="text-xs sm:text-sm font-bold text-indigo-200">
            Scannez ce QR Code avec votre smartphone pour suivre le classement en direct depuis le public !
          </p>
        </div>

        {/* QR Code Canvas */}
        <div className="bg-white p-5 rounded-3xl inline-block shadow-2xl border-4 border-yellow-400">
          <QRCodeSVG value={currentUrl} size={220} level="H" includeMargin={true} />
        </div>

        {/* Link Copy */}
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-yellow-300">Ou partagez le lien :</p>
          <div className="flex items-center gap-2 bg-indigo-950/80 border-2 border-indigo-500 rounded-2xl p-2 pl-3">
            <span className="text-xs text-gray-300 truncate flex-1 font-mono text-left">{currentUrl}</span>
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs flex items-center gap-1.5 transition-all shrink-0 uppercase tracking-wider"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg border border-yellow-200"
        >
          Retour au Classement
        </button>

      </div>
    </div>
  );
};
