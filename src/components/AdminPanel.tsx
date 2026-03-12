import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, UserCheck, UserX, RefreshCw, AlertCircle } from 'lucide-react';

interface ProfileRow {
  id: string;
  email: string;
  role: string;
  phone: string | null;
  account_status: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: 'student',   label: 'Étudiant' },
  { value: 'individual', label: 'Particulier' },
  { value: 'moderator', label: 'Modérateur' },
  { value: 'admin',     label: 'Admin' },
];

const ROLE_COLORS: Record<string, string> = {
  admin:      'bg-red-100 text-red-800',
  moderator:  'bg-purple-100 text-purple-800',
  student:    'bg-blue-100 text-blue-800',
  individual: 'bg-green-100 text-green-800',
};

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending:   'bg-yellow-100 text-yellow-700',
};

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, phone, account_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Impossible de charger les profils : ' + error.message);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const updateField = async (userId: string, updates: Record<string, string>) => {
    setSaving(userId);
    setError('');
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      setError(
        error.code === '42501'
          ? 'Accès refusé — la migration SQL n\'a pas été appliquée correctement.'
          : 'Erreur : ' + error.message
      );
    } else {
      await fetchProfiles();
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-red-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panneau Admin</h2>
            <p className="text-sm text-gray-500">Gestion des utilisateurs et des rôles</p>
          </div>
        </div>
        <button
          onClick={fetchProfiles}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Téléphone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Rôle actuel</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  {/* Email */}
                  <td className="px-4 py-3 text-gray-900 font-medium">{p.email}</td>

                  {/* Téléphone */}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.phone || <span className="italic">—</span>}
                  </td>

                  {/* Rôle */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[p.role] || 'bg-gray-100 text-gray-800'}`}>
                      {ROLE_OPTIONS.find((r) => r.value === p.role)?.label || p.role}
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.account_status] || 'bg-gray-100'}`}>
                      {p.account_status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap items-center">
                      {/* Changer le rôle */}
                      <select
                        value={p.role}
                        disabled={saving === p.id}
                        onChange={(e) => updateField(p.id, { role: e.target.value })}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>

                      {/* Suspendre / Réactiver */}
                      {p.account_status === 'active' ? (
                        <button
                          disabled={saving === p.id}
                          onClick={() => updateField(p.id, { account_status: 'suspended' })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                        >
                          <UserX size={14} />
                          Suspendre
                        </button>
                      ) : (
                        <button
                          disabled={saving === p.id}
                          onClick={() => updateField(p.id, { account_status: 'active' })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium disabled:opacity-50"
                        >
                          <UserCheck size={14} />
                          Réactiver
                        </button>
                      )}

                      {saving === p.id && (
                        <span className="text-xs text-gray-400 italic animate-pulse">Sauvegarde...</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        {profiles.length} utilisateur{profiles.length > 1 ? 's' : ''} enregistré{profiles.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
