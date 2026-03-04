import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Star, TrendingUp, Award, CheckCircle } from 'lucide-react';

interface TrustEvent {
  id: string;
  event_type: string;
  points: number;
  created_at: string;
}

export default function TrustSystemPanel() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<TrustEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchTrustEvents();
    }
  }, [profile]);

  const fetchTrustEvents = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trust_events')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching trust events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventLabel = (type: string) => {
    const labels = {
      announcement_published: 'Annonce publiée',
      message_received: 'Message reçu',
      profile_completed: 'Profil complété',
      announcement_approved: 'Annonce approuvée',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTrustTier = (level: number) => {
    if (level >= 9) return { tier: 'Légendaire', color: 'from-yellow-400 to-yellow-600' };
    if (level >= 7) return { tier: 'Platinum', color: 'from-gray-300 to-gray-500' };
    if (level >= 5) return { tier: 'Or', color: 'from-yellow-500 to-yellow-700' };
    if (level >= 3) return { tier: 'Argent', color: 'from-gray-400 to-gray-600' };
    return { tier: 'Bronze', color: 'from-orange-600 to-orange-800' };
  };

  const tier = getTrustTier(profile?.trust_level || 0);
  const totalPoints = events.reduce((sum, event) => sum + event.points, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Système de confiance</h2>

      <div className={`bg-gradient-to-br ${tier.color} rounded-xl p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Votre niveau</h3>
            <p className="text-4xl font-bold">{tier.tier}</p>
          </div>
          <Award size={48} className="opacity-80" />
        </div>

        <div className="bg-white/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Points de confiance</span>
            <span className="text-lg font-bold">{totalPoints}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${Math.min(totalPoints / 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
          <Star className="mx-auto text-blue-600 mb-2" size={24} />
          <p className="text-sm text-gray-600">Niveau</p>
          <p className="text-2xl font-bold text-blue-600">{profile?.trust_level || 0}/10</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
          <TrendingUp className="mx-auto text-green-600 mb-2" size={24} />
          <p className="text-sm text-gray-600">Points</p>
          <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
          <CheckCircle className="mx-auto text-purple-600 mb-2" size={24} />
          <p className="text-sm text-gray-600">Événements</p>
          <p className="text-2xl font-bold text-purple-600">{events.length}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Comment gagner de la confiance</h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">5</span>
            <span>Lorsqu\'une de vos annonces est approuvée</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
            <span>Chaque message envoyé dans une conversation</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">10</span>
            <span>Lorsque vous complétez votre profil</span>
          </li>
        </ul>
      </div>

      {events.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Historique des événements</h3>
          <div className="space-y-2">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getEventLabel(event.event_type)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                  +{event.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
