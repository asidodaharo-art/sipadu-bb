import React, { useState } from 'react';
import { Project, User } from '../types';
import { 
  Wrench, 
  MapPin, 
  TrendingUp, 
  Calendar, 
  UserCheck, 
  Plus, 
  Trash2, 
  Coins, 
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Gauge,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ArrowRight, BookOpen, Layers, Briefcase } from 'lucide-react';

interface PembangunanProps {
  currentUser: User;
  projects: Project[];
  onAddProject: (newProject: Project) => void;
  onUpdateProject: (updatedProj: Project) => void;
  onUpdateProjectProgress: (id: string, progress: number, status: Project['status']) => void;
  onDeleteProject: (id: string) => void;
  activeSubTab?: 'landing' | 'paket_pekerjaan';
  onSubTabChange?: (tab: 'landing' | 'paket_pekerjaan') => void;
}

export default function Pembangunan({ 
  currentUser, 
  projects, 
  onAddProject, 
  onUpdateProject,
  onUpdateProjectProgress, 
  onDeleteProject,
  activeSubTab = 'landing',
  onSubTabChange
}: PembangunanProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectToUpdate, setSelectedProjectToUpdate] = useState<Project | null>(null);
  
  // New Project Form States
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState<number>(0);
  const [contractor, setContractor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<Project['status']>('Perencanaan');

  // Progress update states
  const [newProgress, setNewProgress] = useState(0);
  const [newStatus, setNewStatus] = useState<Project['status']>('Perencanaan');

  const userSections = currentUser.section ? currentUser.section.split(',') : [];
  const canWrite = userSections.includes('pembangunan') || userSections.includes('all');

  // Format currency helpers e.g. Rp 4.250.000.000
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      alert('Anda tidak memiliki hak akses seksi pembangunan untuk mengusulkan paket!');
      return;
    }
    if (!name || !location || !budget || !contractor || !startDate || !endDate) {
      alert('Semua baris input data proyek wajib diisi.');
      return;
    }

    if (editingProject) {
      const updatedProj: Project = {
        ...editingProject,
        name,
        location,
        budget: Number(budget),
        contractor,
        startDate,
        endDate,
        status // optionally carry over current status selection
      };
      onUpdateProject(updatedProj);
    } else {
      const newProj: Project = {
        id: 'p-' + Math.random().toString(36).substring(2, 9),
        name,
        location,
        budget: Number(budget),
        contractor,
        progress: 0,
        startDate,
        endDate,
        status: 'Perencanaan'
      };
      onAddProject(newProj);
    }

    setIsFormOpen(false);
    setEditingProject(null);

    // Reset Form
    setName('');
    setLocation('');
    setBudget(0);
    setContractor('');
    setStartDate('');
    setEndDate('');
    setStatus('Perencanaan');
  };

  const handleStartEditProject = (proj: Project) => {
    if (!canWrite) {
      alert('Anda tidak memiliki hak akses seksi pembangunan untuk mengubah proyek ini!');
      return;
    }
    setEditingProject(proj);
    setName(proj.name);
    setLocation(proj.location);
    setBudget(proj.budget);
    setContractor(proj.contractor);
    setStartDate(proj.startDate);
    setEndDate(proj.endDate);
    setStatus(proj.status);
    setIsFormOpen(true);
  };

  const openProgressModal = (project: Project) => {
    if (!canWrite) {
      alert('Anda tidak memiliki hak akses seksi pembangunan untuk mengupdate progres!');
      return;
    }
    setSelectedProjectToUpdate(project);
    setNewProgress(project.progress);
    setNewStatus(project.status);
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      alert('Anda tidak memiliki hak akses seksi pembangunan untuk mengupdate progres!');
      return;
    }
    if (selectedProjectToUpdate) {
      onUpdateProjectProgress(selectedProjectToUpdate.id, newProgress, newStatus);
      setSelectedProjectToUpdate(null);
    }
  };

  // Math summary stats
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) 
    : 0;

  if (activeSubTab === 'landing') {
    return (
      <div className="space-y-6 animate-fadeIn" id="pembangunan-landing-content">
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-indigo-950">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Wrench className="w-64 h-64 rotate-12" />
          </div>
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Seksi Pembangunan & Konstruksi
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">UPTD AM/Seksi Pembangunan</h1>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              Seksi Pembangunan dan Konstruksi UPTD PSDA Bah Bolon bertanggung jawab dalam perencanaan teknis, pengawasan berkala, serta pelaksanaan rekonstruksi/rehabilitasi fisik infrastruktur jaringan irigasi, bendung, dan tanggul pengaman di daerah irigasi kewenangan Pemerintah Provinsi.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSubTabChange?.('paket_pekerjaan')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-800 hover:bg-slate-50 font-black rounded-xl text-xs transition-all shadow cursor-pointer border-none"
              >
                <span>Kelola Data Paket Pekerjaan</span>
                <ArrowRight className="w-4 h-4 text-blue-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Summary Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Anggaran Alokasi APBD</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{formatRupiah(totalBudget)}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Total pagu anggaran paket pekerjaan</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Persentase Rata-rata Progres</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{avgProgress}%</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Kinerja fisik konstruksi lapangan</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Paket Terdaftar</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{projects.length} Paket Kerja</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Seksi Pembangunan UPTD Bah Bolon</p>
            </div>
          </div>
        </div>

        {/* Informational Cards on Responsibilities */}
        <div className="bg-white p-8 rounded-3xl border border-slate-150 shadow-xs space-y-6">
          <div>
            <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-2.5 py-1 rounded border border-slate-200">
              URAIAN TUGAS POKOK & FUNGSI
            </span>
            <h2 className="text-lg font-bold text-slate-800 mt-2">Pilar Utama Seksi Pembangunan</h2>
            <p className="text-xs text-slate-400 mt-1">
              Seksi pembangunan mengawal pengelolaan infrastruktur pengairan melalui tahapan berintegritas tinggi:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-700 bg-blue-50">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">1. Perancangan & Usulan</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Menyusun rencana anggaran biaya (RAB), spesifikasi teknis, serta daftar paket pembangunan pengairan sesuai kondisi riil dan aspirasi petani pemakai air.
              </p>
            </div>

            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-700 bg-indigo-50">
                <Wrench className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">2. Pelaksanaan Lapangan</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Mengawasi jalannya konstruksi beton jaringan sekunder, rehabilitasi bendung utama, pintu air, dan tanggul sungai agar tahan lama dan presisi hulu ke hilir.
              </p>
            </div>

            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-700 bg-emerald-50">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">3. Evaluasi & PHO/FHO</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Melakukan kualifikasi mutu, audit ketaatan rencana, berita acuan kemajuan fisik lapangan hingga serah terima Provisional Hand Over.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="pembangunan-tab-content">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="pembangunan-metrics">
        {/* Metric budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Alokasi Rencana APBD</div>
            <div className="text-lg font-black text-slate-800 leading-tight">{formatRupiah(totalBudget)}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Tahun Anggaran Berjalan (UPTD PSDA)</p>
          </div>
        </div>

        {/* Metric avg progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kinerja Fisik Satuan Kerja</div>
            <div className="text-xl font-black text-slate-800 leading-tight">{avgProgress}%</div>
            <p className="text-[10px] text-blue-600 font-medium">Berdasarkan {projects.length} paket irigasi</p>
          </div>
        </div>

        {/* Metric active builders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konstruksi Lapangan</div>
            <div className="text-xl font-black text-slate-800 leading-tight">
              {projects.filter(p => p.status === 'Konstruksi').length} <span className="text-xs text-slate-400">Aktif</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {projects.filter(p => p.status === 'Selesai').length} Pembangunan Selesai FHO
            </p>
          </div>
        </div>
      </div>

      {/* Control Action cover */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-4">
        <div>
          <h2 className="font-bold text-sm text-slate-800">Daftar Paket Program & Proyek Fisik Seksi Pembangunan</h2>
          <p className="text-xs text-slate-500">Pemantauan progres dan status pengerjaan fasilitas irigasi, bendung, & tanggulan dsb.</p>
        </div>

        {canWrite ? (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            id="btn-trigger-proyek"
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Usulkan Paket Baru</span>
          </button>
        ) : (
          <div className="text-[10px] bg-slate-100 px-3 py-1.5 text-slate-500 rounded-lg font-medium">
            *Hubungi Seksi Pembangunan / Admin untuk mengedit progres
          </div>
        )}
      </div>

      {/* Creation form modal view */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => {
            setIsFormOpen(false);
            setEditingProject(null);
            setName('');
            setLocation('');
            setBudget(0);
            setContractor('');
            setStartDate('');
            setEndDate('');
            setStatus('Perencanaan');
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-3xl overflow-y-auto max-h-[90vh]"
              id="project-create-form"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center">
                  <Wrench className="w-4.5 h-4.5 text-blue-600 mr-2" />
                  {editingProject ? 'Ubah Rincian Program Pembangunan Fisik' : 'Entri Usulan Program Pembangunan Fisik Baru'}
                </h3>
                <button 
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingProject(null);
                    setName('');
                    setLocation('');
                    setBudget(0);
                    setContractor('');
                    setStartDate('');
                    setEndDate('');
                    setStatus('Perencanaan');
                  }} 
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama / Judul Program Kementerian & Daerah</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Rehabilitasi Jaringan Irigasi DI Paya Lombang Kiri"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-880 focus:bg-white focus:ring-1 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Wilayah Kerja</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Simalungun KM 12"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-880 focus:bg-white focus:ring-1 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pagu Anggaran Rp (Rupiah)</label>
                  <input 
                    type="number" 
                    placeholder="Contoh: 1500000000"
                    value={budget || ''}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-880 font-semibold focus:bg-white focus:ring-1 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badan Pelaksana / Kontraktor Pemilih</label>
                  <input 
                    type="text" 
                    placeholder="PT / CV Kontraktor Utama pelaksana"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-880 focus:bg-white focus:ring-1 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Awal Pekerjaan</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-880 focus:bg-white focus:ring-1 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Rencana Serah Terima (Selesai)</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-880 focus:bg-white focus:ring-1 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingProject(null);
                      setName('');
                      setLocation('');
                      setBudget(0);
                      setContractor('');
                      setStartDate('');
                      setEndDate('');
                      setStatus('Perencanaan');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer font-bold text-slate-750"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    id="submit-project-btn"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {editingProject ? 'Simpan Perubahan Proyek' : 'Daunkan Proyek Baru Ke Rencana Pembangunan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress management inline model overlay (simple dialog representation) */}
      {selectedProjectToUpdate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 text-xs"
            id="progress-modal-dialog"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Perbarui Kemajuan Lapangan</h3>
              <button 
                onClick={() => setSelectedProjectToUpdate(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Paket Pekerjaan</span>
              <div className="font-semibold text-slate-800 text-sm">{selectedProjectToUpdate.name}</div>
              <div className="text-[10px] text-slate-400">Kontraktor: {selectedProjectToUpdate.contractor}</div>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 uppercase mb-2">
                  <span>Persentase Progres</span>
                  <span className="font-mono text-blue-600">{newProgress}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNewProgress(val);
                    if (val === 100) setNewStatus('Selesai');
                    else if (val > 0) setNewStatus('Konstruksi');
                    else setNewStatus('Perencanaan');
                  }}
                  className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-ew-resize"
                  id="progress-slider-range"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Status Pelaksanaan</label>
                <select
                  value={newStatus}
                  onChange={(e: any) => {
                    setNewStatus(e.target.value);
                    if (e.target.value === 'Selesai') setNewProgress(100);
                    else if (e.target.value === 'Perencanaan') setNewProgress(0);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  id="status-select-progress"
                >
                  <option value="Perencanaan">Perencanaan (0%)</option>
                  <option value="Konstruksi">Kondisi Konstruksi Aktif</option>
                  <option value="Selesai">Selesai Berita Acara (FHO)</option>
                  <option value="Tertunda">Tertunda / Ditangguhkan</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectToUpdate(null)}
                  className="flex-1 py-2 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-center cursor-pointer hover:bg-slate-50"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  id="btn-save-progress"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center cursor-pointer transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Main List Grid showing existing Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="projects-grid">
        {projects.length > 0 ? (
          projects.map((proj) => {
            const statusConfig = {
              'Perencanaan': { bg: 'bg-indigo-50 border-indigo-100 text-indigo-700', icon: Clock },
              'Konstruksi': { bg: 'bg-blue-50 border-blue-100 text-blue-700', icon: Gauge },
              'Selesai': { bg: 'bg-emerald-50 border-emerald-100 text-emerald-700', icon: CheckCircle },
              'Tertunda': { bg: 'bg-amber-50 border-amber-100 text-amber-700', icon: AlertTriangle }
            }[proj.status] || { bg: 'bg-slate-50', icon: Clock };
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={proj.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-200 transition-all"
              >
                <div className="space-y-3">
                  {/* Badge & Title */}
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wide ${statusConfig.bg}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{proj.status}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {proj.id}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-800 leading-snug">{proj.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{proj.location}</span>
                    </p>
                  </div>

                  {/* Financial metadata details */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px]">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Pagu Dana</span>
                      <strong className="text-slate-700 font-extrabold">{formatRupiah(proj.budget)}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Kontraktor Pelaksana</span>
                      <strong className="text-slate-700 truncate block font-bold" title={proj.contractor}>{proj.contractor}</strong>
                    </div>
                  </div>

                  {/* Progressive bar with numerical indicator */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Persentase Pembangunan</span>
                      <span className="text-blue-600">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          proj.progress === 100 
                            ? 'bg-emerald-500' 
                            : proj.progress > 50 
                              ? 'bg-blue-600' 
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                      <span>Mulai: {proj.startDate}</span>
                      <span>Target: {proj.endDate}</span>
                    </div>
                  </div>
                </div>

                {/* Sub Action panel */}
                {canWrite && (
                  <div className="pt-3 border-t border-slate-100 flex justify-between gap-2">
                    <button
                      onClick={() => openProgressModal(proj)}
                      className="flex-1 py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-[11px] transition-colors inline-block cursor-pointer text-center"
                      id={`edit-progress-${proj.id}`}
                    >
                      Update Progres Fisik
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleStartEditProject(proj)}
                        className="p-1.5 border border-blue-100 text-blue-500 hover:bg-blue-50 rounded-xl hover:text-blue-700 transition-all inline-block cursor-pointer"
                        title="Edit Detail Proyek"
                        id={`edit-project-${proj.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1.5 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl hover:text-red-700 transition-all inline-block cursor-pointer"
                        title="Hapus Usulan Proyek"
                        id={`delete-project-${proj.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 shadow-sm">
            Belum ada rencana atau pengerjaan paket pembangunan dilingkungan Bah Bolon yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
}
