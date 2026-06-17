import React, { useState, useRef, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  isFirestoreAvailable, 
  authErrorMsg, 
  signInWithGoogle, 
  signOutFromFirebase, 
  performBidirectionalSync,
  getGoogleAccessToken,
  setGoogleAccessToken
} from '../firebase';
import { 
  findExistingDatabaseSpreadsheet, 
  createDatabaseSpreadsheet, 
  exportAllLocalDataToGoogleSheets, 
  importAllGoogleSheetsDataToLocal 
} from '../googleSheetsSync';
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
  Pencil,
  Database,
  FileSpreadsheet,
  Download,
  RefreshCw,
  ExternalLink,
  AlertCircle
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
  const [activeSubPage, setActiveSubPage] = useState<'profil' | 'users' | 'footer' | 'clean' | 'cloud_sync' | 'google_sheets' | 'mysql'>('profil');

  // MySQL Settings Form States
  const [mysqlHost, setMysqlHost] = useState('');
  const [mysqlPort, setMysqlPort] = useState('3306');
  const [mysqlUser, setMysqlUser] = useState('');
  const [mysqlPassword, setMysqlPassword] = useState('');
  const [mysqlDatabase, setMysqlDatabase] = useState('');
  const [mysqlSslCa, setMysqlSslCa] = useState('');
  const [mysqlServerStatus, setMysqlServerStatus] = useState<any>({ isConnected: false, error: 'Memuat...', config: {} });
  const [mysqlTesting, setMysqlTesting] = useState(false);
  const [mysqlActionMsg, setMysqlActionMsg] = useState('');

  const fetchMysqlStatus = async () => {
    try {
      const res = await fetch("/api/mysql/status");
      if (res.ok) {
        const data = await res.json();
        setMysqlServerStatus(data);
        if (data.config) {
          setMysqlHost(data.config.host || '');
          setMysqlPort(data.config.port || '3306');
          setMysqlUser(data.config.user || '');
          setMysqlDatabase(data.config.database || '');
        }
      }
    } catch (e) {
      setMysqlServerStatus({ isConnected: false, error: "Gagal tersambung ke API server lokal." });
    }
  };

  useEffect(() => {
    fetchMysqlStatus();
  }, []);
  
  // Firebase Auth and Sync Reactive States
  const [firebaseUser, setFirebaseUser] = useState<any>(auth.currentUser);
  const [syncStatus, setSyncStatus] = useState<boolean>(isFirestoreAvailable);
  const [authError, setAuthError] = useState<string | null>(authErrorMsg);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Google Workspace Sheets Database States
  const [googleAccessToken, setGoogleAccessTokenState] = useState<string | null>(getGoogleAccessToken());
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<{ id: string; name: string; webViewLink?: string } | null>(null);
  const [gSyncStatus, setGSyncStatus] = useState<'idle' | 'checking' | 'syncing' | 'export_success' | 'import_success' | 'error'>('idle');
  const [gSyncMessage, setGSyncMessage] = useState<string>('');
  
  // Custom manual token bypass States
  const [manualTokenValue, setManualTokenValue] = useState<string>('');
  const [showManualPanel, setShowManualPanel] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setSyncStatus(isFirestoreAvailable);
      setAuthError(authErrorMsg);
      // Automatically keep access token synchronized
      const token = getGoogleAccessToken();
      setGoogleAccessTokenState(token);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (googleAccessToken) {
      checkGoogleSpreadsheet(googleAccessToken);
    } else {
      setSpreadsheetInfo(null);
    }
  }, [googleAccessToken]);

  const checkGoogleSpreadsheet = async (token: string) => {
    setGSyncStatus('checking');
    setGSyncMessage('Memeriksa ketersediaan Database Spreadsheet di Google Drive...');
    try {
      const found = await findExistingDatabaseSpreadsheet(token);
      if (found) {
        setSpreadsheetInfo(found);
        
        const existingSpreadsheetId = localStorage.getItem('uptd_google_spreadsheet_id');
        const lastSyncTime = localStorage.getItem('uptd_last_sheets_sync_time');
        
        localStorage.setItem('uptd_google_spreadsheet_id', found.id);
        
        // Auto-synchronize and pull if it's a new connection, different file, or has never been imported on this device
        if (!existingSpreadsheetId || existingSpreadsheetId !== found.id || !lastSyncTime) {
          setGSyncStatus('syncing');
          setGSyncMessage('Menemukan basis data Google Sheets! Menyinkronkan seluruh data aplikasi...');
          try {
            await importAllGoogleSheetsDataToLocal(token, found.id, (msg) => {
              setGSyncMessage(msg);
            });
            setGSyncStatus('import_success');
            setGSyncMessage('Sinkronisasi Google Sheets Berhasil! Memuat ulang aplikasi...');
            triggerNotification('Sinkronisasi Google Sheets Berhasil!');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } catch (importErr: any) {
            console.error("Auto import failed:", importErr);
            setGSyncStatus('error');
            setGSyncMessage(`Gagal menyinkronkan data otomatis: ${importErr?.message || importErr}`);
          }
        } else {
          setGSyncStatus('idle');
          setGSyncMessage('');
        }
      } else {
        setSpreadsheetInfo(null);
        setGSyncStatus('idle');
        setGSyncMessage('Belum ada database spreadsheet yang terkelola di Google Drive Anda.');
      }
    } catch (err: any) {
      setGSyncStatus('error');
      setGSyncMessage(`Pemeriksaan Google Drive gagal: ${err?.message || err}`);
    }
  };

  const handleConnectGoogle = async () => {
    setGSyncStatus('checking');
    setGSyncMessage('Menyambungkan akun Google Anda dengan cakupan Sheets & Drive...');
    try {
      await signInWithGoogle();
      const token = getGoogleAccessToken();
      if (token) {
        setGoogleAccessTokenState(token);
        await checkGoogleSpreadsheet(token);
        triggerNotification('Akun Google berhasil tersambung!');
      } else {
        throw new Error('Gagal mendapatkan token akses Google.');
      }
    } catch (err: any) {
      setGSyncStatus('error');
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('suspended') || errMsg.toLowerCase().includes('permission-denied')) {
        setGSyncMessage(`Koneksi Google Pop-up gagal karena Kunci API Firebase ditangguhkan. Silakan gunakan bypass "Solusi 2: Token Akses Manual (Bypass)" di bawah untuk terhubung secara langsung tanpa Firebase!`);
      } else {
        setGSyncMessage(`Penyambungan Google Gagal: ${errMsg}`);
      }
    }
  };

  const handleApplyManualToken = async (pastedToken: string) => {
    if (!pastedToken.trim()) {
      alert("Token tidak boleh kosong.");
      return;
    }
    setGSyncStatus('checking');
    setGSyncMessage('Memverifikasi Google Access Token yang Anda masukkan...');
    try {
      const token = pastedToken.trim();
      setGoogleAccessToken(token);
      setGoogleAccessTokenState(token);
      await checkGoogleSpreadsheet(token);
      triggerNotification('Token berhasil dipasang!');
    } catch (err: any) {
      setGSyncStatus('error');
      setGSyncMessage(`Verifikasi Token Gagal: ${err?.message || err}. Pastikan token aktif dan memiliki cakupan Sheets & Drive.`);
    }
  };

  const handleCreateSpreadsheet = async () => {
    if (!googleAccessToken) return;
    setGSyncStatus('syncing');
    setGSyncMessage('Membuka berkas spreadsheet database baru di Google Drive...');
    try {
      const created = await createDatabaseSpreadsheet(googleAccessToken);
      setSpreadsheetInfo(created);
      localStorage.setItem('uptd_google_spreadsheet_id', created.id);
      
      setGSyncMessage('Mengunggah/seeding seluruh salinan data lokal ke Spreadsheet baru...');
      await exportAllLocalDataToGoogleSheets(googleAccessToken, created.id, (msg) => {
        setGSyncMessage(msg);
      });
      
      setGSyncStatus('idle');
      setGSyncMessage('');
      triggerNotification('Google Spreadsheet database berhasil dibuat & disinkronisasikan!');
    } catch (err: any) {
      setGSyncStatus('error');
      setGSyncMessage(`Gagal membuat file spreadsheet: ${err?.message || err}`);
    }
  };

  const handleExportToSheets = async () => {
    if (!googleAccessToken || !spreadsheetInfo) return;
    if (!window.confirm('Apakah Anda yakin ingin mengekspor data lokal ke Google Sheets? Tindakan ini akan menimpa seluruh baris data di file Spreadsheet Anda.')) {
      return;
    }
    setGSyncStatus('syncing');
    setGSyncMessage('Memulai ekspor database lokal ke Google Sheets...');
    try {
      await exportAllLocalDataToGoogleSheets(googleAccessToken, spreadsheetInfo.id, (msg) => {
        setGSyncMessage(msg);
      });
      setGSyncStatus('export_success');
      setGSyncMessage('Ekspor data berhasil! Seluruh data terbaru Anda telah tersimpan di Google Sheets.');
      triggerNotification('Ekspor Data Berhasil!');
      setTimeout(() => {
        setGSyncStatus('idle');
        setGSyncMessage('');
      }, 5000);
    } catch (err: any) {
      setGSyncStatus('error');
      setGSyncMessage(`Gagal mengekspor data: ${err?.message || err}`);
    }
  };

  const handleImportFromSheets = async () => {
    if (!googleAccessToken || !spreadsheetInfo) return;
    if (!window.confirm('Apakah Anda yakin ingin mengimpor database dari Google Sheets? Ini akan mengganti seluruh data kas kerja, arsip surat, data pegawai, & proyek lokal Anda dengan data yang bersumber dari Spreadsheet.')) {
      return;
    }
    setGSyncStatus('syncing');
    setGSyncMessage('Mengunduh & merestorasi data dari Google Sheets...');
    try {
      await importAllGoogleSheetsDataToLocal(googleAccessToken, spreadsheetInfo.id, (msg) => {
        setGSyncMessage(msg);
      });
      setGSyncStatus('import_success');
      setGSyncMessage('Database lokal berhasil dipulihkan dari Spreadsheet Google! Halaman akan dimuat ulang...');
      triggerNotification('Impor Data Berhasil!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setGSyncStatus('error');
      setGSyncMessage(`Gagal mengimpor data dari Google Sheets: ${err?.message || err}`);
    }
  };

  const handleTestMysql = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mysqlHost || !mysqlUser || !mysqlDatabase) {
      alert("Host, User, dan Database harus diisi untuk mengetes koneksi.");
      return;
    }
    setMysqlTesting(true);
    setMysqlActionMsg("Mengetes koneksi ke Aiven.io MySQL...");
    try {
      const res = await fetch("/api/mysql/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: mysqlHost,
          port: mysqlPort,
          user: mysqlUser,
          password: mysqlPassword,
          database: mysqlDatabase,
          sslCa: mysqlSslCa
        })
      });
      const data = await res.json();
      if (data.success) {
        setMysqlActionMsg("Koneksi berhasil! Database Aiven MySQL aktif & skema lengkap.");
        fetchMysqlStatus();
        triggerNotification("Sukses terhubung ke Aiven MySQL!");
      } else {
        setMysqlActionMsg(`Koneksi Gagal: ${data.message}`);
      }
    } catch (err: any) {
      setMysqlActionMsg(`Kesalahan jaringan: ${err?.message || err}`);
    } finally {
      setMysqlTesting(false);
    }
  };

  const handleExportToMysql = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mengekspor seluruh database lokal Anda ke Aiven.io MySQL? Tindakan ini akan menimpa seluruh data yang tersimpan di MySQL.")) return;
    setMysqlTesting(true);
    setMysqlActionMsg("Memulai migrasi & ekspor data lokal ke MySQL...");
    try {
      const localUsers = localStorage.getItem('uptd_users');
      const localMails = localStorage.getItem('uptd_v3_mails');
      const localStaff = localStorage.getItem('uptd_v3_staff');
      const localProjects = localStorage.getItem('uptd_v3_projects');
      const localWaterLogs = localStorage.getItem('uptd_v3_water_logs');
      const localDamageReports = localStorage.getItem('uptd_v3_damage_reports');
      const localAssets = localStorage.getItem('uptd_v3_assets');
      const localFinances = localStorage.getItem('uptd_v3_finances');
      const localProfile = localStorage.getItem('uptd_profile');
      const localFooter = localStorage.getItem('uptd_footer');

      const payload = {
        users: localUsers ? JSON.parse(localUsers) : users,
        mails: localMails ? JSON.parse(localMails) : [],
        staff: localStaff ? JSON.parse(localStaff) : [],
        projects: localProjects ? JSON.parse(localProjects) : [],
        waterLogs: localWaterLogs ? JSON.parse(localWaterLogs) : [],
        damageReports: localDamageReports ? JSON.parse(localDamageReports) : [],
        assets: localAssets ? JSON.parse(localAssets) : [],
        financeTransactions: localFinances ? JSON.parse(localFinances) : [],
        profile: localProfile ? JSON.parse(localProfile) : profile,
        footer: localFooter ? JSON.parse(localFooter) : footer
      };

      const res = await fetch("/api/mysql/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMysqlActionMsg("Ekspor Sukses! Seluruh data lokal disuntikkan ke Aiven.io MySQL!");
        triggerNotification("Data berhasil diekspor ke MySQL!");
        setTimeout(() => {
          setMysqlActionMsg("");
        }, 3000);
      } else {
        setMysqlActionMsg(`Gagal ekspor: ${data.message}`);
      }
    } catch (err: any) {
      setMysqlActionMsg(`Kesalahan jaringan: ${err?.message || err}`);
    } finally {
      setMysqlTesting(false);
    }
  };

  const handleImportFromMysql = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menarik data dari MySQL Aiven.io untuk menimpa data offline saat ini? Sesi Anda akan dimuat ulang.")) return;
    setMysqlTesting(true);
    setMysqlActionMsg("Menarik data terbaru dari MySQL...");
    try {
      const res = await fetch("/api/mysql/pull");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const d = data.data;
          if (d.users) localStorage.setItem('uptd_users', JSON.stringify(d.users));
          if (d.mails) localStorage.setItem('uptd_v3_mails', JSON.stringify(d.mails));
          if (d.staff) localStorage.setItem('uptd_v3_staff', JSON.stringify(d.staff));
          if (d.projects) localStorage.setItem('uptd_v3_projects', JSON.stringify(d.projects));
          if (d.waterLogs) localStorage.setItem('uptd_v3_water_logs', JSON.stringify(d.waterLogs));
          if (d.damageReports) localStorage.setItem('uptd_v3_damage_reports', JSON.stringify(d.damageReports));
          if (d.assets) localStorage.setItem('uptd_v3_assets', JSON.stringify(d.assets));
          if (d.financeTransactions) localStorage.setItem('uptd_v3_finances', JSON.stringify(d.financeTransactions));
          if (d.profile) localStorage.setItem('uptd_profile', JSON.stringify(d.profile));
          if (d.footer) localStorage.setItem('uptd_footer', JSON.stringify(d.footer));

          setMysqlActionMsg("Data berhasil ditarik! Memuat ulang sistem...");
          triggerNotification("Import data dari MySQL berhasil!");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMysqlActionMsg("Gagal menarik data: API server tidak mengembalikan data yang sah.");
        }
      } else {
        setMysqlActionMsg("Gagal menghubungi server untuk pull data.");
      }
    } catch (err: any) {
      setMysqlActionMsg(`Kesalahan jaringan: ${err?.message || err}`);
    } finally {
      setMysqlTesting(false);
    }
  };

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
      role: selectedAccess.includes('all') ? 'admin' : (selectedAccess.includes('surveyor') && selectedAccess.length === 1 ? 'surveyor' : 'staff'),
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
      role: editAccess.includes('all') ? 'admin' : (editAccess.includes('surveyor') && editAccess.length === 1 ? 'surveyor' : 'staff'),
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

          {/* Google Sheets is now the exclusive cloud sync integration, Firebase is disabled */}

          <button
            onClick={() => setActiveSubPage('google_sheets')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSubPage === 'google_sheets'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-700'
            }`}
            id="subpage-google-sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Database Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveSubPage('mysql')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSubPage === 'mysql'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
            }`}
            id="subpage-mysql"
          >
            <Database className="w-4 h-4" />
            <span>Database MySQL Aiven.io</span>
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
                                  { value: 'surveyor', label: 'Surveyor (hanya input data inventaris DI)' },
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
                                  { value: 'surveyor', label: 'Surveyor (hanya input data inventaris DI)' },
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
                            case 'surveyor':
                              return 'Surveyor (DI)';
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
                                u.role === 'admin' ? 'bg-amber-100 text-amber-800' : u.role === 'surveyor' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
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

          {/* SUBPAGE 5: CLOUD SYNC & FIREBASE AUTH PANEL */}
          {activeSubPage === 'cloud_sync' && (
            <div className="space-y-6" id="settings-cloud-sync-section">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600 animate-spin-slow" />
                  Pusat Sinkronisasi Cloud & Koneksi Firebase
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">Mengelola integrasi database cloud Firestore real-time luar jaringan dan pemulihan status autentikasi.</p>
              </div>

              {/* Status Section Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Connection Status Card */}
                <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-4">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {syncStatus ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </>
                      ) : (
                        <>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
                        </>
                      )}
                    </span>
                    Status Jaringan Cloud
                  </h4>

                  <div className="space-y-2.5 font-medium text-slate-600">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                      <span>Status Sinkronisasi:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        syncStatus 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {syncStatus ? 'AKTIF (Tersinkron Cloud)' : 'OFFLINE (Fallback Lokal)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                      <span>Metode Penyimpanan saat ini:</span>
                      <span className="text-slate-800 font-bold">
                        {syncStatus ? 'Firestore + LocalStorage' : 'LocalStorage (Aman)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span>Sesi Akun Cloud:</span>
                      <span className="text-slate-800 font-bold truncate max-w-[150px]">
                        {firebaseUser ? (firebaseUser.email || 'Pengguna Anonim') : 'Belum Masuk'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Authentication Controls Card */}
                <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Key className="w-4 h-4 text-slate-500" />
                      Kontrol Sesi Firebase Auth
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Secara default, Firebase Auth melakukan login tersembunyi. Jika gagal, Anda dapat memulihkannya dengan masuk menggunakan Akun Google resmi.
                    </p>
                  </div>

                  <div className="pt-3 flex flex-wrap gap-2">
                    {firebaseUser ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("Apakah Anda yakin ingin keluar dari sesi Firebase cloud?")) {
                            setSyncing(true);
                            await signOutFromFirebase();
                            setSyncing(false);
                            triggerNotification("Telah keluar dari sesi Firebase cloud.");
                          }
                        }}
                        className="px-3.5 py-2 bg-slate-200 hover:bg-slate-350 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all text-[11px] cursor-pointer"
                      >
                        Keluar dari Cloud
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={syncing}
                        onClick={async () => {
                          try {
                            setSyncing(true);
                            await signInWithGoogle();
                            setSyncing(false);
                            triggerNotification("Berhasil terautentikasi dan tersambung ke Cloud Firestore!");
                          } catch (err: any) {
                            setSyncing(false);
                            alert("Login Gagal: " + (err?.message || err));
                          }
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-[1px] active:translate-y-0 text-[11px] cursor-pointer flex items-center gap-1.5"
                      >
                        {syncing ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        <span>Hubungkan via Google Sign-In</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={syncing}
                      onClick={async () => {
                        setSyncing(true);
                        // Force check/test connection
                        try {
                          await performBidirectionalSync();
                          const check = isFirestoreAvailable;
                          setSyncStatus(check);
                          if (check) {
                            triggerNotification("Koneksi cloud & sinkronisasi berhasil dijalankan!");
                          } else {
                            triggerNotification("Koneksi gagal. Silakan masuk menggunakan akun Google.");
                          }
                        } catch (err) {
                          setSyncStatus(false);
                        }
                        setSyncing(false);
                      }}
                      className="px-3.5 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-[11px] cursor-pointer"
                    >
                      Tes Koneksi Ulang
                    </button>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Warning Panel */}
              {authError && (
                <div className="p-4 bg-amber-50 border border-amber-200/70 rounded-2xl text-xs text-amber-900 space-y-2">
                  <h4 className="font-bold flex items-center gap-1.5 text-amber-950 uppercase">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-600 animate-pulse" />
                    Penyebab Masalah: {authError.toLowerCase().includes('suspended') ? 'Kunci API Firebase Ditangguhkan (Key Suspended)' : 'Firebase Auth Terblokir (Operation Not Allowed)'}
                  </h4>
                  <div className="leading-relaxed text-[11.5px] text-amber-900 space-y-2">
                    <p>
                      Sistem mendeteksi bahwa koneksi Firebase gagal dengan pesan:
                    </p>
                    <code className="block bg-amber-100 p-2.5 rounded-xl font-mono text-[10.5px] font-bold text-amber-950 max-h-24 overflow-y-auto whitespace-pre-wrap">
                      {authError}
                    </code>
                    {authError.toLowerCase().includes('suspended') ? (
                      <p className="mt-1 font-medium">
                        <strong>Mengapa ini terjadi?</strong> Akun Google Cloud Platform (GCP) Anda mendeteksi bahwa Kunci API (API Key) untuk projek ini dinonaktifkan atau ditangguhkan. Hal ini biasanya dikarenakan masa uji coba billing habis, pembatasan kuota, atau kunci tersebut dinonaktifkan secara manual di GCP Credentials Page.
                        <br />
                        <strong className="text-slate-800 block mt-1.5 font-bold">💡 Solusi Pintas (Bypass Tanpa Firebase):</strong> 
                        Anda bisa mengabaikan Firebase sepenuhnya dan menggunakan fitur <span className="text-emerald-700 font-extrabold font-sans">Database Google Sheets (Bypass Token Manual)</span> di tab sebelah untuk melakukan ekspor/impor cadangan database Anda secara langsung ke Google Drive Anda sendiri tanpa hambatan!
                      </p>
                    ) : (
                      <p className="mt-1">
                        Hal ini terjadi karena modul **Anonymous Sign-In** belum diaktifkan di konsol kontrol Firebase Anda.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions Panel */}
              <div className="p-5 border border-slate-150 bg-slate-50/50 rounded-2xl text-xs space-y-4">
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px] pb-1 border-b border-slate-200">
                  Panduan Penyelesaian Masalah Bagi Administrator (Database Setup Steps)
                </h4>

                <div className="space-y-4 text-slate-600 leading-relaxed text-[11px]">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center font-extrabold text-[10px]">1</span>
                      Opsi Utama: Aktifkan Anonymous Auth di Firebase Console
                    </h5>
                    <p className="mt-1 pl-6">
                      Langkah ini direkomendasikan agar seluruh perangkat tersambung secara otomatis di latar belakang tanpa meminta login Google:
                    </p>
                    <ol className="list-decimal pl-12 mt-1 space-y-1 text-slate-505 font-medium">
                      <li>Buka tautan proyek Firebase Anda di <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Firebase Console</a>.</li>
                      <li>Di panel navigasi samping kiri, klik **Build** lalu masuk ke menu **Authentication**.</li>
                      <li>Pilih tab **Sign-in method** di bagian atas halaman.</li>
                      <li>Cari baris **Anonymous** di bawah penyedia tambahan, klik tombol **Edit / Pensil**, aktifkan tombol toggle **Enable**, lalu tekan tombol **Save**.</li>
                      <li>Setelah selesai, kembali ke dashboard ini lalu klik tombol <strong className="text-slate-8	 font-bold">"Tes Koneksi Ulang"</strong> untuk sinkronisasi otomatis!</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center font-extrabold text-[10px]">2</span>
                      Opsi Instan: Klik tombol "Hubungkan via Google Sign-In"
                    </h5>
                    <p className="mt-1 pl-6">
                      Jika Anda tidak memiliki akses ke konsol Firebase, Anda cukup menghubungkan browser admin Anda ke cloud dengan mengklik tombol berwarna biru di atas untuk masuk menggunakan akun Google Anda sendiri. Google Login telah diaktifkan secara otomatis oleh sistem saat bootstraping backend.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBPAGE 6: GOOGLE SHEETS DATABASE PANEL */}
          {activeSubPage === 'google_sheets' && (
            <div className="space-y-6" id="settings-google-sheets-section">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-sm">
                      Integrasi Database Google Sheets & Google Drive (Aktif & Utama)
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sistem dialihkan sepenuhnya ke Google Sheets sebagai database cloud utama Anda. Setiap penulisan data akan secara otomatis disinkronkan secara real-time ke spreadsheet Google Drive Anda.
                    </p>
                  </div>
                </div>
              </div>

              {/* Premium Google Sheets Master Database Indicator */}
              <div className="bg-emerald-50 border border-emerald-250/60 rounded-2xl p-4 text-xs space-y-2 text-emerald-950">
                <div className="flex items-center gap-2 font-extrabold text-emerald-950 uppercase tracking-wider text-[10.5px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span>Database Utama: Google Sheets &amp; Drive Aktif</span>
                </div>
                <p className="leading-relaxed text-[11.5px] text-emerald-900/90">
                  Penyimpanan Firebase Firestore telah dinonaktifkan sesuai permintaan Anda. Mulai sekarang, seluruh modul aplikasi (arsip surat, kas kerja, data pegawai, progres fisik, debit air, inventarisir, dll) akan disinkronkan <strong className="text-emerald-950 font-black">secara instan di latar belakang (real-time)</strong> langsung ke Spreadsheet Anda apabila Anda terhubung dengan Token Google Workspace di bawah ini!
                </p>
                {googleAccessToken && localStorage.getItem('uptd_google_spreadsheet_id') && (
                  <div className="mt-2 text-[10.5px] text-slate-705 bg-white/80 border border-emerald-200/50 p-2.5 rounded-xl font-mono leading-normal">
                    <span className="font-sans font-bold text-emerald-950 block mb-0.5">ID Spreadsheet Database Aktif:</span>
                    <span className="break-all font-bold select-all text-slate-800 font-mono">{localStorage.getItem('uptd_google_spreadsheet_id')}</span>
                  </div>
                )}
              </div>

              {/* Alert: Firebase API Key Suspension detection */}
              {authError && authError.toLowerCase().includes('suspended') && (
                <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-950 space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-900 uppercase tracking-wide">
                    <AlertCircle className="w-4 h-4 text-amber-600 animate-bounce" />
                    <span>Perhatian: Kunci API Firebase Ditangguhkan (Key Suspended)</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-700">
                    Sistem mendeteksi bahwa Firebase API Key Anda saat ini ditangguhkan di Google Cloud Console. 
                    <br />
                    Namun, Anda **tidak perlu khawatir!** Anda tetap dapat mencadangkan dan memulihkan seluruh data aplikasi menggunakan **Token Akses Manual (Bypass)** di bawah ini. Anda dapat men-generate token ini dari Google OAuth Playground dengan cakupan (scope) Google Sheets dan Google Drive.
                  </p>
                </div>
              )}

              {/* Status & Checking indicators */}
              {gSyncMessage && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center space-x-3 text-xs text-emerald-800">
                  <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
                  <span className="font-medium animate-pulse">{gSyncMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARD 1: KONEKSI AKUN GOOGLE */}
                <div className="p-5 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      Status Akun Google Workspace
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Memerlukan otorisasi untuk membaca dan menulis file Spreadsheet di Google Drive Anda secara aman dengan persetujuan Anda.
                    </p>
                  </div>

                  <div className="pt-2">
                    {googleAccessToken ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
                          <Check className="w-4 h-4" />
                          <span>Akun Google Terhubung</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm('Apakah Anda yakin ingin keluar dari koneksi Google Workspace?')) {
                              await signOutFromFirebase();
                              setGoogleAccessTokenState(null);
                              setSpreadsheetInfo(null);
                              triggerNotification('Akun Google berhasil diputuskan.');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer"
                        >
                          Putuskan Sambungan
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectGoogle}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Hubungkan Akun Google</span>
                      </button>
                    )}
                  </div>

                  {/* HELPFUL ALTERNATIVE / BYPASS SOLUTIONS WHEN NOT CONNECTED */}
                  {!googleAccessToken && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-100/80 text-[11px] text-amber-900 leading-relaxed">
                        <div className="font-extrabold flex items-center gap-1 mb-1 text-amber-950 uppercase tracking-wide">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Penting: Hambatan Iframe Web</span>
                        </div>
                        Otentikasi Google pop-up sering diblokir oleh kebijakan keamanan browser di dalam iframe AI Studio.
                        <div className="mt-1.5 font-bold text-slate-800">
                          Solusi 1: Buka di Tab Baru (Sangat Disarankan)
                        </div>
                        Klik tombol <strong className="text-blue-700 font-extrabold">"Open in new tab"</strong> di pojok kanan atas jendela pratinjau AI Studio Anda untuk mencoba kembali.
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowManualPanel(!showManualPanel)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline select-none flex items-center gap-1 cursor-pointer"
                        >
                          <span>{showManualPanel ? 'Sembunyikan Opsi Token Manual' : 'Solusi 2: Gunakan Token Akses Manual (Bypass)'}</span>
                        </button>

                        {showManualPanel && (
                          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-sm">
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Masukkan Google OAuth Access Token yang valid untuk langsung mem-bypass login Firebase secara instan:
                            </p>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={manualTokenValue}
                                onChange={(e) => setManualTokenValue(e.target.value)}
                                placeholder="ya29.a0Acv..."
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-700 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplyManualToken(manualTokenValue)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-sm"
                              >
                                Verifikasi
                              </button>
                            </div>
                            <span className="block text-[9px] text-slate-400 leading-normal">
                              Dapatkan token Anda dari Google OAuth Playground atau konsol pengembang dengan scope Sheets &amp; Drive.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 2: FILE SPREADSHEET DATABASE */}
                <div className="p-5 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Target Spreadsheet Database
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Seluruh tabel-tabel data aplikasi (arsip surat, kas seksi, TMA air, dll) akan dilarutkan ke dalam lembar kerja spreadsheet terpisah.
                    </p>
                  </div>

                  <div className="pt-2">
                    {!googleAccessToken ? (
                      <span className="text-[11px] text-slate-400 italic">Hubungkan Akun Google terlebih dahulu.</span>
                    ) : spreadsheetInfo ? (
                      <div className="space-y-3">
                        <div className="text-xs">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">File Database Aktif:</span>
                          <span className="font-extrabold text-slate-700 block truncate mt-0.5">{spreadsheetInfo.name}</span>
                        </div>
                        <a
                          href={spreadsheetInfo.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                        >
                          <span>Buka di Google Drive</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[11px] text-amber-600 font-medium">Sistem tidak mendeteksi file database di Google Drive Anda.</p>
                        <button
                          type="button"
                          onClick={handleCreateSpreadsheet}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Database className="w-4 h-4" />
                          <span>Buat File Database Baru</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BACKUP AND RESTORE GRID */}
              {googleAccessToken && spreadsheetInfo && (
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Pusat Sinkronisasi & Pemulihan (Backup & Restore)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* BACKUP EXPORT BOX */}
                    <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-3">
                      <div className="space-y-1.5">
                        <h5 className="font-extrabold text-slate-800 flex items-center gap-1.5 select-none">
                          <Upload className="w-4 h-4 text-emerald-600" />
                          Ekspor Lokal ke Google Sheets
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Mengirim seluruh database lokal browser Anda ke dalam lembar kerja Google Sheets target. Tindakan ini menindih seluruh isi tab spreadsheet secara instan.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportToSheets}
                        disabled={gSyncStatus === 'syncing'}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-750 font-extrabold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Mulai Ekspor Sekarang</span>
                      </button>
                    </div>

                    {/* RESTORE IMPORT BOX */}
                    <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-3">
                      <div className="space-y-1.5">
                        <h5 className="font-extrabold text-slate-800 flex items-center gap-1.5 select-none">
                          <Download className="w-4 h-4 text-blue-600" />
                          Impor Google Sheets ke Lokal
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-normal font-sans">
                          Mengambil database online dari worksheet Google Sheets dan menimpa isi rekam lokal di browser Anda. Sangat berguna untuk sinkronisasi perangkat baru.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleImportFromSheets}
                        disabled={gSyncStatus === 'syncing'}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-750 font-extrabold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Mulai Impor & Reset Sesi</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBPAGE 7: MYSQL AIVEN.IO PANEL */}
          {activeSubPage === 'mysql' && (
            <div className="space-y-6 animate-fade-in" id="settings-mysql-section">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-sm">
                      Integrasi Cloud Database MySQL Aiven.io (PostgreSQL Kompatibel)
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Koneksikan portal UPTD Pengelolaan Jalan Dan Jembatan ke klaster MySQL Aiven milik instansi Anda untuk replikasi data real-time, backup otomatis, dan sinkronisasi multi-admin.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Connection Indicator */}
              <div className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                mysqlServerStatus?.isConnected 
                  ? 'bg-emerald-50/55 border-emerald-200/60 text-emerald-950' 
                  : 'bg-amber-50/50 border-amber-200/60 text-amber-950'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-extrabold uppercase tracking-wide text-[10.5px]">
                    <span className={`h-2.5 w-2.5 rounded-full ${mysqlServerStatus?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    <span>Status Koneksi: {mysqlServerStatus?.isConnected ? 'ONLINE & SECURE' : 'OFFLINE / FALLBACK LOKAL'}</span>
                  </div>
                  <p className="text-slate-500 mt-1 font-sans">
                    {mysqlServerStatus?.isConnected 
                      ? `Sukses terintegrasi ke host database cloud: ${mysqlServerStatus?.config?.host}. Setiap penambahan data akan diduplikasi secara otomatis.` 
                      : `Sistem sedang menggunakan database lokal (In-Memory JSON Fallback). Aktifkan MySQL Aiven dengan memasukkan kredensial di bawah ini.`
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchMysqlStatus}
                  className="px-3 py-1.5 bg-white shadow-sm border border-slate-205/60 hover:bg-slate-50 rounded-lg font-bold text-[10.5px] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Segarkan Status
                </button>
              </div>

              {/* Form Input Setup */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Sandi & Kredensial MySQL Aiven.io</span>
                  <span className="text-[10px] text-slate-450 normal-case font-normal font-mono select-all">Mendukung koneksi SSL wajib</span>
                </h3>

                <form onSubmit={handleTestMysql} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 block">Host / Alamat Server</label>
                      <input 
                        type="text" 
                        value={mysqlHost}
                        onChange={(e) => setMysqlHost(e.target.value)}
                        placeholder="contoh: mysql-aiven-project.aivencloud.com" 
                        className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 block">Port</label>
                      <input 
                        type="text" 
                        value={mysqlPort}
                        onChange={(e) => setMysqlPort(e.target.value)}
                        placeholder="3306" 
                        className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 block">Username</label>
                      <input 
                        type="text" 
                        value={mysqlUser}
                        onChange={(e) => setMysqlUser(e.target.value)}
                        placeholder="avnadmin atau root" 
                        className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 block">Password</label>
                      <input 
                        type="password" 
                        value={mysqlPassword}
                        onChange={(e) => setMysqlPassword(e.target.value)}
                        placeholder="••••••••••••••••" 
                        className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 block">Nama Database Schema</label>
                    <input 
                      type="text" 
                      value={mysqlDatabase}
                      onChange={(e) => setMysqlDatabase(e.target.value)}
                      placeholder="defaultdb" 
                      className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600 block">Sertifikat SSL CA Aiven (Opsional)</label>
                      <span className="text-[9.5px] text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded">SSL Enforced Automatically</span>
                    </div>
                    <textarea 
                      rows={2}
                      value={mysqlSslCa}
                      onChange={(e) => setMysqlSslCa(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----\n..." 
                      className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <p className="text-[10px] text-slate-450 max-w-md">
                      Catatan: Agar kredensial di atas tersimpan selamanya setelah container hidup kembali, pastikan Anda juga menulis kredensial ini di file <span className="font-mono">.env</span> aplikasi Anda.
                    </p>
                    <button
                      type="submit"
                      disabled={mysqlTesting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
                    >
                      <Database className="w-4 h-4" />
                      <span>{mysqlTesting ? 'Menghubungkan...' : 'Simpan & Uji Koneksi'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Status Action Console Log */}
              {mysqlActionMsg && (
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10.5px] leading-relaxed border border-slate-800 animate-slide-up select-text">
                  <div className="flex items-center gap-2 mb-1 border-b border-slate-800 pb-1.5 text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
                    <span>Konsol Log Sistem MySQL:</span>
                  </div>
                  <div>{mysqlActionMsg}</div>
                </div>
              )}

              {/* BULK REPLICATION MIGRATION MODULES */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 select-none">
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  Pusat Sinkronisasi & Migrasi Data MySQL
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* EXPORT TO MYSQL */}
                  <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-3">
                    <div className="space-y-1.5">
                      <h5 className="font-extrabold text-slate-800 flex items-center gap-1.5 select-none">
                        <Upload className="w-4 h-4 text-indigo-600" />
                        Ekspor Lokal Ke MySQL Aiven
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Mengirim seluruh data offline lokal dari browser Anda (Pegawai, Surat, Proyek, Log Irigasi) langsung ke database Aiven MySQL. Tindakan ini menimpa data yang ada di database.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportToMysql}
                      disabled={mysqlTesting}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-750 font-extrabold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Mulai Ekspor Sekarang</span>
                    </button>
                  </div>

                  {/* IMPORT FROM MYSQL */}
                  <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-3">
                    <div className="space-y-1.5">
                      <h5 className="font-extrabold text-slate-800 flex items-center gap-1.5 select-none">
                        <Download className="w-4 h-4 text-indigo-600" />
                        Impor MySQL Aiven Ke Lokal
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Menarik semua baris database historis dari MySQL Aiven ke dalam cache lokal browser Anda. Data offline Anda saat ini akan ditimpa dan modul dasbor akan memuat ulang.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleImportFromMysql}
                      disabled={mysqlTesting}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-205/60 disabled:opacity-50 text-slate-750 font-extrabold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Mulai Impor &amp; Merestore</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
