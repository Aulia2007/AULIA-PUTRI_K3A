import { useState } from 'react';
import { 
  Compass, Plus, Search, Filter, Edit3, Trash2, Calendar, 
  MapPin, Ship, ArrowRight, Clock, AlertCircle, Check, X, Fuel
} from 'lucide-react';
import { Voyage, VoyageStatus, Vessel, Port } from '../types/shipping';
import { addVoyage, updateVoyage, deleteVoyage } from '../services/firebaseService';

interface Props {
  voyages: Voyage[];
  vessels: Vessel[];
  ports: Port[];
  isLoading: boolean;
  onShowToast: (type: 'loading' | 'success' | 'error' | 'info', title: string, message: string) => void;
  onRequestDelete: (title: string, itemName: string, itemType: string, onConfirm: () => Promise<void>) => void;
}

const VOYAGE_STATUSES: VoyageStatus[] = ['Dijadwalkan', 'Dalam Pelayaran', 'Sandar Tujuan', 'Selesai', 'Tertunda'];

export default function VoyageManagement({ voyages, vessels, ports, isLoading, onShowToast, onRequestDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoyage, setEditingVoyage] = useState<Voyage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    voyageNumber: string;
    vesselId: string;
    originPort: string;
    destinationPort: string;
    departureDate: string;
    arrivalEstimateDate: string;
    status: VoyageStatus;
    distanceNauticalMiles: string;
    cargoSummary: string;
    fuelEstimatedTons: string;
  }>({
    voyageNumber: '',
    vesselId: '',
    originPort: 'Pelabuhan Tanjung Priok',
    destinationPort: 'Pelabuhan Tanjung Perak',
    departureDate: '',
    arrivalEstimateDate: '',
    status: 'Dijadwalkan',
    distanceNauticalMiles: '420',
    cargoSummary: '',
    fuelEstimatedTons: '45'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleOpenAddModal = () => {
    setEditingVoyage(null);
    const now = new Date();
    const plus3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const defaultVessel = vessels[0]?.id || '';
    setFormData({
      voyageNumber: `VYG-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      vesselId: defaultVessel,
      originPort: ports[0]?.portName || 'Pelabuhan Tanjung Priok',
      destinationPort: ports[1]?.portName || 'Pelabuhan Tanjung Perak',
      departureDate: now.toISOString().slice(0, 16),
      arrivalEstimateDate: plus3Days.toISOString().slice(0, 16),
      status: 'Dijadwalkan',
      distanceNauticalMiles: '450',
      cargoSummary: '',
      fuelEstimatedTons: '42'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (voyage: Voyage) => {
    setEditingVoyage(voyage);
    setFormData({
      voyageNumber: voyage.voyageNumber,
      vesselId: voyage.vesselId,
      originPort: voyage.originPort,
      destinationPort: voyage.destinationPort,
      departureDate: voyage.departureDate,
      arrivalEstimateDate: voyage.arrivalEstimateDate,
      status: voyage.status,
      distanceNauticalMiles: voyage.distanceNauticalMiles.toString(),
      cargoSummary: voyage.cargoSummary,
      fuelEstimatedTons: voyage.fuelEstimatedTons.toString()
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.voyageNumber.trim()) {
      errors.voyageNumber = 'Nomor pelayaran / kode voyage wajib diisi';
    }

    if (!formData.vesselId) {
      errors.vesselId = 'Kapal pelayaran wajib dipilih dari daftar armada';
    }

    if (!formData.originPort.trim()) {
      errors.originPort = 'Pelabuhan asal wajib ditentukan';
    }

    if (!formData.destinationPort.trim()) {
      errors.destinationPort = 'Pelabuhan tujuan wajib ditentukan';
    }

    if (formData.originPort.trim() === formData.destinationPort.trim()) {
      errors.destinationPort = 'Pelabuhan tujuan tidak boleh sama dengan pelabuhan asal';
    }

    if (!formData.departureDate) {
      errors.departureDate = 'Waktu keberangkatan (ETD) wajib diisi';
    }

    if (!formData.arrivalEstimateDate) {
      errors.arrivalEstimateDate = 'Estimasi tiba (ETA) wajib diisi';
    }

    if (formData.departureDate && formData.arrivalEstimateDate) {
      const dep = new Date(formData.departureDate).getTime();
      const arr = new Date(formData.arrivalEstimateDate).getTime();
      if (arr <= dep) {
        errors.arrivalEstimateDate = 'Estimasi tiba (ETA) harus setelah waktu keberangkatan (ETD)';
      }
    }

    const dist = parseFloat(formData.distanceNauticalMiles);
    if (!formData.distanceNauticalMiles || isNaN(dist) || dist <= 0) {
      errors.distanceNauticalMiles = 'Jarak nautika harus berupa angka positif';
    }

    if (!formData.cargoSummary.trim()) {
      errors.cargoSummary = 'Ringkasan muatan kargo wajib diisi';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveVoyage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onShowToast('error', 'Validasi Gagal', 'Harap periksa kembali isian formulir jadwal pelayaran.');
      return;
    }

    setIsSaving(true);
    const selectedVesselObj = vessels.find(v => v.id === formData.vesselId);
    const vesselName = selectedVesselObj ? selectedVesselObj.name : 'Armada Pelayaran';

    const voyagePayload: Omit<Voyage, 'id'> = {
      voyageNumber: formData.voyageNumber.trim().toUpperCase(),
      vesselId: formData.vesselId,
      vesselName,
      originPort: formData.originPort.trim(),
      destinationPort: formData.destinationPort.trim(),
      departureDate: formData.departureDate,
      arrivalEstimateDate: formData.arrivalEstimateDate,
      status: formData.status,
      distanceNauticalMiles: parseFloat(formData.distanceNauticalMiles),
      cargoSummary: formData.cargoSummary.trim(),
      fuelEstimatedTons: parseFloat(formData.fuelEstimatedTons) || 0
    };

    try {
      if (editingVoyage && editingVoyage.id) {
        onShowToast('loading', 'Menyimpan Perubahan', `Memperbarui jadwal ${voyagePayload.voyageNumber} di Firebase...`);
        await updateVoyage(editingVoyage.id, voyagePayload);
        onShowToast('success', 'Jadwal Diperbarui', `Jadwal pelayaran ${voyagePayload.voyageNumber} berhasil diperbarui.`);
      } else {
        onShowToast('loading', 'Mendaftarkan Pelayaran', `Menyimpan jadwal baru ${voyagePayload.voyageNumber} ke Firestore...`);
        await addVoyage(voyagePayload);
        onShowToast('success', 'Jadwal Ditambahkan', `Jadwal pelayaran ${voyagePayload.voyageNumber} berhasil dibuat.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save voyage error:', err);
      onShowToast('error', 'Gagal Menyimpan Data', err.message || 'Terjadi kesalahan saat menghubungi Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (voyage: Voyage) => {
    if (!voyage.id) return;
    onRequestDelete(
      'Konfirmasi Hapus Jadwal Pelayaran',
      `${voyage.voyageNumber} (${voyage.vesselName})`,
      'Jadwal Pelayaran',
      async () => {
        onShowToast('loading', 'Menghapus Jadwal', `Menghapus jadwal ${voyage.voyageNumber} dari database Firestore...`);
        try {
          await deleteVoyage(voyage.id!);
          onShowToast('success', 'Jadwal Dihapus', `Data jadwal pelayaran ${voyage.voyageNumber} berhasil dihapus.`);
        } catch (err: any) {
          console.error('Delete error:', err);
          onShowToast('error', 'Gagal Menghapus', err.message || 'Tidak dapat menghapus data dari Firebase.');
        }
      }
    );
  };

  const filteredVoyages = voyages.filter((v) => {
    const matchesSearch =
      v.voyageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.originPort.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.destinationPort.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.cargoSummary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || v.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: VoyageStatus) => {
    switch (status) {
      case 'Dalam Pelayaran':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dijadwalkan':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Sandar Tujuan':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Selesai':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Tertunda':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-blue-600" />
            <span>Jadwal & Rute Pelayaran</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pengaturan voyage pelayaran niaga antarpulau, estimasi ETD/ETA, serta alokasi kapal.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Pelayaran</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode voyage, kapal, pelabuhan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status Pelayaran:</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">Semua Status Pelayaran</option>
            {VOYAGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Kode Voyage & Kapal</th>
                <th className="py-3.5 px-4">Rute (Asal &rarr; Tujuan)</th>
                <th className="py-3.5 px-4">Jadwal ETD & ETA</th>
                <th className="py-3.5 px-4">Status & Jarak</th>
                <th className="py-3.5 px-4">Muatan & Konsumsi BBM</th>
                <th className="py-3.5 px-4 text-right sm:pr-6">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading && voyages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Memuat jadwal pelayaran dari Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVoyages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Tidak ada jadwal pelayaran ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Buat jadwal baru dengan mengklik tombol di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVoyages.map((voyage) => (
                  <tr key={voyage.id || voyage.voyageNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 flex-shrink-0">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight font-mono text-xs text-blue-700">
                            {voyage.voyageNumber}
                          </div>
                          <div className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                            <Ship className="w-3.5 h-3.5 text-slate-400" />
                            <span>{voyage.vesselName}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span>{voyage.originPort.replace('Pelabuhan ', '')}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                        <span>{voyage.destinationPort.replace('Pelabuhan ', '')}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Jalur Pelayaran Niaga Domestik
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs text-slate-700 flex items-center gap-1">
                        <span className="font-semibold text-slate-500 w-9">ETD:</span>
                        <span>{formatDate(voyage.departureDate)}</span>
                      </div>
                      <div className="text-xs text-slate-700 flex items-center gap-1 mt-0.5">
                        <span className="font-semibold text-blue-600 w-9">ETA:</span>
                        <span className="font-semibold text-slate-900">{formatDate(voyage.arrivalEstimateDate)}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(voyage.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {voyage.status}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {voyage.distanceNauticalMiles} Nautical Miles (NM)
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-medium text-slate-800 max-w-xs truncate" title={voyage.cargoSummary}>
                        {voyage.cargoSummary}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-amber-500" />
                        <span>Est. BBM: {voyage.fuelEstimatedTons} Ton HFO/MGO</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(voyage)}
                          title="Ubah Jadwal"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(voyage)}
                          title="Hapus Jadwal dari Database"
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

      {/* Modal Add / Edit Voyage with Validation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingVoyage ? 'Ubah Rencana Pelayaran' : 'Buat Jadwal Pelayaran Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Disinkronkan langsung ke database Firebase Firestore.
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

            <form onSubmit={handleSaveVoyage} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode Voyage */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nomor Voyage / Kode Pelayaran *
                  </label>
                  <input
                    type="text"
                    value={formData.voyageNumber}
                    onChange={(e) => setFormData({ ...formData, voyageNumber: e.target.value.toUpperCase() })}
                    placeholder="Contoh: VYG-2026-JKT-SBY-088"
                    className={`w-full px-3.5 py-2 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 ${
                      formErrors.voyageNumber ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.voyageNumber && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.voyageNumber}</p>}
                </div>

                {/* Pilih Kapal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Armada Kapal Ditugaskan *
                  </label>
                  <select
                    value={formData.vesselId}
                    onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none ${
                      formErrors.vesselId ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  >
                    <option value="">-- Pilih Kapal Armada --</option>
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.vesselType} - {v.dwt} DWT)
                      </option>
                    ))}
                  </select>
                  {formErrors.vesselId && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.vesselId}</p>}
                </div>

                {/* Pelabuhan Asal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Pelabuhan Asal (Origin) *
                  </label>
                  <select
                    value={formData.originPort}
                    onChange={(e) => setFormData({ ...formData, originPort: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-600"
                  >
                    {ports.map(p => (
                      <option key={p.id || p.portCode} value={p.portName}>{p.portName} ({p.portCode})</option>
                    ))}
                  </select>
                </div>

                {/* Pelabuhan Tujuan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Pelabuhan Tujuan (Destination) *
                  </label>
                  <select
                    value={formData.destinationPort}
                    onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none ${
                      formErrors.destinationPort ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  >
                    {ports.map(p => (
                      <option key={p.id || p.portCode} value={p.portName}>{p.portName} ({p.portCode})</option>
                    ))}
                  </select>
                  {formErrors.destinationPort && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.destinationPort}</p>}
                </div>

                {/* Waktu Keberangkatan ETD */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Waktu Berangkat (ETD) *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.departureDate ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.departureDate && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.departureDate}</p>}
                </div>

                {/* Estimasi Tiba ETA */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Estimasi Tiba (ETA) *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.arrivalEstimateDate}
                    onChange={(e) => setFormData({ ...formData, arrivalEstimateDate: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.arrivalEstimateDate ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.arrivalEstimateDate && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.arrivalEstimateDate}</p>}
                </div>

                {/* Status Pelayaran */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status Pelayaran *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VoyageStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-600"
                  >
                    {VOYAGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Jarak Nautika */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Jarak Tempuh (Nautical Miles) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.distanceNauticalMiles}
                    onChange={(e) => setFormData({ ...formData, distanceNauticalMiles: e.target.value })}
                    placeholder="420"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.distanceNauticalMiles ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.distanceNauticalMiles && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.distanceNauticalMiles}</p>}
                </div>

                {/* Estimasi Bahan Bakar */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Estimasi Konsumsi BBM (Ton)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.fuelEstimatedTons}
                    onChange={(e) => setFormData({ ...formData, fuelEstimatedTons: e.target.value })}
                    placeholder="45"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Ringkasan Muatan */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ringkasan Muatan Kargo (Manifest Summary) *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.cargoSummary}
                    onChange={(e) => setFormData({ ...formData, cargoSummary: e.target.value })}
                    placeholder="Contoh: 1,450 TEU Kontainer Elektronik & Manufaktur Konsumsi"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.cargoSummary ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.cargoSummary && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.cargoSummary}</p>}
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
                      <span>{editingVoyage ? 'Simpan Perubahan Jadwal' : 'Simpan Jadwal Pelayaran'}</span>
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
