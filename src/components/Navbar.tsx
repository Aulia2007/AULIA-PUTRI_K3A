import { Ship, Anchor, Compass, Package, MapPin, Database, LogOut, RefreshCw, LayoutDashboard } from 'lucide-react';
import { AppUser } from '../types/shipping';

export type NavTab = 'dashboard' | 'vessels' | 'voyages' | 'cargo' | 'ports';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
  totalVesselsCount: number;
}

export default function Navbar({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onSeedData,
  isSeeding,
  totalVesselsCount
}: Props) {
  const navItems: { id: NavTab; label: string; icon: any; count?: number }[] = [
    { id: 'dashboard', label: 'Ringkasan Eksekutif', icon: LayoutDashboard },
    { id: 'vessels', label: 'Armada Kapal', icon: Ship, count: totalVesselsCount },
    { id: 'voyages', label: 'Jadwal Pelayaran', icon: Compass },
    { id: 'cargo', label: 'Manifes Kargo', icon: Package },
    { id: 'ports', label: 'Pelabuhan & Dermaga', icon: MapPin },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top tier: Brand, Firebase real status, and User Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  SAMUDERA NUSANTARA
                </span>
                <span className="hidden md:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  SHIPPING LINES
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistem Manajemen Terpadu Operasional Armada Niaga & Kargo
              </p>
            </div>
          </div>

          {/* Right actions: Real Database Indicator + Seed Button + User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Live Firestore Production indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firebase Firestore: Live Terhubung</span>
            </div>

            {/* Seed Default Data button */}
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              title="Perbarui / Muat Ulang Contoh Data Armada & Kargo ke Firebase"
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSeeding ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sinkronisasi Data Awal</span>
            </button>

            {/* User Profile info & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.avatarInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[11px] text-blue-700 font-medium">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Keluar dari sistem"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Bottom tier: Clean navigation tabs */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
