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
