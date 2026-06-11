import React, { useState, useRef } from 'react';
import { User, InstansiProfile, FooterConfig } from '../types';
import { 
  Building, 
  Users, 
  FileText, 
  Upload, 
  Trash2, 
  UserPlus, 
  Key, 
  ShieldAlert, 
  Check, 
  Globe, 
  Mail, 
  Phone, 
  UserCheck,
  Camera,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  currentUser: User;
  users: User[];
  profile: InstansiProfile;
  footer: FooterConfig;
  onUpdateProfile: (newProfile: InstansiProfile) => void;
  onUpdateFooter: (newFooter: FooterConfig) => void;
  onAddUser: (newUser: User) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (id: string) => void;
  onClearAllData: () => void;
}

export default function Settings({
  currentUser,
  users,
  profile,
  footer,
  onUpdateProfile,
  onUpdateFooter,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onClearAllData
}: SettingsProps) {
  const [activeSubPage, setActiveSubPage] = useState<'profil' | 'users' | 'footer' | 'clean'>('profil');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Drag and drop uploading state
  const [dragActive, setDragActive] = useState(false);

  // Instansi Form state
  const [instansiName, setInstansiName] = useState(profile.name);
  const [instansiAddress, setInstansiAddress] = useState(profile.address);
  const [instansiEmail, setInstansiEmail] = useState(profile.email);
  const [instansiPhone, setInstansiPhone] = useState(profile.phone);
  const [headName, setHeadName] = useState(profile.headName);
  const [headNip, setHeadNip] = useState(profile.headNip);
  const [instansiLogoBase64, setInstansiLogoBase64] = useState(profile.logo);

  // Users Form State
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedAccess, setSelectedAccess] = useState<string[]>(['pimpinan']);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // User Edit Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAccess, setEditAccess] = useState<string[]>([]);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

  // Footer Config Form state
  const [footerText, setFooterText] = useState(footer.footerText);
  const [copyrightText, setCopyrightText] = useState(footer.copyrightText);

  const [notification, setNotification] = useState('');

  // Access Guard
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center max-w-xl mx-auto my-12" id="settings-unauthorized">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-lg font-black text-slate-800">HK: Akses Terbatas Khusus Administrator</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Maaf, Anda login menggunakan akun staf ({currentUser.name}). Halaman panel pengaturan utama (pengelolaan profil dinas, pengubahan footer, & penambahan data pengguna baru) hanya dapat diakses oleh administrator pusat sistem.
        </p>
      </div>
    );
  }

  // Handle Logo Upload base64
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file bertipe gambar (PNG, JPG, JPEG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setInstansiLogoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoFile(e.target.files[0]);
    }
  };

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: instansiName,
      address: instansiAddress,
      email: instansiEmail,
      phone: instansiPhone,
      headName,
      headNip,
      logo: instansiLogoBase64
    });
    triggerNotification('Profil instansi berhasil diperbarui!');
  };

  // Footer Save
  const handleSaveFooter = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFooter({
      footerText,
      copyrightText
    });
    triggerNotification('Pengaturan catatan kaki (footer) & hak cipta diperbarui!');
  };

  // Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName || !newPassword) {
      alert('Isi username, nama lengkap dan password user baru!');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      alert('Username tersebut sudah digunakan oleh user lain.');
      return;
    }

    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substring(2, 9),
      username: newUsername.trim(),
      name: newName,
      role: selectedAccess.includes('all') ? 'admin' : 'staff',
      password: newPassword,
      section: selectedAccess.join(',')
    };

    onAddUser(newUser);

    // Reset User form
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    setSelectedAccess(['pimpinan']);
    setIsAddUserModalOpen(false);
    triggerNotification(`Pengguna @${newUser.username} berhasil didaftarkan!`);
  };

  // Edit User Handlers
  const handleEditUserClick = (u: User) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditName(u.name);
    setEditPassword(u.password || '');
    setEditAccess(u.section ? u.section.split(',') : []);
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editUsername || !editName || !editPassword) {
      alert('Isi username, nama lengkap dan password!');
      return;
    }

    if (users.some(u => u.id !== editingUser.id && u.username.toLowerCase() === editUsername.toLowerCase())) {
      alert('Username tersebut sudah digunakan oleh user lain.');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      username: editUsername.trim(),
      name: editName,
      role: editAccess.includes('all') ? 'admin' : 'staff',
      password: editPassword,
      section: editAccess.join(',')
    };

    onUpdateUser(updatedUser);
    setIsEditUserModalOpen(false);
    setEditingUser(null);
    triggerNotification(`Pengguna @${updatedUser.username} berhasil diperbarui!`);
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 4000);
  };

  return (
    <div className="space-y-6" id="settings-tab-content">
      {/* Settings Notification */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg flex items-center space-x-2 text-xs border border-emerald-500"
          id="settings-success-alert"
        >
          <Check className="w-4.5 h-4.5" />
          <span>{notification}</span>
        </motion.div>
      )}

      {/* Settings Header and Sub-menu Navigation */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sub-menu Navigation Left Panel */}
        <div className="w-full md:w-64 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm self-start h-auto space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3 mb-2">Sub Menu</span>
          
          <button
            onClick={() => setActiveSubPage('profil')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSubPage === 'profil'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="subpage-profil"
          >
            <Building className="w-4 h-4" />
            <span>Profil Resmi Instansi</span>
          </button>

          <button
            onClick={() => setActiveSubPage('users')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSubPage === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="subpage-users"
          >
            <Users className="w-4 h-4" />
            <span>Manajemen User / Sandi</span>
          </button>

          <button
            onClick={() => setActiveSubPage('footer')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSubPage === 'footer'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="subpage-footer"
          >
            <FileText className="w-4 h-4" />
            <span>Catatan Kaki & Hak Cipta</span>
          </button>

          <button
            onClick={() => setActiveSubPage('clean')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSubPage === 'clean'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'
            }`}
            id="subpage-clean"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sistem & Bersihkan Data</span>
          </button>
        </div>

        {/* Content Dynamic Area Right Panel */}
        <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          
          {/* SUBPAGE 1: PROFIL INSTANSI */}
          {activeSubPage === 'profil' && (
            <div className="space-y-6" id="settings-profile-section">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Identitas & Profil Instansi UPTD PSDA
                </h2>
                <p className="text-xs text-slate-500 mt-1">Daftarkan alamat, legalitas Kepala Kantor, beserta kustomisasi Logo Institusi daerah.</p>
              </div>

              {/* Logo Upload Section - Drag and Drop Zone */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Logo Resmi Instansi</span>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border border-slate-100 bg-slate-50 rounded-xl">
                  {/* Image Display */}
                  <div className="h-24 w-24 shrink-0 rounded-full border border-slate-200 bg-white flex items-center justify-center p-2 shadow-sm uppercase font-mono font-bold text-[10px] text-slate-400 relative group overflow-hidden">
                    {instansiLogoBase64 ? (
                      <img 
                        src={instansiLogoBase64} 
                        alt="Logo Preview" 
                        className="h-full w-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>Blm Ada Logo</span>
                    )}
                    {instansiLogoBase64 && (
                      <button 
                        onClick={() => setInstansiLogoBase64('')}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold cursor-pointer"
                        title="Hapus Logo"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>

                  {/* Drag drop Trigger box */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                    }`}
                    id="dropzone-logo"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      className="hidden" 
                      accept="image/*"
                    />
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Seret dan taruh berkas logo logo di sini</p>
                    <p className="text-[10px] text-slate-405 mt-1 text-slate-400">Atau klik untuk memilih file dari komputer (Format PNG/JPG maksimal 1MB)</p>
                  </div>
                </div>
              </div>

              {/* Form inputs */}
              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">Nama Resmi UPTD Instansi</label>
                  <input 
                    type="text"
                    value={instansiName}
                    onChange={(e) => setInstansiName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">Alamat Lengkap Kantor</label>
                  <input 
                    type="text"
                    value={instansiAddress}
                    onChange={(e) => setInstansiAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">E-mail Instansi (Dinas)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input 
                      type="email"
                      value={instansiEmail}
                      onChange={(e) => setInstansiEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Nomor Fax / Telepon Dinas</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input 
                      type="text"
                      value={instansiPhone}
                      onChange={(e) => setInstansiPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Nama Kepala/Kepala Sekolah/Instansi Utama</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <input 
                      type="text"
                      value={headName}
                      onChange={(e) => setHeadName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Nomor Induk Pegawai (NIP)</label>
                  <input 
                    type="text"
                    value={headNip}
                    onChange={(e) => setHeadNip(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    id="save-profile-btn"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow pointer-cursor"
                  >
                    Simpan Identitas Instansi
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUBPAGE 2: MANAGEMENT USERS */}
          {activeSubPage === 'users' && (
            <div className="space-y-6" id="settings-users-section">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  Manajemen Sanksi & Hak Akses Pengguna
                </h2>
                <p className="text-xs text-slate-500 mt-1">Daftarkan akun staf kedivisian baru atau ganti password masuk mereka.</p>
              </div>

              {/* Horizontal Layout of Users List & Create Form */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
               {/* Left side: Create User Form */}
                <div className="lg:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center space-y-4 text-xs h-auto max-h-fit">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 shadow-sm">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      Daftar Akun Pengguna Baru
                    </h3>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                      Tambahkan pengguna, staf seksi, atau pimpinan pelapor baru dengan hak akses spesifik ke sistem.
                    </p>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-sm cursor-pointer transition-colors"
                  >
                    + Daftarkan Anggota / Staf
                  </button>

                  <AnimatePresence>
                    {isAddUserModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none" onClick={() => setIsAddUserModalOpen(false)}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 15 }}
                          className="bg-white text-left p-6 rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                              <UserPlus className="w-4.5 h-4.5 text-blue-700" />
                              <span>Daftar Akun Baru</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setIsAddUserModalOpen(false)}
                              className="text-slate-400 hover:text-slate-650 font-bold text-xs cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>

                          <form onSubmit={handleAddUser} className="space-y-4 text-xs font-sans">
                            <div>
                              <label className="block font-bold text-slate-600 mb-1">Username Masuk</label>
                              <input 
                                type="text" 
                                placeholder="Contoh: stafbaru"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-600 mb-1">Nama Lengkap & Kode</label>
                              <input 
                                type="text" 
                                placeholder="Contoh: Indah Pertiwi, S.Ars."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-600 mb-1">Kata Sandi (Password)</label>
                              <input 
                                type="password" 
                                placeholder="Masukkan password aman"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:bg-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-600 mb-1.5">Hak Akses Sistem (Bisa pilih beberapa sekaligus)</label>
                              <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-100 bg-white p-3 rounded-lg divide-y divide-slate-100">
                                {[
                                  { value: 'pimpinan', label: 'Pimpinan (hanya melihat)' },
                                  { value: 'adm_umum', label: 'Adm umum (adm umum)' },
                                  { value: 'personalia', label: 'Personalia (hanya tambah data personalia tapi tidak dapat meng edit data)' },
                                  { value: 'aset', label: 'Aset (aset)' },
                                  { value: 'keuangan', label: 'Keuangan (keuangan)' },
                                  { value: 'operasional', label: 'Operasional (seksi operasional)' },
                                  { value: 'pembangunan', label: 'Pembangunan (seksi pembanguan)' },
                                  { value: 'staff', label: 'Staff (hanya pegawai yang menggunakan NIP sebagai username yang dapat mengedit data personalia)' },
                                  { value: 'all', label: 'Semua hak akses' },
                                ].map((opt) => {
                                  const isChecked = selectedAccess.includes(opt.value);
                                  return (
                                    <label key={opt.value} className="flex items-start space-x-2.5 py-1.5 first:pt-0 last:pb-0 cursor-pointer select-none">
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setSelectedAccess(selectedAccess.filter(v => v !== opt.value));
                                          } else {
                                            setSelectedAccess([...selectedAccess, opt.value]);
                                          }
                                        }}
                                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                      />
                                      <div className="text-[11px] text-slate-700 font-semibold leading-tight">
                                        {opt.label}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
                              <button
                                type="button"
                                onClick={() => setIsAddUserModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                              >
                                Batal
                              </button>
                              <button 
                                type="submit" 
                                id="save-new-user-btn"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg cursor-pointer transition-colors"
                              >
                                Daftarkan Anggota
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isEditUserModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none" onClick={() => {
                        setIsEditUserModalOpen(false);
                        setEditingUser(null);
                      }}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 15 }}
                          className="bg-white text-left p-6 rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-y-auto max-h-[90vh]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                              <Pencil className="w-4 h-4 text-blue-700" />
                              <span>Ubah Akun Pengguna</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditUserModalOpen(false);
                                setEditingUser(null);
                              }}
                              className="text-slate-400 hover:text-slate-650 font-bold text-xs cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>

                          <form onSubmit={handleUpdateUserSubmit} className="space-y-4 text-xs font-sans">
                            <div>
                              <label className="block font-bold text-slate-600 mb-1">Username Masuk</label>
                              <input 
                                type="text" 
                                placeholder="Contoh: stafbaru"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white disabled:opacity-50"
                                disabled={editingUser?.username === 'admin'}
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-600 mb-1">Nama Lengkap & Kode</label>
                              <input 
                                type="text" 
                                placeholder="Contoh: Indah Pertiwi, S.Ars."
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-600 mb-1">Kata Sandi (Password)</label>
                              <input 
                                type="password" 
                                placeholder="Masukkan password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:bg-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-600 mb-1.5">Hak Akses Sistem</label>
                              <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-100 bg-white p-3 rounded-lg divide-y divide-slate-100">
                                {[
                                  { value: 'pimpinan', label: 'Pimpinan (hanya melihat)' },
                                  { value: 'adm_umum', label: 'Adm umum (adm umum)' },
                                  { value: 'personalia', label: 'Personalia (hanya tambah data personalia)' },
                                  { value: 'aset', label: 'Aset (aset)' },
                                  { value: 'keuangan', label: 'Keuangan (keuangan)' },
                                  { value: 'operasional', label: 'Operasional (seksi operasional)' },
                                  { value: 'pembangunan', label: 'Pembangunan (seksi pembanguan)' },
                                  { value: 'staff', label: 'Staff (hanya NIP sebagai username)' },
                                  { value: 'all', label: 'Semua hak akses' },
                                ].map((opt) => {
                                  const isChecked = editAccess.includes(opt.value);
                                  return (
                                    <label key={opt.value} className="flex items-start space-x-2.5 py-1.5 first:pt-0 last:pb-0 cursor-pointer select-none">
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setEditAccess(editAccess.filter(v => v !== opt.value));
                                          } else {
                                            setEditAccess([...editAccess, opt.value]);
                                          }
                                        }}
                                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                      />
                                      <div className="text-[11px] text-slate-700 font-semibold leading-tight">
                                        {opt.label}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditUserModalOpen(false);
                                  setEditingUser(null);
                                }}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                              >
                                Batal
                              </button>
                              <button 
                                type="submit" 
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg cursor-pointer transition-colors"
                              >
                                Simpan Perubahan
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right side: List representation */}
                <div className="lg:col-span-3 space-y-4">
                  <h3 className="font-bold text-slate-800 text-xs">Akun Terdaftar ({users.length})</h3>
                  
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {users.map((u) => {
                      const getAccessLabel = (section: string) => {
                        if (!section) return '-';
                        const parts = section.split(',');
                        const labels = parts.map((part) => {
                          switch (part) {
                            case 'pimpinan':
                              return 'Pimpinan';
                            case 'adm_umum':
                              return 'Adm umum';
                            case 'personalia':
                              return 'Personalia';
                            case 'aset':
                              return 'Aset';
                            case 'keuangan':
                              return 'Keuangan';
                            case 'operasional':
                              return 'Operasional';
                            case 'pembangunan':
                              return 'Pembangunan';
                            case 'staff':
                              return 'Staff (NIP)';
                            case 'all':
                              return 'Semua Hak Akses (Administrator)';
                            case 'penatausahaan':
                              return 'Umum & Penatausahaan';
                            default:
                              return part;
                          }
                        });
                        return labels.join(', ');
                      };

                      return (
                        <div key={u.id} className="p-4 bg-white hover:bg-slate-50/50 flex items-center justify-between gap-2 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <strong className="text-slate-800 font-bold">{u.name}</strong>
                              <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                                u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {u.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Username: <span className="font-semibold text-blue-600 font-mono">@{u.username}</span> | Hak Akses: <strong className="text-slate-700">{getAccessLabel(u.section)}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleEditUserClick(u)}
                              className="text-blue-600 hover:bg-blue-50 p-1.5 border border-transparent hover:border-blue-100 rounded-lg transition-all cursor-pointer"
                              title="Edit Pengguna"
                              id={`edit-user-${u.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {u.username !== 'admin' ? (
                              <button
                                onClick={() => onDeleteUser(u.id)}
                                className="text-red-500 hover:bg-red-50 p-1.5 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"
                                title="Hapus Pengguna"
                                id={`delete-user-${u.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pr-1 select-none">Default</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBPAGE 3: FOOTER SETTINGS */}
          {activeSubPage === 'footer' && (
            <div className="space-y-6" id="settings-footer-section">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Kustomisasi Catatan Kaki (Footer) & Lisensi Hak Cipta
                </h2>
                <p className="text-xs text-slate-500 mt-1">Ubah atau sisipkan deskripsi dinas pada footer terbawah sistem beserta legalitas hak cipta.</p>
              </div>

              <form onSubmit={handleSaveFooter} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Informasi Kaki (Footer Deskriptif)</label>
                  <textarea 
                    rows={3}
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                    placeholder="Contoh: Sistem Informasi Terpadu UPTD PSDA Bah Bolon..."
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
                    Pernyataan deskripsi operasional atau instansi di pojok kiri bawah layout utama situs.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 font-sans">Pernyataan Hak Cipta (Copyright Line)</label>
                  <input 
                    type="text"
                    value={copyrightText}
                    onChange={(e) => setCopyrightText(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    placeholder="© 2026 UPTD PSDA Bah Bolon. Hak Cipta..."
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
                    Baris hak cipta yang muncul di bagian terbawah dari seluruh halaman portal web.
                  </span>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    id="save-footer-btn"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow cursor-pointer"
                  >
                    Simpan Baris Footer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUBPAGE 4: SYSTEM PURGE / CLEAN PAGE SINKRONISASI */}
          {activeSubPage === 'clean' && (
            <div className="space-y-6" id="settings-clean-section">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-650 text-red-650" />
                  Pembersihan Sistem & Penghapusan Seluruh Data Transaksi
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">Gunakan fitur ini untuk membersihkan dan mengosongkan seluruh data transaksi di semua halaman kerja instansi.</p>
              </div>

              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-800 space-y-2">
                <h4 className="font-bold flex items-center gap-2 text-red-900 uppercase">
                  Peringatan Khusus Administrator
                </h4>
                <p className="leading-relaxed">
                  Tindakan ini akan menghapus secara permanen seluruh dataset berikut dari memori kerja dan penyimpanan lokal browser Anda:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 pl-2 text-[11px] font-semibold text-slate-705">
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-500 shrink-0" /> Seluruh Register Arsip Surat Masuk/Keluar</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-500 shrink-0" /> Seluruh Profil Pegawai Terdaftar di Berbagai Seksi</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-500 shrink-0" /> Seluruh Paket Pembangunan & Keterangan Proyek</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-500 shrink-0" /> Seluruh Catatan Tinggi Muka Air (TMA) & Debit Air</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-500 shrink-0" /> Seluruh Laporan Gangguan Irigasi dari Sektor Tani</div>
                </div>
                <p className="font-bold mt-3 text-[10px] text-red-750 border-t border-red-100/70 pt-2">
                  *Catatan: Akun login pengguna, profil fisik instansi, kustomisasi logo dinas, dan catatan kaki hak cipta TIDAK akan terhapus.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                  Apakah Anda yakin ingin memulai ulang administrasi data sistem ke kondisi bersih awal?
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Apakah Anda yakin ingin mengosongkan seluruh data transaksi? Tindakan ini tidak dapat dibatalkan.")) {
                      onClearAllData();
                      triggerNotification("Seluruh data transaksi di semua halaman berhasil dikosongkan!");
                    }
                  }}
                  id="btn-clean-system-data"
                  className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 hover:active:scale-95 text-white font-extrabold rounded-xl transition-all shadow cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Bersihkan Semua Data Sekarang</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
