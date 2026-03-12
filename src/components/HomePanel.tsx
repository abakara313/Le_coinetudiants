import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Home, Package, Plus, MessageCircle, Heart, Star,
  Users, Shield, TrendingUp, Clock, CheckCircle,
  XCircle, AlertCircle, BookOpen, Building, Briefcase,
  ChevronRight, Bell
} from 'lucide-react';

interface Stats {
  // Commun
  myAnnouncements: number;
  myFavorites: number;
  myMessages: number;
  // Étudiant / Particulier
  approvedAnnouncements: number;
  pendingAnnouncements: number;
  rejectedAnnouncements: number;
  // Modérateur / Admin
  pendingReview: number;
  totalUsers?: number;
  totalAnnouncements?: number;
}

interface HomeProps {
  onNavigate: (view: string) => void;
}

export default function HomePanel({ onNavigate }: HomeProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    myAnnouncements: 0,
    myFavorites: 0,
    myMessages: 0,
    approvedAnnouncements: 0,
    pendingAnnouncements: 0,
    rejectedAnnouncements: 0,
    pendingReview: 0,
    totalUsers: 0,
    totalAnnouncements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hour] = useState(new Date().getHours());

  const greeting =
    hour < 6  ? 'Bonne nuit' :
    hour < 12 ? 'Bonjour' :
    hour < 18 ? 'Bon après-midi' :
                'Bonsoir';

  useEffect(() => {
    if (profile) fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Stats communes
      const [annRes, favRes, convRes] = await Promise.all([
        supabase.from('announcements').select('id, status').eq('owner_id', profile.id),
        supabase.from('favorites').select('announcement_id').eq('user_id', profile.id),
        supabase.from('conversations').select('id').or(`user1.eq.${profile.id},user2.eq.${profile.id}`),
      ]);

      const myAnn = annRes.data || [];

      const base: Partial<Stats> = {
        myAnnouncements:      myAnn.length,
        myFavorites:          (favRes.data || []).length,
        myMessages:           (convRes.data || []).length,
        approvedAnnouncements: myAnn.filter((a) => a.status === 'approved').length,
        pendingAnnouncements:  myAnn.filter((a) => a.status === 'pending_review').length,
        rejectedAnnouncements: myAnn.filter((a) => a.status === 'rejected').length,
      };

      // Stats modérateur / admin
      if (profile.role === 'moderator' || profile.role === 'admin') {
        const pendingRes = await supabase
          .from('announcements')
          .select('id', { count: 'exact' })
          .eq('status', 'pending_review');
        base.pendingReview = pendingRes.count ?? 0;
      }

      // Stats admin uniquement
      if (profile.role === 'admin') {
        const [usersRes, totalAnnRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }),
          supabase.from('announcements').select('id', { count: 'exact' }),
        ]);
        base.totalUsers        = usersRes.count ?? 0;
        base.totalAnnouncements = totalAnnRes.count ?? 0;
      }

      setStats((prev) => ({ ...prev, ...base }));
    } catch (err) {
      console.error('fetchStats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // COMPOSANTS PARTAGÉS
  // ────────────────────────────────────────────────────────────────
  const StatCard = ({
    icon: Icon, label, value, color, onClick,
  }: {
    icon: any; label: string; value: number; color: string; onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-5 rounded-xl border shadow-sm hover:shadow-md transition-all w-full text-left ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${color}`}
    >
      <Icon size={22} className="mb-3 opacity-80" />
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-sm mt-1 opacity-75">{label}</span>
    </button>
  );

  const QuickAction = ({
    icon: Icon, label, description, onClick, color = 'blue',
  }: {
    icon: any; label: string; description: string; onClick: () => void; color?: string;
  }) => {
    const colors: Record<string, string> = {
      blue:   'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
      green:  'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
      purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
      yellow: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700',
      red:    'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
    };
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-4 p-4 rounded-xl border transition-all w-full text-left ${colors[color]}`}
      >
        <div className="p-2 rounded-lg bg-white/60">
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs opacity-70 truncate">{description}</p>
        </div>
        <ChevronRight size={16} className="shrink-0 opacity-50" />
      </button>
    );
  };

  // ────────────────────────────────────────────────────────────────
  // VUE ÉTUDIANT
  // ────────────────────────────────────────────────────────────────
  if (profile?.role === 'student') {
    return (
      <div className="space-y-8">
        {/* Bienvenue */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={28} />
            <span className="text-blue-200 text-sm font-medium uppercase tracking-wide">Espace étudiant</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {greeting}, {profile.email.split('@')[0]} 👋
          </h2>
          <p className="text-blue-100 text-sm">
            Trouvez un logement, un colocataire ou un job étudiant facilement.
          </p>
        </div>

        {/* Stats */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mes statistiques</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Package}      label="Mes annonces"  value={stats.myAnnouncements}      color="bg-blue-50 text-blue-700 border-blue-200"   onClick={() => onNavigate('my-announcements')} />
            <StatCard icon={CheckCircle}  label="Approuvées"    value={stats.approvedAnnouncements} color="bg-green-50 text-green-700 border-green-200"  onClick={() => onNavigate('my-announcements')} />
            <StatCard icon={Clock}        label="En attente"    value={stats.pendingAnnouncements}  color="bg-yellow-50 text-yellow-700 border-yellow-200" onClick={() => onNavigate('my-announcements')} />
            <StatCard icon={Heart}        label="Favoris"       value={stats.myFavorites}           color="bg-pink-50 text-pink-700 border-pink-200"     onClick={() => onNavigate('favorites')} />
          </div>
        </div>

        {/* Raccourcis */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Accès rapide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction icon={Building}      label="Chercher un logement"     description="Parcourez les offres disponibles"       onClick={() => onNavigate('announcements')} color="blue"   />
            <QuickAction icon={Users}         label="Trouver un colocataire"   description="Annonces de colocation étudiante"       onClick={() => onNavigate('announcements')} color="purple" />
            <QuickAction icon={Plus}          label="Publier une annonce"      description="Partagez une offre ou une recherche"    onClick={() => onNavigate('create')}        color="green"  />
            <QuickAction icon={Star}          label="Mon niveau de confiance"  description="Améliorez votre score de fiabilité"     onClick={() => onNavigate('trust')}         color="yellow" />
          </div>
        </div>

        {/* Alerte si annonces rejetées */}
        {stats.rejectedAnnouncements > 0 && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                {stats.rejectedAnnouncements} annonce{stats.rejectedAnnouncements > 1 ? 's' : ''} rejetée{stats.rejectedAnnouncements > 1 ? 's' : ''}
              </p>
              <p className="text-xs mt-0.5">
                Consultez vos annonces pour voir la raison et les modifier.
              </p>
            </div>
            <button
              onClick={() => onNavigate('my-announcements')}
              className="ml-auto text-xs font-medium underline whitespace-nowrap"
            >
              Voir
            </button>
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // VUE PARTICULIER
  // ────────────────────────────────────────────────────────────────
  if (profile?.role === 'individual') {
    return (
      <div className="space-y-8">
        {/* Bienvenue */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Home size={28} />
            <span className="text-green-200 text-sm font-medium uppercase tracking-wide">Espace particulier</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {greeting}, {profile.email.split('@')[0]} 👋
          </h2>
          <p className="text-green-100 text-sm">
            Publiez vos offres de logement ou de services à destination des étudiants.
          </p>
        </div>

        {/* Stats */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mes annonces</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Package}      label="Total"      value={stats.myAnnouncements}       color="bg-gray-50 text-gray-700 border-gray-200"    onClick={() => onNavigate('my-announcements')} />
            <StatCard icon={CheckCircle}  label="En ligne"   value={stats.approvedAnnouncements}  color="bg-green-50 text-green-700 border-green-200"  onClick={() => onNavigate('my-announcements')} />
            <StatCard icon={Clock}        label="En attente" value={stats.pendingAnnouncements}   color="bg-yellow-50 text-yellow-700 border-yellow-200" onClick={() => onNavigate('my-announcements')} />
          </div>
        </div>

        {/* Raccourcis */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Accès rapide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction icon={Plus}          label="Publier une annonce"      description="Logement, service, emploi étudiant"   onClick={() => onNavigate('create')}            color="green"  />
            <QuickAction icon={Briefcase}     label="Gérer mes annonces"       description="Modifier, supprimer, suivre le statut" onClick={() => onNavigate('my-announcements')} color="blue"   />
            <QuickAction icon={MessageCircle} label="Mes messages"             description="Répondez aux étudiants intéressés"    onClick={() => onNavigate('messages')}          color="purple" />
            <QuickAction icon={Star}          label="Mon niveau de confiance"  description="Renforcez votre crédibilité"          onClick={() => onNavigate('trust')}             color="yellow" />
          </div>
        </div>

        {/* Alerte annonces rejetées */}
        {stats.rejectedAnnouncements > 0 && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            <XCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                {stats.rejectedAnnouncements} annonce{stats.rejectedAnnouncements > 1 ? 's' : ''} rejetée{stats.rejectedAnnouncements > 1 ? 's' : ''}
              </p>
              <p className="text-xs mt-0.5">Consultez vos annonces pour voir les raisons.</p>
            </div>
            <button onClick={() => onNavigate('my-announcements')} className="ml-auto text-xs font-medium underline whitespace-nowrap">
              Voir
            </button>
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // VUE MODÉRATEUR
  // ────────────────────────────────────────────────────────────────
  if (profile?.role === 'moderator') {
    return (
      <div className="space-y-8">
        {/* Bienvenue */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} />
            <span className="text-purple-200 text-sm font-medium uppercase tracking-wide">Espace modérateur</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {greeting}, {profile.email.split('@')[0]} 👋
          </h2>
          <p className="text-purple-100 text-sm">
            Gérez les annonces soumises et assurez la qualité de la plateforme.
          </p>
        </div>

        {/* Alerte urgente si annonces en attente */}
        {stats.pendingReview > 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-xl">
            <Bell size={20} className="shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {stats.pendingReview} annonce{stats.pendingReview > 1 ? 's' : ''} en attente de modération
              </p>
              <p className="text-xs mt-0.5">Des utilisateurs attendent votre validation.</p>
            </div>
            <button
              onClick={() => onNavigate('moderation')}
              className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-semibold rounded-lg hover:bg-yellow-700"
            >
              Modérer
            </button>
          </div>
        )}

        {/* Stats */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tableau de bord</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Clock}        label="En attente"      value={stats.pendingReview}          color="bg-yellow-50 text-yellow-700 border-yellow-200" onClick={() => onNavigate('moderation')} />
            <StatCard icon={Package}      label="Mes annonces"    value={stats.myAnnouncements}        color="bg-purple-50 text-purple-700 border-purple-200" onClick={() => onNavigate('my-announcements')} />
            <StatCard icon={MessageCircle} label="Conversations"  value={stats.myMessages}             color="bg-blue-50 text-blue-700 border-blue-200"      onClick={() => onNavigate('messages')} />
          </div>
        </div>

        {/* Raccourcis */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions de modération</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction icon={Users}         label="Panneau de modération"   description={`${stats.pendingReview} annonce(s) à traiter`}  onClick={() => onNavigate('moderation')} color="purple" />
            <QuickAction icon={Package}       label="Toutes les annonces"     description="Vue complète de toutes les annonces"             onClick={() => onNavigate('announcements')} color="blue" />
            <QuickAction icon={MessageCircle} label="Messages"                description="Vos conversations avec les utilisateurs"         onClick={() => onNavigate('messages')} color="green" />
            <QuickAction icon={TrendingUp}    label="Confiance"               description="Voir le système de niveaux de confiance"         onClick={() => onNavigate('trust')} color="yellow" />
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // VUE ADMIN
  // ────────────────────────────────────────────────────────────────
  if (profile?.role === 'admin') {
    return (
      <div className="space-y-8">
        {/* Bienvenue */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} />
            <span className="text-red-200 text-sm font-medium uppercase tracking-wide">Espace administrateur</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {greeting}, {profile.email.split('@')[0]} 👋
          </h2>
          <p className="text-red-100 text-sm">
            Vue globale de la plateforme — utilisateurs, annonces et modération.
          </p>
        </div>

        {/* Alerte modération urgente */}
        {stats.pendingReview > 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-xl">
            <Bell size={20} className="shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {stats.pendingReview} annonce{stats.pendingReview > 1 ? 's' : ''} en attente de modération
              </p>
            </div>
            <button
              onClick={() => onNavigate('moderation')}
              className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-semibold rounded-lg hover:bg-yellow-700"
            >
              Modérer
            </button>
          </div>
        )}

        {/* Stats globales */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Statistiques globales</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users}        label="Utilisateurs"     value={stats.totalUsers ?? 0}        color="bg-red-50 text-red-700 border-red-200"          onClick={() => onNavigate('admin')} />
            <StatCard icon={Package}      label="Toutes annonces"  value={stats.totalAnnouncements ?? 0} color="bg-orange-50 text-orange-700 border-orange-200"  onClick={() => onNavigate('moderation')} />
            <StatCard icon={Clock}        label="En attente"       value={stats.pendingReview}           color="bg-yellow-50 text-yellow-700 border-yellow-200"  onClick={() => onNavigate('moderation')} />
            <StatCard icon={MessageCircle} label="Mes messages"    value={stats.myMessages}             color="bg-blue-50 text-blue-700 border-blue-200"        onClick={() => onNavigate('messages')} />
          </div>
        </div>

        {/* Raccourcis admin */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Administration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction icon={Shield}        label="Panneau Admin"          description="Gérer les rôles et les comptes"                onClick={() => onNavigate('admin')}       color="red"    />
            <QuickAction icon={Users}         label="Modération"             description={`${stats.pendingReview} annonce(s) en attente`} onClick={() => onNavigate('moderation')}  color="purple" />
            <QuickAction icon={Package}       label="Toutes les annonces"    description="Consulter l'ensemble du contenu"               onClick={() => onNavigate('announcements')} color="blue" />
            <QuickAction icon={Plus}          label="Créer une annonce"      description="Publier au nom de la plateforme"               onClick={() => onNavigate('create')}      color="green"  />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
