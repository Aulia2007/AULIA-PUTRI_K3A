import { useState } from 'react';
import { 
  Ship, Plus, Search, Filter, Edit3, Trash2, Anchor, 
  Compass, AlertCircle, Check, X, Shield, Calendar, MapPin, Gauge
} from 'lucide-react';
import { Vessel, VesselType, VesselStatus } from '../types/shipping';
import { addVessel, updateVessel, deleteVessel } from '../services/firebaseService';

interface Props {
  vessels: Vessel[];
  isLoading: boolean;
  onShowToast: (type: 'loading' | 'success' | 'error' | 'info', title: string, message: string) => void;
  onRequestDelete: (title: string, itemName: string, itemType: string, onConfirm: () => Promise<void>) => void;
}

const VESSEL_TYPES: VesselType[] = ['Kontainer', 'Tanker', 'Bulk Carrier', 'Ro-Ro', 'General Cargo', 'Tugboat'];
const VESSEL_STATUSES: VesselStatus[] = ['Berlayar', 'Sandar', 'Perawatan', 'Labuh Jangkar'];

export default function VesselManagement({ vessels, isLoading, onShowToast, onRequestDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields & Strict Validation State
  const [formData, setFormData] = useState<{
    name: string;
    imoNumber: string;
    callSign: string;
    vesselType: VesselType;
    dwt: string;
    teuCapacity: string;
    yearBuilt: string;
    flag: string;
    currentPort: string;
    status: VesselStatus;
    currentSpeedKnots: string;
    captainName: string;
    notes: string;
  }>({
    name: '',
    imoNumber: '',
    callSign: '',
    vesselType: 'Kontainer',
    dwt: '',
    teuCapacity: '',
    yearBuilt: '2020',
    flag: 'Indonesia 🇮🇩',
    currentPort: 'Pelabuhan Tanjung Priok',
    status: 'Sandar',
    currentSpeedKnots: '0',
    captainName: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleOpenAddModal = () => {
    setEditingVessel(null);
    setFormData({
      name: '',
      imoNumber: '',
      callSign: '',
      vesselType: 'Kontainer',
      dwt: '',
      teuCapacity: '',
      yearBuilt: new Date().getFullYear().toString(),
      flag: 'Indonesia 🇮🇩',
      currentPort: 'Pelabuhan Tanjung Priok',
      status: 'Sandar',
      currentSpeedKnots: '0',
      captainName: '',
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vessel: Vessel) => {
    setEditingVessel(vessel);
    setFormData({
      name: vessel.name,
      imoNumber: vessel.imoNumber,
      callSign: vessel.callSign,
      vesselType: vessel.vesselType,
      dwt: vessel.dwt.toString(),
      teuCapacity: vessel.teuCapacity ? vessel.teuCapacity.toString() : '',
      yearBuilt: vessel.yearBuilt.toString(),
      flag: vessel.flag,
      currentPort: vessel.currentPort,
      status: vessel.status,
      currentSpeedKnots: vessel.currentSpeedKnots.toString(),
      captainName: vessel.captainName,
      notes: vessel.notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Strict Validation Logic
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      errors.name = 'Nama kapal wajib diisi (minimal 3 karakter)';
    }

    // IMO Number must be 7 digits
    const cleanIMO = formData.imoNumber.trim();
    if (!cleanIMO) {
      errors.imoNumber = 'Nomor IMO wajib diisi (Standar IMO)';
    } else if (!/^\d{7}$/.test(cleanIMO)) {
      errors.imoNumber = 'Nomor IMO harus tepat 7 digit angka (misal: 9482104)';
    }

    if (!formData.callSign.trim()) {
      errors.callSign = 'Tanda panggil (Call Sign) wajib diisi (misal: PKSP-01)';
    }

    const dwtNum = parseFloat(formData.dwt);
    if (!formData.dwt || isNaN(dwtNum) || dwtNum <= 0) {
      errors.dwt = 'Kapasitas DWT harus berupa angka positif lebih dari 0 ton';
    }

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(formData.yearBuilt, 10);
    if (!formData.yearBuilt || isNaN(yearNum) || yearNum < 1960 || yearNum > currentYear + 2) {
      errors.yearBuilt = `Tahun pembuatan harus di antara 1960 dan ${currentYear + 2}`;
    }

    if (!formData.captainName.trim()) {
      errors.captainName = 'Nama Nakhoda/Kapten kapal wajib diisi';
    }

    if (!formData.currentPort.trim()) {
      errors.currentPort = 'Pelabuhan posisi kapal saat ini wajib diisi';
    }

    const speedNum = parseFloat(formData.currentSpeedKnots);
    if (formData.currentSpeedKnots && (isNaN(speedNum) || speedNum < 0 || speedNum > 45)) {
      errors.currentSpeedKnots = 'Kecepatan harus bernilai antara 0 - 45 knot';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onShowToast('error', 'Validasi Gagal', 'Harap periksa kembali isian formulir armada kapal.');
      return;
    }

    setIsSaving(true);
    const vesselPayload: Omit<Vessel, 'id'> = {
      name: formData.name.trim(),
      imoNumber: formData.imoNumber.trim(),
      callSign: formData.callSign.trim().toUpperCase(),
      vesselType: formData.vesselType,
      dwt: parseFloat(formData.dwt),
      teuCapacity: formData.teuCapacity ? parseInt(formData.teuCapacity, 10) : undefined,
      yearBuilt: parseInt(formData.yearBuilt, 10),
      flag: formData.flag.trim(),
      currentPort: formData.currentPort.trim(),
      status: formData.status,
      currentSpeedKnots: parseFloat(formData.currentSpeedKnots) || 0,
      captainName: formData.captainName.trim(),
      notes: formData.notes.trim()
    };

    try {
      if (editingVessel && editingVessel.id) {
        onShowToast('loading', 'Menyimpan Perubahan', `Memperbarui data kapal ${vesselPayload.name} di Firebase...`);
        await updateVessel(editingVessel.id, vesselPayload);
        onShowToast('success', 'Data Kapal Diperbarui', `Kapal ${vesselPayload.name} berhasil diperbarui di database produksi.`);
      } else {
        onShowToast('loading', 'Menambahkan Kapal Baru', `Menyimpan data ${vesselPayload.name} ke Firestore...`);
        await addVessel(vesselPayload);
        onShowToast('success', 'Kapal Baru Ditambahkan', `Kapal ${vesselPayload.name} berhasil didaftarkan ke armada.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save vessel error:', err);
      onShowToast('error', 'Gagal Menyimpan Data', err.message || 'Terjadi kesalahan saat menghubungi Firebase Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (vessel: Vessel) => {
    if (!vessel.id) return;
    onRequestDelete(
      'Konfirmasi Hapus Armada Kapal',
      `${vessel.name} (IMO: ${vessel.imoNumber})`,
      'Kapal Armada',
      async () => {
        onShowToast('loading', 'Menghapus Kapal', `Menghapus kapal ${vessel.name} dari database Firestore...`);
        try {
          await deleteVessel(vessel.id!);
          onShowToast('success', 'Kapal Dihapus', `Data armada kapal ${vessel.name} telah berhasil dihapus.`);
        } catch (err: any) {
          console.error('Delete error:', err);
          onShowToast('error', 'Gagal Menghapus', err.message || 'Tidak dapat menghapus data dari Firebase.');
        }
      }
    );
  };

  // Filter and Search logic
  const filteredVessels = vessels.filter((v) => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.imoNumber.includes(searchQuery) ||
      v.callSign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.captainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.currentPort.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || v.vesselType === selectedType;
    const matchesStatus = selectedStatus === 'all' || v.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: VesselStatus) => {
    switch (status) {
      case 'Berlayar':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sandar':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Perawatan':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Labuh Jangkar':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ship className="w-6 h-6 text-blue-600" />
            <span>Manajemen Armada Kapal</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pengelolaan spesifikasi teknis, sertifikasi IMO, status operasional, dan lokasi armada kapal niaga.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kapal Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kapal, IMO, call sign, kapten..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">Semua Tipe Kapal</option>
            {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">Semua Status Operasional</option>
            {VESSEL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Vessels Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Nama Kapal & IMO</th>
                <th className="py-3.5 px-4">Tipe & Kapasitas</th>
                <th className="py-3.5 px-4">Status & Kecepatan</th>
                <th className="py-3.5 px-4">Pelabuhan Saat Ini</th>
                <th className="py-3.5 px-4">Nakhoda (Kapten)</th>
                <th className="py-3.5 px-4 text-right sm:pr-6">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading && vessels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Memuat data armada dari Firebase Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVessels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Ship className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Tidak ada data armada kapal ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                        ? 'Coba ubah kata kunci pencarian atau filter Anda.'
                        : 'Klik tombol "Tambah Kapal Baru" atau gunakan "Sinkronisasi Data Awal".'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVessels.map((vessel) => (
                  <tr key={vessel.id || vessel.imoNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0 font-bold">
                          <Ship className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight hover:text-blue-600 cursor-pointer">
                            {vessel.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                            <span>IMO: {vessel.imoNumber}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span>CS: {vessel.callSign}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {vessel.vesselType}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {vessel.dwt.toLocaleString('id-ID')} DWT
                        {vessel.teuCapacity ? ` / ${vessel.teuCapacity} TEU` : ''}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(vessel.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {vessel.status}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                        <Gauge className="w-3 h-3 text-slate-400" />
                        <span>{vessel.currentSpeedKnots} Knot</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{vessel.currentPort}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 pl-5">
                        Bendera: {vessel.flag}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-medium text-slate-900">
                        {vessel.captainName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tahun: {vessel.yearBuilt}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(vessel)}
                          title="Ubah Data Kapal"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(vessel)}
                          title="Hapus Kapal dari Database"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Vessel with Strict Validation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingVessel ? 'Ubah Data Armada Kapal' : 'Pendaftaran Kapal Niaga Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data disimpan secara persisten ke database Firebase Firestore.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVessel} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Kapal */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nama Resmi Kapal *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: KM Samudera Perkasa"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      formErrors.name ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {formErrors.name && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.name}</p>}
                </div>

                {/* IMO Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nomor IMO (7 Digit Angka) *
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    value={formData.imoNumber}
                    onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="9482104"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                      formErrors.imoNumber ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {formErrors.imoNumber && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.imoNumber}</p>}
                </div>

                {/* Call Sign */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tanda Panggil (Call Sign) *
                  </label>
                  <input
                    type="text"
                    value={formData.callSign}
                    onChange={(e) => setFormData({ ...formData, callSign: e.target.value.toUpperCase() })}
                    placeholder="PKSP-01"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                      formErrors.callSign ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {formErrors.callSign && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.callSign}</p>}
                </div>

                {/* Tipe Kapal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tipe Armada *
                  </label>
                  <select
                    value={formData.vesselType}
                    onChange={(e) => setFormData({ ...formData, vesselType: e.target.value as VesselType })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
                  >
                    {VESSEL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Deadweight Tonnage (DWT) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kapasitas DWT (Ton) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.dwt}
                    onChange={(e) => setFormData({ ...formData, dwt: e.target.value })}
                    placeholder="Contoh: 28500"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      formErrors.dwt ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {formErrors.dwt && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.dwt}</p>}
                </div>

                {/* TEU Capacity (opsional jika kontainer) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kapasitas TEU (Khusus Kontainer)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.teuCapacity}
                    onChange={(e) => setFormData({ ...formData, teuCapacity: e.target.value })}
                    placeholder="Contoh: 2100"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Tahun Pembuatan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tahun Pembuatan *
                  </label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                    placeholder="2020"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      formErrors.yearBuilt ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {formErrors.yearBuilt && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.yearBuilt}</p>}
                </div>

                {/* Status Operasional */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status Operasional *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VesselStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
                  >
                    {VESSEL_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Kecepatan Terkini */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kecepatan Terkini (Knot)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="45"
                    value={formData.currentSpeedKnots}
                    onChange={(e) => setFormData({ ...formData, currentSpeedKnots: e.target.value })}
                    placeholder="15.5"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                  {formErrors.currentSpeedKnots && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.currentSpeedKnots}</p>}
                </div>

                {/* Pelabuhan Saat Ini */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Pelabuhan / Posisi Terkini *
                  </label>
                  <input
                    type="text"
                    value={formData.currentPort}
                    onChange={(e) => setFormData({ ...formData, currentPort: e.target.value })}
                    placeholder="Pelabuhan Tanjung Priok"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      formErrors.currentPort ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {formErrors.currentPort && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.currentPort}</p>}
                </div>

                {/* Nakhoda / Kapten */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nama Nakhoda (Kapten Kapal) *
                  </label>
                  <input
                    type="text"
                    value={formData.captainName}
                    onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
                    placeholder="Capt. Hendra Gunawan, M.Mar"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      formErrors.captainName ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {formErrors.captainName && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.captainName}</p>}
                </div>

                {/* Catatan / Keterangan Operasional */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Catatan Rute / Keterangan Muatan
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan inspeksi lambung, jadwal docking, sertifikat kelas BKI..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan ke Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingVessel ? 'Simpan Perubahan' : 'Daftarkan Kapal'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
