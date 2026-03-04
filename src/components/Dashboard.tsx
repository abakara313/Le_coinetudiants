import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Announcement } from '../lib/supabase';
import { Plus, LogOut, Home, Building, Users, Briefcase, Package, User, MessageCircle, Heart, Star, Shield } from 'lucide-react';
import AnnouncementList from './AnnouncementList';
import AnnouncementForm from './AnnouncementForm';
import ModerationPanel from './ModerationPanel';
import ProfilePanel from './ProfilePanel';
import MessagingPanel from './MessagingPanel';
import FavoritesPanel from './FavoritesPanel';
import TrustSystemPanel from './TrustSystemPanel';
import AdminPanel from './AdminPanel';

type View = 'announcements' | 'my-announcements' | 'create' | 'moderation' | 'admin' | 'profile' | 'messages' | 'favorites' | 'trust';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    if (profile) {
      fetchUserFavorites();
    }
  }, [currentView, profile]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      let query = supabase.from('announcements').select('*');

      if (currentView === 'my-announcements') {
        query = query.eq('owner_id', profile?.id);
      } else if (currentView === 'announcements') {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFavorites = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('announcement_id')
        .eq('user_id', profile.id);

      if (error) throw error;
      setUserFavorites((data || []).map((fav: any) => fav.announcement_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleContactClick = async (announcement: Announcement) => {
    if (!profile) return;

    try {
      const otherParticipantId = announcement.owner_id;
      const participant1 = profile.id < otherParticipantId ? profile.id : otherParticipantId;
      const participant2 = profile.id < otherParticipantId ? otherParticipantId : profile.id;

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1_id', participant1)
        .eq('participant_2_id', participant2)
        .maybeSingle();

      if (existingConv) {
        setCurrentView('messages');
      } else {
        await supabase.from('conversations').insert([
          {
            participant_1_id: participant1,
            participant_2_id: participant2,
            announcement_id: announcement.id,
          },
        ]);
        setCurrentView('messages');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Erreur lors du contact');
    }
  };

  const handleFavoriteToggle = async (announcementId: string, isFavorite: boolean) => {
    if (!profile) return;

    try {
      if (isFavorite) {
        await supabase.from('favorites').insert([
          {
            user_id: profile.id,
            announcement_id: announcementId,
          },
        ]);
      } else {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', profile.id)
          .eq('announcement_id', announcementId);
      }
      fetchUserFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      student: { label: 'Étudiant', color: 'bg-blue-100 text-blue-800' },
      individual: { label: 'Particulier', color: 'bg-green-100 text-green-800' },
      moderator: { label: 'Modérateur', color: 'bg-purple-100 text-purple-800' },
      admin: { label: 'Admin', color: 'bg-red-100 text-red-800' },
    };
    return badges[role as keyof typeof badges] || badges.student;
  };

  const badge = getRoleBadge(profile?.role || 'student');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Home className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Le Coin des Étudiants
              </h1>
              <p className="text-sm text-gray-600">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
              {badge.label}
            </span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setCurrentView('announcements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentView === 'announcements'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package size={20} />
            Annonces
          </button>
          <button
            onClick={() => setCurrentView('my-announcements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentView === 'my-announcements'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Briefcase size={20} />
            Mes annonces
          </button>
          <button
            onClick={() => setCurrentView('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentView === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Plus size={20} />
            Créer une annonce
          </button>
          <button
            onClick={() => setCurrentView('messages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentView === 'messages'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageCircle size={20} />
            Messages
          </button>
          <button
            onClick={() => setCurrentView('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentView === 'favorites'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Heart size={20} />
            Favoris
          </button>
          <button
            onClick={() => setCurrentView('trust')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentView === 'trust'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Star size={20} />
            Confiance
          </button>
          {(profile?.role === 'moderator' || profile?.role === 'admin') && (
            <button
              onClick={() => setCurrentView('moderation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                currentView === 'moderation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users size={20} />
              Modération
            </button>
          )}
          {profile?.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                currentView === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield size={20} />
              Admin
            </button>
          )}
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentView === 'profile'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User size={20} />
            Profil
          </button>
        </nav>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {currentView === 'create' && (
            <AnnouncementForm
              onSuccess={() => {
                setCurrentView('my-announcements');
                fetchAnnouncements();
              }}
            />
          )}

          {(currentView === 'announcements' || currentView === 'my-announcements') && (
            <AnnouncementList
              announcements={announcements}
              loading={loading}
              isOwnList={currentView === 'my-announcements'}
              onUpdate={fetchAnnouncements}
              onContactClick={currentView === 'announcements' ? handleContactClick : undefined}
              userFavorites={userFavorites}
              onFavoriteToggle={currentView === 'announcements' ? handleFavoriteToggle : undefined}
            />
          )}

          {currentView === 'messages' && <MessagingPanel />}

          {currentView === 'favorites' && <FavoritesPanel />}

          {currentView === 'trust' && <TrustSystemPanel />}

          {currentView === 'moderation' && <ModerationPanel />}

          {currentView === 'admin' && <AdminPanel />}

          {currentView === 'profile' && <ProfilePanel />}
        </div>
      </div>
    </div>
  );
}
