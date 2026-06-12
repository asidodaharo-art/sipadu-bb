import { useState, useEffect } from 'react';
import { User, Mail, Staff, Project, WaterLog, DamageReport, InstansiProfile, FooterConfig, Asset, FinanceTransaction } from './types';
import { 
  INITIAL_USERS, 
  INITIAL_MAILS, 
  INITIAL_STAFF, 
  INITIAL_PROJECTS, 
  INITIAL_WATER_LOGS, 
  INITIAL_DAMAGE_REPORTS, 
  INITIAL_PROFILE, 
  INITIAL_FOOTER,
  INITIAL_ASSETS
} from './initial_data';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Penatausahaan from './components/Penatausahaan';
import Pembangunan from './components/Pembangunan';
import Settings from './components/Settings';
import Operasional from './components/Operasional';
import InventarisasiDI from './components/InventarisasiDI';
import { 
  LayoutDashboard, 
  FileText, 
  Wrench, 
  Activity, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon, 
  Building2,
  Droplets,
  Calendar,
  Layers,
  Inbox,
  Users,
  Box,
  Wallet,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // One-time data purge to satisfy the user's request: empty all databases and lists, keeping only the Admin user credentials.
  if (typeof window !== 'undefined' && !localStorage.getItem('uptd_v3_data_purged_2026_v7')) {
    const defaultAdmin = [
      {
        id: '1',
        username: 'admin',
        name: 'Administrator UPTD',
        role: 'admin' as const,
        password: 'admin123',
        section: 'all'
      }
    ];
    localStorage.setItem('uptd_users', JSON.stringify(defaultAdmin));
    localStorage.setItem('uptd_v3_mails', JSON.stringify([]));
    localStorage.setItem('uptd_v3_staff', JSON.stringify([]));
    localStorage.setItem('uptd_v3_projects', JSON.stringify([]));
    localStorage.setItem('uptd_v3_projects_operasional', JSON.stringify([]));
    localStorage.setItem('uptd_v3_water_logs', JSON.stringify([]));
    localStorage.setItem('uptd_v3_damage_reports', JSON.stringify([]));
    localStorage.setItem('uptd_v3_assets', JSON.stringify([]));
    localStorage.setItem('uptd_v3_finances', JSON.stringify([]));
    localStorage.setItem('uptd_v3_daerah_irigasi', JSON.stringify([]));
    localStorage.setItem('uptd_v3_river_stations', JSON.stringify([]));
    localStorage.setItem('uptd_v3_asset_distributions', JSON.stringify([]));
    localStorage.setItem('uptd_v3_consumables', JSON.stringify([]));
    
    // Log out if non-admin is active
    const curUserRaw = localStorage.getItem('uptd_current_user');
    if (curUserRaw) {
      try {
        const curUser = JSON.parse(curUserRaw);
        if (curUser.role !== 'admin') {
          localStorage.removeItem('uptd_current_user');
        }
      } catch (e) {
        localStorage.removeItem('uptd_current_user');
      }
    }
    localStorage.setItem('uptd_v3_data_purged_2026_v7', 'true');
  }

  // 1. Core Persistent States from localStorage (or seed INITIAL_DATA)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('uptd_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('uptd_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [mails, setMails] = useState<Mail[]>(() => {
    const saved = localStorage.getItem('uptd_v3_mails');
    return saved ? JSON.parse(saved) : INITIAL_MAILS;
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('uptd_v3_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('uptd_v3_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [projectsOperasional, setProjectsOperasional] = useState<Project[]>(() => {
    const saved = localStorage.getItem('uptd_v3_projects_operasional');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem('uptd_v3_water_logs');
    return saved ? JSON.parse(saved) : INITIAL_WATER_LOGS;
  });

  const [damageReports, setDamageReports] = useState<DamageReport[]>(() => {
    const saved = localStorage.getItem('uptd_v3_damage_reports');
    return saved ? JSON.parse(saved) : INITIAL_DAMAGE_REPORTS;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('uptd_v3_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [finances, setFinances] = useState<FinanceTransaction[]>(() => {
    const saved = localStorage.getItem('uptd_v3_finances');
    return saved ? JSON.parse(saved) : [];
  });

  const [penatausahaanSubTab, setPenatausahaanSubTab] = useState<'landing' | 'adm_umum' | 'personalia' | 'aset_inventaris' | 'keuangan'>('landing');
  const [pembangunanSubTab, setPembangunanSubTab] = useState<'landing' | 'paket_pekerjaan'>('landing');
  const [operasionalSubTab, setOperasionalSubTab] = useState<'landing' | 'paket_pekerjaan'>('landing');

  const [profile, setProfile] = useState<InstansiProfile>(() => {
    const saved = localStorage.getItem('uptd_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [footer, setFooter] = useState<FooterConfig>(() => {
    const saved = localStorage.getItem('uptd_footer');
    return saved ? JSON.parse(saved) : INITIAL_FOOTER;
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Helper to validate tab access based on user role and assigned sections
  const isTabAllowed = (tabId: string) => {
    if (!currentUser) return false;
    const userSections = currentUser.section ? currentUser.section.split(',') : [];
    const isAdmin = currentUser.role === 'admin' || userSections.includes('all');
    const isPimpinan = userSections.includes('pimpinan');

    if (isAdmin || isPimpinan) return true;

    if (tabId === 'dashboard') {
      // General dashboard only accessible if no specific department sections are assigned, or if they are Pimpinan / Admin
      return userSections.length === 0;
    }
    if (tabId === 'penatausahaan') {
      return userSections.some(s => ['adm_umum', 'personalia', 'aset', 'keuangan', 'penatausahaan', 'staff'].includes(s));
    }
    if (tabId === 'pembangunan') {
      return userSections.includes('pembangunan');
    }
    if (tabId === 'operasional' || tabId === 'inventarisasi_di') {
      return userSections.includes('operasional');
    }
    if (tabId === 'settings') {
      return isAdmin;
    }
    return false;
  };

  // Helper to validate subtab access under Penatausahaan (Tata Usaha / Kantor)
  const isPenatausahaanSubTabAllowed = (subTab: string) => {
    if (!currentUser) return false;
    const userSections = currentUser.section ? currentUser.section.split(',') : [];
    const isAdmin = currentUser.role === 'admin' || userSections.includes('all');
    const isPimpinan = userSections.includes('pimpinan');

    if (isAdmin || isPimpinan) return true;
    if (subTab === 'adm_umum') return userSections.includes('adm_umum') || userSections.includes('penatausahaan');
    if (subTab === 'personalia') return userSections.includes('personalia') || userSections.includes('staff') || userSections.includes('penatausahaan');
    if (subTab === 'aset_inventaris') return userSections.includes('aset') || userSections.includes('penatausahaan');
    if (subTab === 'keuangan') return userSections.includes('keuangan') || userSections.includes('penatausahaan');
    if (subTab === 'landing') return true; // landing as the general introduction index
    return false;
  };

  // Enforce access control restrictions by auto-redirecting to the first allowed tab
  useEffect(() => {
    if (currentUser) {
      const allowed = isTabAllowed(activeTab);
      if (activeTab === 'inventarisasi_di') {
        if (!isTabAllowed('operasional')) {
          const firstAllowed = ['dashboard', 'penatausahaan', 'pembangunan', 'operasional', 'settings'].find(t => isTabAllowed(t));
          if (firstAllowed) setActiveTab(firstAllowed);
        }
      } else if (!allowed) {
        const firstAllowed = ['dashboard', 'penatausahaan', 'pembangunan', 'operasional', 'settings'].find(t => isTabAllowed(t));
        if (firstAllowed) {
          setActiveTab(firstAllowed);
          if (firstAllowed === 'penatausahaan') {
            const firstAllowedSub = ['adm_umum', 'personalia', 'aset_inventaris', 'keuangan'].find(sub => isPenatausahaanSubTabAllowed(sub));
            if (firstAllowedSub) setPenatausahaanSubTab(firstAllowedSub as any);
          }
        }
      }

      // Also ensure selected Penatausahaan subtab is allowed
      if (activeTab === 'penatausahaan' && penatausahaanSubTab !== 'landing' && !isPenatausahaanSubTabAllowed(penatausahaanSubTab)) {
        const firstAllowedSub = ['adm_umum', 'personalia', 'aset_inventaris', 'keuangan'].find(sub => isPenatausahaanSubTabAllowed(sub));
        if (firstAllowedSub) {
          setPenatausahaanSubTab(firstAllowedSub as any);
        } else {
          setPenatausahaanSubTab('landing');
        }
      }
    }
  }, [currentUser, activeTab, penatausahaanSubTab]);

  // Helper to find staff photo by matching username with NIP
  const getCurrentUserPhoto = () => {
    if (!currentUser) return null;
    const cleanUsername = currentUser.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = staff.find((s) => {
      if (!s.nip) return false;
      const cleanNip = s.nip.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanNip === cleanUsername && cleanUsername.length > 0;
    });
    return matched?.photo || null;
  };

  // 2. Action Handlers (modifying state + syncing to localStorage)
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('uptd_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('uptd_current_user');
    setActiveTab('dashboard');
  };

  const handleUpdateProfile = (newProfile: InstansiProfile) => {
    setProfile(newProfile);
    localStorage.setItem('uptd_profile', JSON.stringify(newProfile));
  };

  const handleUpdateFooter = (newFooter: FooterConfig) => {
    setFooter(newFooter);
    localStorage.setItem('uptd_footer', JSON.stringify(newFooter));
  };

  const handleAddUser = (newUser: User) => {
    const updated = [newUser, ...users];
    setUsers(updated);
    localStorage.setItem('uptd_users', JSON.stringify(updated));
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    localStorage.setItem('uptd_users', JSON.stringify(updated));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('uptd_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    localStorage.setItem('uptd_users', JSON.stringify(updated));
  };

  const handleAddMail = (newMail: Mail) => {
    const updated = [newMail, ...mails];
    setMails(updated);
    localStorage.setItem('uptd_v3_mails', JSON.stringify(updated));
  };

  const handleUpdateMail = (updatedMail: Mail) => {
    const updated = mails.map((m) => (m.id === updatedMail.id ? updatedMail : m));
    setMails(updated);
    localStorage.setItem('uptd_v3_mails', JSON.stringify(updated));
  };

  const handleDeleteMail = (id: string) => {
    const updated = mails.filter((m) => m.id !== id);
    setMails(updated);
    localStorage.setItem('uptd_v3_mails', JSON.stringify(updated));
  };

  const handleAddStaff = (newStaff: Staff) => {
    const updated = [newStaff, ...staff];
    setStaff(updated);
    localStorage.setItem('uptd_v3_staff', JSON.stringify(updated));
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    const updated = staff.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
    setStaff(updated);
    localStorage.setItem('uptd_v3_staff', JSON.stringify(updated));
  };

  const handleDeleteStaff = (id: string) => {
    const updated = staff.filter((s) => s.id !== id);
    setStaff(updated);
    localStorage.setItem('uptd_v3_staff', JSON.stringify(updated));
  };

  const handleAddProject = (newProject: Project) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    localStorage.setItem('uptd_v3_projects', JSON.stringify(updated));
  };

  const handleUpdateProject = (updatedProj: Project) => {
    const updated = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    setProjects(updated);
    localStorage.setItem('uptd_v3_projects', JSON.stringify(updated));
  };

  const handleUpdateProjectProgress = (id: string, progress: number, status: Project['status']) => {
    const updated = projects.map((proj) => {
      if (proj.id === id) {
        return { ...proj, progress, status };
      }
      return proj;
    });
    setProjects(updated);
    localStorage.setItem('uptd_v3_projects', JSON.stringify(updated));
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem('uptd_v3_projects', JSON.stringify(updated));
  };

  const handleAddProjectOperasional = (newProject: Project) => {
    const updated = [newProject, ...projectsOperasional];
    setProjectsOperasional(updated);
    localStorage.setItem('uptd_v3_projects_operasional', JSON.stringify(updated));
  };

  const handleUpdateProjectOperasional = (updatedProj: Project) => {
    const updated = projectsOperasional.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    setProjectsOperasional(updated);
    localStorage.setItem('uptd_v3_projects_operasional', JSON.stringify(updated));
  };

  const handleUpdateProjectProgressOperasional = (id: string, progress: number, status: Project['status']) => {
    const updated = projectsOperasional.map((proj) => {
      if (proj.id === id) {
        return { ...proj, progress, status };
      }
      return proj;
    });
    setProjectsOperasional(updated);
    localStorage.setItem('uptd_v3_projects_operasional', JSON.stringify(updated));
  };

  const handleDeleteProjectOperasional = (id: string) => {
    const updated = projectsOperasional.filter((p) => p.id !== id);
    setProjectsOperasional(updated);
    localStorage.setItem('uptd_v3_projects_operasional', JSON.stringify(updated));
  };

  const handleAddWaterLog = (newLog: WaterLog) => {
    const updated = [newLog, ...waterLogs];
    setWaterLogs(updated);
    localStorage.setItem('uptd_v3_water_logs', JSON.stringify(updated));
  };

  const handleUpdateWaterLog = (updatedLog: WaterLog) => {
    const updated = waterLogs.map((w) => (w.id === updatedLog.id ? updatedLog : w));
    setWaterLogs(updated);
    localStorage.setItem('uptd_v3_water_logs', JSON.stringify(updated));
  };

  const handleDeleteWaterLog = (id: string) => {
    const updated = waterLogs.filter((w) => w.id !== id);
    setWaterLogs(updated);
    localStorage.setItem('uptd_v3_water_logs', JSON.stringify(updated));
  };

  const handleAddDamageReport = (newReport: DamageReport) => {
    const updated = [newReport, ...damageReports];
    setDamageReports(updated);
    localStorage.setItem('uptd_v3_damage_reports', JSON.stringify(updated));
  };

  const handleUpdateDamageReport = (updatedReport: DamageReport) => {
    const updated = damageReports.map((d) => (d.id === updatedReport.id ? updatedReport : d));
    setDamageReports(updated);
    localStorage.setItem('uptd_v3_damage_reports', JSON.stringify(updated));
  };

  const handleUpdateDamageStatus = (id: string, status: DamageReport['status']) => {
    const updated = damageReports.map((report) => {
      if (report.id === id) {
        return { ...report, status };
      }
      return report;
    });
    setDamageReports(updated);
    localStorage.setItem('uptd_v3_damage_reports', JSON.stringify(updated));
  };

  const handleDeleteDamageReport = (id: string) => {
    const updated = damageReports.filter((d) => d.id !== id);
    setDamageReports(updated);
    localStorage.setItem('uptd_v3_damage_reports', JSON.stringify(updated));
  };

  const handleClearOperasionalData = () => {
    setWaterLogs([]);
    setDamageReports([]);
    setProjectsOperasional([]);
    localStorage.setItem('uptd_v3_water_logs', JSON.stringify([]));
    localStorage.setItem('uptd_v3_damage_reports', JSON.stringify([]));
    localStorage.setItem('uptd_v3_projects_operasional', JSON.stringify([]));
  };

  const handleAddAsset = (newAsset: Asset) => {
    const updated = [newAsset, ...assets];
    setAssets(updated);
    localStorage.setItem('uptd_v3_assets', JSON.stringify(updated));
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    const updated = assets.map((a) => (a.id === updatedAsset.id ? updatedAsset : a));
    setAssets(updated);
    localStorage.setItem('uptd_v3_assets', JSON.stringify(updated));
  };

  const handleDeleteAsset = (id: string) => {
    const updated = assets.filter(a => a.id !== id);
    setAssets(updated);
    localStorage.setItem('uptd_v3_assets', JSON.stringify(updated));
  };

  const handleAddFinance = (newFinance: FinanceTransaction) => {
    const updated = [newFinance, ...finances];
    setFinances(updated);
    localStorage.setItem('uptd_v3_finances', JSON.stringify(updated));
  };

  const handleUpdateFinance = (updatedFinance: FinanceTransaction) => {
    const updated = finances.map((f) => (f.id === updatedFinance.id ? updatedFinance : f));
    setFinances(updated);
    localStorage.setItem('uptd_v3_finances', JSON.stringify(updated));
  };

  const handleDeleteFinance = (id: string) => {
    const updated = finances.filter(f => f.id !== id);
    setFinances(updated);
    localStorage.setItem('uptd_v3_finances', JSON.stringify(updated));
  };

  const handleClearAllData = () => {
    setMails([]);
    setStaff([]);
    setProjects([]);
    setProjectsOperasional([]);
    setWaterLogs([]);
    setDamageReports([]);
    setAssets([]);
    setFinances([]);
    localStorage.setItem('uptd_v3_mails', JSON.stringify([]));
    localStorage.setItem('uptd_v3_staff', JSON.stringify([]));
    localStorage.setItem('uptd_v3_projects', JSON.stringify([]));
    localStorage.setItem('uptd_v3_projects_operasional', JSON.stringify([]));
    localStorage.setItem('uptd_v3_water_logs', JSON.stringify([]));
    localStorage.setItem('uptd_v3_damage_reports', JSON.stringify([]));
    localStorage.setItem('uptd_v3_assets', JSON.stringify([]));
    localStorage.setItem('uptd_v3_finances', JSON.stringify([]));
  };

  // 3. Conditional Page Render
  if (!currentUser) {
    return (
      <Login
        users={users}
        onLoginSuccess={handleLogin}
        instansiName={profile.name}
        instansiLogoBase64={profile.logo}
        copyrightText={footer.copyrightText}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Helper to split profile name nicely for sidebar
  const getSidebarBrandParts = () => {
    const fullName = profile.name || 'UPTD Pengelolaan Sumber Daya Air Bah Bolon';
    
    // Check if it's the default or has "UPTD Pengelolaan Sumber Daya Air"
    if (fullName.includes('UPTD Pengelolaan Sumber Daya Air')) {
      const rest = fullName.replace('UPTD Pengelolaan Sumber Daya Air', '').trim();
      return {
        top: 'UPTD PSDA',
        main: rest || 'BAH BOLON',
        sub: 'Sumatera Utara'
      };
    }
    
    // Generic splits based on word lengths or if it starts with "UPTD"
    if (fullName.startsWith('UPTD')) {
      const words = fullName.split(' ');
      const mainPart = words.slice(1).join(' ');
      return {
        top: words[0],
        main: mainPart || 'INSTANSI',
        sub: 'Profil Instansi'
      };
    }
    
    // If it's a completely custom name, split by some length or just put as top-main-sub
    if (fullName.length > 20) {
      return {
        top: 'SI - TERPADU',
        main: fullName,
        sub: 'Profil Instansi'
      };
    }
    
    return {
      top: 'INSTANSI',
      main: fullName,
      sub: 'Profil Instansi'
    };
  };

  const brandParts = getSidebarBrandParts();

  // Navigation Items
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'penatausahaan', label: 'Penatausahaan / TU', icon: FileText },
    { id: 'pembangunan', label: 'Seksi Pembangunan', icon: Wrench },
    { id: 'operasional', label: 'Seksi Operasional', icon: Activity },
  ];

  // Filter based on user permissions
  const navItems = allNavItems.filter((item) => isTabAllowed(item.id));

  // Only display Settings menu for administrators
  if (currentUser.role === 'admin' || (currentUser.section && currentUser.section.split(',').includes('all'))) {
    navItems.push({ id: 'settings', label: 'Pengaturan Sistem', icon: SettingsIcon });
  }

  const activeLabel = 
    activeTab === 'inventarisasi_di' 
      ? 'Inventarisasi DI' 
      : activeTab === 'pembangunan' && pembangunanSubTab === 'paket_pekerjaan'
        ? 'Data Paket Pekerjaan'
        : activeTab === 'operasional' && operasionalSubTab === 'paket_pekerjaan'
          ? 'Data Paket Pekerjaan'
          : (navItems.find((item) => item.id === activeTab)?.label || 'Portal');

  return (
    <div className="min-h-screen flex bg-slate-50 relative" id="portal-app">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shrink-0 text-slate-300">
        {/* Brand Logo & Name Area */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/40">
          {profile.logo ? (
            <img 
              src={profile.logo} 
              alt="Logo Instansi" 
              className="h-12 w-12 object-contain bg-white p-1 rounded-lg border border-slate-750" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white border border-amber-400 shrink-0 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-cyan-500 opacity-80"></div>
              <Droplets className="w-6 h-6 text-amber-300 z-10" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="block text-[9px] font-black tracking-widest text-blue-400 uppercase truncate" title={brandParts.top}>
              {brandParts.top}
            </span>
            <h2 className="text-xs font-black text-white uppercase tracking-tight truncate leading-tight" title={profile.name}>
              {brandParts.main}
            </h2>
            <span className="text-[9px] text-slate-400 font-medium block truncate" title={profile.address}>
              {brandParts.sub}
            </span>
          </div>
        </div>

        {/* Logged User Info Badge */}
        <div className="p-4 mx-4 my-4 bg-slate-850/50 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-blue-500/20 flex items-center justify-center text-blue-400 overflow-hidden shrink-0">
            {getCurrentUserPhoto() ? (
              <img 
                src={getCurrentUserPhoto()!}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded font-extrabold uppercase inline-block mt-0.5 tracking-wider border border-blue-500/20">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Navigation Link list */}
        <nav className="flex-1 px-4 space-y-1.5" id="sidebar-desktop-nav">
          <span className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pl-3 mb-2">Seksi Navigasi</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'operasional' && activeTab === 'inventarisasi_di');
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'penatausahaan') {
                      setPenatausahaanSubTab('landing');
                    }
                    if (item.id === 'pembangunan') {
                      setPembangunanSubTab('landing');
                    }
                    if (item.id === 'operasional') {
                      setOperasionalSubTab('landing');
                    }
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-3 transition-all cursor-pointer pointer-cursor ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/10' 
                      : 'text-slate-450 hover:bg-slate-850 hover:text-white'
                  }`}
                  id={`sidebar-nav-${item.id}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>

                {item.id === 'pembangunan' && (
                  <div className="pl-4 space-y-1 mt-1 transition-all border-l border-slate-800/80 ml-4">
                    {[
                      { id: 'paket_pekerjaan', label: 'Data Paket Pekerjaan', icon: Wrench },
                    ].map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === 'pembangunan' && pembangunanSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab('pembangunan');
                            setPembangunanSubTab(sub.id as any);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-left flex items-center space-x-2 transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-slate-800/80 text-blue-400 font-extrabold pl-2.5 border-l-2 border-blue-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                          }`}
                          id={`sub-sidebar-${sub.id}`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-blue-400' : 'text-slate-550'}`} />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {item.id === 'penatausahaan' && (
                  <div className="pl-4 space-y-1 mt-1 transition-all border-l border-slate-800/80 ml-4">
                    {[
                      { id: 'adm_umum', label: 'Adm Umum', icon: Inbox },
                      { id: 'personalia', label: 'Personalia', icon: Users },
                      { id: 'aset_inventaris', label: 'Aset & Inventaris', icon: Box },
                      { id: 'keuangan', label: 'Keuangan', icon: Wallet },
                    ].filter(sub => isPenatausahaanSubTabAllowed(sub.id)).map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === 'penatausahaan' && penatausahaanSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab('penatausahaan');
                            setPenatausahaanSubTab(sub.id as any);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-left flex items-center space-x-2 transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-slate-800/80 text-blue-400 font-extrabold pl-2.5 border-l-2 border-blue-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                          }`}
                          id={`sub-sidebar-${sub.id}`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-blue-400' : 'text-slate-550'}`} />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {item.id === 'operasional' && (
                  <div className="pl-4 space-y-1 mt-1 transition-all border-l border-slate-800/80 ml-4">
                    {[
                      { id: 'inventarisasi_di', label: 'Inventarisasi DI', icon: Layers },
                      { id: 'paket_pekerjaan', label: 'Data Paket Pekerjaan', icon: Wrench },
                    ].map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = sub.id === 'inventarisasi_di' 
                        ? activeTab === 'inventarisasi_di' 
                        : activeTab === 'operasional' && operasionalSubTab === 'paket_pekerjaan';
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            if (sub.id === 'inventarisasi_di') {
                              setActiveTab('inventarisasi_di');
                            } else {
                              setActiveTab('operasional');
                              setOperasionalSubTab('paket_pekerjaan');
                            }
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-left flex items-center space-x-2 transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-slate-800/80 text-blue-400 font-extrabold pl-2.5 border-l-2 border-blue-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                          }`}
                          id={`sub-sidebar-${sub.id}`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-blue-400' : 'text-slate-550'}`} />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer & Logout control */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/20 space-y-4">
          <button
            onClick={handleLogout}
            id="btn-desktop-logout"
            className="w-full py-2 px-4 border border-slate-850 hover:bg-red-950/20 hover:border-red-900/40 hover:text-red-400 rounded-xl text-xs font-bold text-slate-407 flex items-center justify-center space-x-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluarkan Sesi</span>
          </button>

          {/* Simple footer in sidebar */}
          <div className="text-[9px] text-slate-500 text-center space-y-0.5 leading-normal">
            <div className="truncate px-1" title={footer.footerText}>{footer.footerText}</div>
            <div className="font-semibold text-slate-400 mt-0.5 text-[8px] truncate px-1" title={footer.copyrightText}>
              {footer.copyrightText}
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR (AnimatePresence) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop cover */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs"
            />
            
            {/* Sidebar shelf container */}
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 z-50 flex flex-col text-slate-300 shadow-2xl"
              id="sidebar-mobile-drawer"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {profile.logo ? (
                    <img 
                      src={profile.logo} 
                      alt="Logo Instansi" 
                      className="h-10 w-10 object-contain bg-white p-1 rounded-lg border border-slate-750 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white border border-amber-400 shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-cyan-500 opacity-80"></div>
                      <Droplets className="w-5.5 h-5.5 text-amber-300 z-10" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] font-black tracking-widest text-blue-400 uppercase truncate" title={brandParts.top}>
                      {brandParts.top}
                    </span>
                    <h2 className="text-xs font-black text-white uppercase tracking-tight truncate" title={profile.name}>
                      {brandParts.main}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User badge */}
              <div className="p-4 mx-4 my-4 bg-slate-850/50 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 overflow-hidden shrink-0">
                  {getCurrentUserPhoto() ? (
                    <img 
                      src={getCurrentUserPhoto()!}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-4.5 h-4.5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{currentUser.name}</div>
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.1 rounded font-extrabold uppercase inline-block border border-blue-500/10">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Navigation list */}
              <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto" id="sidebar-mobile-nav">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'operasional' && activeTab === 'inventarisasi_di');
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab(item.id);
                          if (item.id === 'penatausahaan') {
                            setPenatausahaanSubTab('landing');
                          }
                          if (item.id === 'pembangunan') {
                            setPembangunanSubTab('landing');
                          }
                          if (item.id === 'operasional') {
                            setOperasionalSubTab('landing');
                          }
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-3 cursor-pointer pointer-cursor ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-slate-450 hover:bg-slate-850 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>

                      {item.id === 'pembangunan' && (
                        <div className="pl-4 space-y-1 mt-1 border-l border-slate-800/80 ml-4">
                          {[
                            { id: 'paket_pekerjaan', label: 'Data Paket Pekerjaan', icon: Wrench },
                          ].map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = activeTab === 'pembangunan' && pembangunanSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setActiveTab('pembangunan');
                                  setPembangunanSubTab(sub.id as any);
                                  setIsMobileSidebarOpen(false);
                                }}
                                className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-left flex items-center space-x-2 transition-all cursor-pointer ${
                                  isSubActive
                                    ? 'bg-slate-800/80 text-blue-400 font-extrabold pl-2.5 border-l-2 border-blue-500'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                              >
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-blue-400' : 'text-slate-550'}`} />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {item.id === 'penatausahaan' && (
                        <div className="pl-4 space-y-1 mt-1 border-l border-slate-800/80 ml-4">
                          {[
                            { id: 'adm_umum', label: 'Adm Umum', icon: Inbox },
                            { id: 'personalia', label: 'Personalia', icon: Users },
                            { id: 'aset_inventaris', label: 'Aset & Inventaris', icon: Box },
                            { id: 'keuangan', label: 'Keuangan', icon: Wallet },
                          ].filter(sub => isPenatausahaanSubTabAllowed(sub.id)).map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = activeTab === 'penatausahaan' && penatausahaanSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setActiveTab('penatausahaan');
                                  setPenatausahaanSubTab(sub.id as any);
                                  setIsMobileSidebarOpen(false);
                                }}
                                className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-left flex items-center space-x-2 transition-all cursor-pointer ${
                                  isSubActive
                                    ? 'bg-slate-800/80 text-blue-400 font-extrabold pl-2.5 border-l-2 border-blue-500'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                              >
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-blue-400' : 'text-slate-550'}`} />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {item.id === 'operasional' && (
                        <div className="pl-4 space-y-1 mt-1 border-l border-slate-800/80 ml-4">
                          {[
                            { id: 'inventarisasi_di', label: 'Inventarisasi DI', icon: Layers },
                            { id: 'paket_pekerjaan', label: 'Data Paket Pekerjaan', icon: Wrench },
                          ].map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = sub.id === 'inventarisasi_di' 
                              ? activeTab === 'inventarisasi_di' 
                              : activeTab === 'operasional' && operasionalSubTab === 'paket_pekerjaan';
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  if (sub.id === 'inventarisasi_di') {
                                    setActiveTab('inventarisasi_di');
                                  } else {
                                    setActiveTab('operasional');
                                    setOperasionalSubTab('paket_pekerjaan');
                                  }
                                  setIsMobileSidebarOpen(false);
                                }}
                                className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-left flex items-center space-x-2 transition-all cursor-pointer ${
                                  isSubActive
                                    ? 'bg-slate-800/80 text-blue-400 font-extrabold pl-2.5 border-l-2 border-blue-500'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                              >
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-blue-400' : 'text-slate-550'}`} />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Action Log out */}
              <div className="p-4 border-t border-slate-850 bg-slate-950/20 space-y-4">
                <button
                  onClick={handleLogout}
                  id="btn-mobile-logout"
                  className="w-full py-2 px-4 border border-slate-850 hover:bg-red-950/40 hover:text-red-400 rounded-xl text-xs font-bold text-slate-400 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluarkan Sesi</span>
                </button>

                {/* Simple footer in sidebar */}
                <div className="text-[9px] text-slate-500 text-center space-y-0.5 leading-normal">
                  <div className="truncate px-1" title={footer.footerText}>{footer.footerText}</div>
                  <div className="font-semibold text-slate-400 text-[8px] truncate px-1" title={footer.copyrightText}>
                    {footer.copyrightText}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* PORTAL MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* GLOBAL HEADER */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs">
          
          {/* Left part: Title details */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150 cursor-pointer pointer-cursor"
              id="mobile-menu-trigger"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-[10px] bg-indigo-50/70 text-indigo-700 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-100/50">
                {activeLabel}
              </span>
              <span className="text-xs text-slate-400 font-mono">{new Date().toDateString()}</span>
            </div>
          </div>

          {/* Right part: Office/Dinas Header tag */}
          <div className="flex items-center space-x-4">
            {/* Global Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 border border-slate-150 text-slate-600 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title={theme === 'light' ? 'Beralih ke Mode Gelap' : 'Beralih ke Mode Terang'}
              aria-label="Toggle Theme Mode"
              id="theme-toggler-header"
            >
              {theme === 'light' ? (
                <Moon className="w-4.5 h-4.5 text-slate-600" />
              ) : (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              )}
            </button>

            <div className="text-right hidden md:block animate-fade-in">
              <div className="text-xs font-bold text-slate-850">{profile.name}</div>
              <div className="text-[10px] text-slate-400 font-medium">Dinas Sumber Daya Air Provinsi Sumatera Utara</div>
            </div>
            {profile.logo ? (
              <img 
                src={profile.logo} 
                alt="Logo Instansi" 
                className="h-10 w-10 object-contain rounded border border-slate-100 p-0.5 bg-slate-50/50" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase border border-blue-250">
                P
              </div>
            )}
          </div>
        </header>

        {/* CONTAINER MAIN WINDOW AREA */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto" id="portal-main-window">
          
          {/* Active Tab Component Switching */}
          <div className="min-h-[60vh]">
            {activeTab === 'dashboard' && (
              <Dashboard
                mails={mails}
                staff={staff}
                projects={projects}
                projectsOperasional={projectsOperasional}
                waterLogs={waterLogs}
                damageReports={damageReports}
                instansiName={profile.name}
                assets={assets}
              />
            )}

            {activeTab === 'penatausahaan' && (
              <Penatausahaan
                currentUser={currentUser}
                mails={mails}
                staff={staff}
                assets={assets}
                finances={finances}
                activeSubTab={penatausahaanSubTab}
                onSubTabChange={setPenatausahaanSubTab}
                onAddMail={handleAddMail}
                onUpdateMail={handleUpdateMail}
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
                onDeleteMail={handleDeleteMail}
                onDeleteStaff={handleDeleteStaff}
                onAddAsset={handleAddAsset}
                onUpdateAsset={handleUpdateAsset}
                onDeleteAsset={handleDeleteAsset}
                onAddFinance={handleAddFinance}
                onUpdateFinance={handleUpdateFinance}
                onDeleteFinance={handleDeleteFinance}
              />
            )}

            {activeTab === 'pembangunan' && (
              <Pembangunan
                currentUser={currentUser}
                projects={projects}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onUpdateProjectProgress={handleUpdateProjectProgress}
                onDeleteProject={handleDeleteProject}
                activeSubTab={pembangunanSubTab}
                onSubTabChange={setPembangunanSubTab}
              />
            )}

            {activeTab === 'operasional' && (
              <Operasional
                currentUser={currentUser}
                waterLogs={waterLogs}
                damageReports={damageReports}
                projects={projectsOperasional}
                onAddProject={handleAddProjectOperasional}
                onUpdateProject={handleUpdateProjectOperasional}
                onUpdateProjectProgress={handleUpdateProjectProgressOperasional}
                onDeleteProject={handleDeleteProjectOperasional}
                onAddWaterLog={handleAddWaterLog}
                onUpdateWaterLog={handleUpdateWaterLog}
                onDeleteWaterLog={handleDeleteWaterLog}
                onAddDamageReport={handleAddDamageReport}
                onUpdateDamageReport={handleUpdateDamageReport}
                onUpdateDamageStatus={handleUpdateDamageStatus}
                onDeleteDamageReport={handleDeleteDamageReport}
                onClearOperasionalData={handleClearOperasionalData}
                activeSubTab={operasionalSubTab}
                onSubTabChange={setOperasionalSubTab}
              />
            )}

            {activeTab === 'inventarisasi_di' && (
              <InventarisasiDI
                currentUser={currentUser}
              />
            )}

            {activeTab === 'settings' && (
              <Settings
                currentUser={currentUser}
                users={users}
                profile={profile}
                footer={footer}
                onUpdateProfile={handleUpdateProfile}
                onUpdateFooter={handleUpdateFooter}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onClearAllData={handleClearAllData}
              />
            )}
          </div>
        </main>

        {/* CUSTOM GLOBAL FOOTER */}
        <footer className="bg-white border-t border-slate-100 text-slate-550 py-6 px-6 md:px-8 text-xs font-sans text-center mt-auto" id="portal-footer">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left text-slate-500 max-w-2xl font-medium leading-relaxed" id="footer-text-display">
              {footer.footerText}
            </div>
            <div className="text-slate-400 shrink-0 font-medium whitespace-nowrap" id="copyright-text-display">
              {footer.copyrightText}
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
