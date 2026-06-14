import React from 'react';
import { Mail, Project, WaterLog, DamageReport, Staff, Asset } from '../types';
import { 
  Droplet, 
  Layers, 
  Wrench, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Activity, 
  MapPin, 
  UserCheck, 
  AlertTriangle,
  History,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  Heart,
  Briefcase,
  Coins,
  Package
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatToIndoDate } from '../utils';

interface DashboardProps {
  mails: Mail[];
  staff: Staff[];
  projects: Project[];
  projectsOperasional?: Project[];
  waterLogs: WaterLog[];
  damageReports: DamageReport[];
  instansiName: string;
  assets: Asset[];
}

export default function Dashboard({ 
  mails, 
  staff, 
  projects, 
  projectsOperasional = [], 
  waterLogs, 
  damageReports, 
  instansiName, 
  assets = [] 
}: DashboardProps) {
  // Key Stats
  const activeProjectsCount = projects.filter(p => p.status === 'Konstruksi').length;
  const completedProjectsCount = projects.filter(p => p.status === 'Selesai').length;
  const mailCount = mails.length;
  const staffCount = staff.length;
  const unhandledDamageCount = damageReports.filter(d => d.status === 'Laporan Masuk').length;

  // Average Discharge TMA (Water level) from latest records
  const latestLogsMap = Array.from(new Map(waterLogs.map(log => [log.location, log])).values());
  const avgTma = latestLogsMap.length > 0 
    ? Math.round(latestLogsMap.reduce((acc, log) => acc + log.tma, 0) / latestLogsMap.length) 
    : 0;
  const avgDebit = latestLogsMap.length > 0 
    ? (latestLogsMap.reduce((acc, log) => acc + log.debit, 0) / latestLogsMap.length).toFixed(1) 
    : "0";

  // Check if there is any Awas or Siaga status
  const criticalStatus = latestLogsMap.find(log => log.status === 'Awas' || log.status === 'Siaga');

  // Dynamic Chart Points Generation
  const sortedLogs = [...waterLogs].sort((a, b) => a.date.localeCompare(b.date));
  const chartLogs = sortedLogs.slice(-7);
  const numPoints = chartLogs.length;
  const chartPoints = chartLogs.map((log, i) => {
    const x = numPoints > 1 ? (i / (numPoints - 1)) * 500 : 250;
    const cappedTma = Math.min(300, Math.max(0, log.tma));
    const y = 150 - (cappedTma / 300) * 110 - 20; // leaves safety padding
    return { x, y, log };
  });

  // Calculate Peak TMA from all logs
  const peakTma = waterLogs.length > 0 ? Math.max(...waterLogs.map(l => l.tma)) : 0;

  // Construct SVG Area and Line path d string
  let linePathD = '';
  let areaPathD = '';
  if (numPoints > 1) {
    linePathD = `M ${chartPoints[0].x} ${chartPoints[0].y} ` + chartPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPathD = `M ${chartPoints[0].x} 150 L ${chartPoints[0].x} ${chartPoints[0].y} ` + chartPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${chartPoints[numPoints - 1].x} 150 Z`;
  } else if (numPoints === 1) {
    linePathD = `M 0 ${chartPoints[0].y} L 500 ${chartPoints[0].y}`;
    areaPathD = `M 0 150 L 0 ${chartPoints[0].y} L 500 ${chartPoints[0].y} L 500 150 Z`;
  }

  // ==========================================
  // STAFF DEMOGRAPHIC STATISTICS AGGREGATION
  // ==========================================
  const totalStaff = staff.length;

  // A. Gender distribution
  const maleCount = staff.filter(s => s.jenisKelamin === 'Laki-laki').length;
  const femaleCount = staff.filter(s => s.jenisKelamin === 'Perempuan').length;
  const malePct = totalStaff > 0 ? Math.round((maleCount / totalStaff) * 100) : 0;
  const femalePct = totalStaff > 0 ? Math.round((femaleCount / totalStaff) * 100) : 0;

  // B. Religion Breakdown
  const religionsList = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
  const religionCounts: { [key: string]: number } = {};
  religionsList.forEach(r => {
    religionCounts[r] = staff.filter(s => s.agama === r).length;
  });
  staff.forEach(s => {
    if (s.agama && !religionsList.includes(s.agama)) {
      religionCounts[s.agama] = (religionCounts[s.agama] || 0) + 1;
    }
  });
  const sortedReligionData = Object.entries(religionCounts)
    .map(([name, count]) => ({ name, count }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  // C. Golongan Breakdown
  const golonganDirectCounts: { [key: string]: number } = {};
  staff.forEach(s => {
    if (s.golongan) {
      golonganDirectCounts[s.golongan] = (golonganDirectCounts[s.golongan] || 0) + 1;
    } else {
      golonganDirectCounts['Tanpa Golongan'] = (golonganDirectCounts['Tanpa Golongan'] || 0) + 1;
    }
  });

  const availableGolongans = ['IV/e', 'IV/d', 'IV/c', 'IV/b', 'IV/a', 'III/d', 'III/c', 'III/b', 'III/a', 'II/d', 'II/c', 'II/b', 'II/a', 'I/d', 'I/c', 'I/b', 'I/a'];
  const sortedGolonganData = availableGolongans
    .map(gol => ({ name: gol, count: golonganDirectCounts[gol] || 0 }))
    .filter(item => item.count > 0);

  if (golonganDirectCounts['Tanpa Golongan'] > 0) {
    sortedGolonganData.push({ name: 'N/A', count: golonganDirectCounts['Tanpa Golongan'] });
  }

  // Broad classes summary
  const golonganTierSummary = [
    { tier: 'Golongan IV (Pembina)', count: staff.filter(s => s.golongan && s.golongan.startsWith('IV/')).length, color: 'bg-indigo-600', hoverBg: 'hover:bg-indigo-700' },
    { tier: 'Golongan III (Penata)', count: staff.filter(s => s.golongan && s.golongan.startsWith('III/')).length, color: 'bg-blue-600', hoverBg: 'hover:bg-blue-700' },
    { tier: 'Golongan II (Pengatur)', count: staff.filter(s => s.golongan && s.golongan.startsWith('II/')).length, color: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-700' },
    { tier: 'Golongan I (Juru)', count: staff.filter(s => s.golongan && s.golongan.startsWith('I/')).length, color: 'bg-amber-600', hoverBg: 'hover:bg-amber-700' },
  ].filter(t => t.count > 0);

  // D. Education Breakdown
  const getStaffHighestEduLevel = (person: Staff): string => {
    if (!person.riwayatPendidikan || person.riwayatPendidikan.length === 0) {
      return 'SD/Sederajat';
    }
    const ranks: { [key: string]: number } = {
      'SD': 1, 'SMP': 2, 'SMA': 3, 'SMA/SMK': 3, 'D3': 4, 'D4': 5, 'S1': 6, 'S2': 7, 'S3': 8
    };
    let highest = person.riwayatPendidikan[0];
    let highestRank = ranks[highest.jenjang] || 0;
    
    for (let i = 1; i < person.riwayatPendidikan.length; i++) {
      const current = person.riwayatPendidikan[i];
      const currentRank = ranks[current.jenjang] || 0;
      if (currentRank > highestRank) {
        highest = current;
        highestRank = currentRank;
      }
    }
    return highest.jenjang;
  };

  const eduDistribution: { [key: string]: number } = {};
  staff.forEach(s => {
    const highest = getStaffHighestEduLevel(s);
    eduDistribution[highest] = (eduDistribution[highest] || 0) + 1;
  });

  const allEduLevels = ['S3', 'S2', 'S1', 'D4', 'D3', 'SMA', 'SMP', 'SD'];
  const sortedEduData = allEduLevels
    .map(level => ({ name: level, count: eduDistribution[level] || 0 }))
    .filter(item => item.count > 0);

  // Calculate Total Assets Value (Nilai Aset PSDA Bah Bolon)
  const totalAssetValue = assets.reduce((sum, a) => sum + ((a.price || 0) * (a.quantity || 1)), 0);
  const totalAssetCount = assets.reduce((sum, a) => sum + (a.quantity || 1), 0);

  return (
    <div className="space-y-6" id="dashboard-tab-content">
      {/* Header and Welcome */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-96 h-96 transform translate-x-20 translate-y-20 fill-white">
            <path d="M10 80 Q 25 10 50 80 T 90 80" />
            <path d="M10 90 Q 25 30 50 90 T 90 90" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="bg-amber-400 text-slate-900 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
              Dashboard Utama
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight" id="dashboard-title">
              SISTEM INFORMASI TERPADU UPTD PSDA BAH BOLON
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl font-light">
              Selamat datang kembali. Melaui portal ini Anda dapat memantau seluruh kinerja penatausahaan umum, progres pelaksanaan proyek konstruksi, hingga pemantauan status hidrologi tinggi muka air sungai Bah Bolon secara real-time.
            </p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl shrink-0 border border-white/10 self-start md:self-center">
            <div className="text-xs text-blue-200">Kondisi Sungai Bah Bolon:</div>
            <div className="flex items-center space-x-2 mt-1">
              <Droplet className={`w-5 h-5 ${criticalStatus ? 'text-amber-400 animate-bounce' : 'text-cyan-300'}`} />
              <span className="font-extrabold text-lg tracking-wide">
                {criticalStatus ? `SIAGA: PROYEKSI ${criticalStatus.location}` : 'STATUS AMAN (NORMAL)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: RINGKASAN DATA & NILAI ASET UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-kpi-grid">
        
        {/* Card 1: Nilai Aset PSDA Bah Bolon (Primary Highlight Card) */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden border border-indigo-900/40 shadow-indigo-950/10 min-h-[170px]" id="kpi-nilai-aset-card">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-48 h-48 transform translate-x-12 -translate-y-8 fill-white">
              <circle cx="50" cy="50" r="40" />
            </svg>
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                  <Coins className="w-5 h-5 text-amber-400" />
                </span>
                <span className="text-xs font-extrabold text-blue-200 uppercase tracking-widest">ASET &amp; INVENTARIS</span>
              </div>
              <span className="bg-amber-400 text-slate-900 font-extrabold text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
                Nilai Akumulasi
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">
                NILAI ASET PEROLEHAN UPTD PSDA BAH BOLON
              </div>
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-300 via-white to-blue-100 bg-clip-text text-transparent leading-none">
                Rp {(totalAssetValue || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-blue-200 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="bg-white/15 px-2.5 py-0.5 rounded font-extrabold text-white text-[10px]">
                {assets.length} Macam Barang
              </span>
              <span>&bull;</span>
              <span>{totalAssetCount} Unit Registrasi</span>
            </div>
            <span className="text-[10px] text-amber-400 font-black uppercase flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              <Package className="w-3.5 h-3.5" /> Terhitung Dinamis
            </span>
          </div>
        </div>

        {/* Card 2: Kinerja Pembangunan */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-indigo-100/30 flex flex-col justify-between" id="kpi-pembangunan-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded uppercase tracking-wider">
                PROGRES FISIK
              </span>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Pembangunan Fisik</div>
              <div className="text-2xl font-black text-slate-850 tracking-tight">
                {projects.length} Paket Kerja
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                <strong>{activeProjectsCount}</strong> sedang konstruksi &bull; <strong>{completedProjectsCount}</strong> paket selesai.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-semibold flex justify-between items-center">
            <span>Daftar Progres Terhitung</span>
            <span className="text-emerald-600 font-bold">Dinamis</span>
          </div>
        </div>

        {/* Card 3: Administrasi Umum & Surat */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-indigo-100/30 flex flex-col justify-between" id="kpi-kearsipan-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wider">
                KEARSIPAN
              </span>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Administrasi Surat</div>
              <div className="text-2xl font-black text-slate-850 tracking-tight">
                {mailCount} Dokumen
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                <strong>{mails.filter(m => m.type === 'masuk').length}</strong> Surat Masuk &bull; <strong>{mails.filter(m => m.type === 'keluar').length}</strong> Surat Keluar.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-semibold flex justify-between items-center">
            <span>TMT Surat Tercatat</span>
            <span className="text-blue-600 font-bold">Dinamis</span>
          </div>
        </div>

      </div>



      {/* SECTION: Demografi & Statistik Pegawai */}
      <div className="bg-white p-7 rounded-3xl shadow-md border border-slate-100 space-y-6" id="staff-demographics-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Statistik & Demografi Personalia Pegawai
            </h2>
            <p className="text-xs text-slate-500">
              Profil sebaran pegawai UPTD PSDA Bah Bolon berdasarkan Golongan, Jenis Kelamin, Agama, dan Pendidikan Terakhir secara dinamis dari database personalia.
            </p>
          </div>
          <div className="mt-2 md:mt-0 flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 self-start md:self-center animate-pulse">
            <Award className="w-4 h-4" />
            Total: {totalStaff} Pegawai Aktif
          </div>
        </div>

        {totalStaff > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Widget 1: DIAGRAM BATANG KOLOM GOLONGAN */}
            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4" id="demographic-golongan-card">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Grafik Distribusi Golongan
                  </span>
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Pangkat Tiers</span>
                </div>
                <h3 className="text-xs font-bold text-slate-700">Proporsi Kualifikasi Penjenjangan Karier</h3>
              </div>

              {/* Responsive SVG/CSS Column Bar Chart */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 bg-white rounded-xl border border-slate-100 relative shadow-2xs" id="golongan-column-bar-chart">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-x-0 top-6 border-t border-slate-100/70 pointer-events-none" />
                <div className="absolute inset-x-0 top-18 border-t border-slate-100/70 pointer-events-none" />
                <div className="absolute inset-x-0 top-30 border-t border-slate-100/70 pointer-events-none" />

                {(() => {
                  const itemsToShow = [
                    { tier: 'IV (Pembina)', count: staff.filter(s => s.golongan && s.golongan.startsWith('IV/')).length, gradient: 'from-indigo-600 to-indigo-500', textLight: 'text-indigo-100' },
                    { tier: 'III (Penata)', count: staff.filter(s => s.golongan && s.golongan.startsWith('III/')).length, gradient: 'from-blue-600 to-blue-500', textLight: 'text-blue-100' },
                    { tier: 'II (Pengatur)', count: staff.filter(s => s.golongan && s.golongan.startsWith('II/')).length, gradient: 'from-emerald-600 to-emerald-500', textLight: 'text-emerald-100' },
                    { tier: 'I (Juru)', count: staff.filter(s => s.golongan && s.golongan.startsWith('I/')).length, gradient: 'from-amber-600 to-amber-500', textLight: 'text-amber-100' },
                  ];
                  const maxCount = Math.max(...itemsToShow.map(i => i.count), 1);
                  return itemsToShow.map((item) => {
                    const pctHeight = (item.count / maxCount) * 100;
                    const pctOfTotal = totalStaff > 0 ? Math.round((item.count / totalStaff) * 100) : 0;
                    return (
                      <div key={item.tier} className="flex-1 flex flex-col h-full justify-end relative group">
                        {/* Actual count overlay on top */}
                        <span className="text-[10px] font-black text-slate-805 text-center mb-1 group-hover:scale-110 transition-transform duration-200">
                          {item.count} org
                        </span>
                        
                        {/* Column Bar with Gradient */}
                        <div 
                          style={{ height: `${Math.max(12, pctHeight * 0.7)}%` }}
                          className={`w-full bg-gradient-to-t ${item.gradient} rounded-t-xl transition-all duration-700 relative flex items-center justify-center shadow-xs group-hover:brightness-105 cursor-pointer`}
                        >
                          {pctOfTotal >= 20 && (
                            <span className={`text-[9px] font-black ${item.textLight} rotate-270 md:rotate-0`}>
                              {pctOfTotal}%
                            </span>
                          )}
                        </div>

                        {/* X-axis labels */}
                        <span className="text-[9px] font-extrabold text-slate-500 mt-2 text-center truncate max-w-full">
                          Gol. {item.tier.split(' ')[0]}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Sub-Grade Badges list */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Kode Penjabaran Rincian Golongan:</div>
                <div className="flex flex-wrap gap-1.5 max-h-[50px] overflow-y-auto pr-1">
                  {sortedGolonganData.map((item) => (
                    <span key={item.name} className="inline-flex items-center gap-1 text-[10px] bg-white border border-slate-200 text-slate-750 px-2.5 py-1 rounded-lg font-bold shadow-3xs hover:border-indigo-200 hover:bg-indigo-50/25 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {item.name}: <span className="font-extrabold text-slate-905">{item.count} org</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Widget 3: DIAGRAM SPEEDOMETER DIAL GAUGE GENDER */}
            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4" id="demographic-gender-card">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Meteran Keseimbangan Gender
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Sex-Ratio Comparator</span>
                </div>
                <h3 className="text-xs font-bold text-slate-700">Rasio Distribusi Beban Penugasan Lapangan</h3>
              </div>

              {/* Semicircular Speedometer Dial Gauge */}
              {(() => {
                const needleRotation = -90 + (malePct / 100) * 180;
                return (
                  <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                    <div className="flex flex-col items-center justify-center p-1 relative w-36 h-28 shrink-0">
                      <svg className="w-36 h-20 overflow-visible" viewBox="0 0 100 60">
                        {/* Background track circle arc */}
                        <path 
                          d="M 10 50 A 40 40 0 0 1 90 50" 
                          fill="none" 
                          stroke="#e2e8f0" 
                          strokeWidth="10" 
                          strokeLinecap="round" 
                        />
                        {/* Active Dial colored arc (Laki portions) */}
                        <path 
                          d="M 10 50 A 40 40 0 0 1 90 50" 
                          fill="none" 
                          stroke="url(#genderMetricDialColorGrad)" 
                          strokeWidth="10" 
                          strokeLinecap="round" 
                          strokeDasharray="125.6" 
                          strokeDashoffset={125.6 - (malePct / 100) * 125.6} 
                        />
                        
                        {/* Dial Pointer needle */}
                        <g transform={`translate(55, 50) rotate(${needleRotation})`}>
                          <line x1="0" y1="y" x2="-35" y2="0" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-700" />
                          <circle cx="0" cy="0" r="4.5" fill="#0f172a" />
                          <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                        </g>
                        
                        <defs>
                          <linearGradient id="genderMetricDialColorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ec4899" /> {/* Female Pin */}
                            <stop offset="50%" stopColor="#818cf8" /> {/* Unisex Midpoint */}
                            <stop offset="100%" stopColor="#3b82f6" /> {/* Male Blue */}
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      <div className="text-center mt-1.5">
                        <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-150/45 text-indigo-700 uppercase tracking-widest leading-none">
                          {maleCount === femaleCount ? 'Seimbang 1:1' : maleCount > femaleCount ? 'Cenderung Laki-Laki' : 'Cenderung Perempuan'}
                        </span>
                      </div>
                    </div>

                    {/* Gender info side cards */}
                    <div className="flex-1 w-full space-y-2">
                      <div className="bg-white border border-blue-200 p-2.5 rounded-xl flex items-center justify-between shadow-3xs bg-blue-50/5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs">👨</span>
                          <div>
                            <div className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Laki-laki</div>
                            <div className="text-xs font-black text-slate-800">{maleCount} Orang</div>
                          </div>
                        </div>
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{malePct}%</span>
                      </div>

                      <div className="bg-white border border-rose-200 p-2.5 rounded-xl flex items-center justify-between shadow-3xs bg-rose-50/5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs">👩</span>
                          <div>
                            <div className="text-[9px] text-slate-455 font-bold uppercase tracking-wider">Perempuan</div>
                            <div className="text-xs font-black text-slate-800">{femaleCount} Orang</div>
                          </div>
                        </div>
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{femalePct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Widget 4: BAGAN POLAR BULLET COMPOSITION AGAMA */}
            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4" id="demographic-agama-card">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Bagan Proposi Keberagaman
                  </span>
                  <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Faith Composition</span>
                </div>
                <h3 className="text-xs font-bold text-slate-700">Keragaman Keyakinan &amp; Kebinekaan Staff</h3>
              </div>

              {/* Advanced Stacked Proportion Flow Bar */}
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Segmentasi Spasial Bar:</span>
                    <span className="text-rose-600">Interaktif</span>
                  </div>
                  
                  {/* Proportional solid bar */}
                  <div className="h-5 w-full bg-slate-205 rounded-full flex overflow-hidden shadow-inner border border-slate-200">
                    {(() => {
                      const totalReligionCount = sortedReligionData.reduce((sum, r) => sum + r.count, 0);
                      const religionColors: { [key: string]: { bg: string } } = {
                        'Islam': { bg: 'bg-emerald-500' },
                        'Kristen': { bg: 'bg-blue-500' },
                        'Katolik': { bg: 'bg-indigo-500' },
                        'Hindu': { bg: 'bg-amber-500' },
                        'Buddha': { bg: 'bg-yellow-400' },
                        'Konghucu': { bg: 'bg-rose-500' }
                      };

                      return sortedReligionData.map((item) => {
                        const color = religionColors[item.name] || { bg: 'bg-slate-500' };
                        const pct = totalReligionCount > 0 ? (item.count / totalReligionCount) * 100 : 0;
                        return (
                          <div
                            key={item.name}
                            className={`${color.bg} h-full transition-all duration-700 relative group flex items-center justify-center cursor-pointer hover:opacity-90`}
                            style={{ width: `${pct}%` }}
                            title={`${item.name}: ${item.count} orang (${Math.round(pct)}%)`}
                          >
                            {pct >= 15 && (
                              <span className="text-[9px] font-black text-white hover:scale-110 transition-transform">
                                {Math.round(pct)}%
                              </span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Faith labels and exact counts */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 max-h-[75px] overflow-y-auto pr-1">
                  {(() => {
                    const religionDots: { [key: string]: string } = {
                      'Islam': 'bg-emerald-500',
                      'Kristen': 'bg-blue-500',
                      'Katolik': 'bg-indigo-500',
                      'Hindu': 'bg-amber-500',
                      'Buddha': 'bg-yellow-400',
                      'Konghucu': 'bg-rose-500'
                    };
                    return sortedReligionData.map((item) => {
                      const dotBg = religionDots[item.name] || 'bg-slate-500';
                      const pctOfReligion = totalStaff > 0 ? Math.round((item.count / totalStaff) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center gap-1.5 text-[10.5px]">
                          <span className={`w-2 h-2 rounded-full ${dotBg} shrink-0`} />
                          <span className="font-bold text-slate-700 truncate">{item.name}:</span>
                          <span className="font-extrabold text-slate-900 shrink-0">{item.count} org ({pctOfReligion}%)</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 animate-pulse" />
            </div>
            <div className="font-bold text-slate-700 text-sm">Tidak Ada Data Pegawai</div>
            <p className="text-xs text-slate-400 max-w-md">
              Demografi personalia tidak dapat dianalisis secara visual karena daftar kepegawaian kosong. Masukkan data pegawai di modul Penatausahaan &gt; Kepegawaian (Personalia) untuk memplot bagan secara dinamis.
            </p>
          </div>
        )}
      </div>

      {/* Main Charts & Hydrological Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column - Custom Analytics Graphics */}
        <div className="lg:col-span-2 space-y-6">
          


          {/* Section Progress Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" id="dashboard-progress-container">
            {/* Section Pembangunan Progress Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="dashboard-progress-pembangunan">
              <h2 className="text-base font-bold text-slate-800 mb-3">Kemajuan Fisik Seksi Pembangunan</h2>
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-sm">{project.name}</span>
                      <span className="font-mono bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {project.progress}%
                      </span>
                    </div>
                    {/* Custom Progress bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.progress === 100 
                            ? 'bg-emerald-500' 
                            : project.progress > 50 
                              ? 'bg-blue-600' 
                              : 'bg-amber-500'
                        }`} 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{project.location}</span>
                      <span>Selesai: {formatToIndoDate(project.endDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Operasional Progress Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn" id="dashboard-progress-operasional">
              <h2 className="text-base font-bold text-slate-800 mb-3">Kemajuan Fisik Seksi Operasional</h2>
              {projectsOperasional && projectsOperasional.length > 0 ? (
                <div className="space-y-4">
                  {projectsOperasional.slice(0, 3).map((project) => (
                    <div key={project.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-sm">{project.name}</span>
                        <span className="font-mono bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          {project.progress}%
                        </span>
                      </div>
                      {/* Custom Progress bar */}
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            project.progress === 100 
                              ? 'bg-emerald-500' 
                              : project.progress > 50 
                                ? 'bg-teal-600' 
                                : 'bg-amber-500'
                          }`} 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{project.location}</span>
                        <span>Selesai: {formatToIndoDate(project.endDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400">Belum ada data paket pekerjaan seksi operasional.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Status Operasional & Penatausahaan Live Feeds */}
        <div className="space-y-6">

          {/* Quick Mail Feed */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center">
              <History className="w-5 h-5 text-indigo-600 mr-1.5" />
              Surat Terbaru Masuk/Keluar
            </h2>
            <div className="space-y-3" id="quick-mail-feed">
              {mails.slice(0, 3).map((mail) => (
                <div key={mail.id} className="p-2.5 bg-slate-50 rounded-lg text-xs flex justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[9px] font-bold px-1 rounded uppercase min-w-[36px] text-center ${
                        mail.type === 'masuk' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {mail.type}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 truncate">{mail.referenceNumber}</span>
                    </div>
                    <p className="font-semibold text-slate-700 truncate">{mail.subject}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {mail.type === 'masuk' ? `Dari: ${mail.sender}` : `Ke: ${mail.recipient}`}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 self-center">{formatToIndoDate(mail.date)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
