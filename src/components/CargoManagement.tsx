import { useState } from 'react';
import { 
  Package, Plus, Search, Filter, Edit3, Trash2, ShieldCheck, 
  FileText, ArrowUpRight, Check, X, Building2, Layers
} from 'lucide-react';
import { CargoManifest, CargoType, CargoStatus, Voyage } from '../types/shipping';
import { addCargoManifest, updateCargoManifest, deleteCargoManifest } from '../services/firebaseService';

interface Props {
  cargoList: CargoManifest[];
  voyages: Voyage[];
  isLoading: boolean;
  onShowToast: (type: 'loading' | 'success' | 'error' | 'info', title: string, message: string) => void;
  onRequestDelete: (title: string, itemName: string, itemType: string, onConfirm: () => Promise<void>) => void;
}

const CARGO_TYPES: CargoType[] = [
  'Kontainer 20ft', 
  'Kontainer 40ft', 
  'Curah Kering', 
  'Cairan/Minyak', 
  'Muatan Khusus/Alat Berat', 
  'Kargo Berpendingin'
];

const CARGO_STATUSES: CargoStatus[] = [
  'Siap Muat', 
  'Di Dalam Palka/Kapal', 
  'Dalam Perjalanan', 
  'Bongkar Pelabuhan', 
  'Terkirim'
];

export default function CargoManagement({ cargoList, voyages, isLoading, onShowToast, onRequestDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<CargoManifest | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<{
    blNumber: string;
    voyageId: string;
    shipper: string;
    consignee: string;
    cargoType: CargoType;
    weightTons: string;
    quantityUnits: string;
    hazardousClass: string;
    customsClearanceCode: string;
    status: CargoStatus;
    notes: string;
  }>({
    blNumber: '',
    voyageId: '',
    shipper: '',
    consignee: '',
    cargoType: 'Kontainer 40ft',
    weightTons: '',
    quantityUnits: '1',
    hazardousClass: 'Non-Hazardous',
    customsClearanceCode: '',
    status: 'Siap Muat',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleOpenAddModal = () => {
    setEditingCargo(null);
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const defaultVoyage = voyages[0]?.id || '';
    setFormData({
      blNumber: `BL-SN-${new Date().getFullYear()}-${randomCode}`,
      voyageId: defaultVoyage,
      shipper: '',
      consignee: '',
      cargoType: 'Kontainer 40ft',
      weightTons: '',
      quantityUnits: '1',
      hazardousClass: 'Non-Hazardous',
      customsClearanceCode: `BC2.0-${randomCode}`,
      status: 'Siap Muat',
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cargo: CargoManifest) => {
    setEditingCargo(cargo);
    setFormData({
      blNumber: cargo.blNumber,
      voyageId: cargo.voyageId,
      shipper: cargo.shipper,
      consignee: cargo.consignee,
      cargoType: cargo.cargoType,
      weightTons: cargo.weightTons.toString(),
      quantityUnits: cargo.quantityUnits.toString(),
      hazardousClass: cargo.hazardousClass || 'Non-Hazardous',
      customsClearanceCode: cargo.customsClearanceCode,
      status: cargo.status,
      notes: cargo.notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.blNumber.trim()) {
      errors.blNumber = 'Nomor Bill of Lading (B/L) wajib diisi';
    }

    if (!formData.shipper.trim() || formData.shipper.trim().length < 3) {
      errors.shipper = 'Nama Pengirim (Shipper) wajib diisi lengkap';
    }

    if (!formData.consignee.trim() || formData.consignee.trim().length < 3) {
      errors.consignee = 'Nama Penerima (Consignee) wajib diisi lengkap';
    }

    const weight = parseFloat(formData.weightTons);
    if (!formData.weightTons || isNaN(weight) || weight <= 0) {
      errors.weightTons = 'Berat muatan harus berupa angka positif dalam satuan Ton';
    }

    const qty = parseInt(formData.quantityUnits, 10);
    if (!formData.quantityUnits || isNaN(qty) || qty <= 0) {
      errors.quantityUnits = 'Jumlah unit/kontainer minimal 1';
    }

    if (!formData.customsClearanceCode.trim()) {
      errors.customsClearanceCode = 'Nomor Izin Pabean / Bea Cukai wajib diisi';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onShowToast('error', 'Validasi Gagal', 'Harap periksa isian manifes kargo yang ditandai merah.');
      return;
    }

    setIsSaving(true);
    const selectedVoyage = voyages.find(v => v.id === formData.voyageId);
    const voyageNumber = selectedVoyage ? selectedVoyage.voyageNumber : 'VOYAGE-DEFAULT';
    const vesselName = selectedVoyage ? selectedVoyage.vesselName : 'Armada Pelayaran';

    const cargoPayload: Omit<CargoManifest, 'id'> = {
      blNumber: formData.blNumber.trim().toUpperCase(),
      voyageId: formData.voyageId,
      voyageNumber,
      vesselName,
      shipper: formData.shipper.trim(),
      consignee: formData.consignee.trim(),
      cargoType: formData.cargoType,
      weightTons: parseFloat(formData.weightTons),
      quantityUnits: parseInt(formData.quantityUnits, 10),
      hazardousClass: formData.hazardousClass.trim(),
      customsClearanceCode: formData.customsClearanceCode.trim().toUpperCase(),
      status: formData.status,
      notes: formData.notes.trim()
    };

    try {
      if (editingCargo && editingCargo.id) {
        onShowToast('loading', 'Menyimpan Perubahan', `Memperbarui manifes ${cargoPayload.blNumber} di Firebase...`);
        await updateCargoManifest(editingCargo.id, cargoPayload);
        onShowToast('success', 'Manifes Diperbarui', `Manifes B/L ${cargoPayload.blNumber} berhasil diperbarui.`);
      } else {
        onShowToast('loading', 'Mendaftarkan Manifes', `Menyimpan manifes ${cargoPayload.blNumber} ke Firestore...`);
        await addCargoManifest(cargoPayload);
        onShowToast('success', 'Manifes Didaftarkan', `Kargo ${cargoPayload.blNumber} berhasil ditambahkan ke manifes.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save cargo error:', err);
      onShowToast('error', 'Gagal Menyimpan Data', err.message || 'Terjadi kesalahan pada Firebase Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (cargo: CargoManifest) => {
    if (!cargo.id) return;
    onRequestDelete(
      'Konfirmasi Hapus Manifes Kargo',
      `${cargo.blNumber} - ${cargo.shipper} &rarr; ${cargo.consignee}`,
      'Manifes Kargo B/L',
      async () => {
        onShowToast('loading', 'Menghapus Manifes', `Menghapus ${cargo.blNumber} dari database Firestore...`);
        try {
          await deleteCargoManifest(cargo.id!);
          onShowToast('success', 'Manifes Dihapus', `Data kargo B/L ${cargo.blNumber} berhasil dihapus.`);
        } catch (err: any) {
          console.error('Delete error:', err);
          onShowToast('error', 'Gagal Menghapus', err.message || 'Tidak dapat menghapus data dari Firebase.');
        }
      }
    );
  };

  const filteredCargo = cargoList.filter((c) => {
    const matchesSearch =
      c.blNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shipper.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.consignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customsClearanceCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || c.cargoType === selectedType;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: CargoStatus) => {
    switch (status) {
      case 'Dalam Perjalanan':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Di Dalam Palka/Kapal':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Siap Muat':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Bongkar Pelabuhan':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Terkirim':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-blue-600" />
            <span>Manifes Kargo & Kontainer (B/L)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan Bill of Lading, berat muatan, izin pabean bea cukai, dan pelacakan status logistik.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Manifes Kargo</span>
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
            placeholder="Cari nomor B/L, pengirim, penerima, bea cukai..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50/50"
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
            <option value="all">Semua Jenis Kargo</option>
            {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">Semua Status Kargo</option>
            {CARGO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">No. Bill of Lading (B/L)</th>
                <th className="py-3.5 px-4">Pengirim & Penerima</th>
                <th className="py-3.5 px-4">Jenis & Berat Muatan</th>
                <th className="py-3.5 px-4">Kapal / Pelayaran</th>
                <th className="py-3.5 px-4">Izin Bea Cukai & Status</th>
                <th className="py-3.5 px-4 text-right sm:pr-6">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading && cargoList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Memuat data kargo dari Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCargo.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Tidak ada data manifes kargo</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tambahkan kargo baru melalui formulir di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCargo.map((item) => (
                  <tr key={item.id || item.blNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight font-mono text-xs text-blue-700">
                            {item.blNumber}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.quantityUnits} Satuan / Unit Kontainer
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs">
                        <span className="text-slate-400 font-medium">Dari:</span>{' '}
                        <span className="font-semibold text-slate-900">{item.shipper}</span>
                      </div>
                      <div className="text-xs mt-0.5">
                        <span className="text-slate-400 font-medium">Kpd:</span>{' '}
                        <span className="font-semibold text-slate-700">{item.consignee}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {item.cargoType}
                      </div>
                      <div className="text-xs font-bold text-blue-700 mt-0.5">
                        {item.weightTons.toLocaleString('id-ID')} Ton
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.hazardousClass}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-semibold text-slate-800">
                        {item.vesselName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.voyageNumber}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(item.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                      <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{item.customsClearanceCode}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Ubah Manifes Kargo"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          title="Hapus Manifes dari Database"
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

      {/* Modal Add / Edit Cargo with Validation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingCargo ? 'Ubah Manifes Kargo (B/L)' : 'Pendaftaran Manifes Kargo Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Disimpan langsung ke database Firebase Firestore.
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

            <form onSubmit={handleSaveCargo} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* No Bill of Lading */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nomor Bill of Lading (B/L) *
                  </label>
                  <input
                    type="text"
                    value={formData.blNumber}
                    onChange={(e) => setFormData({ ...formData, blNumber: e.target.value.toUpperCase() })}
                    placeholder="Contoh: BL-SN-2026-9901"
                    className={`w-full px-3.5 py-2 rounded-xl border font-mono text-sm focus:outline-none ${
                      formErrors.blNumber ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.blNumber && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.blNumber}</p>}
                </div>

                {/* Pelayaran Terkait */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Alokasi Pelayaran / Kapal *
                  </label>
                  <select
                    value={formData.voyageId}
                    onChange={(e) => setFormData({ ...formData, voyageId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Pilih Jadwal Pelayaran --</option>
                    {voyages.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.voyageNumber} - {v.vesselName} ({v.originPort} &rarr; {v.destinationPort})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pengirim (Shipper) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nama Pengirim (Shipper) *
                  </label>
                  <input
                    type="text"
                    value={formData.shipper}
                    onChange={(e) => setFormData({ ...formData, shipper: e.target.value })}
                    placeholder="Contoh: PT Astra Otoparts Tbk"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.shipper ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.shipper && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.shipper}</p>}
                </div>

                {/* Penerima (Consignee) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nama Penerima (Consignee) *
                  </label>
                  <input
                    type="text"
                    value={formData.consignee}
                    onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
                    placeholder="Contoh: PT Surabaya Distribusi Logistik"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.consignee ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.consignee && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.consignee}</p>}
                </div>

                {/* Jenis Kargo */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Jenis Muatan Kargo *
                  </label>
                  <select
                    value={formData.cargoType}
                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value as CargoType })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-600"
                  >
                    {CARGO_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Berat Muatan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Total Berat Muatan (Ton) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={formData.weightTons}
                    onChange={(e) => setFormData({ ...formData, weightTons: e.target.value })}
                    placeholder="250.5"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.weightTons ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.weightTons && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.weightTons}</p>}
                </div>

                {/* Jumlah Unit */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Jumlah Satuan / Unit Kontainer *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.quantityUnits}
                    onChange={(e) => setFormData({ ...formData, quantityUnits: e.target.value })}
                    placeholder="18"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                      formErrors.quantityUnits ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.quantityUnits && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.quantityUnits}</p>}
                </div>

                {/* Kode Pabean Bea Cukai */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Izin Pabean / Bea Cukai (BC2.0 / BC3.0) *
                  </label>
                  <input
                    type="text"
                    value={formData.customsClearanceCode}
                    onChange={(e) => setFormData({ ...formData, customsClearanceCode: e.target.value.toUpperCase() })}
                    placeholder="BC2.0-891274-JKT"
                    className={`w-full px-3.5 py-2 rounded-xl border font-mono text-sm focus:outline-none ${
                      formErrors.customsClearanceCode ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.customsClearanceCode && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.customsClearanceCode}</p>}
                </div>

                {/* Status Kargo */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status Kargo *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CargoStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-600"
                  >
                    {CARGO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Klasifikasi Bahaya */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Klasifikasi Bahaya (IMO Dangerous Goods)
                  </label>
                  <input
                    type="text"
                    value={formData.hazardousClass}
                    onChange={(e) => setFormData({ ...formData, hazardousClass: e.target.value })}
                    placeholder="Non-Hazardous / IMO Class 3"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Catatan / Keterangan Muatan */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Deskripsi Detail Muatan / Instruksi Penanganan
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Instruksi handling suhu dingin, penataan di palka kapal, segel kontainer..."
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
                      <span>{editingCargo ? 'Simpan Perubahan' : 'Daftarkan Manifes'}</span>
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
