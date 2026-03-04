import { Announcement } from '../lib/supabase';
import { X, Building, Users, Briefcase, Package, Calendar } from 'lucide-react';

interface Props {
  announcement: Announcement;
  onClose: () => void;
}

export default function AnnouncementDetail({ announcement, onClose }: Props) {
  const getTypeIcon = (type: string) => {
    const icons = {
      housing: <Building size={24} />,
      roommate: <Users size={24} />,
      job: <Briefcase size={24} />,
      service: <Package size={24} />,
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3 text-blue-600">
          {getTypeIcon(announcement.type)}
          <span className="text-lg font-medium">
            {getTypeLabel(announcement.type)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {announcement.title}
      </h1>

      {announcement.price && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-600 font-medium mb-1">Prix</p>
          <p className="text-3xl font-bold text-blue-700">
            {announcement.price} €
          </p>
        </div>
      )}

      <div className="prose max-w-none mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {announcement.description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 pt-6 border-t border-gray-200">
        <Calendar size={16} />
        <span>Publié le {formatDate(announcement.created_at)}</span>
      </div>
    </div>
  );
}
