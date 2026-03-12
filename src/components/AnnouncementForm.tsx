import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Announcement } from '../lib/supabase';
import {
  Save, X, Upload, Trash2, Home, Briefcase, Users,
  Wrench, Gift, ImageIcon, MapPin, Phone, Mail,
  Info, ChevronDown, ChevronUp, AlertCircle, Package,
} from 'lucide-react';

interface Props {
  announcement?: Announcement;
  onSuccess: () => void;
  onCancel?: () => void;
}

const AMENITIES_OPTIONS = [
  { value: 'parking',  label: '🚗 Parking'    },
  { value: 'balcony',  label: '🌿 Balcon'     },
  { value: 'elevator', label: '🛗 Ascenseur'  },
  { value: 'garden',   label: '🌳 Jardin'     },
  { value: 'cellar',   label: '📦 Cave'       },
  { value: 'digicode', label: '🔑 Digicode'   },
  { value: 'intercom', label: '📱 Interphone' },
  { value: 'fiber',    label: '🌐 Fibre'      },
];

const DONATION_CATEGORIES = [
  { value: 'clothes',     label: '👕 Vêtements'   },
  { value: 'books',       label: '📚 Livres / Cours' },
  { value: 'furniture',   label: '🪑 Meubles'     },
  { value: 'food',        label: '🍎 Alimentation' },
  { value: 'electronics', label: '💻 Électronique' },
  { value: 'sport',       label: '⚽ Sport'        },
  { value: 'decoration',  label: '🖼️ Déco'         },
  { value: 'other',       label: '📦 Autre'        },
];

const DONATION_CONDITIONS = [
  { value: 'new',  label: '✨ Neuf',             color: 'green'  },
  { value: 'good', label: '👍 Bon état',          color: 'blue'   },
  { value: 'used', label: '🔄 État correct',      color: 'orange' },
];

// Types visibles selon le rôle
const ALL_TYPES = [
  { v: 'housing',  label: 'Logement',     icon: Home,     roles: ['student','individual','moderator','admin'], desc: 'Proposer un logement à louer' },
  { v: 'roommate', label: 'Colocation',   icon: Users,    roles: ['student','individual','moderator','admin'], desc: 'Chercher ou proposer une coloc' },
  { v: 'job',      label: 'Job étudiant', icon: Briefcase,roles: ['individual','moderator','admin'],           desc: 'Offre d\'emploi étudiant' },
  { v: 'service',  label: 'Service',      icon: Wrench,   roles: ['student','individual','moderator','admin'], desc: 'Cours, aide, prestation...' },
  { v: 'donation', label: 'Don d\'objets',icon: Gift,     roles: ['student','moderator','admin'],              desc: 'Offrir gratuitement à d\'autres étudiants' },
];

export default function AnnouncementForm({ announcement, onSuccess, onCancel }: Props) {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableTypes = ALL_TYPES.filter((t) =>
    t.roles.includes(profile?.role || 'student')
  );

  // ── Base
  const [title,        setTitle]        = useState(announcement?.title        || '');
  const [description,  setDescription]  = useState(announcement?.description  || '');
  const [type,         setType]         = useState(announcement?.type         || availableTypes[0]?.v || 'housing');
  const [price,        setPrice]        = useState(announcement?.price?.toString()   || '');
  const [status,       setStatus]       = useState(announcement?.status       || 'pending_review');
  const [location,     setLocation]     = useState(announcement?.location     || '');
  const [contactEmail, setContactEmail] = useState(announcement?.contact_email || profile?.email || '');
  const [contactPhone, setContactPhone] = useState(announcement?.contact_phone || profile?.phone || '');

  // ── Logement
  const [address,       setAddress]       = useState(announcement?.address       || '');
  const [surface,       setSurface]       = useState(announcement?.surface?.toString()      || '');
  const [rooms,         setRooms]         = useState(announcement?.rooms?.toString()        || '');
  const [bedrooms,      setBedrooms]      = useState(announcement?.bedrooms?.toString()     || '');
  const [floor,         setFloor]         = useState(announcement?.floor?.toString()        || '');
  const [totalFloors,   setTotalFloors]   = useState(announcement?.total_floors?.toString() || '');
  const [furnished,     setFurnished]     = useState(announcement?.furnished     ?? false);
  const [availableFrom, setAvailableFrom] = useState(announcement?.available_from || '');
  const [deposit,       setDeposit]       = useState(announcement?.deposit?.toString()      || '');
  const [charges,       setCharges]       = useState(announcement?.charges?.toString()      || '');
  const [propertyType,  setPropertyType]  = useState(announcement?.property_type  || 'apartment');
  const [amenities,     setAmenities]     = useState<string[]>(announcement?.amenities || []);
  const [showHousing,   setShowHousing]   = useState(true);

  // ── Don d'objets
  const [donationCategory,  setDonationCategory]  = useState(announcement?.donation_category  || '');
  const [donationCondition, setDonationCondition] = useState(announcement?.donation_condition || 'good');
  const [donationPickup,    setDonationPickup]    = useState(announcement?.donation_pickup    ?? true);
  const [donationDelivery,  setDonationDelivery]  = useState(announcement?.donation_delivery  ?? false);

  // ── Photos
  const [images,         setImages]         = useState<string[]>(announcement?.images || []);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── État
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const isDonation = type === 'donation';
  const isHousing  = type === 'housing';

  // ── Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    if (images.length + files.length > 6) { setError('Maximum 6 photos autorisées.'); return; }
    setUploadingImage(true);
    setError('');
    try {
      const urls = await Promise.all(
        Array.from(files).map(async (file) => {
          const ext  = file.name.split('.').pop();
          const path = `${profile?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('announcement-images').upload(path, file, { upsert: false });
          if (upErr) throw upErr;
          return supabase.storage.from('announcement-images').getPublicUrl(path).data.publicUrl;
        })
      );
      setImages((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setError('Erreur upload : ' + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = async (url: string) => {
    const path = url.split('/announcement-images/')[1];
    if (path) await supabase.storage.from('announcement-images').remove([path]);
    setImages((prev) => prev.filter((u) => u !== url));
  };

  const toggleAmenity = (val: string) =>
    setAmenities((prev) => prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]);

  // ── Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data: Record<string, any> = {
        title, description, type, status,
        price:         isDonation ? null : (price ? parseFloat(price) : null),
        location:      location     || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        images,
        owner_id: profile?.id,
      };

      if (isHousing) {
        Object.assign(data, {
          address: address || null,
          surface: surface ? parseFloat(surface) : null,
          rooms:   rooms   ? parseInt(rooms)     : null,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          floor:   floor   ? parseInt(floor)     : null,
          total_floors: totalFloors ? parseInt(totalFloors) : null,
          furnished, available_from: availableFrom || null,
          deposit: deposit ? parseFloat(deposit) : null,
          charges: charges ? parseFloat(charges) : null,
          property_type: propertyType || null, amenities,
        });
      }

      if (isDonation) {
        Object.assign(data, {
          donation_category:  donationCategory  || null,
          donation_condition: donationCondition || null,
          donation_pickup:    donationPickup,
          donation_delivery:  donationDelivery,
        });
      }

      if (announcement) {
        const { error } = await supabase.from('announcements').update(data).eq('id', announcement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('announcements').insert([data]);
        if (error) throw error;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const currentType = ALL_TYPES.find((t) => t.v === type);
  const TypeIcon = currentType?.icon || Home;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">

      {/* ── En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDonation ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            <TypeIcon size={22} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {announcement ? "Modifier l'annonce" : 'Nouvelle annonce'}
          </h2>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X size={22} />
          </button>
        )}
      </div>

      {/* ── SECTION 1 : Type */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Type d'annonce</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableTypes.map(({ v, label, icon: Icon, desc }) => (
            <button key={v} type="button" onClick={() => setType(v)}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left ${
                type === v
                  ? v === 'donation'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Icon size={18} />
              <span className="font-semibold text-sm">{label}</span>
              <span className="text-[11px] opacity-60 leading-tight">{desc}</span>
            </button>
          ))}
        </div>

        {isDonation && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm">
            <Gift size={16} className="mt-0.5 shrink-0" />
            <p>Vous souhaitez offrir quelque chose gratuitement à d'autres étudiants ?
               Vêtements, livres, meubles, nourriture... tout ce qui peut être utile à la communauté !</p>
          </div>
        )}
      </section>

      {/* ── SECTION 2 : Informations générales */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Info size={15} /> Informations générales
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
            placeholder={
              isDonation
                ? "Ex: Lot de vêtements homme T.M — Livres de droit L1/L2"
                : "Ex: Studio meublé proche faculté"
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required
            placeholder={
              isDonation
                ? "Décrivez les objets : marque, taille, quantité, état, toute info utile..."
                : "Décrivez votre annonce en détail..."
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Localisation toujours visible */}
        <div className={`grid gap-4 ${!isDonation ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {!isDonation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isHousing ? 'Loyer mensuel (€)' : 'Prix (€)'}
                {!isHousing && <span className="text-gray-400 font-normal ml-1">— optionnel</span>}
              </label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00" step="0.01" min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><MapPin size={14} /> Localisation *</span>
            </label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required={isDonation}
              placeholder="Ville, quartier, campus..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="draft">Brouillon (non visible)</option>
            <option value="pending_review">Soumettre pour validation</option>
          </select>
        </div>
      </section>

      {/* ── SECTION 3 : Spécifique DON D'OBJETS */}
      {isDonation && (
        <section className="border-2 border-green-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-green-50">
            <h3 className="font-semibold text-green-800 flex items-center gap-2 text-sm">
              <Package size={16} /> Détails du don
            </h3>
          </div>
          <div className="p-5 space-y-5">

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DONATION_CATEGORIES.map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setDonationCategory(value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                      donationCategory === value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-green-300'
                    }`}
                  >
                    <span className="text-lg">{label.split(' ')[0]}</span>
                    <span>{label.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* État */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">État de l'objet</label>
              <div className="flex gap-3">
                {DONATION_CONDITIONS.map(({ value, label, color }) => (
                  <button key={value} type="button" onClick={() => setDonationCondition(value)}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      donationCondition === value
                        ? color === 'green'  ? 'border-green-500 bg-green-50 text-green-700'
                        : color === 'blue'   ? 'border-blue-500 bg-blue-50 text-blue-700'
                        :                     'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode de remise</label>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  donationPickup ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="checkbox" checked={donationPickup} onChange={(e) => setDonationPickup(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">🤝 Remise en main propre</p>
                    <p className="text-xs text-gray-400">Récupération sur place</p>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  donationDelivery ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="checkbox" checked={donationDelivery} onChange={(e) => setDonationDelivery(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">📦 Envoi possible</p>
                    <p className="text-xs text-gray-400">Frais à la charge du bénéficiaire</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 4 : Détails logement */}
      {isHousing && (
        <section className="border border-blue-100 rounded-xl overflow-hidden">
          <button type="button" onClick={() => setShowHousing(!showHousing)}
            className="w-full flex items-center justify-between px-5 py-4 bg-blue-50 text-blue-800 font-semibold text-sm">
            <span className="flex items-center gap-2"><Home size={16} /> Détails du logement</span>
            {showHousing ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showHousing && (
            <div className="p-5 space-y-5">
              {/* Type de bien */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de bien</label>
                <div className="flex flex-wrap gap-2">
                  {[{v:'studio',l:'Studio'},{v:'apartment',l:'Appartement'},{v:'house',l:'Maison'},{v:'room',l:'Chambre'},{v:'other',l:'Autre'}].map(({v,l})=>(
                    <button key={v} type="button" onClick={() => setPropertyType(v)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${propertyType===v?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>{l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Numéro, rue, code postal, ville"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {l:'Surface (m²)',v:surface,s:setSurface,p:'25'},
                  {l:'Nb pièces',v:rooms,s:setRooms,p:'2'},
                  {l:'Chambres',v:bedrooms,s:setBedrooms,p:'1'},
                ].map(({l,v,s,p})=>(
                  <div key={l}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                    <input type="number" value={v} onChange={(e)=>s(e.target.value)} min="0" placeholder={p}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Étage / Total</label>
                  <div className="flex gap-1">
                    <input type="number" value={floor} onChange={(e)=>setFloor(e.target.value)} min="0" placeholder="2"
                      className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                    <input type="number" value={totalFloors} onChange={(e)=>setTotalFloors(e.target.value)} min="0" placeholder="5"
                      className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{l:'Charges (€/mois)',v:charges,s:setCharges,p:'50'},{l:'Caution (€)',v:deposit,s:setDeposit,p:'1000'}].map(({l,v,s,p})=>(
                  <div key={l}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                    <input type="number" value={v} onChange={(e)=>s(e.target.value)} min="0" placeholder={p}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Disponible le</label>
                  <input type="date" value={availableFrom} onChange={(e)=>setAvailableFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-fit">
                <input type="checkbox" checked={furnished} onChange={(e)=>setFurnished(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Logement meublé</span>
              </label>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Équipements</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AMENITIES_OPTIONS.map(({value,label})=>(
                    <label key={value} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all ${amenities.includes(value)?'bg-blue-50 border-blue-300 text-blue-700 font-medium':'border-gray-200 text-gray-600'}`}>
                      <input type="checkbox" checked={amenities.includes(value)} onChange={()=>toggleAmenity(value)} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── SECTION 5 : Photos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <ImageIcon size={15} /> Photos <span className="font-normal normal-case text-gray-400">({images.length}/6)</span>
        </h3>
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={url} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => removeImage(url)} className="p-1.5 bg-red-500 text-white rounded-full">
                    <Trash2 size={14} />
                  </button>
                </div>
                {i === 0 && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Principal</span>}
              </div>
            ))}
          </div>
        )}
        {images.length < 6 && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="sr-only" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
              className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50">
              {uploadingImage
                ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />Envoi...</>
                : <><Upload size={18} />Ajouter des photos</>}
            </button>
            <p className="text-xs text-gray-400 text-center">JPG, PNG, WEBP · max 6 · la 1ère est la photo principale</p>
          </>
        )}
      </section>

      {/* ── SECTION 6 : Contact */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Phone size={15} /> Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Mail size={12} /> Email</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Phone size={12} /> Téléphone</label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+33 6 00 00 00 00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <button type="submit" disabled={loading || uploadingImage}
        className={`w-full font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-white ${
          isDonation ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}>
        <Save size={20} />
        {loading ? 'Enregistrement...' : announcement ? 'Mettre à jour' : "Publier l'annonce"}
      </button>
    </form>
  );
}