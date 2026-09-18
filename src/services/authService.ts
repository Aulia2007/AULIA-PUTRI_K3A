import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut,
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AppUser } from '../types/shipping';

export interface DemoAccount {
  label: string;
  role: AppUser['role'];
  email: string;
  department: string;
  name: string;
  badgeColor: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Direktur Operasional (Fleet Director)',
    role: 'Direktur Operasional',
    email: 'admin@pelayaran-samudera.id',
    department: 'Divisi Operasional & Manajemen Armada',
    name: 'Capt. Aris Munandar, M.Mar',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200'
  },
  {
    label: 'Manager Logistik & Kargo',
    role: 'Manager Logistik',
    email: 'logistik@pelayaran-samudera.id',
    department: 'Divisi Manifes, Kontainer & Pergudangan',
    name: 'Ir. Maya Safitri',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    label: 'Kepala Operasional Pelabuhan (Port Master)',
    role: 'Kepala Operasional Pelabuhan',
    email: 'portmaster@pelayaran-samudera.id',
    department: 'Divisi Sandar Dermaga & Traffic Pelabuhan',
    name: 'Bambang Sudrajat, S.ST.Pel',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  }
];

export async function loginUser(email: string, password: string): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();
  
  // Find matching demo user info or use defaults
  const matchedDemo = DEMO_ACCOUNTS.find(d => d.email.toLowerCase() === cleanEmail);
  const displayName = matchedDemo ? matchedDemo.name : cleanEmail.split('@')[0].toUpperCase();
  const role: AppUser['role'] = matchedDemo ? matchedDemo.role : 'Admin Pelayaran';
  const department = matchedDemo ? matchedDemo.department : 'Divisi Administrasi Pelayaran';
  const avatarInitials = displayName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');

  try {
    let fbUser: FirebaseUser | null = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      fbUser = userCredential.user;
    } catch (authErr: any) {
      // If user doesn't exist yet in Firebase Auth, create it automatically
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        try {
          const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          fbUser = newCredential.user;
        } catch {
          // If creation also fails (e.g. email provider not enabled in GCP), fallback to anonymous sign in
          const anonCred = await signInAnonymously(auth);
          fbUser = anonCred.user;
        }
      } else if (authErr.code === 'auth/operation-not-allowed' || authErr.code === 'auth/admin-restricted-operation') {
        // Fallback to anonymous auth seamlessly
        const anonCred = await signInAnonymously(auth);
        fbUser = anonCred.user;
      } else {
        throw authErr;
      }
    }

    const uid = fbUser?.uid || `user-${Date.now()}`;
    const userProfile: AppUser = {
      uid,
      email: cleanEmail,
      displayName,
      role,
      department,
      avatarInitials: avatarInitials || 'AP',
      lastLogin: new Date().toISOString()
    };

    // Store user profile in Firestore
    try {
      await setDoc(doc(db, 'system_users', uid), userProfile, { merge: true });
    } catch (err) {
      console.warn('Firestore user profile save note:', err);
    }

    return userProfile;
  } catch (error: any) {
    // If network or provider restricts email/pass, fallback to authenticated guest session stored in Firestore
    console.warn('Fallback authentication with persistent profile in Firestore:', error);
    const fallbackUid = `user-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const userProfile: AppUser = {
      uid: fallbackUid,
      email: cleanEmail,
      displayName,
      role,
      department,
      avatarInitials: avatarInitials || 'AD',
      lastLogin: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'system_users', fallbackUid), userProfile, { merge: true });
    } catch (dbErr) {
      console.warn('DB note:', dbErr);
    }
    return userProfile;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('Signout note:', err);
  }
}

export function subscribeAuthState(
  onUserChanged: (user: AppUser | null) => void
) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      onUserChanged(null);
      return;
    }
    try {
      const userDoc = await getDoc(doc(db, 'system_users', fbUser.uid));
      if (userDoc.exists()) {
        onUserChanged(userDoc.data() as AppUser);
      } else {
        // Build user from email or default demo
        const email = fbUser.email || 'admin@pelayaran-samudera.id';
        const demo = DEMO_ACCOUNTS.find(d => d.email.toLowerCase() === email.toLowerCase());
        const profile: AppUser = {
          uid: fbUser.uid,
          email,
          displayName: demo ? demo.name : (fbUser.displayName || 'Admin Pelayaran'),
          role: demo ? demo.role : 'Direktur Operasional',
          department: demo ? demo.department : 'Divisi Operasional & Manajemen Armada',
          avatarInitials: 'AM',
          lastLogin: new Date().toISOString()
        };
        onUserChanged(profile);
      }
    } catch (err) {
      console.error('Error fetching user profile from Firestore:', err);
      // Fallback
      onUserChanged({
        uid: fbUser.uid,
        email: fbUser.email || 'admin@pelayaran-samudera.id',
        displayName: 'Capt. Aris Munandar, M.Mar',
        role: 'Direktur Operasional',
        department: 'Divisi Operasional & Manajemen Armada',
        avatarInitials: 'AM',
        lastLogin: new Date().toISOString()
      });
    }
  });
}
