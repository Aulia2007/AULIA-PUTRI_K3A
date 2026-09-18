export type VesselType = 'Kontainer' | 'Tanker' | 'Bulk Carrier' | 'Ro-Ro' | 'General Cargo' | 'Tugboat';

export type VesselStatus = 'Berlayar' | 'Sandar' | 'Perawatan' | 'Labuh Jangkar';

export interface Vessel {
  id?: string;
  name: string;
  imoNumber: string; // 7 digits
  callSign: string;
  vesselType: VesselType;
  dwt: number; // Deadweight tonnage
  teuCapacity?: number; // For container ships
  yearBuilt: number;
  flag: string;
  currentPort: string;
  status: VesselStatus;
  currentSpeedKnots: number;
  captainName: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type VoyageStatus = 'Dijadwalkan' | 'Dalam Pelayaran' | 'Sandar Tujuan' | 'Selesai' | 'Tertunda';

export interface Voyage {
  id?: string;
  voyageNumber: string; // e.g., VYG-2026-001
  vesselId: string;
  vesselName: string;
  originPort: string;
  destinationPort: string;
  departureDate: string; // ISO string YYYY-MM-DDTHH:mm
  arrivalEstimateDate: string; // ISO string YYYY-MM-DDTHH:mm
  actualArrivalDate?: string;
  status: VoyageStatus;
  distanceNauticalMiles: number;
  cargoSummary: string;
  fuelEstimatedTons: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CargoType = 'Kontainer 20ft' | 'Kontainer 40ft' | 'Curah Kering' | 'Cairan/Minyak' | 'Muatan Khusus/Alat Berat' | 'Kargo Berpendingin';
export type CargoStatus = 'Siap Muat' | 'Di Dalam Palka/Kapal' | 'Dalam Perjalanan' | 'Bongkar Pelabuhan' | 'Terkirim';

export interface CargoManifest {
  id?: string;
  blNumber: string; // Bill of Lading, e.g., BL-SN-9982
  voyageId: string;
  voyageNumber: string;
  vesselName: string;
  shipper: string; // Pengirim
  consignee: string; // Penerima
  cargoType: CargoType;
  weightTons: number;
  quantityUnits: number;
  hazardousClass?: string; // IMO Class or "Non-Hazardous"
  customsClearanceCode: string; // Kode Bea Cukai
  status: CargoStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Port {
  id?: string;
  portCode: string; // UN/LOCODE, e.g. IDTPP
  portName: string;
  city: string;
  province: string;
  country: string;
  maxDraftMeters: number;
  activeBerths: number;
  terminalCapacityTeu: number;
  isOpen: boolean;
  contactVHF: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'Direktur Operasional' | 'Manager Logistik' | 'Kepala Operasional Pelabuhan' | 'Admin Pelayaran';
  avatarInitials: string;
  department: string;
  lastLogin?: string;
}

export interface ToastFeedback {
  id: string;
  type: 'loading' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}
