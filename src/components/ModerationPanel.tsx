import { useEffect, useState } from 'react';
import { supabase, Announcement } from '../lib/supabase';
import { CheckCircle, XCircle, Eye, Archive } from 'lucide-react';
import AnnouncementDetail from './AnnouncementDetail';

export default function ModerationPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    fetchAnnouncements();
  }, [filter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      let query = supabase.from('announcements').select('*');

      if (filter === 'pending') {
        query = query.eq('status', 'pending_review');
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

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour');
    }
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

  if (selectedAnnouncement) {
    return (
      <div>
        <AnnouncementDetail
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              updateStatus(selectedAnnouncement.id, 'approved');
              setSelectedAnnouncement(null);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <CheckCircle size={20} />
            Approuver
          </button>
          <button
            onClick={() => {
              updateStatus(selectedAnnouncement.id, 'rejected');
              setSelectedAnnouncement(null);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <XCircle size={20} />
            Rejeter
          </button>
          <button
            onClick={() => {
              updateStatus(selectedAnnouncement.id, 'archived');
              setSelectedAnnouncement(null);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <Archive size={20} />
            Archiver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Panneau de modération
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {filter === 'pending'
              ? 'Aucune annonce en attente de modération.'
              : 'Aucune annonce trouvée.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const statusBadge = getStatusBadge(announcement.status);
            return (
              <div
                key={announcement.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {announcement.description}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color} whitespace-nowrap ml-4`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    Examiner
                  </button>
                  {announcement.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => updateStatus(announcement.id, 'approved')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        <CheckCircle size={16} />
                        Approuver
                      </button>
                      <button
                        onClick={() => updateStatus(announcement.id, 'rejected')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        <XCircle size={16} />
                        Rejeter
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
