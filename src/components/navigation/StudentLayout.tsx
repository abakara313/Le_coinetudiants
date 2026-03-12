import { useState, useEffect } from 'react';
import { Package, Plus, Briefcase, MessageCircle, Heart, Star, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Announcement } from '../../lib/supabase';
import NavBar, { NavItem } from './NavBar';
import { useHomeNavigation } from './useHomeNavigation';
import HomePanel from '../HomePanel';
import AnnouncementList from '../AnnouncementList';
import AnnouncementForm from '../AnnouncementForm';
import MessagingPanel from '../MessagingPanel';
import FavoritesPanel from '../FavoritesPanel';
import TrustSystemPanel from '../TrustSystemPanel';
import ProfilePanel from '../ProfilePanel';

type StudentView =
  | 'home' | 'announcements' | 'my-announcements'
  | 'create' | 'messages' | 'favorites' | 'trust' | 'profile';

export default function StudentLayout() {
  const { profile } = useAuth();
  const [view, setView] = useState<StudentView>('home');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (view === 'announcements' || view === 'my-announcements') {
      fetchAnnouncements();
    }
    if (view === 'announcements') fetchUserFavorites();
  }, [view]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      let query = supabase.from('announcements').select('*');
      if (view === 'my-announcements') query = query.eq('owner_id', profile?.id);
      else query = query.eq('status', 'approved');
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFavorites = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('favorites').select('announcement_id').eq('user_id', profile.id);
    setUserFavorites((data || []).map((f: any) => f.announcement_id));
  };

  const handleContact = async (announcement: Announcement) => {
    if (!profile) return;
    const other = announcement.owner_id;
    const u1 = profile.id < other ? profile.id : other;
    const u2 = profile.id < other ? other : profile.id;
    const { data } = await supabase
      .from('conversations').select('id').eq('user1', u1).eq('user2', u2).maybeSingle();
    if (!data) await supabase.from('conversations').insert([{ user1: u1, user2: u2 }]);
    setView('messages');
  };

  const handleFavorite = async (id: string, add: boolean) => {
    if (!profile) return;
    if (add) {
      await supabase.from('favorites').insert([{ user_id: profile.id, announcement_id: id }]);
    } else {
      await supabase.from('favorites').delete()
        .eq('user_id', profile.id).eq('announcement_id', id);
    }
    fetchUserFavorites();
  };

  // Retour à l'accueil quand l'utilisateur clique le logo
  useHomeNavigation(() => setView('home'));

  const navItems: NavItem[] = [
    { view: 'home',             icon: Package,        label: 'Accueil' },
    { view: 'announcements',    icon: Package,        label: 'Annonces' },
    { view: 'my-announcements', icon: Briefcase,      label: 'Mes annonces' },
    { view: 'create',           icon: Plus,           label: 'Publier' },
    { view: 'messages',         icon: MessageCircle,  label: 'Messages' },
    { view: 'favorites',        icon: Heart,          label: 'Favoris' },
    { view: 'trust',            icon: Star,           label: 'Confiance' },
    { view: 'profile',          icon: User,           label: 'Profil' },
  ];

  return (
    <>
      <NavBar
        items={navItems}
        currentView={view}
        onNavigate={(v) => setView(v as StudentView)}
        accentColor="bg-blue-600"
      />

      <div className="bg-white rounded-xl shadow-sm p-6">
        {view === 'home' && (
          <HomePanel onNavigate={(v) => setView(v as StudentView)} />
        )}
        {view === 'announcements' && (
          <AnnouncementList
            announcements={announcements}
            loading={loading}
            isOwnList={false}
            onUpdate={fetchAnnouncements}
            onContactClick={handleContact}
            userFavorites={userFavorites}
            onFavoriteToggle={handleFavorite}
          />
        )}
        {view === 'my-announcements' && (
          <AnnouncementList
            announcements={announcements}
            loading={loading}
            isOwnList={true}
            onUpdate={fetchAnnouncements}
          />
        )}
        {view === 'create' && (
          <AnnouncementForm onSuccess={() => { setView('my-announcements'); fetchAnnouncements(); }} />
        )}
        {view === 'messages'  && <MessagingPanel />}
        {view === 'favorites' && <FavoritesPanel />}
        {view === 'trust'     && <TrustSystemPanel />}
        {view === 'profile'   && <ProfilePanel />}
      </div>
    </>
  );
}
