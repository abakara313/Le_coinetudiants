import { useEffect } from 'react';

/**
 * Hook partagé par tous les layouts.
 * Écoute l'événement 'go-home' déclenché par AppHeader
 * et appelle le callback pour revenir à la vue d'accueil.
 */
export function useHomeNavigation(onHome: () => void) {
  useEffect(() => {
    const handler = () => onHome();
    window.addEventListener('go-home', handler);
    return () => window.removeEventListener('go-home', handler);
  }, [onHome]);
}
