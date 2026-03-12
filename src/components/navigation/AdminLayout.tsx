import { useState, useEffect } from 'react';
import { Package, Plus, Briefcase, MessageCircle, Users, Star, User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Announcement } from '../../lib/supabase';
import NavBar, { NavItem } from './NavBar';
import { useHomeNavigation } from './useHomeNavigation';
import HomePanel from '../HomePanel';
import AnnouncementList from '../AnnouncementList';
import AnnouncementForm from '../AnnouncementForm';
import MessagingPanel from '../MessagingPanel';
import ModerationPanel from '../ModerationPanel';
import AdminPanel from '../AdminPanel';
import TrustSystemPanel from '../TrustSystemPanel';
import ProfilePanel from '../ProfilePanel';

type AdminView =
  | 'home' | 'announcements' | 'my-announcements'
  | 'create' | 'messages' | 'moderation' | 'admin' | 'trust' | 'profile';

export default function AdminLayout() {
  const { profile } = useAuth();
  const [view, setView] = useState<AdminView>('home');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  useEffect(() => {
    if (view === 'announcements' || view === 'my-announcements') {
      fetchAnnouncements();
    }
    if (view === 'home') fetchPendingCount();
  }, [view]);

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('announcements')
      .select('id', { count: 'exact' })
      .eq('status', 'pending_review');
    setPendingCount(count ?? 0);
  };

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

  // Retour accueil via logo
  useHomeNavigation(() => setView('home'));

  const navItems: NavItem[] = [
    { view: 'home',             icon: Package,        label: 'Accueil' },
    { view: 'announcements',    icon: Package,        label: 'Annonces' },
    { view: 'my-announcements', icon: Briefcase,      label: 'Mes annonces' },
    { view: 'create',           icon: Plus,           label: 'Publier' },
    { view: 'messages',         icon: MessageCircle,  label: 'Messages' },
    { view: 'moderation',       icon: Users,          label: 'Modération', badge: pendingCount },
    { view: 'admin',            icon: Shield,         label: 'Admin' },
    { view: 'trust',            icon: Star,           label: 'Confiance' },
    { view: 'profile',          icon: User,           label: 'Profil' },
  ];

  return (
    <>
      <NavBar
        items={navItems}
        currentView={view}
        onNavigate={(v) => setView(v as AdminView)}
        accentColor="bg-red-600"
      />

      <div className="bg-white rounded-xl shadow-sm p-6">
        {view === 'home' && (
          <HomePanel onNavigate={(v) => setView(v as AdminView)} />
        )}
        {view === 'announcements' && (
          <AnnouncementList
            announcements={announcements}
            loading={loading}
            isOwnList={false}
            onUpdate={fetchAnnouncements}
            onContactClick={handleContact}
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
        {view === 'messages'   && <MessagingPanel />}
        {view === 'moderation' && <ModerationPanel onUpdate={fetchPendingCount} />}
        {view === 'admin'      && <AdminPanel />}
        {view === 'trust'      && <TrustSystemPanel />}
        {view === 'profile'    && <ProfilePanel />}
      </div>
    </>
  );
}
