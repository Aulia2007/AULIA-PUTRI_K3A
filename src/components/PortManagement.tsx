import { useState } from 'react';
import { 
  MapPin, Plus, Search, Edit3, Trash2, Radio, 
  Anchor, Check, X, ShieldAlert, Waves
} from 'lucide-react';
import { Port } from '../types/shipping';
import { addPort, updatePort, deletePort } from '../services/firebaseService';

interface Props {
  ports: Port[];
  isLoading: boolean;
  onShowToast: (type: 'loading' | 'success' | 'error' | 'info', title: string, message: string) => void;
  onRequestDelete: (title: string, itemName: string, itemType: string, onConfirm: () => Promise<void>) => void;
}

export default function PortManagement({ ports, isLoading, onShowToast, onRequestDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<{
    portCode: string;
    portName: string;
    city: string;
    province: string;
    country: string;
    maxDraftMeters: string;
    activeBerths: string;
    terminalCapacityTeu: string;
    isOpen: boolean;
    contactVHF: string;
  }>({
    portCode: '',
    portName: '',
    city: '',
    province: '',
    country: 'Indonesia',
    maxDraftMeters: '12.5',
    activeBerths: '12',
    terminalCapacityTeu: '2000000',
    isOpen: true,
    contactVHF: 'CH 16 (Port Control)'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleOpenAddModal = () => {
    setEditingPort(null);
    setFormData({
      portCode: 'ID',
      portName: '',
      city: '',
      province: '',
      country: 'Indonesia',
      maxDraftMeters: '12.0',
      activeBerths: '10',
      terminalCapacityTeu: '1500000',
      isOpen: true,
      contactVHF: 'CH 16 / 12'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (port: Port) => {
    setEditingPort(port);
    setFormData({
      portCode: port.portCode,
      portName: port.portName,
      city: port.city,
      province: port.province,
      country: port.country,
      maxDraftMeters: port.maxDraftMeters.toString(),
      activeBerths: port.activeBerths.toString(),
      terminalCapacityTeu: port.terminalCapacityTeu.toString(),
      isOpen: port.isOpen,
      contactVHF: port.contactVHF
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    const code = formData.portCode.trim();
    if (!code) {
      errors.portCode = 'Kode pelabuhan (UN/LOCODE) wajib diisi';
    } else if (code.length < 4 || code.length > 6) {
      errors.portCode = 'Kode UN/LOCODE umumnya 5 karakter (misal: IDTPP)';
    }

    if (!formData.portName.trim() || formData.portName.trim().length < 3) {
      errors.portName = 'Nama resmi pelabuhan wajib diisi lengkap';
    }

    if (!formData.city.trim()) {
      errors.city = 'Kota lokasi pelabuhan wajib diisi';
    }

    if (!formData.province.trim()) {
      errors.province = 'Provinsi lokasi pelabuhan wajib diisi';
    }

    const draft = parseFloat(formData.maxDraftMeters);
    if (!formData.maxDraftMeters || isNaN(draft) || draft <= 0 || draft > 30) {
      errors.maxDraftMeters = 'Kedalaman draft laut harus di antara 1 - 30 meter';
    }

    const berths = parseInt(formData.activeBerths, 10);
    if (!formData.activeBerths || isNaN(berths) || berths < 1) {
      errors.activeBerths = 'Jumlah dermaga aktif minimal 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onShowToast('error', 'Validasi Gagal', 'Harap periksa isian data pelabuhan yang belum valid.');
      return;
    }

    setIsSaving(true);
    const portPayload: Omit<Port, 'id'> = {
      portCode: formData.portCode.trim().toUpperCase(),
      portName: formData.portName.trim(),
      city: formData.city.trim(),
      province: formData.province.trim(),
      country: formData.country.trim(),
      maxDraftMeters: parseFloat(formData.maxDraftMeters),
      activeBerths: parseInt(formData.activeBerths, 10),
      terminalCapacityTeu: parseInt(formData.terminalCapacityTeu, 10) || 0,
      isOpen: formData.isOpen,
      contactVHF: formData.contactVHF.trim()
    };

    try {
      if (editingPort && editingPort.id) {
        onShowToast('loading', 'Menyimpan Perubahan', `Memperbarui data ${portPayload.portName} di Firebase...`);
        await updatePort(editingPort.id, portPayload);
        onShowToast('success', 'Pelabuhan Diperbarui', `Data ${portPayload.portName} berhasil disimpan.`);
      } else {
        onShowToast('loading', 'Mendaftarkan Pelabuhan', `Menyimpan ${portPayload.portName} ke Firestore...`);
        await addPort(portPayload);
        onShowToast('success', 'Pelabuhan Ditambahkan', `Pelabuhan ${portPayload.portName} berhasil didaftarkan.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save port error:', err);
      onShowToast('error', 'Gagal Menyimpan Data', err.message || 'Kesalahan saat menyimpan data ke Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (port: Port) => {
    if (!port.id) return;
    onRequestDelete(
      'Konfirmasi Hapus Data Pelabuhan',
      `${port.portName} (${port.portCode})`,
      'Pelabuhan & Dermaga',
      async () => {
        onShowToast('loading', 'Menghapus Pelabuhan', `Menghapus ${port.portName} dari database Firestore...`);
        try {
          await deletePort(port.id!);
          onShowToast('success', 'Pelabuhan Dihapus', `Data pelabuhan ${port.portName} berhasil dihapus.`);
        } catch (err: any) {
          console.error('Delete error:', err);
          onShowToast('error', 'Gagal Menghapus', err.message || 'Tidak dapat menghapus data dari Firebase.');
        }
      }
    );
  };

  const filteredPorts = ports.filter((p) => {
    return (
      p.portName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.portCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.province.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span>Master Data Pelabuhan & Dermaga</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Data teknis kedalaman draf alur laut, kapasitas dermaga, dan frekuensi komunikasi radio pandu.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelabuhan Baru</span>
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
            placeholder="Cari kode UN/LOCODE, nama pelabuhan, kota..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50/50"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-slate-800">{filteredPorts.length}</strong> Pelabuhan Terdaftar
        </div>
      </div>

      {/* Cards Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {isLoading && ports.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Memuat data pelabuhan dari Firestore...</span>
            </div>
          </div>
        ) : filteredPorts.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm">Tidak ada data pelabuhan ditemukan</p>
          </div>
        ) : (
          filteredPorts.map((port) => (
            <div key={port.id || port.portCode} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-bold font-mono">
                    {port.portCode.slice(-3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{port.portName}</h4>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {port.portCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {port.city}, {port.province} &bull; {port.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(port)}
                    title="Ubah Pelabuhan"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(port)}
                    title="Hapus Pelabuhan"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Draft Alur</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{port.maxDraftMeters} Meter</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Dermaga Aktif</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{port.activeBerths} Berth</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Status</span>
                  <span className={`font-bold mt-0.5 block ${port.isOpen ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {port.isOpen ? 'Buka Operasional' : 'Tutup/Siaga'}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium text-slate-700">{port.contactVHF}</span>
                </div>
                <div>
                  Kapasitas: <strong className="text-slate-700">{port.terminalCapacityTeu.toLocaleString('id-ID')} TEU/thn</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Port with Validation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingPort ? 'Ubah Data Pelabuhan' : 'Pendaftaran Pelabuhan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data disimpan secara persisten di database Firebase Firestore.
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

            <form onSubmit={handleSavePort} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode UN/LOCODE */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kode UN/LOCODE (5 Karakter) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.portCode}
                    onChange={(e) => setFormData({ ...formData, portCode: e.target.value.toUpperCase() })}
                    placeholder="Contoh: IDTPP"
                    className={`w-full px-3.5 py-2 rounded-xl border font-mono text-sm focus:outline-none ${
                      formErrors.portCode ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.portCode && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.portCode}</p>}
                </div>

                {/* Nama Pelabuhan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nama Resmi Pelabuhan *
                  </label>
                  <input
                    type="text"
                    value={formData.portName}
                    onChange={(e) => setFormData({ ...formData, portName: e.target.value })}
                    placeholder="Contoh: Pelabuhan Tanjung Priok"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.portName ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.portName && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.portName}</p>}
                </div>

                {/* Kota */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kota / Wilayah *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Jakarta Utara"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.city ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.city && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.city}</p>}
                </div>

                {/* Provinsi */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="DKI Jakarta"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.province ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.province && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.province}</p>}
                </div>

                {/* Draf Maksimum */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kedalaman Draf Maksimum (Meter) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    max={30}
                    value={formData.maxDraftMeters}
                    onChange={(e) => setFormData({ ...formData, maxDraftMeters: e.target.value })}
                    placeholder="14.5"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.maxDraftMeters ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.maxDraftMeters && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.maxDraftMeters}</p>}
                </div>

                {/* Jumlah Dermaga */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Jumlah Dermaga Aktif (Berths) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.activeBerths}
                    onChange={(e) => setFormData({ ...formData, activeBerths: e.target.value })}
                    placeholder="32"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.activeBerths ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.activeBerths && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.activeBerths}</p>}
                </div>

                {/* Frekuensi Radio VHF */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Frekuensi Radio VHF Pandu
                  </label>
                  <input
                    type="text"
                    value={formData.contactVHF}
                    onChange={(e) => setFormData({ ...formData, contactVHF: e.target.value })}
                    placeholder="CH 12 / 16 (Priok VTS)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Status Operasional Buka */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status Operasional Dermaga
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={formData.isOpen}
                        onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-800">
                        {formData.isOpen ? 'Pelabuhan Buka & Siap Sandar' : 'Pelabuhan Ditutup / Siaga Cuaca'}
                      </span>
                    </label>
                  </div>
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
                      <span>{editingPort ? 'Simpan Perubahan' : 'Daftarkan Pelabuhan'}</span>
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
