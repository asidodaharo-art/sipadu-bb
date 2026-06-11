import { useState, FormEvent } from 'react';
import { User, WaterLog, DamageReport, Project } from '../types';
import Pembangunan from './Pembangunan';
import { 
  Activity, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertTriangle, 
  Droplets, 
  Calendar, 
  MapPin, 
  User as UserIcon, 
  Phone, 
  Clock, 
  ArrowRight, 
  Search, 
  FileSpreadsheet, 
  Waves,
  Hammer,
  RotateCcw,
  Sliders,
  Check,
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OperasionalProps {
  currentUser: User;
  waterLogs: WaterLog[];
  damageReports: DamageReport[];
  projects?: Project[];
  onAddProject?: (newProject: Project) => void;
  onUpdateProject?: (updatedProj: Project) => void;
  onUpdateProjectProgress?: (id: string, progress: number, status: Project['status']) => void;
  onDeleteProject?: (id: string) => void;
  onAddWaterLog: (log: WaterLog) => void;
  onUpdateWaterLog: (log: WaterLog) => void;
  onDeleteWaterLog: (id: string) => void;
  onAddDamageReport: (report: DamageReport) => void;
  onUpdateDamageReport: (report: DamageReport) => void;
  onUpdateDamageStatus: (id: string, status: DamageReport['status']) => void;
  onDeleteDamageReport: (id: string) => void;
  onClearOperasionalData: () => void;
  activeSubTab?: 'landing' | 'paket_pekerjaan';
  onSubTabChange?: (tab: 'landing' | 'paket_pekerjaan') => void;
}

export default function Operasional({
  currentUser,
  waterLogs = [],
  damageReports = [],
  projects = [],
  onAddProject,
  onUpdateProject,
  onUpdateProjectProgress,
  onDeleteProject,
  onAddWaterLog,
  onUpdateWaterLog,
  onDeleteWaterLog,
  onAddDamageReport,
  onUpdateDamageReport,
  onUpdateDamageStatus,
  onDeleteDamageReport,
  onClearOperasionalData,
  activeSubTab = 'landing',
  onSubTabChange
}: OperasionalProps) {
  const [activeOpsTab, setActiveOpsTab] = useState<'hidrologi' | 'kerusakan' | 'pengaturan'>('hidrologi');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // State inisialisasi stasiun sungai lokal
  const [riverStations, setRiverStations] = useState<string[]>(() => {
    const saved = localStorage.getItem('uptd_v3_river_stations');
    if (saved) return JSON.parse(saved);
    return ['Bendung Bah Bolon Hulu', 'DI Paya Lombang', 'Bendung Tanah Jawa', 'Kanal Primer Siantar', 'Sungai Bah Bolon Hilir'];
  });

  const [newStationName, setNewStationName] = useState('');

  // Form toggles
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);

  // Editing state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Field states for River Log Form
  const [logLocation, setLogLocation] = useState(riverStations[0] || '');
  const [logTma, setLogTma] = useState<number>(100);
  const [logDebit, setLogDebit] = useState<number>(15.5);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [logRecordedBy, setLogRecordedBy] = useState(currentUser.name);

  // Field states for Damage Report Form
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repLocation, setRepLocation] = useState('');
  const [repDescription, setRepDescription] = useState('');
  const [repDate, setRepDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Access rights check
  const userSections = currentUser.section ? currentUser.section.split(',') : [];
  const canWrite = currentUser.role === 'admin' || userSections.includes('operasional') || userSections.includes('all');

  // Handling River Station addition
  const handleAddStation = (e: FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) return;
    if (riverStations.includes(newStationName.trim())) {
      alert('Nama stasiun ini sudah terdaftar.');
      return;
    }
    const updated = [...riverStations, newStationName.trim()];
    setRiverStations(updated);
    localStorage.setItem('uptd_v3_river_stations', JSON.stringify(updated));
    setNewStationName('');
  };

  const handleDeleteStation = (station: string) => {
    if (confirm(`Hapus stasiun "${station}" dari opsi pemantauan?`)) {
      const updated = riverStations.filter(s => s !== station);
      setRiverStations(updated);
      localStorage.setItem('uptd_v3_river_stations', JSON.stringify(updated));
    }
  };

  // Determining flood status dynamically
  const determineStatus = (tmaValue: number): 'Normal' | 'Waspada' | 'Siaga' | 'Awas' => {
    if (tmaValue >= 250) return 'Awas';
    if (tmaValue >= 180) return 'Siaga';
    if (tmaValue >= 120) return 'Waspada';
    return 'Normal';
  };

  // Water Log submission
  const handleLogSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!logLocation) {
      alert('Tentukan lokasi pemantauan.');
      return;
    }

    const calculatedStatus = determineStatus(logTma);

    if (editingLogId) {
      onUpdateWaterLog({
        id: editingLogId,
        location: logLocation,
        tma: Number(logTma),
        debit: Number(logDebit),
        status: calculatedStatus,
        date: logDate,
        recordedBy: logRecordedBy || currentUser.name
      });
      setEditingLogId(null);
    } else {
      onAddWaterLog({
        id: `log-${Date.now()}`,
        location: logLocation,
        tma: Number(logTma),
        debit: Number(logDebit),
        status: calculatedStatus,
        date: logDate,
        recordedBy: logRecordedBy || currentUser.name
      });
    }

    // Reset Form
    setIsLogFormOpen(false);
  };

  // Set values to fields when editing River log
  const handleEditLogClick = (log: WaterLog) => {
    setEditingLogId(log.id);
    setLogLocation(log.location);
    setLogTma(log.tma);
    setLogDebit(log.debit);
    setLogDate(log.date);
    setLogRecordedBy(log.recordedBy);
    setIsLogFormOpen(true);
    setIsReportFormOpen(false);
  };

  // Damage Report submission
  const handleReportSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!repName.trim() || !repLocation.trim() || !repDescription.trim()) {
      alert('Harap lengkapi semua kolom wajib.');
      return;
    }

    onAddDamageReport({
      id: `report-${Date.now()}`,
      reporterName: repName,
      reporterPhone: repPhone || '-',
      location: repLocation,
      description: repDescription,
      date: repDate,
      status: 'Laporan Masuk'
    });

    // Reset Form
    setRepName('');
    setRepPhone('');
    setRepLocation('');
    setRepDescription('');
    setIsReportFormOpen(false);
  };

  // Safe wipe callback
  const handleWipeData = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh rekap data hasil pemantauan dan keluhan di seksi operasional?')) {
      onClearOperasionalData();
    }
  };

  // Filters logic
  const filteredLogs = waterLogs.filter(log => {
    const matchesSearch = (log.location || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (log.recordedBy || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesLocation = locationFilter === 'all' || log.location === locationFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const filteredReports = damageReports.filter(rep => {
    const matchesSearch = (rep.location || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (rep.description || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          (rep.reporterName || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesStatus = statusFilter === 'all' || rep.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Aggregated analytics metrics
  const activeStationsCount = riverStations.length;
  const averageTmaOfLogs = waterLogs.length > 0 
    ? Math.round(waterLogs.reduce((acc, log) => acc + log.tma, 0) / waterLogs.length) 
    : 0;
  const maxTmaLogged = waterLogs.length > 0 
    ? Math.max(...waterLogs.map(l => l.tma)) 
    : 0;
  const criticalLogsCount = waterLogs.filter(l => l.status === 'Siaga' || l.status === 'Awas').length;

  if (activeSubTab === 'paket_pekerjaan') {
    return (
      <Pembangunan
        currentUser={currentUser}
        projects={projects}
        onAddProject={onAddProject || (() => {})}
        onUpdateProject={onUpdateProject || (() => {})}
        onUpdateProjectProgress={onUpdateProjectProgress || (() => {})}
        onDeleteProject={onDeleteProject || (() => {})}
        activeSubTab="paket_pekerjaan"
      />
    );
  }

  if (activeSubTab === 'landing') {
    return (
      <div className="space-y-6 animate-fadeIn" id="operasional-landing-content">
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-teal-700 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-indigo-950">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Activity className="w-64 h-64 rotate-12" />
          </div>
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-[10px] bg-sky-300 text-slate-950 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Seksi Operasional &amp; Pemeliharaan (OP)
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">UPTD AM/Seksi Operasional</h1>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              Seksi Operasional dan Pemeliharaan UPTD PSDA Bah Bolon bertugas memonitoring alokasi air irigasi, mencatat tinggi muka air (TMA) hidrologi secara harian, melakukan pengawasan berkala dan repon cepat terhadap aduan kerusakan pintu air serta tanggul guna menjamin kestabilan pasokan air sawah rakyat.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSubTabChange?.('paket_pekerjaan')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-indigo-900 hover:bg-slate-50 font-black rounded-xl text-xs transition-all shadow cursor-pointer border-none"
              >
                <span>Kelola Data Paket Pekerjaan</span>
                <ArrowRight className="w-4 h-4 text-indigo-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Summary Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Titik Pos Pantau</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{activeStationsCount} Stasiun</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Stasiun hidrologi aktif terpantau</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Tinggi Muka Air Rerata</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Waves className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{averageTmaOfLogs} cm</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Rerata log pengukuran TMA terbaru</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Laporan Kerusakan Aktif</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                {damageReports.filter(d => d.status !== 'Selesai').length} Pengaduan
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Laporan yang membutuhkan tindak lanjut</p>
            </div>
          </div>
        </div>

        {/* Informational Cards on Responsibilities */}
        <div className="bg-white p-8 rounded-3xl border border-slate-150 shadow-xs space-y-6">
          <div>
            <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-2.5 py-1 rounded border border-slate-200">
              URAIAN TUGAS POKOK &amp; FUNGSI
            </span>
            <h2 className="text-lg font-bold text-slate-800 mt-2">Pilar Utama Seksi Operasional &amp; Pemeliharaan</h2>
            <p className="text-xs text-slate-400 mt-1">
              Seksi OP mengemban amanah penting dalam menjaga dan mendistribusikan berkah air melalui langkah strategis:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-700 bg-blue-50">
                <Waves className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">1. Pemantauan Hidrologi</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Mencatat tinggi muka air (TMA) dan estimasi debit duga harian untuk mengantisipasi limpasan banjir banjir kiriman maupun krisis kekeringan.
              </p>
            </div>

            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-teal-700 bg-teal-50">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">2. Pengaturan Operasi Pintu</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Mengatur debit bukaan pintu air masuk (intake) bendung agar pasokan air mengalir merata dan efisien ke petak tersier sawah petani.
              </p>
            </div>

            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-700 bg-rose-50">
                <Hammer className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">3. Respon Pengaduan Darurat</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Menampung aduan kebocoran tanggul, penyumbatan sedimen, atau rusaknya pintu sekunder untuk segera dikoordinasikan peninjauannya di lapangan.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="operasional-section-main">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4" id="operasional-header-block">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Activity className="w-5 h-5 animate-pulse text-indigo-500" />
            <span className="font-extrabold text-[10px] uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
              Seksi Operasional (OP)
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Pemantauan Infrastruktur Irigasi
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            Sistem pemantauan infrastruktur irigasi harian UPTD PSDA Bah Bolon. Pantau tinggi muka air (TMA), 
            kelola pos penakar hidrometri, dan tindak lanjuti kerusakan pintu serta tanggul secara real-time.
          </p>
        </div>

        {canWrite && (
          <button 
            onClick={handleWipeData}
            className="px-3.5 py-1.5 self-end md:self-center border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            id="wipe-ops-data-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kosongkan Semua Data</span>
          </button>
        )}
      </div>

      {/* 2. TAB CONTROLLER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-100 p-1 rounded-xl gap-2 border border-slate-200/50" id="operasional-tab-selector">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => {
              setActiveOpsTab('hidrologi');
              setSearchQuery('');
              setLocationFilter('all');
              setStatusFilter('all');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeOpsTab === 'hidrologi'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Ukur Hidrologi &amp; TMA</span>
          </button>

          <button
            onClick={() => {
              setActiveOpsTab('kerusakan');
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeOpsTab === 'kerusakan'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Laporan Kerusakan ({damageReports.filter(d => d.status !== 'Selesai').length})</span>
          </button>

          <button
            onClick={() => {
              setActiveOpsTab('pengaturan');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeOpsTab === 'pengaturan'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Konfigurasi Pos Alat Ukur</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-550 font-bold font-mono px-3 py-1.5 bg-slate-200/50 rounded-lg text-center whitespace-nowrap">
          Role: <span className="text-indigo-700 capitalize">{currentUser.role}</span> ({currentUser.section && currentUser.section.split(',').includes('all') ? 'Lengkap' : 'Seksi OP'})
        </div>
      </div>

      {/* 3. SUBTAB CONTENT - HIDROLOGI */}
      {activeOpsTab === 'hidrologi' && (
        <div className="space-y-6" id="panel-operasional-hidrologi">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="hidrologi-mini-stats">
            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">Titik Pos Pantau</span>
                <span className="text-xl font-extrabold text-slate-800">{activeStationsCount}</span>
                <span className="text-[9px] text-slate-500 block">Stasiun Aktif Terdaftar</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-indigo-500">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">Rata-rata TMA</span>
                <span className="text-xl font-extrabold text-slate-800">{averageTmaOfLogs} cm</span>
                <span className="text-[9px] text-indigo-600 font-bold block">Tinggi Muka Air Rerata</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Waves className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">TMA Tertinggi</span>
                <span className="text-xl font-extrabold text-amber-700">{maxTmaLogged} cm</span>
                <span className="text-[9px] text-slate-500 block">Ambang Puncak Terpantau</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">Status Kritis</span>
                <span className={`text-xl font-extrabold ${criticalLogsCount > 0 ? 'text-red-650' : 'text-emerald-700'}`}>
                  {criticalLogsCount > 0 ? `${criticalLogsCount} Pos` : '0 AMAN'}
                </span>
                <span className="text-[9px] text-slate-500 block">Siaga atau Awas Banjir</span>
              </div>
              <div className={`p-3 rounded-lg ${criticalLogsCount > 0 ? 'bg-red-50 text-red-650' : 'bg-emerald-50 text-emerald-600'}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action Trigger Line */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 gap-4">
            <div className="flex flex-col md:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari lokasi / petugas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700"
              >
                <option value="all">Semua Stasiun</option>
                {riverStations.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700"
              >
                <option value="all">Semua Status</option>
                <option value="Normal">Normal</option>
                <option value="Waspada">Waspada</option>
                <option value="Siaga">Siaga</option>
                <option value="Awas">Awas</option>
              </select>
            </div>

            {canWrite && (
              <button
                onClick={() => {
                  setEditingLogId(null);
                  setLogLocation(riverStations[0] || '');
                  setLogTma(100);
                  setLogDebit(15.5);
                  setLogDate(new Date().toISOString().substring(0, 10));
                  setLogRecordedBy(currentUser.name);
                  setIsLogFormOpen(!isLogFormOpen);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                id="add-log-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Pencatatan Debit Air</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {isLogFormOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-500" />
                    <span>{editingLogId ? 'Ubah Hasil Ukur Sungai' : 'Input Hasil Pengukuran Hidrometri'}</span>
                  </h3>
                  <button 
                    onClick={() => {
                      setIsLogFormOpen(false);
                      setEditingLogId(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Tutup
                  </button>
                </div>

                <form onSubmit={handleLogSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lokasi Pos Ukur</label>
                    <select
                      value={logLocation}
                      onChange={(e) => setLogLocation(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white"
                      required
                    >
                      {riverStations.length === 0 ? (
                        <option value="">(Tambahkan stasiun di tab Pengaturan)</option>
                      ) : (
                        riverStations.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tinggi Muka Air (TMA)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={logTma}
                        onChange={(e) => setLogTma(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white pr-10"
                        min="0"
                        max="2000"
                        required
                      />
                      <span className="absolute right-3 top-3 text-slate-400 font-bold text-[10px]">cm</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Debit Air (Q)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={logDebit}
                        onChange={(e) => setLogDebit(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white pr-12"
                        min="0"
                        max="1000"
                        required
                      />
                      <span className="absolute right-3 top-3 text-slate-400 font-bold text-[10px]">m³/s</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal &amp; Waktu Ambil</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Petugas Juru Ukur</label>
                    <input
                      type="text"
                      value={logRecordedBy}
                      onChange={(e) => setLogRecordedBy(e.target.value)}
                      placeholder="Nama pencatat"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 font-bold outline-none focus:bg-white mb-2"
                      required
                    />
                  </div>

                  <div className="md:col-span-5 flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogFormOpen(false);
                        setEditingLogId(null);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={riverStations.length === 0}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingLogId ? 'Simpan Perubahan' : 'Sematkan Laporan Pengukuran'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Area */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-700">Daftar Hasil Pengukuran Hidrometri</span>
              <span className="font-mono text-[10px] text-slate-450">Menampilkan {filteredLogs.length} dari {waterLogs.length} catatan</span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Waves className="w-6 h-6 text-slate-350" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Log Data Hidrometri</h4>
                  <p className="text-xs text-slate-450 max-w-md mx-auto">
                    Pengukuran debit belum dimasukkan atau kueri pencarian tidak cocok. Silakan tambah log baru dengan tombol di atas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-450 uppercase font-bold tracking-widest text-[9px]">
                      <th className="p-4">Tanggal Ukur</th>
                      <th className="p-4">Pos Pemantauan / Stasiun</th>
                      <th className="p-4 text-center">Tinggi Muka Air (TMA)</th>
                      <th className="p-4 text-center">Estimasi Debit (Q)</th>
                      <th className="p-4 text-center">Status Limpasan</th>
                      <th className="p-4">Petugas / Juru</th>
                      {canWrite && <th className="p-4 text-center w-24">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105">
                    {filteredLogs.map((log) => {
                      const getBadgeColor = (st: string) => {
                        switch (st) {
                          case 'Awas': return 'bg-red-50 text-red-700 border-red-200';
                          case 'Siaga': return 'bg-amber-50 text-amber-700 border-amber-200';
                          case 'Waspada': return 'bg-yellow-50 text-yellow-700 border-yellow-250';
                          default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        }
                      };

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 font-bold text-slate-600 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {log.date}
                            </span>
                          </td>
                          <td className="p-4 font-extrabold text-slate-900">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              {log.location}
                            </span>
                          </td>
                          <td className="p-4 text-center font-black text-slate-800 text-[13px] whitespace-nowrap">
                            {log.tma} cm
                          </td>
                          <td className="p-4 text-center font-bold text-indigo-750 text-[13px] whitespace-nowrap">
                            {log.debit} m³/s
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getBadgeColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-bold whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3 text-slate-400" />
                              {log.recordedBy}
                            </span>
                          </td>
                          {canWrite && (
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditLogClick(log)}
                                  className="p-1 px-2 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-md transition-colors"
                                  title="Ubah data"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Hapus baris hasil ukur ini?')) {
                                      onDeleteWaterLog(log.id);
                                    }
                                  }}
                                  className="p-1 px-2 bg-red-50/10 hover:bg-red-50 border border-red-100/40 hover:border-red-205 text-red-650 rounded-md transition-colors"
                                  title="Hapus data"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SUBTAB CONTENT - KERUSAKAN */}
      {activeOpsTab === 'kerusakan' && (
        <div className="space-y-6" id="panel-operasional-kerusakan">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="kerusakan-mini-stats">
            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Total Pengaduan</span>
              <span className="text-xl font-extrabold text-slate-800">{damageReports.length}</span>
              <span className="text-[9px] text-slate-500 block">Laporan Masuk Sejak Sistem Berdiri</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-black uppercase text-[8px] tracking-wide inline-block mb-1">Menunggu Peninjauan</span>
              <span className="text-xl font-extrabold text-red-750 block">
                {damageReports.filter(d => d.status === 'Laporan Masuk').length} Kasus
              </span>
              <span className="text-[9px] text-slate-500 block">Butuh Verifikasi Lapangan</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-black uppercase text-[8px] tracking-wide inline-block mb-1">Dalam Rekonstruksi</span>
              <span className="text-xl font-extrabold text-amber-705 block">
                {damageReports.filter(d => d.status === 'Proses Perbaikan' || d.status === 'Ditinjau').length} Kasus
              </span>
              <span className="text-[9px] text-slate-500 block">Tahap Pemeliharaan Bertahap</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-black uppercase text-[8px] tracking-wide inline-block mb-1">Selesai Ditangani</span>
              <span className="text-xl font-extrabold text-emerald-700 block">
                {damageReports.filter(d => d.status === 'Selesai').length} Kasus
              </span>
              <span className="text-[9px] text-slate-500 block">Pemberkasan Pemeliharaan Selesai</span>
            </div>
          </div>

          {/* Actions Column */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 gap-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari keluhan, pencatat, atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700 text-xs"
              >
                <option value="all">Semua Status Pengaduan</option>
                <option value="Laporan Masuk">Laporan Masuk</option>
                <option value="Ditinjau">Ditinjau</option>
                <option value="Proses Perbaikan">Proses Perbaikan</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            {canWrite && (
              <button
                onClick={() => setIsReportFormOpen(!isReportFormOpen)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                id="add-damage-report-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengaduan Keluhan</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {isReportFormOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                    <span>Catat Aduan Laporan Kerusakan Irigasi</span>
                  </h3>
                  <button 
                    onClick={() => setIsReportFormOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Tutup
                  </button>
                </div>

                <form onSubmit={handleReportSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Pelapor / Juru Pengamat</label>
                    <input
                      type="text"
                      value={repName}
                      onChange={(e) => setRepName(e.target.value)}
                      placeholder="Masukkan nama pelapor..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 font-bold outline-none focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor Kontak Pelapor</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={repPhone}
                        onChange={(e) => setRepPhone(e.target.value)}
                        placeholder="Contoh: 0812XXXXXXXX"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 font-bold outline-none focus:bg-white pl-8"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lokasi Kerusakan</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={repLocation}
                        onChange={(e) => setRepLocation(e.target.value)}
                        placeholder="Contoh: Saluran Tersier DI-1"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 font-bold outline-none focus:bg-white pl-8"
                        required
                      />
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Aduan</label>
                    <input
                      type="date"
                      value={repDate}
                      onChange={(e) => setRepDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 font-bold outline-none focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1">Keterangan / Kerusakan Detail</label>
                    <textarea
                      value={repDescription}
                      onChange={(e) => setRepDescription(e.target.value)}
                      placeholder="Dekripsikan kerusakan konstruksi, pengaruh terhadap suplai air sawah, luasan dampak hilir..."
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 font-bold outline-none focus:bg-white"
                      required
                    ></textarea>
                  </div>

                  <div className="md:col-span-4 flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsReportFormOpen(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg"
                    >
                      Kirim Laporan Pengaduan
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards Display Grid */}
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center space-y-3 px-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <AlertTriangle className="w-6 h-6 text-slate-350" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Pengaduan Kerusakan</h4>
                <p className="text-xs text-slate-450 max-w-md mx-auto">
                  Seluruh saluran irigasi dan pintu air dalam keadaan baik. Tidak ada aduan kerusakan tanggul saat ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="kerusakan-reports-grid">
              {filteredReports.map((report) => {
                const getStatusStyle = (st: string) => {
                  switch (st) {
                    case 'Selesai': return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-250', pill: 'bg-emerald-200', text: 'Selesai Ditangani' };
                    case 'Proses Perbaikan': return { bg: 'bg-indigo-50 text-indigo-800 border-indigo-250', pill: 'bg-indigo-300', text: 'Perbaikan Fisik' };
                    case 'Ditinjau': return { bg: 'bg-amber-50 text-amber-800 border-amber-250', pill: 'bg-amber-300', text: 'Ditinjau di Lapangan' };
                    default: return { bg: 'bg-red-50 text-red-800 border-red-250', pill: 'bg-red-300', text: 'Baru Masuk' };
                  }
                };

                const style = getStatusStyle(report.status);

                return (
                  <div key={report.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-black font-mono block">ID: {report.id}</span>
                          <span className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {report.date}
                          </span>
                        </div>
                        
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider border ${style.bg} flex items-center gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.pill} animate-pulse`}></span>
                          {style.text}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5 text-[13px] font-black text-slate-800">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{report.location}</span>
                        </div>
                        <p className="text-xs text-slate-550 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {report.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-700">{report.reporterName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{report.reporterPhone}</span>
                        </div>
                      </div>

                      {canWrite && (
                        <div className="flex gap-1.5 self-stretch sm:self-auto justify-end">
                          {report.status !== 'Selesai' && (
                            <>
                              {report.status === 'Laporan Masuk' && (
                                <button
                                  onClick={() => onUpdateDamageStatus(report.id, 'Ditinjau')}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                                >
                                  Tinjau Lokasi
                                </button>
                              )}
                              {(report.status === 'Laporan Masuk' || report.status === 'Ditinjau') && (
                                <button
                                  onClick={() => onUpdateDamageStatus(report.id, 'Proses Perbaikan')}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-900 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                                >
                                  Mulai Perbaikan
                                </button>
                              )}
                              {report.status === 'Proses Perbaikan' && (
                                <button
                                  onClick={() => onUpdateDamageStatus(report.id, 'Selesai')}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Tandai Selesai</span>
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Hapus laporan pengaduan ini permanent dari data harian?')) {
                                onDeleteDamageReport(report.id);
                              }
                            }}
                            className="p-1.5 bg-red-50/10 hover:bg-red-50 border border-red-100 text-red-650 hover:text-red-750 transition-colors rounded-lg text-[10px]"
                            title="Hapus Pengaduan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. SUBTAB CONTENT - PENGATURAN POS */}
      {activeOpsTab === 'pengaturan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="panel-operasional-pengaturan">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                <h3 className="font-extrabold text-slate-800 text-sm">Prasarana Pos Pemantauan Wilayah Air</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Di bawah ini merupakan daftar stasiun hidrolik dan klimatologi harian UPTD PSDA Bah Bolon yang aktif. Anda dapat menambahkan pos pengamat debit lain demi menyesuaikan data inventarisasi limpasan yang ada di lapangan.
              </p>

              <div className="divide-y divide-slate-100" id="river-stations-list-display">
                {riverStations.map((station, i) => (
                  <div key={station} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5 font-extrabold text-slate-800">
                      <span className="w-5 h-5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                        {i + 1}
                      </span>
                      <span>{station}</span>
                    </div>

                    {canWrite ? (
                      <button
                        onClick={() => handleDeleteStation(station)}
                        className="text-red-550 hover:text-red-700 p-1 bg-red-50/30 rounded border border-transparent hover:border-red-100"
                        title="Hapus opsi stasiun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Terkunci</span>
                    )}
                  </div>
                ))}

                {riverStations.length === 0 && (
                  <div className="py-8 text-center text-slate-450 italic">
                    Belum ada pos pemantauan air harian terdaftar. Silakan tambahkan satu di samping.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100/50 flex gap-3 text-xs text-indigo-900 leading-relaxed font-medium">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-slate-800">Panduan Klasifikasi TMA Sungai UPTD Bah Bolon</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-[11px] text-slate-650">
                  <li><strong>Normal (&lt; 120 cm):</strong> Aliran normal, tanggul aman, limpasan bendung aman.</li>
                  <li><strong>Waspada (120 cm - 179 cm):</strong> Terjadi curah hujan tinggi setempat, pengawas pintu wajib siaga di pos pembagi.</li>
                  <li><strong>Siaga (180 cm - 249 cm):</strong> Sungai mulai meluap mendekati bibir saluran hulu, bersiap membuka pintu darurat.</li>
                  <li><strong>Awas (&ge; 250 cm):</strong> Banjir bandang atau limpasan darurat terdeteksi, lakukan evakuasi daerah banyolan.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {canWrite ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <span className="text-[10px] text-indigo-650 uppercase font-bold tracking-widest block bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                  Registrasi Pos Pengukuran
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm">Daftarkan Pos Baru</h4>

                <form onSubmit={handleAddStation} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Pos / Cabang Aliran</label>
                    <input
                      type="text"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      placeholder="Contoh: Bendung Pintu Kiri Hilir"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    Daftarkan Pos Pemantauan
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 text-center text-xs text-amber-800 font-medium">
                🔒 Perubahan konfigurasi parameter pos pemantauan hanya diizinkan untuk Admin dan Staf seksi Operasional saja.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
