import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Star, Calendar } from 'lucide-react';

export default function ProfilePanel() {
  const { profile } = useAuth();

  if (!profile) return null;

  const getRoleLabel = (role: string) => {
    const labels = {
      student: 'Étudiant',
      individual: 'Particulier',
      moderator: 'Modérateur',
      admin: 'Administrateur',
    };
    return labels[role as keyof typeof labels] || role;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h2>

      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{profile.email}</h3>
            <p className="text-blue-100">{getRoleLabel(profile.role)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <Mail className="text-gray-400" size={20} />
          <div className="flex-1">
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{profile.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <Shield className="text-gray-400" size={20} />
          <div className="flex-1">
            <p className="text-sm text-gray-500">Rôle</p>
            <p className="font-medium text-gray-900">{getRoleLabel(profile.role)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <Star className="text-gray-400" size={20} />
          <div className="flex-1">
            <p className="text-sm text-gray-500">Niveau de confiance</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(profile.trust_level * 10, 100)}%` }}
                />
              </div>
              <span className="font-medium text-gray-900">{profile.trust_level}/10</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="text-gray-400" size={20} />
          <div className="flex-1">
            <p className="text-sm text-gray-500">Membre depuis</p>
            <p className="font-medium text-gray-900">{formatDate(profile.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          À propos du niveau de confiance
        </h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          Votre niveau de confiance augmente progressivement en fonction de votre activité
          sur la plateforme. Un niveau élevé vous donnera accès à plus de fonctionnalités
          et renforcera la confiance des autres utilisateurs.
        </p>
      </div>
    </div>
  );
}
