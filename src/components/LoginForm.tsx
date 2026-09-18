import { useState } from 'react';
import { Ship, Lock, Mail, ArrowRight, ShieldCheck, Database, KeyRound, CheckCircle2, UserCheck, Eye, EyeOff } from 'lucide-react';
import { DEMO_ACCOUNTS, DemoAccount, loginUser } from '../services/authService';
import { AppUser } from '../types/shipping';

interface Props {
  onLoginSuccess: (user: AppUser) => void;
  onShowToast: (type: 'loading' | 'success' | 'error' | 'info', title: string, message: string) => void;
}

export default function LoginForm({ onLoginSuccess, onShowToast }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoAccount | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Username atau email wajib diisi';
    } else if (!trimmedEmail.includes('@') && trimmedEmail.length < 3) {
      errors.email = 'Format username/email tidak valid';
    }

    if (!password) {
      errors.password = 'Kata sandi wajib diisi';
    } else if (password.length < 5) {
      errors.password = 'Kata sandi minimal 5 karakter';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    onShowToast('loading', 'Memverifikasi Kredensial', 'Menghubungkan ke server otentikasi Firebase Firestore...');

    try {
      const user = await loginUser(email, password);
      onShowToast('success', 'Login Berhasil', `Selamat datang kembali, ${user.displayName}! Mengakses portal operasional armada.`);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Login error:', err);
      onShowToast('error', 'Otentikasi Gagal', err.message || 'Kredensial tidak valid atau gangguan koneksi database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoClick = async (demo: DemoAccount) => {
    setSelectedDemo(demo);
    setEmail(demo.email);
    setPassword('Samudera2026!');
    setFieldErrors({});

    // Immediate quick login execution for high usability
    setIsLoading(true);
    onShowToast('loading', 'Quick Login Aktif', `Mengotentikasi akun demo ${demo.role}...`);

    try {
      const user = await loginUser(demo.email, 'Samudera2026!');
      onShowToast('success', 'Otentikasi Berhasil', `Berhasil masuk sebagai ${demo.name} (${demo.role})`);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Quick login error:', err);
      onShowToast('error', 'Login Demo Gagal', 'Gagal menyambung ke Firebase Auth.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-blue-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Brand Visual & Enterprise Information */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-sky-800 to-indigo-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
          {/* Subtle wave / nautical decorative accents */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200 mb-6">
              <Ship className="w-4 h-4 text-sky-300" />
              <span>Sistem Manajemen Pelayaran Terpadu</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              PT Samudera Nusantara Shipping Lines
            </h1>
            <p className="text-sky-100/90 text-sm mt-3 leading-relaxed">
              Platform operasional armada kapal niaga terintegrasi. Pemantauan rute pelayaran, pergerakan kapal, manifes kargo, dan izin pelabuhan secara real-time.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-sky-300 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-200">Arsitektur Database</h4>
                  <p className="text-xs text-white/90 font-medium mt-0.5">
                    Real Firebase Firestore Production (Tanpa LocalStorage)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">Validasi & Keamanan</h4>
                  <p className="text-xs text-white/90 font-medium mt-0.5">
                    Role-Based Access Control & Standar Maritim Internasional IMO
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-sky-200/80">
            <span>Versi Produksi 2026.1</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Firestore Aktif
            </span>
          </div>
        </div>

        {/* Right Side: Bright Modern Login Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 flex flex-col justify-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Portal Operasional
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Silakan masukkan akun resmi atau pilih <strong className="text-blue-700">Quick Demo Login</strong> di bawah.
            </p>
          </div>

          {/* Quick Demo Login Selector */}
          <div className="mt-6 mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Akses Cepat Demo (Quick Login 1-Klik):
              </span>
              <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                Siap Klik
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {DEMO_ACCOUNTS.map((demo) => {
                const isCurrent = selectedDemo?.email === demo.email;
                return (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleQuickDemoClick(demo)}
                    disabled={isLoading}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {demo.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {demo.name}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${demo.badgeColor}`}>
                            {demo.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {demo.email}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Atau Masuk Manual
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username / Email Petugas
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  placeholder="admin@pelayaran-samudera.id"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? 'border-rose-300 bg-rose-50/20 focus:ring-rose-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 font-medium mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kata Sandi (Password)
                </label>
                <span className="text-[11px] text-slate-400">Demo pwd: Samudera2026!</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-rose-300 bg-rose-50/20 focus:ring-rose-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-600 font-medium mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi ke Firebase Firestore...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Masuk Portal Pelayaran</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Keamanan Terverifikasi SSL &bull; Standar Pelayaran Niaga Republik Indonesia
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
