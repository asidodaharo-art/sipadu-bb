import React from 'react';
import { Mail, Project, WaterLog, DamageReport, Staff } from '../types';
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
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  mails: Mail[];
  staff: Staff[];
  projects: Project[];
  waterLogs: WaterLog[];
  damageReports: DamageReport[];
  instansiName: string;
}

export default function Dashboard({ mails, staff, projects, waterLogs, damageReports, instansiName }: DashboardProps) {
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
    { tier: 'Golongan IV (Pembina)', count: staff.filter(s => s.golongan && s.golongan.startsWith('IV')).length, color: 'bg-indigo-600', hoverBg: 'hover:bg-indigo-700' },
    { tier: 'Golongan III (Penata)', count: staff.filter(s => s.golongan && s.golongan.startsWith('III')).length, color: 'bg-blue-600', hoverBg: 'hover:bg-blue-700' },
    { tier: 'Golongan II (Pengatur)', count: staff.filter(s => s.golongan && s.golongan.startsWith('II')).length, color: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-700' },
    { tier: 'Golongan I (Juru)', count: staff.filter(s => s.golongan && s.golongan.startsWith('I')).length, color: 'bg-amber-600', hoverBg: 'hover:bg-amber-700' },
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



      {/* SECTION: Demografi & Statistik Pegawai */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6" id="staff-demographics-section">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: GOLONGAN */}
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between" id="demographic-golongan-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sebaran Golongan</span>
                  <Award className="w-4 h-4 text-indigo-600 animate-bounce" />
                </div>
                
                {/* Visual Bar Breakdown of Tier Classes first */}
                <div className="space-y-2 mt-2">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Golongan Tiers</div>
                  {golonganTierSummary.map((item) => {
                    const pct = totalStaff > 0 ? Math.round((item.count / totalStaff) * 100) : 0;
                    return (
                      <div key={item.tier} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span className="font-medium truncate max-w-[120px]">{item.tier}</span>
                          <span className="font-semibold">{item.count} orang ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Direct Counts inside a tag list */}
                <div className="pt-3 border-t border-slate-200/50">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1.55">Rincian Golongan</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedGolonganData.map((item) => (
                      <span key={item.name} className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {item.name}: {item.count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: PENDIDIKAN TERAKHIR */}
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between" id="demographic-pendidikan-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pendidikan Terakhir</span>
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="space-y-2.5 mt-2">
                  {sortedEduData.map((item) => {
                    const pct = totalStaff > 0 ? Math.round((item.count / totalStaff) * 100) : 0;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span className="font-bold flex items-center text-slate-700">
                            <BookOpen className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
                            {item.name}
                          </span>
                          <span className="font-semibold">{item.count} orang ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: JENIS KELAMIN */}
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between" id="demographic-gender-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Komparasi Gender</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>

                {/* Male statistics panel */}
                <div className="bg-white border border-blue-100 rounded-xl p-2.5 flex items-center justify-between shadow-3xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs">👨</div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Laki-laki</div>
                      <div className="text-xs font-black text-slate-800">{maleCount} Orang</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md">{malePct}%</span>
                  </div>
                </div>

                {/* Female statistics panel */}
                <div className="bg-white border border-rose-100 rounded-xl p-2.5 flex items-center justify-between shadow-3xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs">👩</div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Perempuan</div>
                      <div className="text-xs font-black text-slate-800">{femaleCount} Orang</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded-md">{femalePct}%</span>
                  </div>
                </div>

                {/* Stacked comparison bar */}
                <div className="pt-2">
                  <div className="h-3.5 w-full bg-slate-100 rounded-full flex overflow-hidden shadow-2xs">
                    {maleCount > 0 && (
                      <div 
                        className="bg-blue-500 h-full transition-all duration-550 flex items-center justify-center text-[7px] font-black text-white" 
                        style={{ width: `${malePct}%` }}
                        title={`Laki-laki: ${malePct}%`}
                      >
                        {malePct >= 15 ? '👨' : ''}
                      </div>
                    )}
                    {femaleCount > 0 && (
                      <div 
                        className="bg-rose-500 h-full transition-all duration-550 flex items-center justify-center text-[7px] font-black text-white" 
                        style={{ width: `${femalePct}%` }}
                        title={`Perempuan: ${femalePct}%`}
                      >
                        {femalePct >= 15 ? '👩' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: AGAMA */}
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between" id="demographic-agama-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keragaman Agama</span>
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>

                <div className="space-y-2 mt-2">
                  {sortedReligionData.map((item) => {
                    const pct = totalStaff > 0 ? Math.round((item.count / totalStaff) * 100) : 0;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">{item.name}</span>
                          <span className="font-medium text-slate-500">{item.count} orang ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
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
          


          {/* Section Pembangunan Progress Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-3">Kemajuan Fisik Instansi Seksi Pembangunan</h2>
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
                    <span>Selesai: {project.endDate}</span>
                  </div>
                </div>
              ))}
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
                  <span className="text-[10px] text-slate-400 shrink-0 self-center">{mail.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
