import { LucideIcon } from 'lucide-react';

export interface NavItem {
  view: string;
  icon: LucideIcon;
  label: string;
  badge?: number; // ex: nb d'annonces en attente
}

interface NavBarProps {
  items: NavItem[];
  currentView: string;
  onNavigate: (view: string) => void;
  accentColor?: string; // classe Tailwind ex: 'bg-blue-600'
}

export default function NavBar({
  items,
  currentView,
  onNavigate,
  accentColor = 'bg-blue-600',
}: NavBarProps) {
  return (
    <nav className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
      {items.map(({ view, icon: Icon, label, badge }) => {
        const active = currentView === view;
        return (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
              active
                ? `${accentColor} text-white shadow-sm`
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Icon size={16} />
            {label}
            {/* Badge de notification */}
            {badge !== undefined && badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
