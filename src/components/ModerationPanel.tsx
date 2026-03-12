import { useEffect, useState } from 'react';
import { supabase, Announcement } from '../lib/supabase';
import { CheckCircle, XCircle, Eye, Archive, AlertCircle } from 'lucide-react';
import AnnouncementDetail from './AnnouncementDetail';

export default function ModerationPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [actionError, setActionError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [filter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setActionError('');
    try {
      let query = supabase.from('announcements').select('*');
      if (filter === 'pending') {
        query = query.eq('status', 'pending_review');
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err: any) {
      console.error('fetchAnnouncements:', err);
      setActionError('Impossible de charger les annonces : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, reason?: string) => {
    setProcessing(true);
    setActionError('');
    try {
      const updates: Record<string, string> = { status };
      if (reason) updates.rejected_reason = reason;

      const { error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Fermeture des modaux et refresh
      setSelectedAnnouncement(null);
      setShowRejectModal(null);
      setRejectReason('');
      await fetchAnnouncements();
    } catch (err: any) {
      console.error('updateStatus:', err);
      setActionError(
        err.code === '42501' || err?.status === 403
          ? 'Accès refusé — vérifiez que la migration SQL a bien été exécutée et que votre rôle est admin/modérateur.'
          : 'Erreur : ' + (err.message || JSON.stringify(err))
      );
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      draft:          { label: 'Brouillon',  color: 'bg-gray-100 text-gray-800' },
      pending_review: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      approved:       { label: 'Approuvée',  color: 'bg-green-100 text-green-800' },
      rejected:       { label: 'Rejetée',    color: 'bg-red-100 text-red-800' },
      archived:       { label: 'Archivée',   color: 'bg-gray-100 text-gray-600' },
    };
    return badges[status] || badges.draft;
  };

  // ── Modal rejet ────────────────────────────────────────────────
  if (showRejectModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Raison du rejet</h3>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Expliquez pourquoi cette annonce est rejetée..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-28"
          />
          {actionError && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm mt-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {actionError}
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button
              disabled={processing}
              onClick={() => updateStatus(showRejectModal, 'rejected', rejectReason)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
            >
              <XCircle size={18} />
              {processing ? 'En cours...' : 'Confirmer le rejet'}
            </button>
            <button
              onClick={() => { setShowRejectModal(null); setRejectReason(''); setActionError(''); }}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vue détail ─────────────────────────────────────────────────
  if (selectedAnnouncement) {
    return (
      <div>
        <AnnouncementDetail
          announcement={selectedAnnouncement}
          onClose={() => { setSelectedAnnouncement(null); setActionError(''); }}
        />

        {actionError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mt-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {actionError}
          </div>
        )}

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            disabled={processing}
            onClick={() => updateStatus(selectedAnnouncement.id, 'approved')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            <CheckCircle size={20} />
            {processing ? '...' : 'Approuver'}
          </button>
          <button
            disabled={processing}
            onClick={() => setShowRejectModal(selectedAnnouncement.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
          >
            <XCircle size={20} />
            Rejeter
          </button>
          <button
            disabled={processing}
            onClick={() => updateStatus(selectedAnnouncement.id, 'archived')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50"
          >
            <Archive size={20} />
            Archiver
          </button>
        </div>
      </div>
    );
  }

  // ── Liste principale ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Panneau de modération</h2>
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

      {actionError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Erreur de modération</p>
            <p className="mt-1">{actionError}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          {filter === 'pending'
            ? 'Aucune annonce en attente de modération.'
            : 'Aucune annonce trouvée.'}
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 truncate">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{announcement.description}</p>
                    {announcement.rejected_reason && (
                      <p className="text-xs text-red-600 mt-1 italic">
                        Raison du rejet : {announcement.rejected_reason}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color} whitespace-nowrap ml-4`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setActionError(''); setSelectedAnnouncement(announcement); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <Eye size={16} />
                    Examiner
                  </button>
                  {announcement.status === 'pending_review' && (
                    <>
                      <button
                        disabled={processing}
                        onClick={() => updateStatus(announcement.id, 'approved')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        Approuver
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => setShowRejectModal(announcement.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium disabled:opacity-50"
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
