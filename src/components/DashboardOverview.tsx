import { 
  Ship, Compass, Package, MapPin, ArrowUpRight, 
  Activity, CheckCircle2, TrendingUp, ShieldCheck, Database, Anchor
} from 'lucide-react';
import { Vessel, Voyage, CargoManifest, Port, AppUser } from '../types/shipping';
import { NavTab } from './Navbar';

interface Props {
  vessels: Vessel[];
  voyages: Voyage[];
  cargoList: CargoManifest[];
  ports: Port[];
  currentUser: AppUser | null;
  onNavigate: (tab: NavTab) => void;
}

export default function DashboardOverview({
  vessels,
  voyages,
  cargoList,
  ports,
  currentUser,
  onNavigate
}: Props) {
  // Computed metrics
  const totalDWT = vessels.reduce((sum, v) => sum + (v.dwt || 0), 0);
  const sailingVessels = vessels.filter(v => v.status === 'Berlayar').length;
  const dockedVessels = vessels.filter(v => v.status === 'Sandar').length;
  const maintenanceVessels = vessels.filter(v => v.status === 'Perawatan').length;

  const activeVoyages = voyages.filter(v => v.status === 'Dalam Pelayaran');
  const scheduledVoyages = voyages.filter(v => v.status === 'Dijadwalkan');

  const totalCargoWeight = cargoList.reduce((sum, c) => sum + (c.weightTons || 0), 0);
  const totalContainers = cargoList.reduce((sum, c) => sum + (c.quantityUnits || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-200 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/20">
              <Ship className="w-3.5 h-3.5" />
              <span>Pusat Kendali Operasi Maritim</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Bertugas, {currentUser?.displayName || 'Petugas Operasional'}
            </h1>
            <p className="text-sky-100/90 text-sm mt-1 max-w-2xl">
              Memantau posisi armada kapal niaga, progres voyage pelayaran, manifes kargo peti kemas, dan kelaiklautan secara live melalui Firebase Firestore.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 self-start md:self-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-xs">
              <span className="block font-bold text-white">Database Firestore</span>
              <span className="text-sky-200 text-[11px]">Real-time Live Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Armada */}
        <div 
          onClick={() => onNavigate('vessels')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Armada Kapal</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Ship className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {vessels.length} <span className="text-sm font-semibold text-slate-500">Kapal</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-2 font-medium">
              <span className="text-emerald-700 font-bold">{sailingVessels} Berlayar</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-blue-700 font-bold">{dockedVessels} Sandar</span>
              {maintenanceVessels > 0 && (
                <>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-amber-700 font-bold">{maintenanceVessels} Docking</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kapasitas Total:</span>
            <span className="font-bold text-slate-800">{totalDWT.toLocaleString('id-ID')} DWT</span>
          </div>
        </div>

        {/* Card 2: Pelayaran Aktif */}
        <div 
          onClick={() => onNavigate('voyages')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pelayaran & Rute</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeVoyages.length} <span className="text-sm font-semibold text-slate-500">Di Laut</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-2 font-medium">
              <span className="text-blue-700 font-bold">{scheduledVoyages.length} Dijadwalkan</span>
              <span className="text-slate-300">&bull;</span>
              <span>{voyages.length} Total Voyage</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kelola Jadwal:</span>
            <span className="font-bold text-blue-600 flex items-center gap-0.5">
              Buka Jadwal <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Manifes Kargo */}
        <div 
          onClick={() => onNavigate('cargo')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kargo & B/L</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalCargoWeight.toLocaleString('id-ID', { maximumFractionDigits: 0 })}{' '}
              <span className="text-sm font-semibold text-slate-500">Ton</span>
            </div>
            <div className="text-xs text-slate-600 mt-2 font-medium">
              <span className="text-indigo-700 font-bold">{totalContainers} Unit Kontainer</span>{' '}
              terdaftar di manifes
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Manifes:</span>
            <span className="font-bold text-slate-800">{cargoList.length} Dokumen B/L</span>
          </div>
        </div>

        {/* Card 4: Pelabuhan & Dermaga */}
        <div 
          onClick={() => onNavigate('ports')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pelabuhan Jaringan</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {ports.length} <span className="text-sm font-semibold text-slate-500">Pelabuhan</span>
            </div>
            <div className="text-xs text-slate-600 mt-2 font-medium">
              <span className="text-emerald-700 font-bold">100% Siap Sandar</span> di seluruh Indonesia
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>UN/LOCODE Master:</span>
            <span className="font-bold text-slate-800">Tersertifikasi</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Active Voyages & Fleet Status Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Voyages */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Pelayaran Aktif Hari Ini</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan kapal niaga yang sedang menempuh perjalanan laut.
              </p>
            </div>
            <button
              onClick={() => onNavigate('voyages')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Kelola Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {voyages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada data jadwal pelayaran di Firestore.
              </div>
            ) : (
              voyages.slice(0, 4).map((voyage) => (
                <div key={voyage.id || voyage.voyageNumber} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {voyage.vesselName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                        <span>{voyage.originPort.replace('Pelabuhan ', '')}</span>
                        <span className="text-blue-600 font-bold">&rarr;</span>
                        <span>{voyage.destinationPort.replace('Pelabuhan ', '')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {voyage.status}
                    </span>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      {voyage.distanceNauticalMiles} NM
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Fleet Readiness & Safety Standards */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Kesiapan Armada & Standar IMO</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                100% Layak Laut
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">Sertifikasi Kelaiklautan BKI</span>
                </div>
                <span className="text-xs font-bold text-slate-700">Aktif</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-800">Sistem AIS & VTS Priok / Perak</span>
                </div>
                <span className="text-xs font-bold text-slate-700">Online</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-slate-800">Izin Pabean Bea Cukai (BC2.0)</span>
                </div>
                <span className="text-xs font-bold text-slate-700">Tervalidasi</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Jaminan Integritas Data Firestore</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Seluruh operasi CRUD langsung terhubung ke database cloud Firebase Firestore tanpa penyimpanan lokal (localStorage).
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
