import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Announcement } from '../lib/supabase';
import { Heart, Building, Users, Briefcase, Package, Eye, Trash2 } from 'lucide-react';
import AnnouncementDetail from './AnnouncementDetail';

interface FavoriteItem {
  id: string;
  announcement: Announcement;
}

export default function FavoritesPanel() {
  const { profile } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchFavorites();
    }
  }, [profile]);

  const fetchFavorites = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id, announcements(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFavorites = (data || []).map((fav: any) => ({
        id: fav.id,
        announcement: fav.announcements,
      }));

      setFavorites(formattedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);

      if (error) throw error;
      fetchFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      housing: <Building size={20} />,
      roommate: <Users size={20} />,
      job: <Briefcase size={20} />,
      service: <Package size={20} />,
    };
    return icons[type as keyof typeof icons];
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      housing: 'Logement',
      roommate: 'Colocation',
      job: 'Job étudiant',
      service: 'Service',
    };
    return labels[type as keyof typeof labels];
  };

  if (selectedAnnouncement) {
    return (
      <AnnouncementDetail
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes favoris</h2>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun favori</h3>
          <p className="text-gray-600">Ajoutez des annonces à vos favoris en cliquant sur le cœur</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map(({ id, announcement }) => (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-600">
                  {getTypeIcon(announcement.type)}
                  <span className="text-sm font-medium">
                    {getTypeLabel(announcement.type)}
                  </span>
                </div>
                <Heart size={20} className="fill-red-500 text-red-500" />
              </div>

              <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">
                {announcement.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {announcement.description}
              </p>

              {announcement.price && (
                <p className="text-lg font-bold text-blue-600 mb-3">
                  {announcement.price} €
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAnnouncement(announcement)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Eye size={16} />
                  Voir
                </button>
                <button
                  onClick={() => handleRemoveFavorite(id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
