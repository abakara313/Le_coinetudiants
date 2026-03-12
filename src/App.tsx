import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import AppHeader from './components/AppHeader';
import StudentLayout    from './components/navigation/StudentLayout';
import IndividualLayout from './components/navigation/IndividualLayout';
import ModeratorLayout  from './components/navigation/ModeratorLayout';
import AdminLayout      from './components/navigation/AdminLayout';

// Chaque rôle → son propre layout avec sa propre navigation
const LAYOUTS: Record<string, React.ComponentType> = {
  student:    StudentLayout,
  individual: IndividualLayout,
  moderator:  ModeratorLayout,
  admin:      AdminLayout,
};

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return <Auth />;

  // Sélection du layout selon le rôle du profil connecté
  const Layout = LAYOUTS[profile?.role || 'student'] ?? StudentLayout;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header partagé : logo + badge rôle + déconnexion */}
      <AppHeader
        onHomeClick={() => window.dispatchEvent(new CustomEvent('go-home'))}
      />

      {/* Layout spécifique au rôle — gère sa propre nav et ses vues */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Layout />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;