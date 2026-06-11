import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, Lock, Database, AlertCircle, ArrowRight, Activity, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  instansiName: string;
  instansiLogoBase64?: string;
  copyrightText: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function Login({ 
  users, 
  onLoginSuccess, 
  instansiName, 
  instansiLogoBase64, 
  copyrightText,
  theme = 'light',
  onToggleTheme 
}: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      onLoginSuccess(matchedUser);
    } else {
      setError('Username atau password salah. Silakan coba kembali.');
    }
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    const matchedUser = users.find((u) => u.username === uname);
    if (matchedUser) {
      onLoginSuccess(matchedUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="login-container">
      {/* Upper Empty Area / Header with Theme Switcher */}
      <div className="w-full flex justify-end p-6">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:scale-105 transition-all text-xs font-bold gap-2 cursor-pointer float-right"
            title="Ganti Tema Mode"
            type="button"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="text-slate-700 font-semibold text-[11px] hidden sm:inline">Mode Gelap</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-amber-400 font-semibold text-[11px] hidden sm:inline">Mode Terang</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center">
        {/* Brand Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-8"
        >
          {instansiLogoBase64 ? (
            <img 
              src={instansiLogoBase64} 
              alt="Logo Instansi" 
              className="h-24 w-24 object-contain mb-4 rounded-lg bg-white p-2 shadow-md border border-slate-100" 
              referrerPolicy="no-referrer"
            />
          ) : (
            /* Beautiful Vector SVG of UPTD PSDA PU Crest */
            <div className="h-24 w-24 mb-4 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg border-2 border-amber-400 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-cyan-500 opacity-80"></div>
              {/* Custom Hydrological Crest */}
              <div className="z-10 flex flex-col items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-14 h-14 text-amber-300 fill-current">
                  {/* Mountain Wave Symbol */}
                  <path d="M20 70 L35 45 L50 65 L65 35 L80 70 Z" className="fill-blue-900/40 stroke-amber-400 stroke-2" />
                  {/* Dam Wave lines */}
                  <path d="M10 82 Q25 75 40 82 T70 82 T100 82" className="fill-none stroke-blue-200 stroke-2" />
                  <path d="M10 88 Q25 82 40 88 T70 88 T100 88" className="fill-none stroke-blue-300 stroke-2" />
                  {/* Irrigation Gate line */}
                  <rect x="42" y="25" width="16" height="15" rx="2" className="fill-amber-400 text-blue-900" />
                  <line x1="50" y1="20" x2="50" y2="25" className="stroke-amber-400 stroke-2" />
                </svg>
                <span className="text-[9px] font-bold tracking-widest text-amber-300 mt-1 uppercase">PSDA</span>
              </div>
            </div>
          )}

          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 uppercase tracking-tight max-w-sm">
            Sistem Informasi Terpadu
          </h1>
          <p className="text-sm font-semibold text-blue-600 mt-1 uppercase tracking-wider">
            {instansiName}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Provinsi Sumatera Utara
          </p>
        </motion.div>

        {/* Login Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Masuk ke Sistem</h2>
            <p className="text-xs text-slate-500">Gunakan akun Anda untuk mengelola penatausahaan, pembangunan, &amp; operasional.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start bg-red-50 text-red-700 p-3 rounded-lg text-xs space-x-2 border border-red-100" id="login-error-msg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username anda"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center space-x-2 pointer-cursor"
            >
              <span>Autentikasi Masuk</span>
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </button>
          </form>

          {/* Quick Login Section for Developer Convenience */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              Pintas Masuk Cepat (Akses Cepat)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                id="quick-login-admin"
                className="p-2 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-xl text-left transition-all group pointer-cursor"
              >
                <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-blue-800">
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Akses penuh sistem &amp; pengaturan</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pembangunan', 'staff123')}
                id="quick-login-staff-pemb"
                className="p-2 border border-cyan-100 bg-cyan-50/50 hover:bg-cyan-50 text-cyan-800 rounded-xl text-left transition-all group pointer-cursor"
              >
                <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-cyan-900">
                  <Database className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Pembangunan</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Input progress fisik proyek</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operasional', 'staff123')}
                id="quick-login-staff-oper"
                className="p-2 border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-800 rounded-xl text-left transition-all group pointer-cursor"
              >
                <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-indigo-900">
                  <Activity className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Operasional</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Debit air &amp; kerusakan irigasi</p>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer copyright */}
      <div className="text-center py-6 text-xs text-slate-400 font-medium px-4">
        {copyrightText}
      </div>
    </div>
  );
}
