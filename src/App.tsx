import { useState, useEffect } from 'react';
import { 
  subscribeVessels, 
  subscribeVoyages, 
  subscribeCargo, 
  subscribePorts, 
  checkAndSeedInitialDatabase 
} from './services/firebaseService';
import { subscribeAuthState, logoutUser } from './services/authService';
import { Vessel, Voyage, CargoManifest, Port, AppUser, ToastFeedback } from './types/shipping';

import Navbar, { NavTab } from './components/Navbar';
import LoginForm from './components/LoginForm';
import DashboardOverview from './components/DashboardOverview';
import VesselManagement from './components/VesselManagement';
import VoyageManagement from './components/VoyageManagement';
import CargoManagement from './components/CargoManagement';
import PortManagement from './components/PortManagement';
import NotificationToast from './components/NotificationToast';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';

export default function App() {
  // Authentication State - Default is null so LoginForm is displayed as requested
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Active Navigation Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Real Database State (Firebase Firestore)
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [cargoList, setCargoList] = useState<CargoManifest[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);

  // Loading States
  const [isVesselsLoading, setIsVesselsLoading] = useState(true);
  const [isVoyagesLoading, setIsVoyagesLoading] = useState(true);
  const [isCargoLoading, setIsCargoLoading] = useState(true);
  const [isPortsLoading, setIsPortsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Informative UI Feedback Toast
  const [toast, setToast] = useState<ToastFeedback | null>(null);

  // Delete Confirmation Modal State
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    itemType: string;
    isDeleting: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    itemName: '',
    itemType: '',
    isDeleting: false,
    onConfirm: async () => {}
  });

  const showToast = (type: 'loading' | 'success' | 'error' | 'info', title: string, message: string, duration?: number) => {
    setToast({
      id: Math.random().toString(),
      type,
      title,
      message,
      duration: duration || (type === 'error' ? 5000 : 3500)
    });
  };

  const requestDelete = (
    title: string,
    itemName: string,
    itemType: string,
    onConfirmAction: () => Promise<void>
  ) => {
    setDeleteDialog({
      isOpen: true,
      title,
      itemName,
      itemType,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
        try {
          await onConfirmAction();
          setDeleteDialog(prev => ({ ...prev, isOpen: false, isDeleting: false }));
        } catch {
          setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
        }
      }
    });
  };

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = subscribeAuthState((user) => {
      // Note: We deliberately let the user experience the login screen by default if not previously logged in in this session
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore Subscriptions
  useEffect(() => {
    // Subscribe to Vessels
    const unsubVessels = subscribeVessels(
      (data) => {
        setVessels(data);
        setIsVesselsLoading(false);
      },
      (err) => {
        console.error('Vessels subscription error:', err);
        setIsVesselsLoading(false);
        showToast('error', 'Koneksi Firestore', 'Gagal memuat data armada kapal.');
      }
    );

    // Subscribe to Voyages
    const unsubVoyages = subscribeVoyages(
      (data) => {
        setVoyages(data);
        setIsVoyagesLoading(false);
      },
      (err) => {
        console.error('Voyages subscription error:', err);
        setIsVoyagesLoading(false);
      }
    );

    // Subscribe to Cargo Manifests
    const unsubCargo = subscribeCargo(
      (data) => {
        setCargoList(data);
        setIsCargoLoading(false);
      },
      (err) => {
        console.error('Cargo subscription error:', err);
        setIsCargoLoading(false);
      }
    );

    // Subscribe to Ports
    const unsubPorts = subscribePorts(
      (data) => {
        setPorts(data);
        setIsPortsLoading(false);
      },
      (err) => {
        console.error('Ports subscription error:', err);
        setIsPortsLoading(false);
      }
    );

    return () => {
      unsubVessels();
      unsubVoyages();
      unsubCargo();
      unsubPorts();
    };
  }, []);

  // 3. Initial database check & automatic seeding if brand new
  useEffect(() => {
    const initDb = async () => {
      try {
        const seeded = await checkAndSeedInitialDatabase();
        if (seeded) {
          showToast('info', 'Database Siap', 'Data awal armada kapal dan pelabuhan Indonesia telah disinkronkan ke Firebase.');
        }
      } catch (err) {
        console.warn('Initial seed check note:', err);
      }
    };
    initDb();
  }, []);

  // Handle Manual Seed / Re-sync
  const handleManualSeed = async () => {
    setIsSeeding(true);
    showToast('loading', 'Menyinkronkan Database', 'Memeriksa dan memperbarui data awal operasional pelayaran ke Firebase Firestore...');
    try {
      await checkAndSeedInitialDatabase();
      showToast('success', 'Sinkronisasi Selesai', 'Data armada kapal, rute, dan kargo telah sinkron dengan Firebase.');
    } catch (err: any) {
      showToast('error', 'Sinkronisasi Gagal', err.message || 'Gagal menyinkronkan database.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    showToast('info', 'Sesi Berakhir', 'Anda telah berhasil keluar dari sistem manajemen pelayaran.');
  };

  // If user is not authenticated, show Login Form as DEFAULT VIEW
  if (!currentUser) {
    return (
      <div className="font-sans antialiased text-slate-800">
        <LoginForm
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          onShowToast={showToast}
        />
        <NotificationToast
          toast={toast}
          onDismiss={() => setToast(null)}
        />
      </div>
    );
  }

  // Authenticated Enterprise Application View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Topbar Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSeedData={handleManualSeed}
        isSeeding={isSeeding}
        totalVesselsCount={vessels.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardOverview
            vessels={vessels}
            voyages={voyages}
            cargoList={cargoList}
            ports={ports}
            currentUser={currentUser}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'vessels' && (
          <VesselManagement
            vessels={vessels}
            isLoading={isVesselsLoading}
            onShowToast={showToast}
            onRequestDelete={requestDelete}
          />
        )}

        {currentTab === 'voyages' && (
          <VoyageManagement
            voyages={voyages}
            vessels={vessels}
            ports={ports}
            isLoading={isVoyagesLoading}
            onShowToast={showToast}
            onRequestDelete={requestDelete}
          />
        )}

        {currentTab === 'cargo' && (
          <CargoManagement
            cargoList={cargoList}
            voyages={voyages}
            isLoading={isCargoLoading}
            onShowToast={showToast}
            onRequestDelete={requestDelete}
          />
        )}

        {currentTab === 'ports' && (
          <PortManagement
            ports={ports}
            isLoading={isPortsLoading}
            onShowToast={showToast}
            onRequestDelete={requestDelete}
          />
        )}
      </main>

      {/* Modern Maritime Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">PT Samudera Nusantara Shipping Lines</span>
            <span>&bull;</span>
            <span>Sistem Operasional Armada & Kargo</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firebase Firestore Live Terhubung
            </span>
            <span>Tanpa LocalStorage (Zero LocalStorage)</span>
          </div>
        </div>
      </footer>

      {/* Global Toast Feedback UI */}
      <NotificationToast
        toast={toast}
        onDismiss={() => setToast(null)}
      />

      {/* Global Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        itemName={deleteDialog.itemName}
        itemType={deleteDialog.itemType}
        isDeleting={deleteDialog.isDeleting}
        onConfirm={deleteDialog.onConfirm}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
