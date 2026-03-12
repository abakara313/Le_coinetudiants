import { useState } from 'react';
import { Announcement } from '../lib/supabase';
import { Building, Users, Briefcase, Package, CreditCard as Edit, Trash2, Eye, Heart, MessageCircle } from 'lucide-react';
import AnnouncementDetail from './AnnouncementDetail';
import AnnouncementForm from './AnnouncementForm';
import { supabase } from '../lib/supabase';

interface Props {
  announcements: Announcement[];
  loading: boolean;
  isOwnList: boolean;
  onUpdate: () => void;
  onContactClick?: (announcement: Announcement) => void;
  userFavorites?: string[];
  onFavoriteToggle?: (announcementId: string, isFavorite: boolean) => void;
}

export default function AnnouncementList({
  announcements,
  loading,
  isOwnList,
  onUpdate,
  onContactClick,
  userFavorites = [],
  onFavoriteToggle,
}: Props) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

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

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      pending_review: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approuvée', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-800' },
      archived: { label: 'Archivée', color: 'bg-gray-100 text-gray-600' },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (editingAnnouncement) {
    return (
      <AnnouncementForm
        announcement={editingAnnouncement}
        onSuccess={() => {
          setEditingAnnouncement(null);
          onUpdate();
        }}
        onCancel={() => setEditingAnnouncement(null)}
      />
    );
  }

  if (selectedAnnouncement) {
    return (
      <AnnouncementDetail
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune annonce
        </h3>
        <p className="text-gray-600">
          {isOwnList
            ? 'Vous n\'avez pas encore créé d\'annonce.'
            : 'Aucune annonce disponible pour le moment.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {isOwnList ? 'Mes annonces' : 'Annonces disponibles'}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {announcements.map((announcement) => {
          const statusBadge = getStatusBadge(announcement.status);
          return (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-600">
                  {getTypeIcon(announcement.type)}
                  <span className="text-sm font-medium">
                    {getTypeLabel(announcement.type)}
                  </span>
                </div>
                {isOwnList && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                )}
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
                {isOwnList ? (
                  <>
                    <button
                      onClick={() => setEditingAnnouncement(announcement)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    {onContactClick && (
                      <button
                        onClick={() => onContactClick(announcement)}
                        className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <MessageCircle size={16} />
                      </button>
                    )}
                    {onFavoriteToggle && (
                      <button
                        onClick={() =>
                          onFavoriteToggle(
                            announcement.id,
                            !userFavorites.includes(announcement.id)
                          )
                        }
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          userFavorites.includes(announcement.id)
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Heart
                          size={16}
                          className={
                            userFavorites.includes(announcement.id) ? 'fill-current' : ''
                          }
                        />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
