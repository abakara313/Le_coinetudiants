import { LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ROLE_CONFIG: Record<string, {
  label: string;
  gradient: string;
  badge: string;
  dot: string;
  glow: string;
}> = {
  student:    {
    label:    'Étudiant',
    gradient: 'from-blue-500 via-blue-600 to-indigo-700',
    badge:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    dot:      'bg-blue-400',
    glow:     'shadow-blue-200',
  },
  individual: {
    label:    'Particulier',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    badge:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot:      'bg-emerald-400',
    glow:     'shadow-emerald-200',
  },
  moderator:  {
    label:    'Modérateur',
    gradient: 'from-violet-500 via-purple-600 to-fuchsia-600',
    badge:    'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    dot:      'bg-violet-400',
    glow:     'shadow-violet-200',
  },
  admin:      {
    label:    'Admin',
    gradient: 'from-rose-500 via-red-500 to-orange-500',
    badge:    'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    dot:      'bg-rose-400',
    glow:     'shadow-rose-200',
  },
};

interface AppHeaderProps {
  onHomeClick: () => void;
}

export default function AppHeader({ onHomeClick }: AppHeaderProps) {
  const { profile, signOut } = useAuth();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [logoError,   setLogoError]   = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role   = profile?.role || 'student';
  const cfg    = ROLE_CONFIG[role];
  const initials = profile?.email
    ? profile.email.slice(0, 2).toUpperCase()
    : 'CE';
  const username = profile?.email?.split('@')[0] ?? '';

  // Ombre progressive au scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fermeture menu au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur-lg transition-shadow duration-300 ${
        scrolled ? 'shadow-md border-b border-gray-100' : 'border-b border-gray-100/80'
      }`}
    >
      {/* Bande colorée très fine en haut selon le rôle */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${cfg.gradient}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 py-2.5 flex items-center justify-between gap-4">

        {/* ── LOGO + NOM ───────────────────────────────────── */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-3 group focus:outline-none"
        >
          {/* Image logo avec fallback dégradé */}
          <div className={`relative w-10 h-10 rounded-xl overflow-hidden shadow-md ${cfg.glow} transition-transform duration-200 group-hover:scale-105 group-active:scale-95`}>
            {!logoError ? (
              <img
                src="/images/logo.png"
                alt="Logo Le Coin des Étudiants"
                className="w-full h-full object-contain bg-white p-0.5"
                onError={() => setLogoError(true)}
              />
            ) : (
              /* Fallback stylisé si image absente */
              <div className={`w-full h-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                <span className="text-white font-black text-sm tracking-tight select-none">CE</span>
              </div>
            )}
          </div>

          {/* Texte */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-extrabold text-gray-900 leading-tight tracking-tight">
              Le Coin des Étudiants
            </span>
            <span className="text-[10px] text-gray-400 leading-tight font-medium tracking-wide uppercase">
              Plateforme étudiante
            </span>
          </div>
        </button>

        {/* ── SÉPARATEUR DÉCORATIF ─────────────────────────── */}
        <div className="hidden lg:flex flex-1 items-center justify-center pointer-events-none">
          <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* ── DROITE ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Badge rôle — desktop uniquement */}
          <div className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>

          {/* Avatar + menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none"
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white text-xs font-black shadow-sm select-none`}
              >
                {initials}
              </div>

              {/* Nom (tablette+) */}
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-800 leading-tight max-w-[120px] truncate">
                  {username}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">{cfg.label}</p>
              </div>

              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* ── DROPDOWN ─────────────────────────────────── */}
            {menuOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                style={{ animation: 'dropIn 0.15s ease-out' }}
              >
                {/* Header coloré */}
                <div className={`bg-gradient-to-br ${cfg.gradient} px-5 py-4`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-lg select-none">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-extrabold text-sm truncate">{username}</p>
                      <p className="text-white/65 text-xs truncate">{profile?.email}</p>
                    </div>
                  </div>
                  {/* Badge rôle dans le menu */}
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Sparkles size={10} />
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Déconnexion */}
                <div className="p-2">
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                      <LogOut size={15} className="group-hover:text-red-500 transition-colors" />
                    </div>
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation CSS inline */}
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </header>
  );
}