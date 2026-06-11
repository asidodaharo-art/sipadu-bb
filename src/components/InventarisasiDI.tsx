import React, { useState, FormEvent, useRef } from 'react';
import { User } from '../types';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Waves, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  ShieldAlert, 
  RotateCcw, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Filter,
  ArrowRight,
  TrendingUp,
  Boxes,
  Camera,
  Image as ImageIcon,
  Navigation,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BangunanPendukung {
  id: string;
  name: string;
  category: string; // e.g., 'Bendung Utama', 'Pintu Intake', etc.
  condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  photo?: string; // base64 or placeholder URL
  location?: string; // "Lat, Lng"
  notes?: string;
}

interface DaerahIrigasi {
  id: string;
  name: string;
  regency: string; // e.g., Simalungun, Serdang Bedagai
  potensialArea: number; // Ha
  fungsionalArea: number; // Ha
  waterSource: string; // e.g., Sungai Bah Bolon
  coordinates: string; // Lat, Lng
  condition: 'Mengalir' | 'Kering';
  notes?: string;
  structuresCount: {
    bendung: number;
    intake: number;
    pintuAir: number;
    saluranKm: number;
  };
  bangunanPendukung?: BangunanPendukung[];
}

const INITIAL_DI_DATA: DaerahIrigasi[] = [
  {
    id: 'di-1',
    name: 'DI Bah Bolon',
    regency: 'Simalungun',
    potensialArea: 9550,
    fungsionalArea: 8320,
    waterSource: 'Sungai Bah Bolon',
    coordinates: '2.9644, 99.0621',
    condition: 'Mengalir',
    notes: 'Kondisi air stabil sepanjang tahun, penyuplai utama sawah baku di wilayah tengah',
    structuresCount: { bendung: 1, intake: 2, pintuAir: 24, saluranKm: 42.5 },
    bangunanPendukung: [
      {
        id: 'bp-1',
        name: 'Pintu Sadap Utama Bah Bolon',
        category: 'Pintu Intake',
        condition: 'Baik',
        photo: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&auto=format&fit=crop&q=60',
        location: '2.9644, 99.0621',
        notes: 'Pintu air beroperasi dengan lancar, pelumasan rutin dilakukan setiap bulan.'
      },
      {
        id: 'bp-2',
        name: 'Tanggul Banjir HM-4',
        category: 'Tanggul Pengaman',
        condition: 'Rusak Ringan',
        photo: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400&auto=format&fit=crop&q=60',
        location: '2.9658, 99.0635',
        notes: 'Terlihat gerusan air kecil di tepi fondasi pasca limpasan banjir pekan lalu.'
      }
    ]
  },
  {
    id: 'di-2',
    name: 'DI Paya Lombang',
    regency: 'Serdang Bedagai',
    potensialArea: 3420,
    fungsionalArea: 3100,
    waterSource: 'Sungai Paya Lombang',
    coordinates: '3.1233, 99.1822',
    condition: 'Mengalir',
    notes: 'Butuh perbaikan tanggul di saluran primer HM 12+400',
    structuresCount: { bendung: 1, intake: 1, pintuAir: 12, saluranKm: 18.2 },
    bangunanPendukung: [
      {
        id: 'bp-3',
        name: 'Pintu Pembagi Saluran Sekunder',
        category: 'Pintu Air Bagi',
        condition: 'Rusak Berat',
        photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=60',
        location: '3.1235, 99.1825',
        notes: 'Drat pemutar berkarat kronis dan macet total, aliran dialihkan darurat.'
      }
    ]
  },
  {
    id: 'di-3',
    name: 'DI Kerasaan',
    regency: 'Simalungun',
    potensialArea: 5120,
    fungsionalArea: 4890,
    waterSource: 'Sungai Bah Bolon',
    coordinates: '3.0455, 99.2789',
    condition: 'Mengalir',
    notes: 'Sistem pintu air digitalisasi terintegrasi pos pantau hidrometri Kerasaan',
    structuresCount: { bendung: 1, intake: 2, pintuAir: 18, saluranKm: 28.0 },
    bangunanPendukung: []
  },
  {
    id: 'di-4',
    name: 'DI Tanah Jawa',
    regency: 'Simalungun',
    potensialArea: 2890,
    fungsionalArea: 2450,
    waterSource: 'Sungai Kasihan',
    coordinates: '2.8812, 99.1121',
    condition: 'Kering',
    notes: 'Sedimentasi tinggi di sekitar bendung utama, perlu pengerukan rutin',
    structuresCount: { bendung: 1, intake: 1, pintuAir: 9, saluranKm: 14.8 },
    bangunanPendukung: []
  },
  {
    id: 'di-5',
    name: 'DI Tebing Tinggi',
    regency: 'Tebing Tinggi',
    potensialArea: 1780,
    fungsionalArea: 1420,
    waterSource: 'Sungai Padang',
    coordinates: '3.3241, 99.1633',
    condition: 'Kering',
    notes: 'Pintu intake sisi kanan macet akibat korosi, dalam pengusulan rehab seksi pembangunan',
    structuresCount: { bendung: 1, intake: 1, pintuAir: 6, saluranKm: 9.5 },
    bangunanPendukung: []
  }
];

interface InventarisasiDIProps {
  currentUser: User;
}

export default function InventarisasiDI({ currentUser }: InventarisasiDIProps) {
  // Persistence using local storage inside component
  const [diList, setDiList] = useState<DaerahIrigasi[]>(() => {
    const saved = localStorage.getItem('uptd_v3_daerah_irigasi');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map old structure values for safety
        return parsed.map((item: any) => ({
          ...item,
          condition: (item.condition === 'Baik' || item.condition === 'Rusak Ringan' || item.condition === 'Mengalir') ? 'Mengalir' : 'Kering',
          structuresCount: item.structuresCount || { bendung: 1, intake: 1, pintuAir: 10, saluranKm: 10 },
          bangunanPendukung: item.bangunanPendukung || []
        }));
      } catch (e) {
        return INITIAL_DI_DATA;
      }
    }
    return INITIAL_DI_DATA;
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [regencyFilter, setRegencyFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedDiId, setExpandedDiId] = useState<string | null>(null);

  // Form states
  const [diName, setDiName] = useState('');
  const [diRegency, setDiRegency] = useState('');
  const [diPotensial, setDiPotensial] = useState<number>(1000);
  const [diFungsional, setDiFungsional] = useState<number>(800);
  const [diWaterSource, setDiWaterSource] = useState('');
  const [diCoordinates, setDiCoordinates] = useState('');
  const [diCondition, setDiCondition] = useState<DaerahIrigasi['condition']>('Mengalir');
  const [diNotes, setDiNotes] = useState('');
  // structures state
  const [countBendung, setCountBendung] = useState(1);
  const [countIntake, setCountIntake] = useState(1);
  const [countPintu, setCountPintu] = useState(10);
  const [countSaluran, setCountSaluran] = useState(10);

  // Supporting Structures state
  const [bangunanPendukungList, setBangunanPendukungList] = useState<BangunanPendukung[]>([]);

  // Sub-form state for dynamic dynamic add form
  const [isAddingBp, setIsAddingBp] = useState(false);
  const [bpName, setBpName] = useState('');
  const [bpCategory, setBpCategory] = useState('Bendung Utama');
  const [bpCondition, setBpCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [bpPhoto, setBpPhoto] = useState<string>(''); // base64 payload
  const [bpLocation, setBpLocation] = useState('');
  const [bpNotes, setBpNotes] = useState('');

  // Device Integration hooks
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      // Direct stream initiation
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera interaction error:', err);
      setCameraError('Akses kamera tidak diizinkan atau tidak didukung pada browser ini. Silakan gunakan opsi Unggah File.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setBpPhoto(dataUrl);
      }
      stopCamera();
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBpPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Fitur Pendeteksi GPS tidak didukung di peranti ini.');
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setBpLocation(`${lat}, ${lng}`);
        setIsGpsLoading(false);
      },
      (error) => {
        console.error('GPS error:', error);
        alert('Gagal melacak lokasi: ' + error.message);
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Access rights check
  const userSections = currentUser.section ? currentUser.section.split(',') : [];
  const canWrite = currentUser.role === 'admin' || userSections.includes('operasional') || userSections.includes('all');

  // Helper sync with localStorage
  const syncAndSetData = (newList: DaerahIrigasi[]) => {
    setDiList(newList);
    localStorage.setItem('uptd_v3_daerah_irigasi', JSON.stringify(newList));
  };

  // Re-initialize default
  const handleResetToDefault = () => {
    if (confirm('Apakah Anda yakin ingin memulihkan dataset contoh Daerah Irigasi UPTD Bah Bolon? Data kustomisasi Anda saat ini akan ditimpa.')) {
      syncAndSetData(INITIAL_DI_DATA);
    }
  };

  // Submit Handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!diName.trim() || !diWaterSource.trim()) {
      alert('Nama Daerah Irigasi dan Sumber Air wajib diisi.');
      return;
    }

    const structureObj = {
      bendung: Number(countBendung),
      intake: Number(countIntake),
      pintuAir: Number(countPintu),
      saluranKm: Number(countSaluran)
    };

    if (editingId) {
      // Update
      const updated = diList.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            name: diName,
            regency: diRegency,
            potensialArea: Number(diPotensial),
            fungsionalArea: Number(diFungsional),
            waterSource: diWaterSource,
            coordinates: diCoordinates || '0.0000, 0.0000',
            condition: diCondition,
            notes: diNotes,
            structuresCount: structureObj,
            bangunanPendukung: bangunanPendukungList
          };
        }
        return item;
      });
      syncAndSetData(updated);
      setEditingId(null);
    } else {
      // Insert
      const newItem: DaerahIrigasi = {
        id: `di-${Date.now()}`,
        name: diName,
        regency: diRegency,
        potensialArea: Number(diPotensial),
        fungsionalArea: Number(diFungsional),
        waterSource: diWaterSource,
        coordinates: diCoordinates || '2.9000, 99.1000',
        condition: diCondition,
        notes: diNotes,
        structuresCount: structureObj,
        bangunanPendukung: bangunanPendukungList
      };
      syncAndSetData([newItem, ...diList]);
    }

    // Reset Form fields
    resetForm();
    setIsFormOpen(false);
  };

  const resetForm = () => {
    stopCamera();
    setEditingId(null);
    setDiName('');
    setDiRegency('');
    setDiPotensial(1000);
    setDiFungsional(800);
    setDiWaterSource('');
    setDiCoordinates('');
    setDiCondition('Mengalir');
    setDiNotes('');
    setCountBendung(1);
    setCountIntake(1);
    setCountPintu(10);
    setCountSaluran(10);
    setBangunanPendukungList([]);
    setIsAddingBp(false);
  };

  const handleEditClick = (di: DaerahIrigasi) => {
    setEditingId(di.id);
    setDiName(di.name);
    setDiRegency(di.regency);
    setDiPotensial(di.potensialArea);
    setDiFungsional(di.fungsionalArea);
    setDiWaterSource(di.waterSource);
    setDiCoordinates(di.coordinates);
    setDiCondition(di.condition);
    setDiNotes(di.notes || '');
    setCountBendung(di.structuresCount?.bendung ?? 0);
    setCountIntake(di.structuresCount?.intake ?? 0);
    setCountPintu(di.structuresCount?.pintuAir ?? 0);
    setCountSaluran(di.structuresCount?.saluranKm ?? 0);
    setBangunanPendukungList(di.bangunanPendukung || []);
    setIsAddingBp(false);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data Daerah Irigasi "${name}"?`)) {
      const filtered = diList.filter(item => item.id !== id);
      syncAndSetData(filtered);
    }
  };

  // Get unique regencies dynamically from the table data
  const uniqueRegencies = Array.from(
    new Set(
      diList
        .map((di) => di.regency?.trim())
        .filter((regency): regency is string => !!regency)
    )
  ).sort();

  // Filter Logic
  const filteredDI = diList.filter(di => {
    const matchesSearch = (di.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (di.waterSource || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          (di.regency || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesRegency = regencyFilter === 'all' || di.regency === regencyFilter;
    const matchesCondition = conditionFilter === 'all' || di.condition === conditionFilter;
    return matchesSearch && matchesRegency && matchesCondition;
  });

  // Analytics Calculations
  const totalPotensial = filteredDI.reduce((acc, current) => acc + current.potensialArea, 0);
  const totalFungsional = filteredDI.reduce((acc, current) => acc + current.fungsionalArea, 0);
  const avgEfficiency = totalPotensial > 0 ? Math.round((totalFungsional / totalPotensial) * 100) : 0;
  
  const countByCondition = {
    Mengalir: filteredDI.filter(item => item.condition === 'Mengalir').length,
    Kering: filteredDI.filter(item => item.condition === 'Kering').length
  };

  return (
    <div className="space-y-6" id="inventarisasi-di-page">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs gap-4" id="inventarisasi-header">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-600">
            <Layers className="w-5 h-5 text-blue-500" />
            <span className="font-extrabold text-[10px] uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-md">
              Seksi Operasional (OP) • Keirigasian
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventarisasi Daerah Irigasi (DI)
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            Sistem rekapitulasi data Daerah Irigasi UPTD PSDA Bah Bolon. Pantau dan kelolah cakupan sawah fungsional, 
            potensi pengembangan, ketersediaan air sungai, letak astronomis, dan status kondisi infrastruktur pendukung sawah rakyat.
          </p>
        </div>

        <div className="flex gap-2 self-end md:self-center shrink-0">
          <button 
            onClick={handleResetToDefault}
            className="px-3.5 py-2 border border-slate-201 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            id="reset-di-dataset-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Pulihkan Dataset</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="di-stats-panel">
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black block">Total Daerah Irigasi</span>
            <span className="text-xl font-extrabold text-slate-800">{filteredDI.length} DI</span>
            <span className="text-[9px] text-slate-550 block">Tercatat di UPTD Bah Bolon</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black block">Total Luas Potensial</span>
            <span className="text-xl font-extrabold text-indigo-700">{(totalPotensial || 0).toLocaleString()} Ha</span>
            <span className="text-[9px] text-slate-550 block">Maksimal perluasan irigasi</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black block">Sawah Baku Fungsional</span>
            <span className="text-xl font-extrabold text-emerald-700">{(totalFungsional || 0).toLocaleString()} Ha</span>
            <span className="text-[9px] text-emerald-600 font-bold block">Teraliri air aktif ({avgEfficiency}%)</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black block">Kondisi Aliran Kering</span>
            <span className={`text-xl font-extrabold ${countByCondition.Kering > 0 ? 'text-red-650 font-black' : 'text-slate-700'}`}>
              {countByCondition.Kering} DI
            </span>
            <span className="text-[9px] text-slate-550 block">Perlu suplai debit air tambahan</span>
          </div>
          <div className={`p-3 rounded-lg ${countByCondition.Kering > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-550'}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search, Filter, and Action Buttons Row */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200/60 gap-4" id="di-action-filters">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama DI, sumber pasokan air, wilayah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={regencyFilter}
            onChange={(e) => setRegencyFilter(e.target.value)}
            className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700 font-medium"
          >
            <option value="all">Semua Kabupaten/Kota</option>
            {uniqueRegencies.map((regency) => (
              <option key={regency} value={regency}>
                {regency}
              </option>
            ))}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700 font-medium"
          >
            <option value="all">Semua Kondisi Aliran</option>
            <option value="Mengalir">Mengalir</option>
            <option value="Kering">Kering</option>
          </select>
        </div>

        {canWrite && (
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            id="open-di-form-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Pendaftaran / Tambah DI</span>
          </button>
        )}
      </div>

      {/* 4. Pop-up Modal Form for Create/Update with Overlay Backdrop & AnimatePresence */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="di-form-modal">
            {/* Backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center bg-slate-50 border-b border-slate-150 px-6 py-4 shrink-0">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>{editingId ? 'SUNTING DATA DAERAH IRIGASI' : 'DAFTARKAN DAERAH IRIGASI BARU'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-450 font-medium">Lengkapi parameter keirigasian UPTD PSDA Bah Bolon</p>
                </div>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Daerah Irigasi (DI) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={diName}
                      onChange={(e) => setDiName(e.target.value)}
                      placeholder="Contoh: DI Bah Bolon Kanan"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lokasi Kabupaten / Daerah <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={diRegency}
                      onChange={(e) => setDiRegency(e.target.value)}
                      placeholder="Contoh: Simalungun, Serdang Bedagai, Tebing Tinggi, dll."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Luas Baku Fungsional / Sawah Baku (Ha) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={diFungsional}
                      onChange={(e) => setDiFungsional(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Luas Potensial Irigasi (Ha) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={diPotensial}
                      onChange={(e) => setDiPotensial(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kondisi Aliran Sungai/Saluran <span className="text-red-500">*</span></label>
                    <select
                      value={diCondition}
                      onChange={(e) => setDiCondition(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-extrabold outline-none focus:bg-white focus:border-blue-500 text-blue-700"
                    >
                      <option value="Mengalir">🟢 Mengalir (Aktif)</option>
                      <option value="Kering">🔴 Kering (Mati/Defisit)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Sumber Pasokan Air Aliran Utama <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={diWaterSource}
                      onChange={(e) => setDiWaterSource(e.target.value)}
                      placeholder="Contoh: Sungai Bah Bolon"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>
                </div>



                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Hambatan / Rekomendasi Pemeliharaan</label>
                  <textarea
                    value={diNotes}
                    onChange={(e) => setDiNotes(e.target.value)}
                    placeholder="Deskripsikan hambatan aliran, kekurangan pasokan air saat gaduan sawah..."
                    rows={2}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:bg-white focus:border-blue-500"
                  ></textarea>
                </div>

                {/* Sub-Form Bangunan Pendukung */}
                <div className="border-t border-slate-150 pt-5 space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span>🏗️ Data Bangunan Pendukung ({bangunanPendukungList.length})</span>
                      </h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">Infrastruktur pembagi, pengatur, pengaman DI</p>
                    </div>
                    {!isAddingBp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingBp(true);
                          setBpName('');
                          setBpCategory('Bendung Utama');
                          setBpCondition('Baik');
                          setBpPhoto('');
                          setBpLocation('');
                          setBpNotes('');
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-extrabold rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Bangunan
                      </button>
                    )}
                  </div>

                  {/* Dynamic list */}
                  {bangunanPendukungList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="di-bp-list">
                      {bangunanPendukungList.map((bp) => (
                        <div key={bp.id} className="p-3 border border-slate-150 rounded-xl bg-slate-50 flex gap-2.5 items-start relative hover:border-slate-300 transition-all">
                          {bp.photo ? (
                            <img 
                              src={bp.photo} 
                              alt={bp.name} 
                              className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-200 border-dashed text-slate-400 shrink-0">
                              <ImageIcon className="w-4 h-4 opacity-60" />
                              <span className="text-[7px] font-black uppercase text-slate-450 leading-none mt-1">No Photo</span>
                            </div>
                          )}
                          <div className="flex-1 space-y-1 min-w-0 pr-5">
                            <h5 className="font-extrabold text-slate-800 text-[11px] leading-tight truncate">{bp.name}</h5>
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="px-1.5 py-0.5 bg-slate-200/80 text-slate-600 font-bold rounded text-[8px] uppercase tracking-wider">{bp.category}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                bp.condition === 'Baik' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                bp.condition === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-red-50 text-red-700 border-red-100'
                              }`}>{bp.condition}</span>
                            </div>
                            {bp.location && (
                              <a 
                                href={`https://www.google.com/maps?q=${bp.location}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[9px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5 inline-flex"
                              >
                                <MapPin className="w-2.5 h-2.5 text-red-500" />
                                <span>GPS: {bp.location}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {bp.notes && <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic line-clamp-1">"{bp.notes}"</p>}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setBangunanPendukungList(bangunanPendukungList.filter((item) => item.id !== bp.id));
                            }}
                            className="p-1 hover:bg-red-50 hover:text-red-650 text-slate-400 rounded-md transition-colors absolute right-2 top-2"
                            title="Hapus bangunan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !isAddingBp && (
                      <div className="py-4 text-center border-2 border-dashed border-slate-150 rounded-xl text-slate-400">
                        <p className="text-[11px]">Belum ada bangunan pendukung terdaftar.</p>
                      </div>
                    )
                  )}

                  {/* Adding form wrapper inside modal */}
                  {isAddingBp && (
                    <div className="p-4 border-2 border-blue-150 bg-blue-50/15 rounded-xl space-y-4 shadow-inner" id="di-bp-add-inner-form">
                      <div className="flex justify-between items-center pb-2 border-b border-blue-50">
                        <span className="font-extrabold text-[10px] text-blue-800 uppercase tracking-widest flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          Form Tambah Bangunan Pendukung
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setIsAddingBp(false);
                          }}
                          className="text-slate-400 hover:text-slate-600 font-black text-xs cursor-pointer p-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nama Bangunan Pendukung <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={bpName}
                            onChange={(e) => setBpName(e.target.value)}
                            placeholder="Contoh: Pintu Sekunder HM-2"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:border-blue-500 text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                          <select
                            value={bpCategory}
                            onChange={(e) => setBpCategory(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:border-blue-500 text-[11px]"
                          >
                            <option value="Bendung Utama">Bendung Utama</option>
                            <option value="Pintu Intake">Pintu Intake</option>
                            <option value="Pintu Air Bagi">Pintu Air Bagi</option>
                            <option value="Tanggul Pengaman">Tanggul Pengaman</option>
                            <option value="Saluran Sadap">Saluran Sadap</option>
                            <option value="Alat Ukur Debit">Alat Ukur Debit</option>
                            <option value="Siphon / Gorong-gorong">Siphon / Gorong-gorong</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Kondisi Fisik Bangunan <span className="text-red-500">*</span></label>
                          <select
                            value={bpCondition}
                            onChange={(e) => setBpCondition(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold outline-none focus:border-blue-500 text-[11px]"
                          >
                            <option value="Baik">🟢 Baik (Mantap)</option>
                            <option value="Rusak Ringan">🟡 Rusak Ringan</option>
                            <option value="Rusak Berat">🔴 Rusak Berat</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1 flex justify-between items-center">
                            <span>Koordinat Lokasi GPS</span>
                            <div className="flex gap-1.5">
                              {diCoordinates && (
                                <button
                                  type="button"
                                  onClick={() => setBpLocation(diCoordinates)}
                                  className="text-[9px] text-indigo-700 hover:text-indigo-900 font-black inline-flex items-center gap-0.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200"
                                  title="Gunakan koordinat dari lokasi Daerah Irigasi induk"
                                >
                                  📍 Lokasi DI Induk
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleGetGPS}
                                className="text-[9px] text-blue-700 hover:text-blue-900 font-black inline-flex items-center gap-0.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200"
                                disabled={isGpsLoading}
                                title="Deteksi lokasi koordinat menggunakan GPS perangkat"
                              >
                                <Navigation className={`w-2.5 h-2.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
                                {isGpsLoading ? 'Mendeteksi...' : 'GPS Perangkat'}
                              </button>
                            </div>
                          </label>
                          <input
                            type="text"
                            value={bpLocation}
                            onChange={(e) => setBpLocation(e.target.value)}
                            placeholder="Contoh: 2.9644, 99.0621 (atau isi manual)"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-500 text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Foto Bukti Fisik Bangunan</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          <div className="sm:col-span-2 space-y-2">
                            {!isCameraActive ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={startCamera}
                                  className="flex-1 py-1.5 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <Camera className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Kamera Kamera Live</span>
                                </button>
                                <label className="flex-1 py-1.5 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
                                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Unggah File</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handlePhotoFileChange}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-350 bg-black max-h-[140px] flex items-center justify-center">
                                  <video 
                                    ref={videoRef} 
                                    className="w-full h-full object-cover" 
                                    playsInline 
                                    muted
                                  />
                                  {cameraError && (
                                    <div className="absolute inset-0 bg-slate-900/90 text-red-400 p-3 text-[9px] flex items-center justify-center text-center leading-relaxed">
                                      {cameraError}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    Ambil Gambar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="py-1 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-center shrink-0">
                            {bpPhoto ? (
                              <div className="relative group">
                                <img 
                                  src={bpPhoto} 
                                  alt="Captured Preview" 
                                  className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setBpPhoto('')}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-650 transition-colors text-[8px]"
                                  title="Hapus foto"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="w-20 h-20 bg-slate-100 border border-slate-200 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400">
                                <ImageIcon className="w-5 h-5 opacity-40" />
                                <span className="text-[7px] uppercase font-black tracking-wider text-slate-400 mt-1">Belum Ada</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan Bangunan</label>
                        <textarea
                          value={bpNotes}
                          onChange={(e) => setBpNotes(e.target.value)}
                          placeholder="Jelaskan hambatan atau kondisi tertentu..."
                          rows={1.5}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-500 text-[11px]"
                        ></textarea>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setIsAddingBp(false);
                          }}
                          className="px-3 py-1.5 border border-slate-250 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!bpName.trim()) {
                              alert('Nama bangunan pendukung wajib diisi.');
                              return;
                            }
                            const newBp: BangunanPendukung = {
                              id: `bp-${Date.now()}`,
                              name: bpName,
                              category: bpCategory,
                              condition: bpCondition,
                              photo: bpPhoto || undefined,
                              location: bpLocation || undefined,
                              notes: bpNotes || undefined
                            };
                            setBangunanPendukungList([...bangunanPendukungList, newBp]);
                            stopCamera();
                            setIsAddingBp(false);
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-[10px] cursor-pointer"
                        >
                          Simpan Ke List
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions inside Modal */}
                <div className="flex justify-end gap-2 border-t border-slate-150 pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg shadow-md cursor-pointer transition-colors"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Daftarkan Daerah Irigasi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Main Card and Table Presentation */}
      <div className="bg-white rounded-2xl border border-slate-200/85 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-slate-400" />
            <span>Parameter Registrasi Daerah Irigasi (DI)</span>
          </span>
          <span className="font-mono text-[10px] text-slate-450 bg-white border px-2 py-0.5 rounded">
            Ditemukan {filteredDI.length} dari {diList.length} Daerah Irigasi
          </span>
        </div>

        {filteredDI.length === 0 ? (
          <div className="py-20 text-center space-y-3 px-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-6 h-6 text-slate-350" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Daerah Irigasi Ditemukan</h4>
              <p className="text-xs text-slate-450 max-w-md mx-auto">
                Silakan ubah filter penelusuran Anda atau memulihkan dataset bawaan UPTD Bah Bolon dengan tombol di sudut atas halaman.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-450 uppercase font-bold tracking-widest text-[9px]">
                  <th className="p-4">Nama Daerah Irigasi</th>
                  <th className="p-4">Lokasi</th>
                  <th className="p-4 text-center">Luas Baku (Fungsional)</th>
                  <th className="p-4 text-center">Luas Potensial</th>
                  <th className="p-4 text-center">Kondisi Aliran</th>
                  <th className="p-4">Sumber Air</th>
                  <th className="p-4">Catatan / Hambatan</th>
                  {canWrite && <th className="p-4 text-center w-24">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDI.flatMap((di) => {
                  const getConditionBadge = (st: DaerahIrigasi['condition']) => {
                    switch (st) {
                      case 'Mengalir': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      case 'Kering': return 'bg-red-50 text-red-705 border-red-200';
                      default: return 'bg-slate-50 text-slate-750 border-slate-200';
                    }
                  };

                  const efficiency = di.potensialArea > 0 ? Math.round((di.fungsionalArea / di.potensialArea) * 100) : 0;
                  const hasBp = di.bangunanPendukung && di.bangunanPendukung.length > 0;
                  const isExpanded = expandedDiId === di.id;

                  const mainRow = (
                    <tr key={di.id} className={`hover:bg-slate-50/30 transition-colors ${isExpanded ? 'bg-slate-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                            {di.name}
                          </span>
                          {hasBp ? (
                            <button
                              type="button"
                              onClick={() => setExpandedDiId(isExpanded ? null : di.id)}
                              className="text-[10px] text-blue-700 hover:text-blue-900 font-extrabold flex items-center gap-1 mt-0.5 hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                            >
                              <span>🏗️ {di.bangunanPendukung!.length} Bangunan Pendukung</span>
                              <span>{isExpanded ? '▲' : '▼'}</span>
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-400 italic block">Belum ada bangunan pendukung</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded text-[10px] uppercase">
                          {di.regency}
                        </span>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="font-extrabold text-emerald-700 text-[12px] block">
                          {(di.fungsionalArea || 0).toLocaleString()} Ha
                        </span>
                      </td>

                      <td className="p-4 text-center font-bold text-slate-800 text-[12px] whitespace-nowrap">
                        {(di.potensialArea || 0).toLocaleString()} Ha
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.8 rounded-md text-[10px] font-black uppercase tracking-wider border ${getConditionBadge(di.condition)}`}>
                          {di.condition}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="flex items-center gap-1 text-slate-600 font-bold">
                          <Waves className="w-3.5 h-3.5 text-blue-400" />
                          {di.waterSource}
                        </span>
                      </td>

                      <td className="p-4 max-w-xs text-slate-500 font-medium font-sans">
                        {di.notes || <span className="text-slate-350 italic">-</span>}
                      </td>

                      {canWrite && (
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(di)}
                              className="p-1 px-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md transition-colors cursor-pointer"
                              title="Sunting data irigasi"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(di.id, di.name)}
                              className="p-1 px-2 bg-red-50/10 hover:bg-red-50 border border-red-100 hover:border-red-200 text-red-650 rounded-md transition-colors cursor-pointer"
                              title="Hapus data irigasi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );

                  if (isExpanded && hasBp) {
                    const expandedRow = (
                      <tr key={`${di.id}-expanded`} className="bg-slate-50/10 border-b border-slate-100">
                        <td colSpan={canWrite ? 8 : 7} className="p-4 border-t border-slate-100 bg-slate-50/30">
                          <div className="space-y-3 pl-4 border-l-2 border-blue-500">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">INVENTARISASI BANGUNAN PENDUKUNG DAERAH IRIGASI</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {di.bangunanPendukung!.map((bp) => (
                                <div key={bp.id} className="p-3 border border-slate-200 bg-white rounded-xl shadow-xs flex gap-3 items-start hover:shadow-sm transition-all">
                                  {bp.photo ? (
                                    <img 
                                      src={bp.photo} 
                                      alt={bp.name} 
                                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0 shadow-xs" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-slate-50 border border-slate-150 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-350 shrink-0">
                                      <ImageIcon className="w-4 h-4 opacity-50" />
                                      <span className="text-[7px] font-black uppercase mt-0.5 leading-none">No Photo</span>
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1 space-y-1 text-[11px]">
                                    <h5 className="font-extrabold text-slate-800 leading-snug break-words">{bp.name}</h5>
                                    <div className="flex flex-wrap gap-1 items-center">
                                      <span className="px-1.5 py-0.5 bg-slate-100 font-extrabold border border-slate-150 rounded text-[8px] uppercase tracking-wider text-slate-550">{bp.category}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                        bp.condition === 'Baik' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        bp.condition === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-red-50 text-red-700 border-red-100'
                                      }`}>{bp.condition}</span>
                                    </div>
                                    {bp.location && (
                                      <a 
                                        href={`https://www.google.com/maps?q=${bp.location}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-[9px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5 mt-0.5 inline-flex"
                                      >
                                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                        <span>GPS: {bp.location}</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                    {bp.notes && (
                                      <p className="text-[10px] text-slate-500 font-medium italic mt-1 leading-relaxed bg-slate-50/75 p-1.5 rounded border border-slate-100">
                                        "{bp.notes}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                    return [mainRow, expandedRow];
                  }

                  return [mainRow];
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Footer Information block */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <Building2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-xs text-blue-900 block uppercase tracking-wider">INSTRUKSI PENATAUSAHAAN DAERAH IRIGASI</span>
          <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
            Rasio efisiensi irigasi diperoleh dari pembagian luasan sawah fungsional yang sudah terafiliasi pintu sadap/bagi dengan total potensi perluasan lahan pertanian yang dikalkulasikan oleh pengamat hidrometri di lapangan. Pemutakhiran status fisik atau perbaikan tanggul diinfokan berkala melalui koordinasi dengan Seksi Pembangunan.
          </p>
        </div>
      </div>

    </div>
  );
}
