import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Copy, Trash2, Mail, RotateCw, Key, Plus } from 'lucide-react';

interface Invitation {
  id: string;
  code: string;
  email?: string;
  used: boolean;
  used_by_id?: string;
  created_at: string;
  used_at?: string;
  expires_at: string;
}

export default function AdminPanel() {
  const { profile } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">Accès refusé. Seuls les administrateurs peuvent accéder à ce panneau.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('moderator_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'MOD-';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingCode(true);

    try {
      const code = generateCode();

      const { error } = await supabase.from('moderator_invitations').insert([
        {
          code,
          email: newEmail || null,
          created_by_id: profile?.id,
        },
      ]);

      if (error) throw error;

      setNewEmail('');
      fetchInvitations();
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert('Erreur lors de la création du code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette invitation?')) return;

    try {
      const { error } = await supabase
        .from('moderator_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.used) {
      return { label: 'Utilisé', color: 'bg-green-100 text-green-800' };
    }
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return { label: 'Expiré', color: 'bg-gray-100 text-gray-800' };
    }
    return { label: 'Actif', color: 'bg-blue-100 text-blue-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Panneau Administrateur</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Key size={20} />
          Créer une invitation modérateur
        </h3>
        <form onSubmit={handleCreateInvitation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (optionnel)
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="modérateur@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si vous spécifiez un email, seule cette personne pourra utiliser ce code
            </p>
          </div>

          <button
            type="submit"
            disabled={generatingCode}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {generatingCode ? 'Création...' : 'Générer un code'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail size={20} />
          Codes d'invitation
        </h3>

        {invitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune invitation créée
          </div>
        ) : (
          <div className="space-y-2">
            {invitations.map((invitation) => {
              const badge = getStatusBadge(invitation);
              const isExpired = new Date(invitation.expires_at) < new Date();

              return (
                <div
                  key={invitation.id}
                  className={`p-4 rounded-lg border ${
                    isExpired ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                  } hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="font-mono font-bold text-gray-900 text-sm bg-gray-100 px-3 py-1 rounded">
                          {invitation.code}
                        </code>
                        <button
                          onClick={() => handleCopyCode(invitation.code)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          title="Copier le code"
                        >
                          <Copy size={16} />
                        </button>
                        {copied === invitation.code && (
                          <span className="text-xs text-green-600 font-medium">Copié!</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>

                        {invitation.email && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {invitation.email}
                          </span>
                        )}

                        <span className="text-xs text-gray-500">
                          Créé: {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                        </span>

                        {invitation.used && invitation.used_at && (
                          <span className="text-xs text-green-600">
                            Utilisé: {new Date(invitation.used_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Expire: {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteInvitation(invitation.id)}
                      className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-900 mb-2 text-sm flex items-center gap-2">
          <RotateCw size={16} />
          Instructions
        </h3>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>Générez un code pour chaque modérateur</li>
          <li>Partagez le code via email ou message sécurisé</li>
          <li>Le modérateur l'utilise pour créer son compte</li>
          <li>Les codes expirent après 30 jours</li>
        </ul>
      </div>
    </div>
  );
}
