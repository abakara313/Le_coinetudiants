import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Announcement } from '../lib/supabase';
import {
  X, ChevronLeft, ChevronRight, MapPin, Phone, Mail,
  Calendar, Home, Layers, BedDouble, ArrowUp,
  CheckCircle, Sofa, Heart, Euro, Target,
  User, Clock, ChevronDown, ChevronUp, Send, AlertCircle, Zap,
} from 'lucide-react';

interface Props {
  announcement: Announcement;
  onClose: () => void;
}

const AMENITY_LABELS: Record<string, string> = {
  parking: '🚗 Parking', balcony: '🌿 Balcon', elevator: '🛗 Ascenseur',
  garden: '🌳 Jardin',   cellar: '📦 Cave',    digicode: '🔑 Digicode',
  intercom: '📱 Interphone', fiber: '🌐 Fibre',
};

const PROPERTY_LABELS: Record<string, string> = {
  studio: 'Studio', apartment: 'Appartement', house: 'Maison', room: 'Chambre', other: 'Autre',
};

export default function AnnouncementDetail({ announcement, onClose }: Props) {
  const { profile } = useAuth();
  const [photoIndex,        setPhotoIndex]        = useState(0);
  const [donations,         setDonations]         = useState<Donation[]>([]);
  const [totalDonated,      setTotalDonated]      = useState(0);
  const [showDonateForm,    setShowDonateForm]    = useState(false);
  const [donationAmount,    setDonationAmount]    = useState('');
  const [donationMessage,   setDonationMessage]   = useState('');
  const [donationAnonymous, setDonationAnonymous] = useState(false);
  const [donating,          setDonating]          = useState(false);
  const [donateSuccess,     setDonateSuccess]     = useState(false);
  const [donateError,       setDonateError]       = useState('');
  const [showAllDonations,  setShowAllDonations]  = useState(false);

  const images     = announcement.images?.length ? announcement.images : [];
  const isDonation = announcement.type === 'donation';
  const isOwner    = profile?.id === announcement.owner_id;

  useEffect(() => {
    if (isDonation) fetchDonations();
    // Incrémenter les vues
    supabase.from('announcements')
      .update({ views: (announcement.views || 0) + 1 })
      .eq('id', announcement.id);
  }, []);

  const fetchDonations = async () => {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('announcement_id', announcement.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    const list = data || [];
    setDonations(list);
    setTotalDonated(list.reduce((s, d) => s + d.amount, 0));
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setDonating(true);
    setDonateError('');
    try {
      const { error } = await supabase.from('donations').insert([{
        announcement_id: announcement.id,
        donor_id:        donationAnonymous ? null : profile.id,
        amount:          parseFloat(donationAmount),
        message:         donationMessage || null,
        anonymous:       donationAnonymous,
        status:          'completed',
      }]);
      if (error) throw error;
      setDonateSuccess(true);
      setShowDonateForm(false);
      fetchDonations();
    } catch (err: any) {
      setDonateError(err.message);
    } finally {
      setDonating(false);
    }
  };

  const progressPercent = announcement.donation_goal && totalDonated
    ? Math.min(100, (totalDonated / announcement.donation_goal) * 100)
    : null;

  const visibleDonations = showAllDonations ? donations : donations.slice(0, 3);

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isDonation && (
              <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <Heart size={12} /> Demande de don
              </span>
            )}
            {isDonation && announcement.donation_urgent && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <Zap size={12} /> Urgent
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">{announcement.title}</h2>
          {announcement.location && (
            <p className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
              <MapPin size={14} /> {announcement.location}
            </p>
          )}
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg shrink-0">
          <X size={20} />
        </button>
      </div>

      {/* ── Galerie photos ─────────────────────────────────────── */}
      {images.length > 0 && (
        <div className="rounded-xl overflow-hidden bg-gray-100">
          <div className="relative aspect-video">
            <img src={images[photoIndex]} alt={`Photo ${photoIndex + 1}`} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <button onClick={() => setPhotoIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setPhotoIndex((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70">
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === photoIndex ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-2 bg-gray-50 overflow-x-auto">
              {images.map((url, i) => (
                <button key={url} onClick={() => setPhotoIndex(i)}
                  className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                    i === photoIndex ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Prix (hors donation) ───────────────────────────────── */}
      {!isDonation && (
        <div className="flex flex-wrap gap-3 items-center">
          {announcement.price && (
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-lg">
              {announcement.price.toLocaleString('fr-FR')} €
              {announcement.type === 'housing' && <span className="text-blue-200 font-normal text-sm">/mois</span>}
            </div>
          )}
          {announcement.charges && (
            <span className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm">+ {announcement.charges} € charges</span>
          )}
          {announcement.deposit && (
            <span className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm">Caution : {announcement.deposit.toLocaleString('fr-FR')} €</span>
          )}
          {announcement.type === 'housing' && (
            <span className={`px-3 py-2 rounded-xl text-sm font-medium ${announcement.furnished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              <Sofa size={14} className="inline mr-1" />{announcement.furnished ? 'Meublé' : 'Non meublé'}
            </span>
          )}
        </div>
      )}

      {/* ── Détails logement ───────────────────────────────────── */}
      {announcement.type === 'housing' && (
        <div className="bg-blue-50 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <Home size={16} /> Détails du bien
            {announcement.property_type && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">
                {PROPERTY_LABELS[announcement.property_type]}
              </span>
            )}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {announcement.surface && (
              <div className="bg-white rounded-lg p-3 text-center">
                <Layers size={18} className="mx-auto text-blue-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{announcement.surface} m²</p>
                <p className="text-xs text-gray-500">Surface</p>
              </div>
            )}
            {announcement.rooms && (
              <div className="bg-white rounded-lg p-3 text-center">
                <Home size={18} className="mx-auto text-blue-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{announcement.rooms}</p>
                <p className="text-xs text-gray-500">Pièces</p>
              </div>
            )}
            {announcement.bedrooms && (
              <div className="bg-white rounded-lg p-3 text-center">
                <BedDouble size={18} className="mx-auto text-blue-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{announcement.bedrooms}</p>
                <p className="text-xs text-gray-500">Chambres</p>
              </div>
            )}
            {announcement.floor != null && (
              <div className="bg-white rounded-lg p-3 text-center">
                <ArrowUp size={18} className="mx-auto text-blue-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">
                  {announcement.floor === 0 ? 'RDC' : `${announcement.floor}e`}
                  {announcement.total_floors ? `/${announcement.total_floors}` : ''}
                </p>
                <p className="text-xs text-gray-500">Étage</p>
              </div>
            )}
          </div>
          {announcement.address && (
            <p className="flex items-start gap-1.5 text-sm text-gray-600">
              <MapPin size={14} className="mt-0.5 shrink-0 text-blue-400" /> {announcement.address}
            </p>
          )}
          {announcement.available_from && (
            <p className="flex items-center gap-1.5 text-sm text-gray-600">
              <Calendar size={14} className="text-blue-400" />
              Disponible à partir du <strong className="ml-1">{new Date(announcement.available_from).toLocaleDateString('fr-FR')}</strong>
            </p>
          )}
          {announcement.amenities?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Équipements</p>
              <div className="flex flex-wrap gap-2">
                {announcement.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1 bg-white text-gray-700 px-2.5 py-1 rounded-full text-xs border border-gray-200">
                    <CheckCircle size={11} className="text-green-500" />
                    {AMENITY_LABELS[a] || a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Description ────────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">
          {isDonation ? 'Ma situation' : 'Description'}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{announcement.description}</p>
        {isDonation && announcement.donation_urgent && (
          <div className="mt-3 p-3 bg-pink-50 border border-pink-100 rounded-lg text-sm text-pink-700 italic">
            "{announcement.donation_urgent}"
          </div>
        )}
      </div>

      {/* ── Contact (hors donation) ────────────────────────────── */}
      {!isDonation && (announcement.contact_email || announcement.contact_phone) && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Contact</h3>
          {announcement.contact_email && (
            <a href={`mailto:${announcement.contact_email}`} className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
              <Mail size={15} /> {announcement.contact_email}
            </a>
          )}
          {announcement.contact_phone && (
            <a href={`tel:${announcement.contact_phone}`} className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
              <Phone size={15} /> {announcement.contact_phone}
            </a>
          )}
        </div>
      )}

      {/* ── WIDGET DONS (type=donation uniquement) ─────────────── */}
      {isDonation && (
        <div className="border-2 border-pink-200 rounded-xl overflow-hidden">

          {/* En-tête avec progression */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-pink-800 flex items-center gap-2">
                <Heart size={18} className="text-pink-500" />
                {isOwner ? 'Dons reçus' : 'Soutenir cet étudiant'}
              </h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-pink-700">{totalDonated.toLocaleString('fr-FR')} €</p>
                {announcement.donation_goal && (
                  <p className="text-xs text-pink-500">sur {announcement.donation_goal} € visés</p>
                )}
              </div>
            </div>

            {progressPercent !== null && (
              <div>
                <div className="h-3 bg-pink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-pink-500 mt-1">
                  <span>{Math.round(progressPercent)}% atteint · {donations.length} donateur{donations.length > 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1"><Target size={11} /> {announcement.donation_goal} €</span>
                </div>
              </div>
            )}

            {!announcement.donation_goal && donations.length > 0 && (
              <p className="text-xs text-pink-500">{donations.length} donateur{donations.length > 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Succès */}
          {donateSuccess && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-3 text-sm font-medium">
              <CheckCircle size={16} /> Merci pour votre soutien ! 🎉
            </div>
          )}

          {/* Bouton / Formulaire de don — masqué pour le propriétaire */}
          {!isOwner && !donateSuccess && (
            <div className="px-5 py-4">
              {!showDonateForm ? (
                <button onClick={() => setShowDonateForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-colors">
                  <Heart size={18} /> Faire un don
                </button>
              ) : (
                <form onSubmit={handleDonate} className="space-y-4">
                  {/* Montants rapides */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Choisir un montant</label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {[5, 10, 20, 50].map((v) => (
                        <button key={v} type="button" onClick={() => setDonationAmount(v.toString())}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                            donationAmount === v.toString()
                              ? 'bg-pink-600 text-white border-pink-600'
                              : 'border-gray-200 text-gray-600 hover:border-pink-300'
                          }`}
                        >
                          {v} €
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="number" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)}
                        min="1" step="0.50" placeholder="Autre montant (€)"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                        required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Message (optionnel)</label>
                    <textarea value={donationMessage} onChange={(e) => setDonationMessage(e.target.value)}
                      rows={2} placeholder="Un mot d'encouragement..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm resize-none" />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={donationAnonymous} onChange={(e) => setDonationAnonymous(e.target.checked)}
                      className="w-4 h-4 text-pink-600 rounded" />
                    Rester anonyme
                  </label>

                  {donateError && (
                    <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded-lg">
                      <AlertCircle size={13} /> {donateError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="submit" disabled={donating}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 disabled:opacity-50">
                      <Send size={16} />
                      {donating ? 'Envoi...' : 'Confirmer'}
                    </button>
                    <button type="button" onClick={() => setShowDonateForm(false)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium">
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Liste des dons */}
          {donations.length > 0 && (
            <div className="border-t border-pink-100 px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Derniers soutiens
              </p>
              <div className="space-y-2">
                {visibleDonations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 text-gray-600 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                        <User size={13} className="text-pink-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700">{d.anonymous ? 'Anonyme' : 'Donateur'}</p>
                        {d.message && (
                          <p className="text-xs text-gray-400 italic truncate">"{d.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-bold text-pink-700">{d.amount} €</span>
                      <span className="text-xs text-gray-400">
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {donations.length > 3 && (
                <button onClick={() => setShowAllDonations(!showAllDonations)}
                  className="flex items-center gap-1 text-xs text-pink-600 mt-3 hover:underline">
                  {showAllDonations
                    ? <><ChevronUp size={12} />Voir moins</>
                    : <><ChevronDown size={12} />Voir les {donations.length} dons</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Métadonnées */}
      <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Clock size={11} /> {new Date(announcement.created_at).toLocaleDateString('fr-FR')}
        </span>
        <span>{announcement.views || 0} vue{announcement.views !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}