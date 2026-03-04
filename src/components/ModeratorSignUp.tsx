import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, Key, LogIn, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function ModeratorSignUp({ onBack }: Props) {
  const [step, setStep] = useState<'code' | 'signup'>('code');
  const [invitationCode, setInvitationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validCode, setValidCode] = useState(false);
  const { signUp } = useAuth();

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('moderator_invitations')
        .select('*')
        .eq('code', invitationCode.trim())
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (queryError) throw queryError;

      if (!data) {
        setError('Code invalide ou expiré');
        return;
      }

      setValidCode(true);
      if (data.email) {
        setEmail(data.email);
      }
      setStep('signup');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification du code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, 'student');

      const { data: userData } = await supabase.auth.getUser();

      if (userData.user) {
        await supabase
          .from('profiles')
          .update({ role: 'moderator' })
          .eq('id', userData.user.id);

        await supabase
          .from('moderator_invitations')
          .update({
            used: true,
            used_by_id: userData.user.id,
            used_at: new Date().toISOString(),
          })
          .eq('code', invitationCode.trim());
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="text-purple-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Inscription Modérateur
          </h1>
          <p className="text-gray-600 text-sm">
            {step === 'code'
              ? 'Entrez votre code d\'invitation'
              : 'Créez votre compte modérateur'}
          </p>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code d'invitation
              </label>
              <input
                type="text"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                placeholder="EX: MOD-ABC123XYZ"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-center tracking-widest"
                required
                disabled={validCode}
              />
              <p className="text-xs text-gray-500 mt-2">
                Vous avez reçu ce code par email de la part d'un administrateur
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || validCode}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Key size={20} />
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              Retour
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={!!invitationCode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Shield size={20} />
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('code');
                setValidCode(false);
                setError('');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              Utiliser un autre code
            </button>
          </form>
        )}

        <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2 text-sm">
            Vous n'avez pas de code?
          </h3>
          <p className="text-xs text-purple-800 mb-3">
            Contactez un administrateur pour obtenir un code d'invitation exclusif.
          </p>
          <button
            onClick={onBack}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
