import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { formatToIndoDate } from '../utils';
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
  activeSubTab?: 'landing' | 'paket_pekerjaan' | 'progres_kegiatan' | 'usulan_pekerjaan';
  onSubTabChange?: (tab: 'landing' | 'paket_pekerjaan' | 'progres_kegiatan' | 'usulan_pekerjaan') => void;
  isOperasionalVariant?: boolean;
}

export default function Pembangunan({ 
  currentUser, 
  projects, 
  onAddProject, 
  onUpdateProject,
  onUpdateProjectProgress, 
  onDeleteProject,
  activeSubTab = 'landing',
  onSubTabChange,
  isOperasionalVariant = false
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

  // Contracts state for autofill / data synchronization
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContractDuration, setSelectedContractDuration] = useState<string>('');

  useEffect(() => {
    if (isFormOpen) {
      const savedContracts = localStorage.getItem('uptd_v3_contracts');
      if (savedContracts) {
        setContracts(JSON.parse(savedContracts));
      } else {
        setContracts([]);
      }
    }
  }, [isFormOpen]);

  const userSections = currentUser.section ? currentUser.section.split(',') : [];
  const canWrite = currentUser.role === 'admin' || userSections.includes('all') || 
    (isOperasionalVariant ? userSections.includes('operasional') : userSections.includes('pembangunan'));

  // Format currency helpers e.g. Rp 4.250.000.000
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleStartDateChange = (val: string, durationStr: string = selectedContractDuration) => {
    setStartDate(val);
    if (val && durationStr) {
      const match = durationStr.match(/\d+/);
      const days = match ? parseInt(match[0], 10) : 0;
      if (days > 0) {
        const dateObj = new Date(val);
        if (!isNaN(dateObj.getTime())) {
          dateObj.setDate(dateObj.getDate() + days + 1);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          setEndDate(`${year}-${month}-${day}`);
        }
      }
    }
  };

  const handleAutofillFromContract = (selectedContract: any) => {
    setName(selectedContract.projectName || '');
    setBudget(selectedContract.amount || 0);
    setContractor(selectedContract.contractorName || '');
    const duration = selectedContract.duration || '';
    setSelectedContractDuration(duration);
    
    const initialStart = selectedContract.startDate || selectedContract.spmkDate || selectedContract.contractDate || '';
    setStartDate(initialStart);
    
    if (initialStart && duration) {
      const match = duration.match(/\d+/);
      const days = match ? parseInt(match[0], 10) : 0;
      if (days > 0) {
        const dateObj = new Date(initialStart);
        if (!isNaN(dateObj.getTime())) {
          dateObj.setDate(dateObj.getDate() + days + 1);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          setEndDate(`${year}-${month}-${day}`);
        }
      }
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      alert(`Anda tidak memiliki hak akses ${isOperasionalVariant ? 'seksi operasional' : 'seksi pembangunan'} untuk mengusulkan paket!`);
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
      alert(`Anda tidak memiliki hak akses ${isOperasionalVariant ? 'seksi operasional' : 'seksi pembangunan'} untuk mengubah proyek ini!`);
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
      alert(`Anda tidak memiliki hak akses ${isOperasionalVariant ? 'seksi operasional' : 'seksi pembangunan'} untuk mengupdate progres!`);
      return;
    }
    setSelectedProjectToUpdate(project);
    setNewProgress(project.progress);
    setNewStatus(project.status);
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      alert(`Anda tidak memiliki hak akses ${isOperasionalVariant ? 'seksi operasional' : 'seksi pembangunan'} untuk mengupdate progres!`);
      return;
    }
    if (selectedProjectToUpdate) {
      onUpdateProjectProgress(selectedProjectToUpdate.id, newProgress, newStatus);
      setSelectedProjectToUpdate(null);
    }
  };

  // -------------------------------------------------------------
  // STATES & SEEDS FOR NEW PAGES (PROGRES KEGIATAN & USULAN PEKERJAAN)
  // -------------------------------------------------------------
  const [proposals, setProposals] = useState<any[]>(() => {
    const saved = localStorage.getItem('uptd_v3_job_proposals');
    if (saved) return JSON.parse(saved);
    const initial = [
      {
        id: 'prop-1',
        title: 'Normalisasi & Pengerukan Sedimentasi Jaringan Sekunder DI Bah Bolon',
        location: 'Kecamatan Simalungun (Sektor Bah Bolon)',
        type: 'Irigasi',
        budget: 380000000,
        urgency: 'Tinggi',
        proposer: 'Somad (Ketua Komunitas P3A)',
        description: 'Saluran sekunder mengalami penyumbatan lumpur tebal setinggi 45cm sepanjang 1.8 kilometer. Hal ini menyebabkan debit air menyusut drastis untuk sawah hilir.',
        createdAt: '2026-06-02',
        status: 'Menunggu Review'
      },
      {
        id: 'prop-2',
        title: 'Pemasangan Pintu Air Baja Ulir Ganda Pintu 3 & 4 Bendung Utama',
        location: 'DI Bah Bolon Hulu (Pintu Pengatur)',
        type: 'Bendung',
        budget: 650000000,
        urgency: 'Tinggi',
        proposer: 'Seksi Pembangunan',
        description: 'Mengganti pintu air kayu konvensional yang sudah mulai rapuh dengan pintu ulir besi ganda modern demi meningkatkan keamanan debit saat puncak musim hujan.',
        createdAt: '2026-06-08',
        status: 'Disetujui'
      },
      {
        id: 'prop-3',
        title: 'Penguatan Tanggul Pemukiman Bantaran Sungai Sektor Hilir',
        location: 'Sektor Tebas Hilir',
        type: 'Tanggul',
        budget: 1100000000,
        urgency: 'Sedang',
        proposer: 'Kepala Desa Tebas Hilir',
        description: 'Pengerjaan bronjong penahan abrasi bantaran sungai sepanjang 300 meter guna mengamankan puluhan KK permukiman di kala debit sungai meluap tinggi.',
        createdAt: '2026-06-11',
        status: 'Draf'
      }
    ];
    localStorage.setItem('uptd_v3_job_proposals', JSON.stringify(initial));
    return initial;
  });

  const [inspectionLogs, setInspectionLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('uptd_v3_inspection_logs');
    if (saved) return JSON.parse(saved);
    const initial = [
      {
        id: 'log-1',
        projectId: 'p-default',
        projectName: 'Contoh Paket Saluran',
        date: '2026-05-15',
        percent: 15,
        inspector: 'Ir. Heru Prasetyo',
        notes: 'Land clearing selesai. Pengukuran patok ukur as jalan dan elevasi rampung. Mobilisasi semen dan material cor mulai sampai.'
      },
      {
        id: 'log-2',
        projectId: 'p-default',
        projectName: 'Contoh Paket Saluran',
        date: '2026-06-01',
        percent: 45,
        inspector: 'Ir. Heru Prasetyo',
        notes: 'Pekerjaan pondasi cakar ayam dan cetakan dinding beton pracetak selesai 40%. Kondisi cuaca cerah mendukung pengerjaan.'
      }
    ];
    localStorage.setItem('uptd_v3_inspection_logs', JSON.stringify(initial));
    return initial;
  });

  // Selected project for progress inspector
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );
  const [curveProjectId, setCurveProjectId] = useState<string>('all');

  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Log form state
  const [isLogFormActive, setIsLogFormActive] = useState(false);
  const [logPercent, setLogPercent] = useState(0);
  const [logInspector, setLogInspector] = useState('Staff Pengawas UPTD');
  const [logNotes, setLogNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Sync log default progress when selecting project
  React.useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        setLogPercent(proj.progress);
      }
    }
  }, [selectedProjectId, projects]);

  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return;

    const newLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      projectId: selectedProjectId,
      projectName: proj.name,
      date: logDate,
      percent: logPercent,
      inspector: logInspector,
      notes: logNotes
    };

    const updated = [newLog, ...inspectionLogs];
    setInspectionLogs(updated);
    localStorage.setItem('uptd_v3_inspection_logs', JSON.stringify(updated));

    // Calc status
    let nextStatus: Project['status'] = proj.status;
    if (logPercent === 100) nextStatus = 'Selesai';
    else if (logPercent > 0 && logPercent < 100) nextStatus = 'Konstruksi';
    else if (logPercent === 0) nextStatus = 'Perencanaan';

    onUpdateProjectProgress(selectedProjectId, logPercent, nextStatus);

    setLogNotes('');
    setIsLogFormActive(false);
    alert('Laporan progres fisik berhasil ditambahkan & data paket diperbarui!');
  };

  // Proposal states
  const [isPropFormOpen, setIsPropFormOpen] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propLocation, setPropLocation] = useState('');
  const [propType, setPropType] = useState('Irigasi');
  const [propBudget, setPropBudget] = useState<number>(0);
  const [propUrgency, setPropUrgency] = useState('Tinggi');
  const [propDescription, setPropDescription] = useState('');

  const [propSearch, setPropSearch] = useState('');
  const [propFilterStatus, setPropFilterStatus] = useState('All');
  const [propFilterUrgency, setPropFilterUrgency] = useState('All');

  // Proposal conversion to active project
  const [convertingProp, setConvertingProp] = useState<any | null>(null);
  const [convContractor, setConvContractor] = useState('');
  const [convStartDate, setConvStartDate] = useState('');
  const [convEndDate, setConvEndDate] = useState('');

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle || !propLocation || !propBudget) {
      alert('Judul, lokasi, dan anggaran wajib diisi.');
      return;
    }

    const newProp = {
      id: 'prop-' + Math.random().toString(36).substring(2, 9),
      title: propTitle,
      location: propLocation,
      type: propType,
      budget: Number(propBudget),
      urgency: propUrgency,
      proposer: currentUser.name || 'Pengusul UPTD',
      description: propDescription,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Menunggu Review'
    };

    const updated = [newProp, ...proposals];
    setProposals(updated);
    localStorage.setItem('uptd_v3_job_proposals', JSON.stringify(updated));

    // Reset Form
    setPropTitle('');
    setPropLocation('');
    setPropBudget(0);
    setPropDescription('');
    setIsPropFormOpen(false);
    alert('Usulan kegiatan baru berhasil didaftarkan untuk evaluasi!');
  };

  const handleUpdateProposalStatus = (id: string, newStatus: string) => {
    if (!canWrite) {
      alert('Anda tidak memiliki akses menulis untuk mengevaluasi usulan.');
      return;
    }
    const updated = proposals.map(p => p.id === id ? { ...p, status: newStatus } : p);
    setProposals(updated);
    localStorage.setItem('uptd_v3_job_proposals', JSON.stringify(updated));
  };

  const handleConvertProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingProp) return;
    if (!convContractor || !convStartDate || !convEndDate) {
      alert('Silakan isi seluruh kelengkapan kontraktor pelaksana & tanggal.');
      return;
    }

    const newProj: Project = {
      id: 'p-' + Math.random().toString(36).substring(2, 9),
      name: convertingProp.title,
      location: convertingProp.location,
      budget: Number(convertingProp.budget),
      contractor: convContractor,
      progress: 0,
      startDate: convStartDate,
      endDate: convEndDate,
      status: 'Perencanaan'
    };

    onAddProject(newProj);

    const updated = proposals.map(p => p.id === convertingProp.id ? { ...p, status: 'Ditambahkan Ke Paket Kerja' } : p);
    setProposals(updated);
    localStorage.setItem('uptd_v3_job_proposals', JSON.stringify(updated));

    setConvertingProp(null);
    setConvContractor('');
    setConvStartDate('');
    setConvEndDate('');

    alert('Sukses mengonversi usulan terpilih menjadi Paket Pekerjaan Seksi Pembangunan!');
  };

  // Edit & Delete Proposal states and handlers
  const [editingProp, setEditingProp] = useState<any | null>(null);
  const [editPropTitle, setEditPropTitle] = useState('');
  const [editPropLocation, setEditPropLocation] = useState('');
  const [editPropType, setEditPropType] = useState('Irigasi');
  const [editPropBudget, setEditPropBudget] = useState<number>(0);
  const [editPropUrgency, setEditPropUrgency] = useState('Tinggi');
  const [editPropDescription, setEditPropDescription] = useState('');
  const [editPropProposer, setEditPropProposer] = useState('');
  const [editPropStatus, setEditPropStatus] = useState('Menunggu Review');

  const handleEditProposalClick = (p: any) => {
    setEditingProp(p);
    setEditPropTitle(p.title || '');
    setEditPropLocation(p.location || '');
    setEditPropType(p.type || 'Irigasi');
    setEditPropBudget(p.budget || 0);
    setEditPropUrgency(p.urgency || 'Tinggi');
    setEditPropDescription(p.description || '');
    setEditPropProposer(p.proposer || '');
    setEditPropStatus(p.status || 'Menunggu Review');
  };

  const handleUpdateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProp) return;
    if (!editPropTitle || !editPropLocation || !editPropBudget) {
      alert('Judul, lokasi, dan anggaran wajib diisi.');
      return;
    }

    const updated = proposals.map(p => {
      if (p.id === editingProp.id) {
        return {
          ...p,
          title: editPropTitle,
          location: editPropLocation,
          type: editPropType,
          budget: Number(editPropBudget),
          urgency: editPropUrgency,
          proposer: editPropProposer,
          description: editPropDescription,
          status: editPropStatus
        };
      }
      return p;
    });

    setProposals(updated);
    localStorage.setItem('uptd_v3_job_proposals', JSON.stringify(updated));
    setEditingProp(null);
    alert('Usulan pekerjaan berhasil diperbarui!');
  };

  const handleDeleteProposal = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus usulan pekerjaan ini?')) {
      const updated = proposals.filter(p => p.id !== id);
      setProposals(updated);
      localStorage.setItem('uptd_v3_job_proposals', JSON.stringify(updated));
      alert('Usulan pekerjaan berhasil dihapus!');
    }
  };

  // Math summary stats
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) 
    : 0;

  // -------------------------------------------------------------
  // PROGRES KEGIATAN RENDERING
  // -------------------------------------------------------------
  if (activeSubTab === 'progres_kegiatan') {
    const selectedProj = projects.find(p => p.id === selectedProjectId);
    const relatedLogs = inspectionLogs.filter(log => log.projectId === selectedProjectId);
    
    // Sort and structure chronological chart data for visual progress trend graph
    const chartData = selectedProj ? [
      { date: selectedProj.startDate, percent: 0 },
      ...[...relatedLogs]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(log => ({
          date: log.date,
          percent: log.percent
        }))
    ] : [];

    // Ensure the latest actual progress point is visually plotted
    if (selectedProj && chartData.length > 0 && chartData[chartData.length - 1].percent < selectedProj.progress) {
      chartData.push({
        date: new Date().toISOString().split('T')[0],
        percent: selectedProj.progress
      });
    }
    
    return (
      <div className="space-y-6 animate-fadeIn" id="pembangunan-progres-content">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-900 shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] bg-indigo-500 font-extrabold text-white px-2.5 py-0.5 rounded-full uppercase">Monitoring Fisik</span>
            <h1 className="text-xl font-bold tracking-tight">Pelacakan & Progres Kegiatan Konstruksi</h1>
            <p className="text-xs text-indigo-200 font-medium">Visualisasi timeline kemajuan fisik proyek, pencatatan log inspeksi, serta berita acara pengawasan lapangan.</p>
          </div>
          <button 
            onClick={() => onSubTabChange?.('paket_pekerjaan')}
            className="text-[10px] bg-white text-indigo-950 hover:bg-slate-50 px-4 py-2 rounded-xl font-black transition-all flex items-center gap-1.5 border-none cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Katalog Paket</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white p-12 text-center border border-slate-150 rounded-2xl shadow-xs space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Paket Pekerjaan Terdaftar</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Saat ini belum ada paket pekerjaan konstruksi yang terdaftar pada sistem Seksi Pembangunan. Silakan buat atau usulkan paket pekerjaan baru terlebih dahulu.
              </p>
              <button
                onClick={() => onSubTabChange?.('paket_pekerjaan')}
                className="mt-2 text-xs py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
              >
                + Usulkan Paket Baru
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar: project list */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Daftar Paket Aktif</span>
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {projects.map((p) => {
                    const isSelected = p.id === selectedProjectId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`w-full p-3.5 rounded-xl text-left border transition-all flex flex-col gap-2 cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50/70 border-blue-200 shadow-3xs' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full font-bold">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase ${
                            p.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            p.status === 'Konstruksi' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            p.status === 'Tertunda' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-700 border-slate-100'
                          }`}>
                            {p.status}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">{p.progress}%</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 leading-normal line-clamp-2">{p.name}</h4>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              p.progress === 100 ? 'bg-emerald-500' :
                              p.progress > 50 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right details panel */}
            <div className="lg:col-span-2 space-y-6">
              {selectedProj ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-6">
                  {/* Selected Project Header */}
                  <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase">PAKET TERPILIH</span>
                      <h2 className="text-base font-bold text-slate-800 tracking-tight leading-snug">{selectedProj.name}</h2>
                      <p className="text-xs text-slate-500 flex items-center">
                        <MapPin className="w-3.5 h-3.5 text-slate-450 mr-1" />
                        <span>Lokasi: {selectedProj.location}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span>Pelaksana: <strong>{selectedProj.contractor}</strong></span>
                      </p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-center border border-slate-100">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Progres Fisik</span>
                      <span className="text-lg font-black text-blue-600 font-mono">{selectedProj.progress}%</span>
                    </div>
                  </div>

                  {/* General Stats summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Anggaran Biaya</span>
                      <strong className="text-xs text-slate-700 font-extrabold">{formatRupiah(selectedProj.budget)}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Tanggal Mulai</span>
                      <strong className="text-xs text-slate-700 font-bold">{formatToIndoDate(selectedProj.startDate)}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Rencana Selesai</span>
                      <strong className="text-xs text-slate-700 font-bold">{formatToIndoDate(selectedProj.endDate)}</strong>
                    </div>
                  </div>

                   {/* Progressive Timeline of Inspections */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span>Histori Inspeksi & Progress Log</span>
                      </h3>
                      {canWrite && (
                        <button
                          onClick={() => setIsLogFormActive(!isLogFormActive)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] uppercase flex items-center gap-1 transition-all border-none cursor-pointer"
                        >
                          {isLogFormActive ? 'Tutup Form' : '+ Catat Log Baru'}
                        </button>
                      )}
                    </div>

                    {/* Progress Trend Curve Chart */}
                    <div className="border border-slate-150 p-4 rounded-2xl bg-white shadow-3xs space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Kurva Realisasi Fisik (S-Curve)</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono text-[9px] font-extrabold uppercase">
                          Grafik Tren Progres
                        </span>
                      </div>
                      {chartData.length > 1 ? (
                        <div className="w-full h-36 bg-slate-50/40 border border-slate-100 rounded-xl p-3 flex items-center justify-center relative">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                              </linearGradient>
                            </defs>
                            {/* Gridlines */}
                            <line x1="40" y1="15" x2="480" y2="15" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="40" y1="52.5" x2="480" y2="52.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="40" y1="90" x2="480" y2="90" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                            
                            {/* Y-axis Labels */}
                            <text x="12" y="18" className="text-[8px] font-mono font-bold fill-slate-400">100%</text>
                            <text x="18" y="55" className="text-[8px] font-mono font-bold fill-slate-400">50%</text>
                            <text x="22" y="93" className="text-[8px] font-mono font-bold fill-slate-400">0%</text>

                            {/* Generate Path */}
                            {(() => {
                              const points = chartData.map((d, index) => {
                                const x = 40 + (index / (chartData.length - 1)) * 440;
                                // 0% is y = 90, 100% is y = 15 (height 75 range)
                                const y = 90 - (d.percent / 100) * 75;
                                return { x, y, ...d };
                              });
                              const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                              const areaD = `${pathD} L ${points[points.length - 1].x} 90 L ${points[0].x} 90 Z`;
                              
                              return (
                                <>
                                  {/* Fill Area */}
                                  <path d={areaD} fill="url(#chartGrad)" />
                                  {/* Line */}
                                  <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  {/* Dots and Tooltips */}
                                  {points.map((p, idx) => (
                                    <g key={idx} className="group">
                                      <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                                      <text x={p.x} y={p.y - 7} textAnchor="middle" className="text-[8px] font-mono font-extrabold fill-indigo-900">
                                        {p.percent}%
                                      </text>
                                      <text x={p.x} y="105" textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-slate-450">
                                        {p.date.split('-').reverse().join('/')}
                                      </text>
                                    </g>
                                  ))}
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                      ) : (
                        <div className="h-32 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                          <p className="text-slate-400 text-xs font-semibold">Membutuhkan log progres untuk membuat kurva realisasi.</p>
                        </div>
                      )}
                    </div>

                    {/* Progress log submission form inside collapsible */}
                    {isLogFormActive && (
                      <motion.form 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleAddInspection} 
                        className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-4"
                      >
                        <h4 className="font-bold text-xs text-slate-700 uppercase">Entri Log Inspeksi Fisik Baru</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">Tanggal Inspeksi</label>
                            <input 
                              type="date"
                              value={logDate}
                              onChange={(e) => setLogDate(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">Petugas Pengawas</label>
                            <input 
                              type="text"
                              value={logInspector}
                              onChange={(e) => setLogInspector(e.target.value)}
                              placeholder="Nama petugas"
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none"
                              required
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center font-bold text-slate-650 mb-1">
                              <span>Kemajuan Fisik</span>
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="any"
                                  value={logPercent}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    if (valStr === '') {
                                      setLogPercent(0);
                                      return;
                                    }
                                    let val = parseFloat(valStr);
                                    if (isNaN(val)) val = 0;
                                    if (val < 0) val = 0;
                                    if (val > 100) val = 100;
                                    setLogPercent(val);
                                  }}
                                  className="w-14 text-right text-xs font-mono font-bold text-blue-600 bg-transparent outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-0"
                                />
                                <span className="text-[10px] text-slate-400 font-extrabold pr-1">%</span>
                              </div>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              step="any"
                              value={logPercent}
                              onChange={(e) => setLogPercent(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg accent-blue-600 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="text-xs">
                          <label className="block font-bold text-slate-600 mb-1">Rincian Hasil Pengawasan Lapangan</label>
                          <textarea
                            value={logNotes}
                            onChange={(e) => setLogNotes(e.target.value)}
                            placeholder="Tulis kondisi kemajuan konstruksi beton, instalasi pintu air dsb secara objektif..."
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none h-20 resize-none font-medium"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1 font-bold">
                          <button
                            type="button"
                            onClick={() => setIsLogFormActive(false)}
                            className="px-3.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            Simpan Log Progres
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {/* Timeline representation list */}
                    <div className="relative border-l border-slate-150 pl-4 mt-6 space-y-4 ml-2">
                      {relatedLogs.length > 0 ? (
                        relatedLogs.map((log) => (
                          <div key={log.id} className="relative">
                            {/* Point Dot */}
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white ring-4 ring-indigo-50" />
                            
                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-2.5 hover:bg-slate-50 hover:border-slate-150 transition-all text-xs">
                              <div className="space-y-1 sm:max-w-[75%]">
                                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                                  <span>{formatToIndoDate(log.date)}</span>
                                  <span>•</span>
                                  <span>Pengawas: <strong>{log.inspector}</strong></span>
                                </div>
                                <p className="text-slate-700 leading-relaxed font-semibold">{log.notes}</p>
                              </div>
                              <div className="shrink-0 flex items-start">
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black px-2.5 py-1 rounded-md font-mono">
                                  Naik Ke: {log.percent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/40 rounded-xl border border-dashed border-slate-200 font-semibold">
                          Belum ada catatan inspeksi progres terunggah untuk paket kerja ini.
                        </div>
                      )}

                      {/* Initial seed visual timeline points to enrich ui even if empty */}
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-slate-400 rounded-full border border-white ring-4 ring-slate-100" />
                        <div className="p-3 bg-slate-50/30 rounded-xl border border-slate-100/60 max-w-sm text-[10px] text-slate-550 font-semibold leading-relaxed">
                          <strong>Tahap Perencanaan</strong> • Paket diusulkan formal, penyusunan RAB dan kualifikasi lapangan awal selesai. (0%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-150 shadow-xs text-slate-400 text-xs">
                  Proyek tidak ditemukan atau telah dihapus.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // USULAN PEKERJAAN RENDERING
  // -------------------------------------------------------------
  if (activeSubTab === 'usulan_pekerjaan') {
    // Filter proposals
    const filteredProps = proposals.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(propSearch.toLowerCase()) || 
                          p.location.toLowerCase().includes(propSearch.toLowerCase());
      const matchStatus = propFilterStatus === 'All' || p.status === propFilterStatus;
      const matchUrgency = propFilterUrgency === 'All' || p.urgency === propFilterUrgency;
      return matchSearch && matchStatus && matchUrgency;
    });

    const pendingCount = proposals.filter(p => p.status === 'Menunggu Review').length;
    const approvedCount = proposals.filter(p => p.status === 'Disetujui').length;

    return (
      <div className="space-y-6 animate-fadeIn" id="pembangunan-usulan-content">
        {/* Banner */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-teal-950 shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] bg-teal-400 text-slate-950 font-extrabold px-2.5 py-0.5 rounded-full uppercase">Perencanaan Teknis</span>
            <h1 className="text-xl font-bold tracking-tight">Usulan Kegiatan Pekerjaan (Public Proposals)</h1>
            <p className="text-xs text-teal-100 font-semibold leading-loose">Daftar usulan pembangunan jalan tani, tanggul, normalisasi irigasi dari komisi petunjuk tani & swadaya masyarakat.</p>
          </div>
          {canWrite && (
            <button
              onClick={() => setIsPropFormOpen(true)}
              className="text-xs bg-white text-teal-950 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-black transition-all cursor-pointer border-none shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-teal-600" />
              <span>Daftarkan Usulan Baru</span>
            </button>
          )}
        </div>

        {/* Stats counter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-700">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">Total Usulan Masuk</span>
            <h3 className="text-lg font-black text-slate-850 mt-1">{proposals.length} Berkas</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">Menunggu Review</span>
            <h3 className="text-lg font-black text-amber-600 mt-1">{pendingCount} Berkas</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">Usulan Disetujui</span>
            <h3 className="text-lg font-black text-emerald-600 mt-1">{approvedCount} Berkas</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">Telah Direalisasikan</span>
            <h3 className="text-lg font-black text-indigo-600 mt-1">
              {proposals.filter(p => p.status === 'Ditambahkan Ke Paket Kerja').length} Paket
            </h3>
          </div>
        </div>

        {/* Search & filters controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
          <div className="w-full md:w-1/3">
            <input 
              type="text"
              placeholder="Cari kata kunci usulan atau lokasi..."
              value={propSearch}
              onChange={(e) => setPropSearch(e.target.value)}
              className="w-full p-2.5 border border-slate-200 outline-none rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold"
            />
          </div>
          <div className="w-full md:w-2/3 flex flex-wrap gap-3 items-center justify-end text-slate-700 font-bold">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Urgensi:</span>
              <select
                value={propFilterUrgency}
                onChange={(e) => setPropFilterUrgency(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold"
              >
                <option value="All">Semua Tingkat</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Status:</span>
              <select
                value={propFilterStatus}
                onChange={(e) => setPropFilterStatus(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold"
              >
                <option value="All">Semua Status</option>
                <option value="Draf">Draf</option>
                <option value="Menunggu Review">Menunggu Review</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak (Ditolak Teknis)</option>
                <option value="Ditambahkan Ke Paket Kerja">Sudah Di-Paket</option>
              </select>
            </div>
          </div>
        </div>

        {/* Proposals List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProps.length > 0 ? (
            filteredProps.map((p) => {
              const statusBadges = {
                'Draf': 'bg-slate-100 text-slate-600 border-slate-200',
                'Menunggu Review': 'bg-amber-50 text-amber-700 border-amber-200',
                'Disetujui': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'Ditolak': 'bg-rose-50 text-rose-700 border-rose-200',
                'Ditambahkan Ke Paket Kerja': 'bg-purple-50 text-purple-700 border-purple-200'
              }[p.status] || 'bg-slate-50';

              const urgencyColors = {
                'Tinggi': 'bg-rose-500 text-white',
                'Sedang': 'bg-amber-400 text-slate-900',
                'Rendah': 'bg-blue-400 text-white'
              }[p.urgency] || 'bg-slate-400 text-white';

              return (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">Usulan ID: {p.id}</span>
                      <div className="flex gap-1.5 items-center font-bold">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${urgencyColors}`}>
                          Urgensi: {p.urgency}
                        </span>
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${statusBadges}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded uppercase border border-slate-250 block w-fit">{p.type}</span>
                      <h3 className="font-bold text-sm text-slate-800 leading-snug pt-1">{p.title}</h3>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Lokasi Usulan: <span className="text-slate-800 font-bold">{p.location}</span></p>
                    </div>

                    <p className="text-xs text-slate-550 leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 font-semibold">
                      {p.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-100 pt-2 text-slate-400 font-semibold">
                      <div>
                        <span>Pengusul:</span>
                        <strong className="block text-slate-700">{p.proposer}</strong>
                      </div>
                      <div>
                        <span>Estimasi Anggaran:</span>
                        <strong className="block text-slate-800 text-xs font-black font-mono">{formatRupiah(p.budget)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Proposals Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between font-bold gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      {canWrite && (
                        <>
                          <button
                            onClick={() => handleEditProposalClick(p)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-700 rounded-xl transition-all cursor-pointer border border-slate-200"
                            title="Konfigurasi & Ubah Usulan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProposal(p.id)}
                            className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-slate-200 hover:border-rose-200"
                            title="Hapus Usulan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex gap-1.5 justify-end">
                      {p.status === 'Draf' && canWrite && (
                        <button
                          onClick={() => handleUpdateProposalStatus(p.id, 'Menunggu Review')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs cursor-pointer text-center border-none"
                        >
                          Ajukan Review
                        </button>
                      )}
                      
                      {p.status === 'Menunggu Review' && canWrite && (
                        <>
                          <button
                            onClick={() => handleUpdateProposalStatus(p.id, 'Disetujui')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs cursor-pointer text-center flex items-center gap-1 border-none shadow-3xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                          <button
                            onClick={() => handleUpdateProposalStatus(p.id, 'Ditolak')}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 rounded-lg text-xs cursor-pointer text-center flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </>
                      )}

                      {p.status === 'Disetujui' && canWrite && (
                        <button
                          onClick={() => setConvertingProp(p)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer text-center border-none"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>Konversikan Jadi Paket Kerja</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-150 shadow-xs">
              Tidak ada usulan pekerjaan yang cocok dengan penyaringan pencarian Anda.
            </div>
          )}
        </div>

        {/* Create proposal modal popup dialog */}
        {isPropFormOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4.5 h-4.5 text-teal-600" />
                  <span>Daftarkan Usulan Kegiatan Baru</span>
                </h3>
                <button 
                  onClick={() => setIsPropFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Tutup
                </button>
              </div>

              <form onSubmit={handleCreateProposal} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-slate-700">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">Judul Usulan / Nama Kegiatan</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Pembuatan Saluran Tersier Blok B DI Paya Lombang"
                    value={propTitle}
                    onChange={(e) => setPropTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Lokasi Wilayah Kegiatan</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Desa Tambun, Sektor Timur"
                    value={propLocation}
                    onChange={(e) => setPropLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Jenis Layanan Bidang</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold"
                  >
                    <option value="Irigasi">Irigasi Jaringan Utama/Sekunder</option>
                    <option value="Bendung">Bendung / Pintu Pengatur</option>
                    <option value="Tanggul">Tanggul / Pengaman Banjir</option>
                    <option value="Lainnya">Fasilitas Penunjang Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Estimasi Kebutuhan Pagu Anggaran (Rp)</label>
                  <input 
                    type="number"
                    required
                    placeholder="Contoh: 150000000"
                    value={propBudget || ''}
                    onChange={(e) => setPropBudget(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tingkat Urgensi Kebutuhan</label>
                  <select
                    value={propUrgency}
                    onChange={(e) => setPropUrgency(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-rose-700"
                  >
                    <option value="Tinggi">⚡ Tinggi / Mendesak</option>
                    <option value="Sedang">⏳ Sedang</option>
                    <option value="Rendah">💤 Rendah / Pemeliharaan Berkala</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">Narasi Justifikasi Masalah Lapangan & Dampak</label>
                  <textarea 
                    value={propDescription}
                    onChange={(e) => setPropDescription(e.target.value)}
                    placeholder="Menguraikan mengapa pekerjaan ini dibutuhkan, luas sawah terdampak dsb..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none h-24 resize-none focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsPropFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-lg cursor-pointer transition-colors border-none"
                  >
                    Ajukan Usulan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit proposal modal popup dialog */}
        {editingProp && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 text-xs animate-none"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Edit3 className="w-4.5 h-4.5 text-blue-600" />
                  <span>Ubah Data & Konfigurasi Usulan</span>
                </h3>
                <button 
                  onClick={() => setEditingProp(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Tutup
                </button>
              </div>

              <form onSubmit={handleUpdateProposal} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-slate-700">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">Judul Usulan / Nama Kegiatan</label>
                  <input 
                    type="text"
                    required
                    value={editPropTitle}
                    onChange={(e) => setEditPropTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Lokasi Wilayah Kegiatan</label>
                  <input 
                    type="text"
                    required
                    value={editPropLocation}
                    onChange={(e) => setEditPropLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Jenis Layanan Bidang</label>
                  <select
                    value={editPropType}
                    onChange={(e) => setEditPropType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold"
                  >
                    <option value="Irigasi">Irigasi Jaringan Utama/Sekunder</option>
                    <option value="Bendung">Bendung / Pintu Pengatur</option>
                    <option value="Tanggul">Tanggul / Pengaman Banjir</option>
                    <option value="Lainnya">Fasilitas Penunjang Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Estimasi Kebutuhan Pagu Anggaran (Rp)</label>
                  <input 
                    type="number"
                    required
                    value={editPropBudget || ''}
                    onChange={(e) => setEditPropBudget(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tingkat Urgensi Kebutuhan</label>
                  <select
                    value={editPropUrgency}
                    onChange={(e) => setEditPropUrgency(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-rose-700"
                  >
                    <option value="Tinggi">⚡ Tinggi / Mendesak</option>
                    <option value="Sedang">⏳ Sedang</option>
                    <option value="Rendah">💤 Rendah / Pemeliharaan Berkala</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nama Pengusul / Instansi</label>
                  <input 
                    type="text"
                    required
                    value={editPropProposer}
                    onChange={(e) => setEditPropProposer(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Status Usulan Pekerjaan</label>
                  <select
                    value={editPropStatus}
                    onChange={(e) => setEditPropStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-sky-800"
                  >
                    <option value="Draf">Status: Draf</option>
                    <option value="Menunggu Review">Status: Menunggu Review</option>
                    <option value="Disetujui">Status: Disetujui</option>
                    <option value="Ditolak">Status: Ditolak</option>
                    <option value="Ditambahkan Ke Paket Kerja">Status: Ditambahkan Ke Paket Kerja</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">Narasi Justifikasi Masalah Lapangan & Dampak</label>
                  <textarea 
                    value={editPropDescription}
                    onChange={(e) => setEditPropDescription(e.target.value)}
                    placeholder="Menguraikan mengapa pekerjaan ini dibutuhkan, luas sawah terdampak dsb..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none h-24 resize-none focus:bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEditingProp(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors border-none"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Convert proposal to project modal configuration dialog */}
        {convertingProp && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 text-xs"
            >
              <div className="pb-2 border-b border-slate-150">
                <h3 className="font-bold text-sm text-slate-800 uppercase flex items-center gap-1.5">
                  <Wrench className="w-4.5 h-4.5 text-purple-600" />
                  <span>Konfigurasi Paket Pekerjaan Baru</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Mengonversi Usulan ID: {convertingProp.id} menjadi proyek aktif konstruksi lapangan.</p>
              </div>

              <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-purple-700 uppercase">Judul Kegiatan:</span>
                <p className="font-bold text-slate-800 leading-snug">{convertingProp.title}</p>
                <div className="flex gap-4 text-[10px] text-slate-500 pt-1 font-semibold">
                  <span>Pagu: <strong>{formatRupiah(convertingProp.budget)}</strong></span>
                  <span>Lokasi: <strong>{convertingProp.location}</strong></span>
                </div>
              </div>

              <form onSubmit={handleConvertProposal} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Badan Kontraktor Pelaksana Terpilih (Pemenang Tender)</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: PT. Karya Indah Selaras"
                    value={convContractor}
                    onChange={(e) => setConvContractor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Tanggal Mulai Kontrak</label>
                    <input 
                      type="date"
                      required
                      value={convStartDate}
                      onChange={(e) => setConvStartDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Tanggal Rencana PHO</label>
                    <input 
                      type="date"
                      required
                      value={convEndDate}
                      onChange={(e) => setConvEndDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setConvertingProp(null)}
                    className="flex-1 py-2 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg cursor-pointer transition-colors border-none"
                  >
                    Konversikan Sekarang
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

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

        {(() => {
          // Identify selected project or "all"
          const selectedProjInstance = projects.find(p => p.id === curveProjectId);
          
          let curveDataPoints: { date: string; percent: number; isLogged?: boolean; inspector?: string; notes?: string }[] = [];
          
          if (curveProjectId === 'all' || !selectedProjInstance) {
            // Collect all unique dates from project starts and all inspection logs for these projects
            const datesSet = new Set<string>();
            projects.forEach(p => {
              if (p.startDate) datesSet.add(p.startDate);
            });
            inspectionLogs.forEach(log => {
              if (log.date) datesSet.add(log.date);
            });
            const todayStr = new Date().toISOString().split('T')[0];
            datesSet.add(todayStr);
            
            const sortedDates = Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            
            curveDataPoints = sortedDates.map(currentDate => {
              let totalProgress = 0;
              projects.forEach(p => {
                if (new Date(currentDate) < new Date(p.startDate)) {
                  totalProgress += 0;
                } else {
                  const projectLogs = inspectionLogs.filter(log => log.projectId === p.id);
                  const logsOnOrBefore = projectLogs.filter(log => new Date(log.date) <= new Date(currentDate));
                  if (logsOnOrBefore.length > 0) {
                    logsOnOrBefore.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    totalProgress += logsOnOrBefore[0].percent;
                  } else {
                    totalProgress += p.progress || 0;
                  }
                }
              });
              const avgProgressAtDate = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;
              return {
                date: currentDate,
                percent: avgProgressAtDate
              };
            });
          } else {
            // Single project S-curve
            const p = selectedProjInstance;
            const datesSet = new Set<string>();
            if (p.startDate) datesSet.add(p.startDate);
            
            const projectLogs = inspectionLogs.filter(log => log.projectId === p.id);
            projectLogs.forEach(log => {
              if (log.date) datesSet.add(log.date);
            });
            
            const todayStr = new Date().toISOString().split('T')[0];
            datesSet.add(todayStr);
            if (p.endDate) datesSet.add(p.endDate);
            
            const sortedDates = Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            
            curveDataPoints = sortedDates.map(currentDate => {
              const logOnDate = projectLogs.find(log => log.date === currentDate);
              
              let percentAtDate = 0;
              if (new Date(currentDate) < new Date(p.startDate)) {
                percentAtDate = 0;
              } else {
                const logsOnOrBefore = projectLogs.filter(log => new Date(log.date) <= new Date(currentDate));
                if (logsOnOrBefore.length > 0) {
                  logsOnOrBefore.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  percentAtDate = logsOnOrBefore[0].percent;
                } else {
                  percentAtDate = p.progress || 0;
                }
              }
              
              return {
                date: currentDate,
                percent: percentAtDate,
                isLogged: !!logOnDate,
                inspector: logOnDate?.inspector,
                notes: logOnDate?.notes
              };
            });
          }

          return (
            <div className="bg-white p-8 rounded-3xl border border-slate-150 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded border border-indigo-100 uppercase tracking-wider">
                    Kinerja Fisik per Paket Pekerjaan
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 mt-2">Kurva S Kemajuan Proyek</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Visualisasi grafik kemajuan fisik (Kurva S) per item kegiatan pembangunan irigasi dan tanggul seksi pembangunan.
                  </p>
                </div>

                {/* Mobile Selector */}
                <div className="lg:hidden flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Pilih Paket:</span>
                  <select
                    value={curveProjectId}
                    onChange={(e) => setCurveProjectId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">📊 Semua Paket (Akumulasi)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        💼 {p.name} ({p.progress}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Desktop Side List */}
                <div className="hidden lg:flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 border-r border-slate-100">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Pilih Paket Kerja</div>
                  <button
                    onClick={() => setCurveProjectId('all')}
                    className={`w-full text-left p-3 rounded-xl transition-all border flex flex-col gap-1 cursor-pointer border-solid ${
                      curveProjectId === 'all'
                        ? 'bg-indigo-50/70 border-indigo-200 shadow-3xs'
                        : 'bg-white hover:bg-slate-50 border-slate-150'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-md ${curveProjectId === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-650'}`}>
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black text-slate-800">Semua Paket (Rerata)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Akumulasi Kurva S Gabungan ({projects.length} paket)</span>
                  </button>

                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setCurveProjectId(p.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all border flex flex-col gap-1 cursor-pointer border-solid ${
                        curveProjectId === p.id
                          ? 'bg-indigo-50/70 border-indigo-200 shadow-3xs'
                          : 'bg-white hover:bg-slate-50 border-slate-150'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold text-slate-700 line-clamp-1">{p.name}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono font-bold">{p.contractor}</span>
                        <span className="text-xs font-mono font-black text-indigo-700">{p.progress}%</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Chart Area */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="border border-slate-100 p-6 rounded-2xl bg-slate-50/30 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                      <span className="flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        {curveProjectId === 'all' ? 'Tren Kemajuan Kumulatif (%)' : `Kurva S: ${selectedProjInstance?.name}`}
                      </span>
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-mono text-[10px]">
                        {curveProjectId === 'all' ? `Rerata: ${avgProgress}% Selesai` : `Kemajuan: ${selectedProjInstance?.progress}% Selesai`}
                      </span>
                    </div>

                    {curveDataPoints.length > 1 ? (
                      <div className="w-full h-48 bg-white border border-slate-150 rounded-xl p-4 flex items-center justify-center relative shadow-3xs">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="aggChartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                            </linearGradient>
                          </defs>
                          {/* Gridlines */}
                          <line x1="40" y1="15" x2="480" y2="15" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="40" y1="52.5" x2="480" y2="52.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1="40" y1="90" x2="480" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                          
                          {/* Y-axis Labels */}
                          <text x="12" y="18" className="text-[8px] font-mono font-bold fill-slate-400">100%</text>
                          <text x="18" y="55" className="text-[8px] font-mono font-bold fill-slate-400">50%</text>
                          <text x="22" y="93" className="text-[8px] font-mono font-bold fill-slate-400">0%</text>

                          {/* Generate Path */}
                          {(() => {
                            const points = curveDataPoints.map((d, index) => {
                              const x = 40 + (index / (curveDataPoints.length - 1)) * 440;
                              const y = 90 - (d.percent / 100) * 75;
                              return { x, y, ...d };
                            });
                            const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                            const areaD = `${pathD} L ${points[points.length - 1].x} 90 L ${points[0].x} 90 Z`;
                            
                            return (
                              <>
                                {/* Fill Area */}
                                <path d={areaD} fill="url(#aggChartGrad)" />
                                {/* Line */}
                                <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Dots and Tooltips */}
                                {points.map((p, idx) => (
                                  <g key={idx} className="group">
                                    <circle cx={p.x} cy={p.y} r={p.isLogged ? "5" : "4"} fill={p.isLogged ? "#ef4444" : "#ffffff"} stroke="#4f46e5" strokeWidth="2.5" className="transition-transform duration-200 hover:scale-150 cursor-pointer" />
                                    <text x={p.x} y={p.y - 7} textAnchor="middle" className="text-[8px] font-mono font-extrabold fill-indigo-950">
                                      {p.percent}%
                                    </text>
                                    <text x={p.x} y="105" textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-slate-400">
                                      {p.date.split('-').reverse().join('/')}
                                    </text>
                                  </g>
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    ) : (
                      <div className="h-32 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                        <p className="text-slate-400 text-xs font-semibold">Membutuhkan data paket pembangunan untuk memetakan kurva akumulatif.</p>
                      </div>
                    )}
                  </div>

                  {/* Selected Project Details */}
                  {selectedProjInstance && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-fadeIn">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pelaksana/Kontraktor</div>
                        <div className="text-xs font-bold text-slate-800 mt-1">{selectedProjInstance.contractor}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pagu Anggaran</div>
                        <div className="text-xs font-bold text-slate-800 mt-1 font-mono">{formatRupiah(selectedProjInstance.budget)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Durasi Mulai</div>
                        <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatToIndoDate(selectedProjInstance.startDate)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Selesai</div>
                        <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatToIndoDate(selectedProjInstance.endDate)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
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
          <h2 className="font-bold text-sm text-slate-800">Daftar Paket Program & Proyek Fisik {isOperasionalVariant ? 'Seksi Operasional' : 'Seksi Pembangunan'}</h2>
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
            *Hubungi {isOperasionalVariant ? 'Seksi Operasional' : 'Seksi Pembangunan'} / Admin untuk mengedit progres
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
                {contracts.length > 0 && (
                  <div className="md:col-span-3 bg-blue-50/70 border border-blue-100 p-3 rounded-xl text-left animate-fadeIn">
                    <label className="block text-[11px] font-extrabold text-blue-800 mb-1 flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      Pilih dari Data Kontrak (Autofill Otomatis)
                    </label>
                    <select
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId) {
                          const selectedContract = contracts.find(c => c.id === selectedId);
                          if (selectedContract) {
                            handleAutofillFromContract(selectedContract);
                          }
                        }
                      }}
                      className="w-full p-2 bg-white border border-blue-200 rounded-lg text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs cursor-pointer"
                    >
                      <option value="">-- Pilih Kontrak untuk Autofill Data Pekerjaan --</option>
                      {contracts.map((c) => {
                        const isContractUsed = projects.some(p => 
                          (!editingProject || p.id !== editingProject.id) &&
                          p.name.trim().toLowerCase() === c.projectName.trim().toLowerCase()
                        );
                        return (
                          <option 
                            key={c.id} 
                            value={c.id}
                            disabled={isContractUsed}
                            className={isContractUsed ? "text-slate-400 bg-slate-100 italic" : "text-slate-800 font-semibold"}
                          >
                            {c.projectName} (No Kontrak: {c.contractNumber}) {c.duration ? `[Masa Pelaksanaan: ${c.duration}]` : ''}{isContractUsed ? " (Sudah terdaftar sebagai paket pekerjaan)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[10px] text-blue-600 font-medium mt-1">
                      *Memilih kontrak akan mengisi otomatis Pagu Anggaran, Kontraktor, Tanggal Awal, dan menghitung otomatis Tanggal Rencana Selesai (Awal + Masa Pelaksanaan + 1 hari).
                    </p>
                  </div>
                )}

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
                    onChange={(e) => handleStartDateChange(e.target.value)}
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
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase mb-2">
                  <span>Persentase Progres</span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={newProgress}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        if (valStr === '') {
                          setNewProgress(0);
                          return;
                        }
                        let val = parseFloat(valStr);
                        if (isNaN(val)) val = 0;
                        if (val < 0) val = 0;
                        if (val > 100) val = 100;
                        setNewProgress(val);
                        if (val === 100) setNewStatus('Selesai');
                        else if (val > 0) setNewStatus('Konstruksi');
                        else setNewStatus('Perencanaan');
                      }}
                      className="w-14 text-right text-xs font-mono font-bold text-blue-600 bg-transparent outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-0"
                    />
                    <span className="text-[10px] text-slate-400 font-extrabold pr-1">%</span>
                  </div>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="any"
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
                      <span>Mulai: {formatToIndoDate(proj.startDate)}</span>
                      <span>Target: {formatToIndoDate(proj.endDate)}</span>
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
                    {canWrite && (
                      <button
                        onClick={() => handleStartEditProject(proj)}
                        className="p-1.5 border border-blue-100 text-blue-500 hover:bg-blue-50 rounded-xl hover:text-blue-700 transition-all inline-block cursor-pointer"
                        title="Edit Detail Proyek"
                        id={`edit-project-${proj.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {canWrite && (
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
