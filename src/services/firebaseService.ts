import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Vessel, Voyage, CargoManifest, Port } from '../types/shipping';

const VESSELS_COLLECTION = 'vessels';
const VOYAGES_COLLECTION = 'voyages';
const CARGO_COLLECTION = 'cargo_manifests';
const PORTS_COLLECTION = 'ports';

// ==================== VESSELS CRUD ====================

export function subscribeVessels(
  onData: (vessels: Vessel[]) => void,
  onError: (error: Error) => void
) {
  const q = query(collection(db, VESSELS_COLLECTION), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const vessels: Vessel[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Vessel));
      onData(vessels);
    },
    (err) => {
      console.error('Firestore subscribeVessels error:', err);
      onError(err);
    }
  );
}

export async function addVessel(vessel: Omit<Vessel, 'id'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, VESSELS_COLLECTION), {
    ...vessel,
    createdAt: now,
    updatedAt: now,
    _serverTimestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function updateVessel(id: string, vessel: Partial<Vessel>): Promise<void> {
  const docRef = doc(db, VESSELS_COLLECTION, id);
  await updateDoc(docRef, {
    ...vessel,
    updatedAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp()
  });
}

export async function deleteVessel(id: string): Promise<void> {
  const docRef = doc(db, VESSELS_COLLECTION, id);
  await deleteDoc(docRef);
}

// ==================== VOYAGES CRUD ====================

export function subscribeVoyages(
  onData: (voyages: Voyage[]) => void,
  onError: (error: Error) => void
) {
  const q = query(collection(db, VOYAGES_COLLECTION), orderBy('departureDate', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const voyages: Voyage[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Voyage));
      onData(voyages);
    },
    (err) => {
      console.error('Firestore subscribeVoyages error:', err);
      onError(err);
    }
  );
}

export async function addVoyage(voyage: Omit<Voyage, 'id'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, VOYAGES_COLLECTION), {
    ...voyage,
    createdAt: now,
    updatedAt: now,
    _serverTimestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function updateVoyage(id: string, voyage: Partial<Voyage>): Promise<void> {
  const docRef = doc(db, VOYAGES_COLLECTION, id);
  await updateDoc(docRef, {
    ...voyage,
    updatedAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp()
  });
}

export async function deleteVoyage(id: string): Promise<void> {
  const docRef = doc(db, VOYAGES_COLLECTION, id);
  await deleteDoc(docRef);
}

// ==================== CARGO MANIFESTS CRUD ====================

export function subscribeCargo(
  onData: (cargo: CargoManifest[]) => void,
  onError: (error: Error) => void
) {
  const q = query(collection(db, CARGO_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CargoManifest[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      } as CargoManifest));
      onData(items);
    },
    (err) => {
      console.error('Firestore subscribeCargo error:', err);
      onError(err);
    }
  );
}

export async function addCargoManifest(cargo: Omit<CargoManifest, 'id'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, CARGO_COLLECTION), {
    ...cargo,
    createdAt: now,
    updatedAt: now,
    _serverTimestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function updateCargoManifest(id: string, cargo: Partial<CargoManifest>): Promise<void> {
  const docRef = doc(db, CARGO_COLLECTION, id);
  await updateDoc(docRef, {
    ...cargo,
    updatedAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp()
  });
}

export async function deleteCargoManifest(id: string): Promise<void> {
  const docRef = doc(db, CARGO_COLLECTION, id);
  await deleteDoc(docRef);
}

// ==================== PORTS CRUD ====================

export function subscribePorts(
  onData: (ports: Port[]) => void,
  onError: (error: Error) => void
) {
  const q = query(collection(db, PORTS_COLLECTION), orderBy('portName', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const ports: Port[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Port));
      onData(ports);
    },
    (err) => {
      console.error('Firestore subscribePorts error:', err);
      onError(err);
    }
  );
}

export async function addPort(port: Omit<Port, 'id'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, PORTS_COLLECTION), {
    ...port,
    createdAt: now,
    updatedAt: now,
    _serverTimestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function updatePort(id: string, port: Partial<Port>): Promise<void> {
  const docRef = doc(db, PORTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...port,
    updatedAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp()
  });
}

export async function deletePort(id: string): Promise<void> {
  const docRef = doc(db, PORTS_COLLECTION, id);
  await deleteDoc(docRef);
}

// ==================== DEFAULT INITIAL SEED DATA ====================

export async function checkAndSeedInitialDatabase(): Promise<boolean> {
  try {
    const vesselsSnap = await getDocs(collection(db, VESSELS_COLLECTION));
    if (!vesselsSnap.empty) {
      return false; // Database already populated
    }

    // Default Indonesian Ports
    const initialPorts: Omit<Port, 'id'>[] = [
      {
        portCode: 'IDTPP',
        portName: 'Pelabuhan Tanjung Priok',
        city: 'Jakarta Utara',
        province: 'DKI Jakarta',
        country: 'Indonesia',
        maxDraftMeters: 14.5,
        activeBerths: 32,
        terminalCapacityTeu: 7500000,
        isOpen: true,
        contactVHF: 'CH 12 / 16 (Priok VTS)',
        createdAt: new Date().toISOString()
      },
      {
        portCode: 'IDSUB',
        portName: 'Pelabuhan Tanjung Perak',
        city: 'Surabaya',
        province: 'Jawa Timur',
        country: 'Indonesia',
        maxDraftMeters: 12.0,
        activeBerths: 24,
        terminalCapacityTeu: 3800000,
        isOpen: true,
        contactVHF: 'CH 14 / 16 (Perak Radio)',
        createdAt: new Date().toISOString()
      },
      {
        portCode: 'IDMAK',
        portName: 'Pelabuhan Soekarno-Hatta Makassar',
        city: 'Makassar',
        province: 'Sulawesi Selatan',
        country: 'Indonesia',
        maxDraftMeters: 11.5,
        activeBerths: 16,
        terminalCapacityTeu: 1500000,
        isOpen: true,
        contactVHF: 'CH 16 (Makassar Port)',
        createdAt: new Date().toISOString()
      },
      {
        portCode: 'IDBLW',
        portName: 'Pelabuhan Belawan',
        city: 'Medan',
        province: 'Sumatera Utara',
        country: 'Indonesia',
        maxDraftMeters: 10.8,
        activeBerths: 14,
        terminalCapacityTeu: 1200000,
        isOpen: true,
        contactVHF: 'CH 16 (Belawan Traffic)',
        createdAt: new Date().toISOString()
      }
    ];

    for (const port of initialPorts) {
      await addDoc(collection(db, PORTS_COLLECTION), port);
    }

    // Default Vessels
    const initialVessels: Omit<Vessel, 'id'>[] = [
      {
        name: 'KM Samudera Perkasa',
        imoNumber: '9482104',
        callSign: 'PKSP-01',
        vesselType: 'Kontainer',
        dwt: 28500,
        teuCapacity: 2100,
        yearBuilt: 2019,
        flag: 'Indonesia 🇮🇩',
        currentPort: 'Pelabuhan Tanjung Priok',
        status: 'Berlayar',
        currentSpeedKnots: 15.8,
        captainName: 'Capt. Hendra Gunawan, M.Mar',
        notes: 'Kapal kontainer utama rute Jakarta - Surabaya - Makassar',
        createdAt: new Date().toISOString()
      },
      {
        name: 'MT Nusantara Bahari',
        imoNumber: '9653421',
        callSign: 'PKNB-02',
        vesselType: 'Tanker',
        dwt: 45000,
        yearBuilt: 2021,
        flag: 'Indonesia 🇮🇩',
        currentPort: 'Pelabuhan Belawan',
        status: 'Sandar',
        currentSpeedKnots: 0.0,
        captainName: 'Capt. Bambang Suryono',
        notes: 'Tanker pengangkut minyak sawit mentah (CPO) dan BBM industri',
        createdAt: new Date().toISOString()
      },
      {
        name: 'MV Baruna Raya',
        imoNumber: '9345112',
        callSign: 'PKBR-03',
        vesselType: 'Bulk Carrier',
        dwt: 56000,
        yearBuilt: 2018,
        flag: 'Indonesia 🇮🇩',
        currentPort: 'Pelabuhan Soekarno-Hatta Makassar',
        status: 'Labuh Jangkar',
        currentSpeedKnots: 0.0,
        captainName: 'Capt. Agus Riyadi, M.Mar',
        notes: 'Curah kering: pengangkutan batubara, klinker semen, dan bijih nikel',
        createdAt: new Date().toISOString()
      },
      {
        name: 'KM Dharma Samudera',
        imoNumber: '9784320',
        callSign: 'PKDS-04',
        vesselType: 'Ro-Ro',
        dwt: 12000,
        yearBuilt: 2022,
        flag: 'Indonesia 🇮🇩',
        currentPort: 'Pelabuhan Tanjung Perak',
        status: 'Berlayar',
        currentSpeedKnots: 14.2,
        captainName: 'Capt. Slamet Wahyudi',
        notes: 'Ferry kargo & logistik kendaraan rute Surabaya - Banjarmasin',
        createdAt: new Date().toISOString()
      }
    ];

    for (const vessel of initialVessels) {
      await addDoc(collection(db, VESSELS_COLLECTION), vessel);
    }

    // Default Voyages
    const initialVoyages: Omit<Voyage, 'id'>[] = [
      {
        voyageNumber: 'VYG-2026-JKT-SBY-088',
        vesselId: 'vessel-demo-1',
        vesselName: 'KM Samudera Perkasa',
        originPort: 'Pelabuhan Tanjung Priok',
        destinationPort: 'Pelabuhan Tanjung Perak',
        departureDate: '2026-09-16T08:00',
        arrivalEstimateDate: '2026-09-18T14:00',
        status: 'Dalam Pelayaran',
        distanceNauticalMiles: 410,
        cargoSummary: '1,450 TEU Kontainer Elektronik & Manufaktur Konsumsi',
        fuelEstimatedTons: 42.5,
        createdAt: new Date().toISOString()
      },
      {
        voyageNumber: 'VYG-2026-BLW-JKT-042',
        vesselId: 'vessel-demo-2',
        vesselName: 'MT Nusantara Bahari',
        originPort: 'Pelabuhan Belawan',
        destinationPort: 'Pelabuhan Tanjung Priok',
        departureDate: '2026-09-19T10:00',
        arrivalEstimateDate: '2026-09-22T06:00',
        status: 'Dijadwalkan',
        distanceNauticalMiles: 820,
        cargoSummary: '38,000 Ton CPO Berkualitas Tinggi',
        fuelEstimatedTons: 78.0,
        createdAt: new Date().toISOString()
      },
      {
        voyageNumber: 'VYG-2026-SBY-MAK-019',
        vesselId: 'vessel-demo-4',
        vesselName: 'KM Dharma Samudera',
        originPort: 'Pelabuhan Tanjung Perak',
        destinationPort: 'Pelabuhan Soekarno-Hatta Makassar',
        departureDate: '2026-09-17T04:00',
        arrivalEstimateDate: '2026-09-19T11:00',
        status: 'Dalam Pelayaran',
        distanceNauticalMiles: 520,
        cargoSummary: '140 Truk Logistik Sembako & Bahan Pokok Kawasan Timur',
        fuelEstimatedTons: 54.0,
        createdAt: new Date().toISOString()
      }
    ];

    for (const voyage of initialVoyages) {
      await addDoc(collection(db, VOYAGES_COLLECTION), voyage);
    }

    // Default Cargo Manifests
    const initialCargo: Omit<CargoManifest, 'id'>[] = [
      {
        blNumber: 'BL-JKT-SBY-20260901',
        voyageId: 'voyage-demo-1',
        voyageNumber: 'VYG-2026-JKT-SBY-088',
        vesselName: 'KM Samudera Perkasa',
        shipper: 'PT Astra Otoparts Tbk',
        consignee: 'PT Surabaya Distribusi Logistik',
        cargoType: 'Kontainer 40ft',
        weightTons: 245.5,
        quantityUnits: 18,
        hazardousClass: 'Non-Hazardous',
        customsClearanceCode: 'BC2.0-891274-JKT',
        status: 'Dalam Perjalanan',
        notes: 'Muatan komponen otomotif dan suku cadang presisi',
        createdAt: new Date().toISOString()
      },
      {
        blNumber: 'BL-BLW-JKT-20260902',
        voyageId: 'voyage-demo-2',
        voyageNumber: 'VYG-2026-BLW-JKT-042',
        vesselName: 'MT Nusantara Bahari',
        shipper: 'PT Perkebunan Nusantara III',
        consignee: 'PT Salim Ivomas Pratama',
        cargoType: 'Cairan/Minyak',
        weightTons: 18500.0,
        quantityUnits: 1,
        hazardousClass: 'IMO Class 3 / Suhu Terkontrol',
        customsClearanceCode: 'BC3.0-449102-BLW',
        status: 'Siap Muat',
        notes: 'Minyak sawit mentah (Crude Palm Oil) spesifikasi ekspor & industri',
        createdAt: new Date().toISOString()
      },
      {
        blNumber: 'BL-SBY-MAK-20260903',
        voyageId: 'voyage-demo-3',
        voyageNumber: 'VYG-2026-SBY-MAK-019',
        vesselName: 'KM Dharma Samudera',
        shipper: 'PT Indofood CBP Sukses Makmur',
        consignee: 'CV Celebes Makmur Sejahtera',
        cargoType: 'Kontainer 20ft',
        weightTons: 420.0,
        quantityUnits: 25,
        hazardousClass: 'Non-Hazardous',
        customsClearanceCode: 'BC2.0-550198-SBY',
        status: 'Dalam Perjalanan',
        notes: 'Bahan pangan dan sembako konsumsi Sulawesi',
        createdAt: new Date().toISOString()
      }
    ];

    for (const cargo of initialCargo) {
      await addDoc(collection(db, CARGO_COLLECTION), cargo);
    }

    return true;
  } catch (err) {
    console.error('Error seeding initial data to Firestore:', err);
    return false;
  }
}
