import React, { useState, useEffect } from 'react';
import { Mail, Staff, User, Asset, FinanceTransaction, AssetDistribution, ConsumableSupply, BankAccount, ActivityAccount, SpjDocument, BappDocument, Contract, Project } from '../types';
import { 
  FileText, 
  Users, 
  Search, 
  Plus, 
  FolderPlus, 
  MailOpen, 
  Send, 
  ChevronRight, 
  UserPlus, 
  Phone, 
  CreditCard,
  Trash2,
  Filter,
  CheckCircle,
  HelpCircle,
  Box,
  Wallet,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Tag,
  Upload,
  FileUp,
  FileText as FileIcon,
  X,
  Eye,
  Download,
  FileSpreadsheet,
  Edit3,
  Award,
  GraduationCap,
  Heart,
  Baby,
  Archive,
  Inbox,
  Share2,
  TrendingUp,
  Sliders,
  Sparkles,
  Camera,
  User as UserIcon,
  Briefcase,
  FileCheck,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatToIndoDate, ymdToDmy, dmyToYmd } from '../utils';

interface PenatausahaanProps {
  currentUser: User;
  mails: Mail[];
  staff: Staff[];
  assets: Asset[];
  finances: FinanceTransaction[];
  activeSubTab: 'landing' | 'adm_umum' | 'personalia' | 'aset_inventaris' | 'keuangan';
  onSubTabChange: (tab: 'landing' | 'adm_umum' | 'personalia' | 'aset_inventaris' | 'keuangan') => void;
  onAddMail: (newMail: Mail) => void;
  onUpdateMail: (updatedMail: Mail) => void;
  onAddStaff: (newStaff: Staff) => void;
  onUpdateStaff: (updatedStaff: Staff) => void;
  onDeleteMail: (id: string) => void;
  onDeleteStaff: (id: string) => void;
  onAddAsset: (newAsset: Asset) => void;
  onUpdateAsset: (updatedAsset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onAddFinance: (newFinance: FinanceTransaction) => void;
  onUpdateFinance: (updatedFinance: FinanceTransaction) => void;
  onDeleteFinance: (id: string) => void;
}

const RANK_MAPPINGS = [
  { pangkat: 'Juru Muda', golongan: 'I/a' },
  { pangkat: 'Juru Muda Tingkat I', golongan: 'I/b' },
  { pangkat: 'Juru', golongan: 'I/c' },
  { pangkat: 'Juru Tingkat I', golongan: 'I/d' },
  { pangkat: 'Pengatur Muda', golongan: 'II/a' },
  { pangkat: 'Pengatur Muda Tingkat I', golongan: 'II/b' },
  { pangkat: 'Pengatur', golongan: 'II/c' },
  { pangkat: 'Pengatur Tingkat I', golongan: 'II/d' },
  { pangkat: 'Penata Muda', golongan: 'III/a' },
  { pangkat: 'Penata Muda Tingkat I', golongan: 'III/b' },
  { pangkat: 'Penata', golongan: 'III/c' },
  { pangkat: 'Penata Tingkat I', golongan: 'III/d' },
  { pangkat: 'Pembina', golongan: 'IV/a' },
  { pangkat: 'Pembina Tingkat I', golongan: 'IV/b' },
  { pangkat: 'Pembina Utama Muda', golongan: 'IV/c' },
  { pangkat: 'Pembina Utama Madya', golongan: 'IV/d' },
  { pangkat: 'Pembina Utama', golongan: 'IV/e' }
];

export default function Penatausahaan({ 
  currentUser, 
  mails, 
  staff, 
  assets = [],
  finances = [],
  activeSubTab = 'landing',
  onSubTabChange,
  onAddMail,
  onUpdateMail,
  onAddStaff,
  onUpdateStaff,
  onDeleteMail,
  onDeleteStaff,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onAddFinance,
  onUpdateFinance,
  onDeleteFinance
}: PenatausahaanProps) {
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Reference Date for calculations (as of current system clock date)
  const referenceDate = new Date('2026-06-09');

  // 1. Data Pensiun (< 1 tahun dari usia pensiun 58 tahun)
  const pensionAlerts = staff.map(s => {
    if (!s.tanggalLahir) return null;
    const birthDate = new Date(s.tanggalLahir);
    if (isNaN(birthDate.getTime())) return null;
    
    // Retirement Date = Birth Date + 58 years
    const pensionDate = new Date(birthDate);
    pensionDate.setFullYear(birthDate.getFullYear() + 58);
    
    const diffMs = pensionDate.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return {
      staff: s,
      pensionDate,
      diffDays,
      formattedDate: s.tanggalLahir
    };
  }).filter((item): item is NonNullable<typeof item> => 
    item !== null && item.diffDays >= 0 && item.diffDays <= 365
  );

  // 2. Kenaikan Pangkat (< 1 tahun, tanggal TMT kepangkatan terakhir + 4 tahun)
  const promotionAlerts = staff.map(s => {
    let lastSkDate: Date | null = null;
    let source = '';
    
    if (s.riwayatKepangkatan && s.riwayatKepangkatan.length > 0) {
      const sorted = [...s.riwayatKepangkatan].sort((a, b) => {
        const da = new Date(a.tmt || a.tglSk);
        const db = new Date(b.tmt || b.tglSk);
        return db.getTime() - da.getTime();
      });
      const latest = sorted[0];
      if (latest.tmt || latest.tglSk) {
        lastSkDate = new Date(latest.tmt || latest.tglSk);
        source = `Pangkat Terakhir: ${latest.pangkat} (${latest.golongan})${latest.noSk ? ` - No. SK: ${latest.noSk}` : ''}`;
      }
    }
    
    // Fallback to NIP CPNS
    if (!lastSkDate) {
      const nipCompact = s.nip?.replace(/\s+/g, '') || '';
      if (nipCompact.length >= 14) {
        const cpnsYear = parseInt(nipCompact.substring(8, 12), 10);
        const cpnsMonth = parseInt(nipCompact.substring(12, 14), 10) - 1;
        if (!isNaN(cpnsYear) && !isNaN(cpnsMonth)) {
          lastSkDate = new Date(cpnsYear, cpnsMonth, 1);
          source = 'NIP CPNS (Kenaikan berkala 4 tahun)';
        }
      }
    }
    
    if (!lastSkDate) return null;
    
    let nextPromotionDate = new Date(lastSkDate);
    nextPromotionDate.setFullYear(lastSkDate.getFullYear() + 4);
    
    // Project in 4-year steps if the date is far in the past
    while (nextPromotionDate.getTime() < referenceDate.getTime() - (30 * 24 * 60 * 60 * 1000)) {
      nextPromotionDate.setFullYear(nextPromotionDate.getFullYear() + 4);
    }
    
    const diffMs = nextPromotionDate.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return {
      staff: s,
      nextPromotionDate,
      diffDays,
      source
    };
  }).filter((item): item is NonNullable<typeof item> => 
    item !== null && item.diffDays >= 0 && item.diffDays <= 365
  );

  // 3. Kenaikan Gaji Berkala (< 1 tahun, tanggal gaji berkala terakhir + 2 tahun)
  const salaryAlerts = staff.map(s => {
    let lastGajiDate: Date | null = null;
    let source = '';
    
    if (s.riwayatGaji && s.riwayatGaji.length > 0) {
      const sorted = [...s.riwayatGaji].sort((a, b) => {
        const da = new Date(a.tmtGaji || a.tglSk);
        const db = new Date(b.tmtGaji || b.tglSk);
        return db.getTime() - da.getTime();
      });
      const latest = sorted[0];
      if (latest.tmtGaji || latest.tglSk) {
        lastGajiDate = new Date(latest.tmtGaji || latest.tglSk);
        source = `KGB Terakhir${latest.noSk ? ` - No. SK: ${latest.noSk}` : ''}`;
      }
    }
    
    // Fallback to NIP CPNS
    if (!lastGajiDate) {
      const nipCompact = s.nip?.replace(/\s+/g, '') || '';
      if (nipCompact.length >= 14) {
        const cpnsYear = parseInt(nipCompact.substring(8, 12), 10);
        const cpnsMonth = parseInt(nipCompact.substring(12, 14), 10) - 1;
        if (!isNaN(cpnsYear) && !isNaN(cpnsMonth)) {
          lastGajiDate = new Date(cpnsYear, cpnsMonth, 1);
          source = 'NIP CPNS (KGB berkala 2 tahun)';
        }
      }
    }
    
    if (!lastGajiDate) return null;
    
    let nextGajiDate = new Date(lastGajiDate);
    nextGajiDate.setFullYear(lastGajiDate.getFullYear() + 2);
    
    // Project in 2-year steps
    while (nextGajiDate.getTime() < referenceDate.getTime() - (15 * 24 * 60 * 60 * 1000)) {
      nextGajiDate.setFullYear(nextGajiDate.getFullYear() + 2);
    }
    
    const diffMs = nextGajiDate.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return {
      staff: s,
      nextGajiDate,
      diffDays,
      source
    };
  }).filter((item): item is NonNullable<typeof item> => 
    item !== null && item.diffDays >= 0 && item.diffDays <= 365
  );

  const updateDraftField = (field: keyof Staff, value: any) => {
    if (editStaffDraft) {
      setEditStaffDraft({
        ...editStaffDraft,
        [field]: value
      });
    }
  };

  const syncMainPangkatWithHistory = (historyItems: any[]) => {
    if (historyItems && historyItems.length > 0) {
      const sorted = [...historyItems].sort((a, b) => {
        const da = new Date(a.tmt || a.tglSk);
        const db = new Date(b.tmt || b.tglSk);
        return db.getTime() - da.getTime();
      });
      const latest = sorted[0];
      if (latest && latest.pangkat) {
        setStaffPangkat(latest.pangkat);
        setStaffGolongan(latest.golongan);
      }
    }
  };

  const updateDraftNested = (parentField: 'riwayatOrangTua' | 'riwayatPasangan', childField: string, value: any) => {
    if (editStaffDraft) {
      const parentVal = editStaffDraft[parentField] || {};
      setEditStaffDraft({
        ...editStaffDraft,
        [parentField]: {
          ...parentVal,
          [childField]: value
        } as any
      });
    }
  };
  const [mailSubTab, setMailSubTab] = useState<'masuk' | 'keluar'>('masuk');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    if (mailSubTab === 'masuk') {
      setRecipient('UPTD PSDA Bah Bolon');
      setSender('');
      setMailStatus('Diterima');
    } else {
      setSender('UPTD PSDA Bah Bolon');
      setRecipient('');
      setMailStatus('Terkirim');
    }
  }, [mailSubTab]);
  
  // Mail Form States
  const [isMailFormOpen, setIsMailFormOpen] = useState(false);
  const [mailType, setMailType] = useState<'masuk' | 'keluar'>('masuk');
  const [refNumber, setRefNumber] = useState('');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [mailDate, setMailDate] = useState('');
  const [mailStatus, setMailStatus] = useState<'Diterima' | 'Diproses' | 'Diarsipkan' | 'Terkirim'>('Diterima');

  // Khusus Surat Masuk Baru & PDF Upload
  const [originalLetterNumber, setOriginalLetterNumber] = useState('');
  const [letterDate, setLetterDate ] = useState('');
  const [pdfFile, setPdfFile] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Preview Modal State for PDFs
  const [viewingPdfMail, setViewingPdfMail] = useState<Mail | null>(null);
  const [viewingHistoryPdf, setViewingHistoryPdf] = useState<{ file: string; name: string } | null>(null);

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Hanya diperbolehkan mengupload dokumen dengan format PDF (*.pdf).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file PDF terlalu besar. Maksimum batas ukuran adalah 8MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPdfFile(event.target.result as string);
        setPdfName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Staff Form States
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffNip, setStaffNip] = useState('');
  const [staffPosition, setStaffPosition] = useState('');
  const [staffPangkat, setStaffPangkat] = useState('');
  const [staffGolongan, setStaffGolongan] = useState('');

  // Sub-tab form states for adding items
  const [newPangkatName, setNewPangkatName] = useState('');
  const [newPangkatGolongan, setNewPangkatGolongan] = useState('');
  const [newPangkatTmt, setNewPangkatTmt] = useState('');
  const [newPangkatNoSk, setNewPangkatNoSk] = useState('');
  const [newPangkatTglSk, setNewPangkatTglSk] = useState('');

  const [newGajiTmt, setNewGajiTmt] = useState('');
  const [newGajiNominal, setNewGajiNominal] = useState(0);
  const [newGajiNoSk, setNewGajiNoSk] = useState('');
  const [newGajiTglSk, setNewGajiTglSk] = useState('');
  const [newGajiPejabat, setNewGajiPejabat] = useState('');

  const [newEduJenjang, setNewEduJenjang] = useState('S1');
  const [newEduInstitusi, setNewEduInstitusi] = useState('');
  const [newEduJurusan, setNewEduJurusan] = useState('');
  const [newEduTahun, setNewEduTahun] = useState('');
  const [newEduNoIjazah, setNewEduNoIjazah] = useState('');

  const [newAnakNama, setNewAnakNama] = useState('');
  const [newAnakTglLahir, setNewAnakTglLahir] = useState('');
  const [newAnakJkel, setNewAnakJkel] = useState('Laki-laki');
  const [newAnakStatus, setNewAnakStatus] = useState('Anak Kandung');

  // PDF uploads for staff history lists
  const [newPangkatPdfFile, setNewPangkatPdfFile] = useState('');
  const [newPangkatPdfName, setNewPangkatPdfName] = useState('');

  const [newGajiPdfFile, setNewGajiPdfFile] = useState('');
  const [newGajiPdfName, setNewGajiPdfName] = useState('');

  const [newEduPdfFile, setNewEduPdfFile] = useState('');
  const [newEduPdfName, setNewEduPdfName] = useState('');

  const [newAnakPdfFile, setNewAnakPdfFile] = useState('');
  const [newAnakPdfName, setNewAnakPdfName] = useState('');

  // Sub Sub Tab states inside Aset & Inventaris
  const [assetSubTab, setAssetSubTab] = useState<'inventaris_kib' | 'distribusi' | 'persediaan'>('inventaris_kib');
  const [activeKibFilter, setActiveKibFilter] = useState<'ALL' | 'KIB A' | 'KIB B' | 'KIB C' | 'KIB D' | 'KIB E' | 'KIB F'>('ALL');

  // Extended Asset Form States
  const [assetKibCategory, setAssetKibCategory] = useState<'KIB A' | 'KIB B' | 'KIB C' | 'KIB D' | 'KIB E' | 'KIB F'>('KIB B');
  const [assetPrice, setAssetPrice] = useState<number>(0);
  const [assetBrand, setAssetBrand] = useState<string>('');
  const [assetNotes, setAssetNotes] = useState<string>('');

  // Asset Distribution module states
  const [distributions, setDistributions] = useState<AssetDistribution[]>(() => {
    const saved = localStorage.getItem('uptd_v3_asset_distributions');
    return saved ? JSON.parse(saved) : [
      {
        id: 'dist-1',
        assetId: 'a-1',
        assetName: 'Laptop Admin HP ProBook',
        staffId: 'staff-1',
        staffName: 'Hadi Wijaya, S.T.',
        quantity: 1,
        location: 'Ruang Tata Usaha (TU)',
        status: 'dipakai',
        allocationDate: '2026-02-15',
        conditionAtAllocation: 'Baik',
        notes: 'Digunakan untuk input surat masuk dan keluar secara digital'
      },
      {
        id: 'dist-2',
        assetId: 'a-2',
        assetName: 'Alat Survey Current Meter Flowatch FL-03',
        staffId: 'staff-2',
        staffName: 'Siti Rahma, S.Kom.',
        quantity: 1,
        location: 'Gudang Lapangan UPTD',
        status: 'dipinjam',
        allocationDate: '2026-03-20',
        conditionAtAllocation: 'Baik',
        notes: 'Operational survey hidrologi dan debit aliran sub-bendung'
      }
    ];
  });

  const [isDistFormOpen, setIsDistFormOpen] = useState(false);
  const [distAssetId, setDistAssetId] = useState('');
  const [distStaffId, setDistStaffId] = useState('');
  const [distQuantity, setDistQuantity] = useState(1);
  const [distStatus, setDistStatus] = useState<'dipakai' | 'dipinjam' | 'dipulangkan'>('dipakai');
  const [distAllocationDate, setDistAllocationDate] = useState('');
  const [distCondition, setDistCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [distNotes, setDistNotes] = useState('');
  const [editingDist, setEditingDist] = useState<AssetDistribution | null>(null);

  // Consumable Supplies (Persediaan) states
  const [supplies, setSupplies] = useState<ConsumableSupply[]>(() => {
    const saved = localStorage.getItem('uptd_v3_consumables');
    return saved ? JSON.parse(saved) : [
      {
        id: 'sup-1',
        itemName: 'Kertas HVS Sinar Dunia A4 80gr',
        category: 'ATK',
        stock: 45,
        unit: 'Rim',
        minStock: 10,
        location: 'Lemari ATK Seksi TU',
        lastUpdated: '2026-06-01',
        history: [
          { id: 'h-11', date: '2026-06-01', type: 'Masuk', quantity: 50, notes: 'Pengadaan ATK Triwulan II', recordedBy: 'Admin' },
          { id: 'h-12', date: '2026-06-05', type: 'Keluar', quantity: 5, notes: 'Pembuatan Dokumen Laporan Kinerja', recordedBy: 'Admin' }
        ]
      },
      {
        id: 'sup-2',
        itemName: 'Oli Mesin Diesel SAE 40 Pompa Air 1L',
        category: 'Bahan Bakar/Oli',
        stock: 12,
        unit: 'Botol',
        minStock: 4,
        location: 'Gudang Mesin / Pintu Air Utama',
        lastUpdated: '2026-05-25',
        history: [
          { id: 'h-21', date: '2026-05-25', type: 'Masuk', quantity: 15, notes: 'Stok berkala pintu air', recordedBy: 'Admin' },
          { id: 'h-22', date: '2026-06-02', type: 'Keluar', quantity: 3, notes: 'Ganti oli mesin genset pintu regulator', recordedBy: 'Admin' }
        ]
      },
      {
        id: 'sup-3',
        itemName: 'Sapu Lidi Tebal & Alat Kebersihan Kantor',
        category: 'Alat Bersih',
        stock: 6,
        unit: 'Pcs',
        minStock: 2,
        location: 'Pos Jaga Bendung',
        lastUpdated: '2026-05-10',
        history: []
      },
      {
        id: 'sup-4',
        itemName: 'Bearing Karet Seal Gate Valve 3 Inch',
        category: 'Suku Cadang',
        stock: 8,
        unit: 'Pcs',
        minStock: 3,
        location: 'Workshop Peralatan Hidrolik',
        lastUpdated: '2026-06-04',
        history: [
          { id: 'h-41', date: '2026-06-04', type: 'Masuk', quantity: 8, notes: 'Penerimaan suku cadang pemeliharaan', recordedBy: 'Admin' }
        ]
      }
    ];
  });

  const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supCategory, setSupCategory] = useState<'ATK' | 'Bahan Bakar/Oli' | 'Alat Bersih' | 'Suku Cadang' | 'Lainnya'>('ATK');
  const [supStock, setSupStock] = useState(0);
  const [supUnit, setSupUnit] = useState('Pcs');
  const [supMinStock, setSupMinStock] = useState(1);
  const [supLocation, setSupLocation] = useState('');
  const [editingSupply, setEditingSupply] = useState<ConsumableSupply | null>(null);
  const [activeSupplyFilter, setActiveSupplyFilter] = useState<'ALL' | 'ATK' | 'Bahan Bakar/Oli' | 'Alat Bersih' | 'Suku Cadang' | 'Lainnya'>('ALL');

  // Supply adjustment states
  const [adjustingSupply, setAdjustingSupply] = useState<ConsumableSupply | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('uptd_v3_asset_distributions', JSON.stringify(distributions));
  }, [distributions]);

  useEffect(() => {
    localStorage.setItem('uptd_v3_consumables', JSON.stringify(supplies));
  }, [supplies]);

  // Finance sub-tab state (Nomor Rekening vs Kode Rekening Kegiatan vs SPJ Rutin vs BAPP)
  const [financeSubTab, setFinanceSubTab] = useState<'rekening' | 'rekening_kegiatan' | 'spj_rutin' | 'bapp'>('rekening_kegiatan');

  // Activity Accounts list state
  const [activityAccounts, setActivityAccounts] = useState<ActivityAccount[]>(() => {
    const saved = localStorage.getItem('uptd_v3_activity_accounts');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'act-1',
        code: '5.1.02.01.01.0024',
        name: 'Belanja Alat Tulis Kantor (ATK)',
        programName: 'Program Penunjang Urusan Pemerintahan Daerah Provinsi',
        activityName: 'Penyediaan Jasa Penunjang Urusan Pemerintahan Daerah',
        allocation: 35000000,
        description: 'Untuk pembelian kertas HVS, tinta printer, map, pulpen, stempel, dan perlengkapan administrasi dinas.',
        status: 'Aktif'
      },
      {
        id: 'act-2',
        code: '5.1.02.04.01.0001',
        name: 'Belanja Perjalanan Dinas Rutin',
        programName: 'Program Penunjang Urusan Pemerintahan Daerah Provinsi',
        activityName: 'Penyediaan Jasa Penunjang Urusan Pemerintahan Daerah',
        allocation: 75000000,
        description: 'Perjalanan dinas dalam daerah dan luar daerah untuk koordinasi kegiatan pengelolaan bendung dan irigasi.',
        status: 'Aktif'
      },
      {
        id: 'act-3',
        code: '5.2.02.05.01.0005',
        name: 'Belanja Pemeliharaan Sarana dan Prasarana Bendung',
        programName: 'Program Pengelolaan Sumber Daya Air (SDA)',
        activityName: 'Operasi dan Pemeliharaan Jaringan Irigasi dan Sungai',
        allocation: 120000000,
        description: 'Biaya perbaikan pintu air, pembersihan sedimen lumpur, dan pemeliharaan alat ukur TMA.',
        status: 'Aktif'
      },
      {
        id: 'act-4',
        code: '5.1.02.02.01.0011',
        name: 'Belanja Air, Listrik, dan Jasa Internet',
        programName: 'Program Penunjang Urusan Pemerintahan Daerah Provinsi',
        activityName: 'Penyediaan Jasa Komunikasi, Sumber Daya Air dan Listrik',
        allocation: 24000000,
        description: 'Pembayaran rekening listrik kantor UPTD, tagihan PDAM, dan internet kecepatan tinggi untuk e-government.',
        status: 'Aktif'
      }
    ];
  });

  // Sync Activity Accounts
  useEffect(() => {
    localStorage.setItem('uptd_v3_activity_accounts', JSON.stringify(activityAccounts));
  }, [activityAccounts]);

  // Activity Account Form States
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [activityCode, setActivityCode] = useState('');
  const [activityName, setActivityName] = useState('');
  const [activityProgram, setActivityProgram] = useState('');
  const [activityActName, setActivityActName] = useState('');
  const [activityAllocation, setActivityAllocation] = useState(0);
  const [activityDescription, setActivityDescription] = useState('');
  const [activityStatus, setActivityStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [editingActivityAccount, setEditingActivityAccount] = useState<ActivityAccount | null>(null);

  // SPJ Rutin states
  const [spjDocuments, setSpjDocuments] = useState<SpjDocument[]>(() => {
    const saved = localStorage.getItem('uptd_v3_spj');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'spj-1',
        number: '056/SPJ-RUTIN/UPTD/V/2026',
        date: '2026-05-12',
        description: 'Pertanggungjawaban Belanja Alat Tulis Kantor (ATK) bulan April-Mei',
        activityCode: '5.1.02.01.01.0024',
        amount: 4500000,
        recipient: 'Toko ATK Berkah Mandiri',
        status: 'Disetujui'
      },
      {
        id: 'spj-2',
        number: '057/SPJ-RUTIN/UPTD/V/2026',
        date: '2026-05-20',
        description: 'SPJ Perjalanan Dinas Rutin dalam Rangka Koordinasi Bendung Way Rarem',
        activityCode: '5.1.02.04.01.0001',
        amount: 3200000,
        recipient: 'Tim Teknis OP UPTD',
        status: 'Diverifikasi'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('uptd_v3_spj', JSON.stringify(spjDocuments));
  }, [spjDocuments]);

  // SPJ Form states
  const [isSpjFormOpen, setIsSpjFormOpen] = useState(false);
  const [spjNumber, setSpjNumber] = useState('');
  const [spjDate, setSpjDate] = useState('');
  const [spjDescription, setSpjDescription] = useState('');
  const [spjActivityCode, setSpjActivityCode] = useState('');
  const [spjAmount, setSpjAmount] = useState(0);
  const [spjRecipient, setSpjRecipient] = useState('');
  const [spjStatus, setSpjStatus] = useState<SpjDocument['status']>('Draft');
  const [editingSpj, setEditingSpj] = useState<SpjDocument | null>(null);

  // BAPP states
  const [bappDocuments, setBappDocuments] = useState<BappDocument[]>(() => {
    const saved = localStorage.getItem('uptd_v3_bapp');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('uptd_v3_bapp', JSON.stringify(bappDocuments));
  }, [bappDocuments]);

  // BAPP sub-tab controller (Berkas BAPP vs Data Kontrak)
  const [bappSubTab, setBappSubTab] = useState<'berkas_bapp' | 'data_kontrak'>('data_kontrak');

  // Contract list state
  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('uptd_v3_contracts');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('uptd_v3_contracts', JSON.stringify(contracts));
  }, [contracts]);

  // Contract form states
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [contractNumber, setContractNumber] = useState('');
  const [contractRawDate, setContractRawDate] = useState('');
  const [contractProjectName, setContractProjectName] = useState('');
  
  // New user-requested fields
  const [contractAccountCode, setContractAccountCode] = useState('');
  const [contractSppbjNumber, setContractSppbjNumber] = useState('');
  const [contractSppbjRawDate, setContractSppbjRawDate] = useState('');
  const [contractSpmkNumber, setContractSpmkNumber] = useState('');
  const [contractSpmkRawDate, setContractSpmkRawDate] = useState('');
  const [contractSplNumber, setContractSplNumber] = useState('');
  const [contractSplRawDate, setContractSplRawDate] = useState('');
  const [contractDuration, setContractDuration] = useState('');

  // Additional detail states
  const [contractAddendums, setContractAddendums] = useState<{ id: string; number: string; date: string; description?: string; amount?: number; duration?: string; }[]>([]);
  const [contractClosingNumber, setContractClosingNumber] = useState('');
  const [contractClosingDate, setContractClosingDate] = useState('');
  const [contractClosingNotes, setContractClosingNotes] = useState('');

  // Pejabat details
  const [pejabatPPK, setPejabatPPK] = useState('');
  const [nipPPK, setNipPPK] = useState('');
  const [pejabatPPTK, setPejabatPPTK] = useState('');
  const [nipPPTK, setNipPPTK] = useState('');
  const [pejabatPengawas, setPejabatPengawas] = useState('');
  const [nipPengawas, setNipPengawas] = useState('');

  // Rekanan details
  const [rekananDirektur, setRekananDirektur] = useState('');
  const [rekananJabatan, setRekananJabatan] = useState('');
  const [rekananNpwp, setRekananNpwp] = useState('');
  const [rekananAddress, setRekananAddress] = useState('');
  const [rekananBankName, setRekananBankName] = useState('');
  const [rekananBankAccount, setRekananBankAccount] = useState('');
  const [rekananBankBranch, setRekananBankBranch] = useState('');

  // Temporary inputs for creating a new addendum item
  const [tempAddendumNumber, setTempAddendumNumber] = useState('');
  const [tempAddendumDate, setTempAddendumDate] = useState('');
  const [tempAddendumDescription, setTempAddendumDescription] = useState('');
  const [tempAddendumAmount, setTempAddendumAmount] = useState<number>(0);
  const [tempAddendumDuration, setTempAddendumDuration] = useState('');

  const [contractorName, setContractorName] = useState('');
  const [contractAmount, setContractAmount] = useState(0);
  const [contractRawStartDate, setContractRawStartDate] = useState('');
  const [contractRawEndDate, setContractRawEndDate] = useState('');
  const [contractType, setContractType] = useState<'Pembangunan' | 'Pemeliharaan' | 'Rehabilitasi' | 'Lainnya'>('Pembangunan');
  const [contractStatus, setContractStatus] = useState<Contract['status']>('Aktif');
  const [contractNotes, setContractNotes] = useState('');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [activeContractTab, setActiveContractTab] = useState<'utama' | 'addendum' | 'pejabat' | 'rekanan'>('utama');

  // List of active projects from Pembangunan & Operasional
  const [pembangunanProjects, setPembangunanProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('uptd_v3_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [operasionalProjects, setOperasionalProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('uptd_v3_projects_operasional');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (isContractFormOpen) {
      const savedPembangunan = localStorage.getItem('uptd_v3_projects');
      if (savedPembangunan) {
        setPembangunanProjects(JSON.parse(savedPembangunan));
      }
      const savedOperasional = localStorage.getItem('uptd_v3_projects_operasional');
      if (savedOperasional) {
        setOperasionalProjects(JSON.parse(savedOperasional));
      }
    }
  }, [isContractFormOpen]);

  const isProjectInList = (name: string) => {
    if (!name || name === '__custom__') return false;
    const inPembangunan = pembangunanProjects.some(p => p.name === name);
    const inOperasional = operasionalProjects.some(p => p.name === name);
    return inPembangunan || inOperasional;
  };

  const handleSelectProject = (val: string) => {
    if (val === '__custom__') {
      setContractProjectName('__custom__');
      return;
    }
    if (!val) {
      setContractProjectName('');
      return;
    }

    setContractProjectName(val);

    // Find project in pembangunan or operasional
    const allProjs = [
      ...pembangunanProjects.map(p => ({ ...p, section: 'Pembangunan' })),
      ...operasionalProjects.map(p => ({ ...p, section: 'Operasional' }))
    ];
    const selectedProj = allProjs.find(p => p.name === val);

    if (selectedProj) {
      if (selectedProj.contractor) {
        setContractorName(selectedProj.contractor);
      }
      if (selectedProj.budget) {
        setContractAmount(selectedProj.budget);
      }
      if (selectedProj.startDate) {
        setContractRawStartDate(ymdToDmy(selectedProj.startDate));
      }
      if (selectedProj.endDate) {
        setContractRawEndDate(ymdToDmy(selectedProj.endDate));
      }
      // Set type based on section
      if (selectedProj.section === 'Pembangunan') {
        setContractType('Pembangunan');
      } else if (selectedProj.section === 'Operasional') {
        setContractType('Pemeliharaan');
      }
    }
  };

  const handleSelectActivityAccount = (val: string) => {
    if (!val) {
      setContractProjectName('');
      setContractAccountCode('');
      return;
    }
    const found = activityAccounts.find(act => (act.description || act.name) === val || act.code === val);
    if (found) {
      setContractProjectName(found.description || found.name);
      setContractAccountCode(found.code);
    } else {
      setContractProjectName(val);
    }
  };

  // Handlers for Contract
  const handleContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractProjectName) {
      setActiveContractTab('utama');
      alert('Nama Pekerjaan wajib diisi.');
      return;
    }
    if (!contractNumber) {
      setActiveContractTab('utama');
      alert('Nomor Kontrak wajib diisi.');
      return;
    }
    if (!contractRawDate) {
      setActiveContractTab('utama');
      alert('Tanggal Kontrak wajib diisi.');
      return;
    }
    if (!contractDuration) {
      setActiveContractTab('utama');
      alert('Jangka Waktu Pelaksanaan wajib diisi.');
      return;
    }
    if (!contractorName) {
      setActiveContractTab('rekanan');
      alert('Nama Rekanan / Perusahaan wajib diisi pada tab Data Rekanan.');
      return;
    }
    if (!contractAmount || contractAmount <= 0) {
      setActiveContractTab('utama');
      alert('Nilai Kontrak (Rupiah) wajib diisi dengan nilai lebih dari 0 pada tab Data Utama.');
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(contractRawDate)) {
      setActiveContractTab('utama');
      alert('Format tanggal Kontrak salah. Silakan masukkan format dd/mm/yyyy (contoh: 25/05/2026)');
      return;
    }

    if (contractSppbjRawDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(contractSppbjRawDate)) {
      setActiveContractTab('utama');
      alert('Format tanggal SPPBJ salah. Silakan gunakan format dd/mm/yyyy atau kosongkan.');
      return;
    }

    if (contractSpmkRawDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(contractSpmkRawDate)) {
      setActiveContractTab('utama');
      alert('Format tanggal SPMK salah. Silakan gunakan format dd/mm/yyyy atau kosongkan.');
      return;
    }

    if (contractSplRawDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(contractSplRawDate)) {
      setActiveContractTab('utama');
      alert('Format tanggal SPL salah. Silakan gunakan format dd/mm/yyyy atau kosongkan.');
      return;
    }

    if (contractClosingDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(contractClosingDate)) {
      setActiveContractTab('addendum');
      alert('Format tanggal Kontrak Penutup salah. Silakan gunakan format dd/mm/yyyy atau kosongkan.');
      return;
    }

    // Duplicate contract number or project name validation to avoid double records
    const isDuplicateNumber = contracts.some(c => 
      (!editingContract || c.id !== editingContract.id) &&
      c.contractNumber.trim().toLowerCase() === contractNumber.trim().toLowerCase()
    );

    if (isDuplicateNumber) {
      setActiveContractTab('utama');
      alert(`Nomor Kontrak "${contractNumber}" sudah terdaftar dalam sistem. Silakan gunakan Nomor Kontrak lain untuk menghindari data ganda.`);
      return;
    }

    const isDuplicateName = contracts.some(c => 
      (!editingContract || c.id !== editingContract.id) &&
      c.projectName.trim().toLowerCase() === contractProjectName.trim().toLowerCase()
    );

    if (isDuplicateName) {
      setActiveContractTab('utama');
      alert(`Nama Pekerjaan "${contractProjectName}" sudah terdaftar dalam sistem. Silakan gunakan Nama Pekerjaan lain untuk menghindari data ganda.`);
      return;
    }

    const standardDate = dmyToYmd(contractRawDate);
    const standardSppbjDate = contractSppbjRawDate ? dmyToYmd(contractSppbjRawDate) : '';
    const standardSpmkDate = contractSpmkRawDate ? dmyToYmd(contractSpmkRawDate) : '';
    const standardSplDate = contractSplRawDate ? dmyToYmd(contractSplRawDate) : '';
    const standardClosingDate = contractClosingDate ? dmyToYmd(contractClosingDate) : '';

    if (editingContract) {
      const updated = contracts.map(c => c.id === editingContract.id ? {
        ...c,
        projectName: contractProjectName,
        accountCode: contractAccountCode,
        contractNumber,
        contractDate: standardDate,
        sppbjNumber: contractSppbjNumber,
        sppbjDate: standardSppbjDate,
        spmkNumber: contractSpmkNumber,
        spmkDate: standardSpmkDate,
        splNumber: contractSplNumber,
        splDate: standardSplDate,
        duration: contractDuration,
        // safe fallbacks for optional original fields to avoid crashing
        contractorName: contractorName || '-',
        amount: Number(contractAmount) || 0,
        startDate: standardDate,
        endDate: standardDate,
        status: contractStatus,
        notes: contractNotes,

        // new dynamic properties
        addendums: contractAddendums,
        closingContractNumber: contractClosingNumber,
        closingContractDate: standardClosingDate,
        closingClosingNotes: contractClosingNotes,
        pejabatPPK,
        nipPPK,
        pejabatPPTK,
        nipPPTK,
        pejabatPengawas,
        nipPengawas,
        rekananDirektur,
        rekananJabatan,
        rekananNpwp,
        rekananAddress,
        rekananBankName,
        rekananBankAccount,
        rekananBankBranch
      } : c);
      setContracts(updated);
      setEditingContract(null);
    } else {
      const newContract: Contract = {
        id: 'ctr-' + Date.now(),
        projectName: contractProjectName,
        accountCode: contractAccountCode,
        contractNumber,
        contractDate: standardDate,
        sppbjNumber: contractSppbjNumber,
        sppbjDate: standardSppbjDate,
        spmkNumber: contractSpmkNumber,
        spmkDate: standardSpmkDate,
        splNumber: contractSplNumber,
        splDate: standardSplDate,
        duration: contractDuration,
        // safe fallbacks for optional original fields to avoid crashing
        contractorName: contractorName || '-',
        amount: Number(contractAmount) || 0,
        startDate: standardDate,
        endDate: standardDate,
        status: contractStatus,
        notes: contractNotes,

        // new dynamic properties
        addendums: contractAddendums,
        closingContractNumber: contractClosingNumber,
        closingContractDate: standardClosingDate,
        closingClosingNotes: contractClosingNotes,
        pejabatPPK,
        nipPPK,
        pejabatPPTK,
        nipPPTK,
        pejabatPengawas,
        nipPengawas,
        rekananDirektur,
        rekananJabatan,
        rekananNpwp,
        rekananAddress,
        rekananBankName,
        rekananBankAccount,
        rekananBankBranch
      };
      setContracts([newContract, ...contracts]);
    }

    setIsContractFormOpen(false);
  };

  const handleStartEditContract = (c: Contract) => {
    setEditingContract(c);
    setContractProjectName(c.projectName);
    setContractAccountCode(c.accountCode || '');
    setContractNumber(c.contractNumber);
    setContractRawDate(ymdToDmy(c.contractDate));
    setContractSppbjNumber(c.sppbjNumber || '');
    setContractSppbjRawDate(c.sppbjDate ? ymdToDmy(c.sppbjDate) : '');
    setContractSpmkNumber(c.spmkNumber || '');
    setContractSpmkRawDate(c.spmkDate ? ymdToDmy(c.spmkDate) : '');
    setContractSplNumber(c.splNumber || '');
    setContractSplRawDate(c.splDate ? ymdToDmy(c.splDate) : '');
    setContractDuration(c.duration || '');

    setContractorName(c.contractorName || '');
    setContractAmount(c.amount || 0);
    setContractRawStartDate(c.startDate ? ymdToDmy(c.startDate) : '');
    setContractRawEndDate(c.endDate ? ymdToDmy(c.endDate) : '');
    setContractType('Pembangunan');
    setContractStatus(c.status || 'Aktif');
    setContractNotes(c.notes || '');

    // Set additional ones
    setContractAddendums(c.addendums || []);
    setContractClosingNumber(c.closingContractNumber || '');
    setContractClosingDate(c.closingContractDate ? ymdToDmy(c.closingContractDate) : '');
    setContractClosingNotes(c.closingClosingNotes || '');
    setPejabatPPK(c.pejabatPPK || '');
    setNipPPK(c.nipPPK || '');
    setPejabatPPTK(c.pejabatPPTK || '');
    setNipPPTK(c.nipPPTK || '');
    setPejabatPengawas(c.pejabatPengawas || '');
    setNipPengawas(c.nipPengawas || '');
    setRekananDirektur(c.rekananDirektur || '');
    setRekananJabatan(c.rekananJabatan || '');
    setRekananNpwp(c.rekananNpwp || '');
    setRekananAddress(c.rekananAddress || '');
    setRekananBankName(c.rekananBankName || '');
    setRekananBankAccount(c.rekananBankAccount || '');
    setRekananBankBranch(c.rekananBankBranch || '');

    setActiveContractTab('utama');
    setIsContractFormOpen(true);
  };

  const handleDeleteContract = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data kontrak ini?')) {
      setContracts(contracts.filter(c => c.id !== id));
    }
  };

  const handleAddAddendumToList = () => {
    if (!tempAddendumNumber) {
      alert('Nomor Addendum wajib diisi.');
      return;
    }
    if (!tempAddendumDate) {
      alert('Tanggal Addendum wajib diisi.');
      return;
    }
    const newItem = {
      id: 'add-' + Date.now(),
      number: tempAddendumNumber,
      date: tempAddendumDate,
      description: tempAddendumDescription || '',
      amount: Number(tempAddendumAmount) || 0,
      duration: tempAddendumDuration || ''
    };
    setContractAddendums([...contractAddendums, newItem]);
    setTempAddendumNumber('');
    setTempAddendumDate('');
    setTempAddendumDescription('');
    setTempAddendumAmount(0);
    setTempAddendumDuration('');
  };

  const handleRemoveAddendumFromList = (id: string) => {
    setContractAddendums(contractAddendums.filter(item => item.id !== id));
  };


  // BAPP Form states
  const [isBappFormOpen, setIsBappFormOpen] = useState(false);
  const [bappNumber, setBappNumber] = useState('');
  const [bappDate, setBappDate] = useState('');
  const [bappProjectName, setBappProjectName] = useState('');
  const [bappContractor, setBappContractor] = useState('');
  const [bappAmount, setBappAmount] = useState(0);
  const [bappProgress, setBappProgress] = useState(0);
  const [bappTerms, setBappTerms] = useState('');
  const [bappVerifiedBy, setBappVerifiedBy] = useState('');
  const [bappStatus, setBappStatus] = useState<BappDocument['status']>('Draft');
  const [editingBapp, setEditingBapp] = useState<BappDocument | null>(null);

  // Bank Accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Bank Form States
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountType, setBankAccountType] = useState('');
  const [bankAccountDescription, setBankAccountDescription] = useState('');
  const [bankAccountStatus, setBankAccountStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);

  // Sync Bank Accounts
  useEffect(() => {
    localStorage.setItem('uptd_v3_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  // Asset Form States
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [assetCondition, setAssetCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [assetLocation, setAssetLocation] = useState('');
  const [assetQuantity, setAssetQuantity] = useState(1);
  const [assetDate, setAssetDate] = useState('');

  // Finance Form States
  const [isFinanceFormOpen, setIsFinanceFormOpen] = useState(false);
  const [financeDate, setFinanceDate] = useState('');
  const [financeDescription, setFinanceDescription] = useState('');
  const [financeAmount, setFinanceAmount] = useState(0);
  const [financeType, setFinanceType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [financeCategory, setFinanceCategory] = useState('Anggaran Rutin');

  // Editing individual item states for CRUD updates
  const [editingMail, setEditingMail] = useState<Mail | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editStaffDraft, setEditStaffDraft] = useState<Staff | null>(null);
  const [editModalTab, setEditModalTab] = useState<'biodata' | 'pangkat' | 'gaji' | 'pendidikan' | 'ortu' | 'pasangan' | 'anak'>('biodata');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingFinance, setEditingFinance] = useState<FinanceTransaction | null>(null);

  const handleStartEditMail = (mail: Mail) => {
    setEditingMail(mail);
    setRefNumber(mail.referenceNumber);
    setSender(mail.sender);
    setRecipient(mail.recipient);
    setSubject(mail.subject);
    setMailDate(mail.date);
    setMailStatus(mail.status);
    setOriginalLetterNumber(mail.originalLetterNumber || '');
    setLetterDate(mail.letterDate || '');
    setPdfFile(mail.pdfFile || '');
    setPdfName(mail.pdfName || '');
    setIsMailFormOpen(true);
  };

  const handleStartEditStaff = (person: Staff) => {
    setEditingStaff(person);
    setEditStaffDraft({
      ...person,
      photo: person.photo || '',
      tempatLahir: person.tempatLahir || '',
      tanggalLahir: person.tanggalLahir || '',
      jenisKelamin: person.jenisKelamin || 'Laki-laki',
      agama: person.agama || 'Islam',
      telepon: person.telepon || '',
      email: person.email || '',
      alamat: person.alamat || '',
      riwayatKepangkatan: person.riwayatKepangkatan || [],
      riwayatGaji: person.riwayatGaji || [],
      riwayatPendidikan: person.riwayatPendidikan || [],
      riwayatOrangTua: person.riwayatOrangTua || { namaAyah: '', pekerjaanAyah: '', namaIbu: '', pekerjaanIbu: '' },
      riwayatPasangan: person.riwayatPasangan || { namaPasangan: '', pekerjaan: '', tanggalLahir: '', tanggalNikah: '', statusPasangan: 'Istri' },
      riwayatAnak: person.riwayatAnak || []
    });
    setEditModalTab('biodata');
    setStaffName(person.name);
    setStaffNip(person.nip);
    setStaffPosition(person.position);
    setStaffPangkat(person.pangkat);
    setStaffGolongan(person.golongan);
    setIsStaffFormOpen(true);
  };

  const handleStartEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetName(asset.name);
    setAssetCode(asset.code);
    setAssetCondition(asset.condition);
    setAssetLocation(asset.location);
    setAssetQuantity(asset.quantity);
    setAssetDate(asset.purchaseDate);
    setAssetKibCategory(asset.kibCategory || 'KIB B');
    setAssetPrice(asset.price || 0);
    setAssetBrand(asset.brand || '');
    setAssetNotes(asset.notes || '');
    setIsAssetFormOpen(true);
  };

  const handleStartEditFinance = (trans: FinanceTransaction) => {
    setEditingFinance(trans);
    setFinanceDate(trans.date);
    setFinanceDescription(trans.description);
    setFinanceAmount(trans.amount);
    setFinanceType(trans.type);
    setFinanceCategory(trans.category);
    setIsFinanceFormOpen(true);
  };

   const userSections = currentUser.section ? currentUser.section.split(',') : [];

  const isSubTabAllowed = (subTab: string) => {
    const isAdmin = currentUser.role === 'admin' || userSections.includes('all');
    const isPimpinan = userSections.includes('pimpinan');
    if (isAdmin || isPimpinan) return true;
    if (subTab === 'adm_umum' || subTab === 'personalia' || subTab === 'aset_inventaris' || subTab === 'keuangan') {
      return true;
    }
    return false;
  };

  const canWrite = currentUser.role === 'admin' || userSections.includes('all') || userSections.includes('penatausahaan');

  // Customized Hak Akses
  const canWriteAdmUmum = currentUser.role === 'admin' || userSections.includes('all') || userSections.includes('adm_umum') || userSections.includes('penatausahaan');
  
  const canCreateStaff = currentUser.role === 'admin' || userSections.includes('all') || userSections.includes('personalia');
  
  const canEditThisStaff = (personNip?: string) => {
    if (currentUser.role === 'admin' || userSections.includes('all') || userSections.includes('personalia')) {
      return true;
    }
    if (userSections.includes('staff') && personNip) {
      const cleanUsername = currentUser.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanNip = personNip.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanUsername === cleanNip && cleanUsername.length > 0;
    }
    return false;
  };

  const canDeleteThisStaff = () => {
    return currentUser.role === 'admin' || userSections.includes('all') || userSections.includes('personalia');
  };

  const showStaffActionsColumn = currentUser.role === 'admin' || userSections.includes('all') || userSections.includes('staff') || userSections.includes('personalia');

  const canWriteAset = currentUser.role === 'admin' || userSections.includes('all') || userSections.includes('aset');
  
  const canWriteKeuangan = currentUser.role === 'admin' || userSections.includes('all') || userSections.includes('keuangan');

  // Bank Account Handlers
  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses seksi keuangan untuk mengelola kode rekening!');
      return;
    }
    if (!bankName || !bankAccountNumber || !bankAccountHolder || !bankAccountType) {
      alert('Semua baris input wajib diisi.');
      return;
    }

    if (editingBankAccount) {
      // Edit mode
      const updated = bankAccounts.map(b => b.id === editingBankAccount.id ? {
        ...b,
        bankName,
        accountNumber: bankAccountNumber,
        accountHolder: bankAccountHolder,
        type: bankAccountType,
        description: bankAccountDescription,
        status: bankAccountStatus
      } as BankAccount : b);
      setBankAccounts(updated);
      setEditingBankAccount(null);
    } else {
      // Add mode
      const newAcc: BankAccount = {
        id: 'acc-' + Date.now(),
        bankName,
        accountNumber: bankAccountNumber,
        accountHolder: bankAccountHolder,
        type: bankAccountType,
        description: bankAccountDescription,
        status: bankAccountStatus
      };
      setBankAccounts([newAcc, ...bankAccounts]);
    }

    // Reset Form
    setIsBankFormOpen(false);
    setBankName('');
    setBankAccountNumber('');
    setBankAccountHolder('');
    setBankAccountType('');
    setBankAccountDescription('');
    setBankAccountStatus('Aktif');
  };

  const handleStartEditBankAccount = (b: BankAccount) => {
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses seksi keuangan untuk mengubah kode rekening!');
      return;
    }
    setEditingBankAccount(b);
    setBankName(b.bankName);
    setBankAccountNumber(b.accountNumber);
    setBankAccountHolder(b.accountHolder);
    setBankAccountType(b.type);
    setBankAccountDescription(b.description || '');
    setBankAccountStatus(b.status);
    setIsBankFormOpen(true);
  };

  const handleDeleteBankAccount = (id: string) => {
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses seksi keuangan untuk menghapus kode rekening!');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus kode rekening ini?')) {
      const updated = bankAccounts.filter(b => b.id !== id);
      setBankAccounts(updated);
    }
  };

  // Activity Account Handlers
  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses seksi keuangan untuk mengelola kode rekening kegiatan!');
      return;
    }
    if (!activityCode || !activityName || !activityProgram || !activityActName) {
      alert('Kolom bertanda bintang (*) wajib diisi.');
      return;
    }

    if (editingActivityAccount) {
      // Edit mode
      const updated = activityAccounts.map(a => a.id === editingActivityAccount.id ? {
        ...a,
        code: activityCode,
        name: activityName,
        programName: activityProgram,
        activityName: activityActName,
        allocation: activityAllocation,
        description: activityDescription,
        status: activityStatus
      } as ActivityAccount : a);
      setActivityAccounts(updated);
      setEditingActivityAccount(null);
    } else {
      // Add mode
      const newAct: ActivityAccount = {
        id: 'act-' + Date.now(),
        code: activityCode,
        name: activityName,
        programName: activityProgram,
        activityName: activityActName,
        allocation: activityAllocation,
        description: activityDescription,
        status: activityStatus
      };
      setActivityAccounts([newAct, ...activityAccounts]);
    }

    // Reset Form
    setIsActivityFormOpen(false);
    setActivityCode('');
    setActivityName('');
    setActivityProgram('');
    setActivityActName('');
    setActivityAllocation(0);
    setActivityDescription('');
    setActivityStatus('Aktif');
  };

  const handleStartEditActivityAccount = (a: ActivityAccount) => {
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses seksi keuangan untuk mengubah kode rekening kegiatan!');
      return;
    }
    setEditingActivityAccount(a);
    setActivityCode(a.code);
    setActivityName(a.name);
    setActivityProgram(a.programName);
    setActivityActName(a.activityName);
    setActivityAllocation(a.allocation);
    setActivityDescription(a.description || '');
    setActivityStatus(a.status);
    setIsActivityFormOpen(true);
  };

  const handleDeleteActivityAccount = (id: string) => {
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses seksi keuangan untuk menghapus kode rekening kegiatan!');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus kode rekening kegiatan ini?')) {
      const updated = activityAccounts.filter(a => a.id !== id);
      setActivityAccounts(updated);
    }
  };

  const handleSpjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses seksi keuangan!');
      return;
    }
    if (!spjNumber || !spjDate || !spjDescription || !spjActivityCode || spjAmount <= 0) {
      alert('Semua baris input SPJ wajib diisi dengan benar.');
      return;
    }

    if (editingSpj) {
      const updated = spjDocuments.map(s => s.id === editingSpj.id ? {
        ...s,
        number: spjNumber,
        date: spjDate,
        description: spjDescription,
        activityCode: spjActivityCode,
        amount: spjAmount,
        recipient: spjRecipient,
        status: spjStatus
      } as SpjDocument : s);
      setSpjDocuments(updated);
      setEditingSpj(null);
    } else {
      const newSpj: SpjDocument = {
        id: 'spj-' + Date.now(),
        number: spjNumber,
        date: spjDate,
        description: spjDescription,
        activityCode: spjActivityCode,
        amount: spjAmount,
        recipient: spjRecipient,
        status: spjStatus
      };
      setSpjDocuments([newSpj, ...spjDocuments]);
    }

    setIsSpjFormOpen(false);
    setSpjNumber('');
    setSpjDate('');
    setSpjDescription('');
    setSpjActivityCode('');
    setSpjAmount(0);
    setSpjRecipient('');
    setSpjStatus('Draft');
  };

  const handleStartEditSpj = (s: SpjDocument) => {
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses!');
      return;
    }
    setEditingSpj(s);
    setSpjNumber(s.number);
    setSpjDate(s.date);
    setSpjDescription(s.description);
    setSpjActivityCode(s.activityCode);
    setSpjAmount(s.amount);
    setSpjRecipient(s.recipient);
    setSpjStatus(s.status);
    setIsSpjFormOpen(true);
  };

  const handleDeleteSpj = (id: string) => {
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses!');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus SPJ ini?')) {
      setSpjDocuments(spjDocuments.filter(s => s.id !== id));
    }
  };

  const handleBappSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses seksi keuangan!');
      return;
    }
    if (!bappNumber || !bappDate || !bappProjectName || !bappContractor || bappAmount <= 0) {
      alert('Semua baris input BAPP wajib diisi dengan benar.');
      return;
    }

    if (editingBapp) {
      const updated = bappDocuments.map(b => b.id === editingBapp.id ? {
        ...b,
        number: bappNumber,
        date: bappDate,
        projectName: bappProjectName,
        contractor: bappContractor,
        amount: bappAmount,
        progress: bappProgress,
        terms: bappTerms,
        verifiedBy: bappVerifiedBy,
        status: bappStatus
      } as BappDocument : b);
      setBappDocuments(updated);
      setEditingBapp(null);
    } else {
      const newBapp: BappDocument = {
        id: 'bapp-' + Date.now(),
        number: bappNumber,
        date: bappDate,
        projectName: bappProjectName,
        contractor: bappContractor,
        amount: bappAmount,
        progress: bappProgress,
        terms: bappTerms,
        verifiedBy: bappVerifiedBy,
        status: bappStatus
      };
      setBappDocuments([newBapp, ...bappDocuments]);
    }

    setIsBappFormOpen(false);
    setBappNumber('');
    setBappDate('');
    setBappProjectName('');
    setBappContractor('');
    setBappAmount(0);
    setBappProgress(0);
    setBappTerms('');
    setBappVerifiedBy('');
    setBappStatus('Draft');
  };

  const handleStartEditBapp = (b: BappDocument) => {
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses!');
      return;
    }
    setEditingBapp(b);
    setBappNumber(b.number);
    setBappDate(b.date);
    setBappProjectName(b.projectName);
    setBappContractor(b.contractor);
    setBappAmount(b.amount);
    setBappProgress(b.progress);
    setBappTerms(b.terms);
    setBappVerifiedBy(b.verifiedBy);
    setBappStatus(b.status);
    setIsBappFormOpen(true);
  };

  const handleDeleteBapp = (id: string) => {
    if (!canWriteKeuangan) {
      alert('Anda tidak memiliki hak akses!');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus BAPP ini?')) {
      setBappDocuments(bappDocuments.filter(b => b.id !== id));
    }
  };

  const handleMailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber || !sender || !recipient || !subject || !mailDate) {
      alert('Semua baris input surat wajib diisi.');
      return;
    }

    if (mailSubTab === 'masuk') {
      if (!originalLetterNumber || !letterDate) {
        alert('Nomor surat asli dan tanggal surat pengirim wajib diisi untuk kategori Surat Masuk.');
        return;
      }
    }

    if (editingMail) {
      const updated: Mail = {
        ...editingMail,
        type: mailSubTab,
        referenceNumber: refNumber,
        sender,
        recipient,
        subject,
        date: mailDate,
        status: mailStatus,
        originalLetterNumber: mailSubTab === 'masuk' ? originalLetterNumber : undefined,
        letterDate: mailSubTab === 'masuk' ? letterDate : undefined,
        pdfFile: pdfFile || undefined,
        pdfName: pdfName || undefined
      };
      onUpdateMail(updated);
      setEditingMail(null);
    } else {
      const newMail: Mail = {
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: mailSubTab,
        referenceNumber: refNumber,
        sender,
        recipient,
        subject,
        date: mailDate,
        status: mailStatus,
        originalLetterNumber: mailSubTab === 'masuk' ? originalLetterNumber : undefined,
        letterDate: mailSubTab === 'masuk' ? letterDate : undefined,
        pdfFile: pdfFile || undefined,
        pdfName: pdfName || undefined
      };
      onAddMail(newMail);
    }
    
    setIsMailFormOpen(false);
    
    // Reset form
    setRefNumber('');
    setSender('');
    setRecipient('');
    setSubject('');
    setMailDate('');
    setOriginalLetterNumber('');
    setLetterDate('');
    setPdfFile('');
    setPdfName('');
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffNip || !staffPosition || !staffPangkat || !staffGolongan) {
      alert('Semua baris data pegawai wajib diisi.');
      return;
    }

    if (editingStaff) {
      if (!canEditThisStaff(editingStaff.nip)) {
        alert('Maaf, Anda tidak memiliki hak akses untuk mengubah data pegawai ini.');
        return;
      }
      const updated: Staff = {
        ...editingStaff,
        ...(editStaffDraft || {}),
        name: staffName,
        nip: staffNip,
        pangkat: staffPangkat,
        golongan: staffGolongan,
        position: staffPosition
      };
      onUpdateStaff(updated);
      setEditingStaff(null);
      setEditStaffDraft(null);
    } else {
      if (!canCreateStaff) {
        alert('Maaf, Anda tidak memiliki hak akses untuk menambah data pegawai.');
        return;
      }
      const newStaff: Staff = {
        id: 's-' + Math.random().toString(36).substring(2, 9),
        name: staffName,
        nip: staffNip,
        pangkat: staffPangkat,
        golongan: staffGolongan,
        position: staffPosition,
        tempatLahir: '',
        tanggalLahir: '',
        jenisKelamin: 'Laki-laki',
        agama: 'Islam',
        telepon: '',
        email: '',
        alamat: '',
        riwayatKepangkatan: [],
        riwayatGaji: [],
        riwayatPendidikan: [],
        riwayatOrangTua: { namaAyah: '', pekerjaanAyah: '', namaIbu: '', pekerjaanIbu: '' },
        riwayatPasangan: { namaPasangan: '', pekerjaan: '', tanggalLahir: '', tanggalNikah: '', statusPasangan: 'Istri' },
        riwayatAnak: []
      };
      onAddStaff(newStaff);
    }
    
    setIsStaffFormOpen(false);

    // Reset form
    setStaffName('');
    setStaffNip('');
    setStaffPosition('');
    setStaffPangkat('');
    setStaffGolongan('');
  };

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetCode || !assetLocation || !assetDate || assetQuantity <= 0) {
      alert('Semua baris data aset wajib diisi.');
      return;
    }

    if (editingAsset) {
      const updated: Asset = {
        ...editingAsset,
        name: assetName,
        code: assetCode,
        condition: assetCondition,
        location: assetLocation,
        quantity: Number(assetQuantity),
        purchaseDate: assetDate,
        kibCategory: assetKibCategory,
        price: Number(assetPrice) || 0,
        brand: assetBrand,
        notes: assetNotes
      };
      onUpdateAsset(updated);
      setEditingAsset(null);
    } else {
      const newAsset: Asset = {
        id: 'a-' + Math.random().toString(36).substring(2, 9),
        name: assetName,
        code: assetCode,
        condition: assetCondition,
        location: assetLocation,
        quantity: Number(assetQuantity),
        purchaseDate: assetDate,
        kibCategory: assetKibCategory,
        price: Number(assetPrice) || 0,
        brand: assetBrand,
        notes: assetNotes
      };
      onAddAsset(newAsset);
    }
    
    setIsAssetFormOpen(false);

    // Reset form
    setAssetName('');
    setAssetCode('');
    setAssetCondition('Baik');
    setAssetLocation('');
    setAssetQuantity(1);
    setAssetDate('');
    setAssetKibCategory('KIB B');
    setAssetPrice(0);
    setAssetBrand('');
    setAssetNotes('');
  };

  const handleFinanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeDate || !financeDescription || financeAmount <= 0) {
      alert('Semua baris data transaksi wajib diisi.');
      return;
    }

    if (editingFinance) {
      const updated: FinanceTransaction = {
        ...editingFinance,
        date: financeDate,
        description: financeDescription,
        amount: Number(financeAmount),
        type: financeType,
        category: financeCategory
      };
      onUpdateFinance(updated);
      setEditingFinance(null);
    } else {
      const newFinance: FinanceTransaction = {
        id: 'f-' + Math.random().toString(36).substring(2, 9),
        date: financeDate,
        description: financeDescription,
        amount: Number(financeAmount),
        type: financeType,
        category: financeCategory,
        registeredBy: currentUser.name
      };
      onAddFinance(newFinance);
    }
    
    setIsFinanceFormOpen(false);

    // Reset form
    setFinanceDate('');
    setFinanceDescription('');
    setFinanceAmount(0);
    setFinanceType('pemasukan');
    setFinanceCategory('Anggaran Rutin');
  };

  // Filters
  const filteredMails = mails.filter(m => {
    const matchesSearch = (m.subject || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          (m.referenceNumber || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          (m.sender || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          (m.recipient || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesType = m.type === mailSubTab;
    const matchesMonth = selectedMonth === 'all' || (m.date && m.date.split('-')[1] === selectedMonth);
    const matchesYear = !selectedYear || (m.date && m.date.split('-')[0] === selectedYear);
    return matchesSearch && matchesType && matchesMonth && matchesYear;
  });

  const handleExportToExcel = () => {
    const isMasuk = mailSubTab === 'masuk';
    const headers = isMasuk 
      ? ['No', 'Nomor Agenda', 'Nomor Surat Asli', 'Tanggal Diterima', 'Tanggal Fisik Surat', 'Pengirim (Asal)', 'Penerima UPTD', 'Perihal', 'Status']
      : ['No', 'Nomor Surat Keluar', 'Tanggal Pengiriman', 'Pengirim UPTD', 'Penerima (Tujuan)', 'Perihal', 'Status'];
    
    const rows = filteredMails.map((mail, index) => {
      if (isMasuk) {
        return [
          index + 1,
          mail.referenceNumber,
          mail.originalLetterNumber || '-',
          formatToIndoDate(mail.date),
          formatToIndoDate(mail.letterDate || '-'),
          mail.sender,
          mail.recipient,
          mail.subject,
          mail.status
        ];
      } else {
        return [
          index + 1,
          mail.referenceNumber,
          formatToIndoDate(mail.date),
          mail.sender,
          mail.recipient,
          mail.subject,
          mail.status
        ];
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const monthLabel = selectedMonth === 'all' ? 'Semua_Bulan' : `Bulan_${selectedMonth}`;
    const yearLabel = selectedYear ? `Tahun_${selectedYear}` : 'Semua_Tahun';
    const typeLabel = isMasuk ? 'Surat_Masuk' : 'Surat_Keluar';
    link.href = url;
    link.setAttribute('download', `Rekap_Arsip_${typeLabel}_${monthLabel}_${yearLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStaff = staff.filter(s => {
    return (s.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (s.nip || '').includes(searchQuery) ||
           (s.position || '').toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  const filteredAssets = assets.filter(a => {
    return (a.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (a.code || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (a.location || '').toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  const filteredFinances = finances.filter(f => {
    return (f.description || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (f.category || '').toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  const filteredBankAccounts = bankAccounts.filter(b => {
    return (b.bankName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (b.accountNumber || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (b.accountHolder || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (b.type || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (b.description || '').toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  const filteredActivityAccounts = activityAccounts.filter(a => {
    return (a.code || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (a.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (a.programName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (a.activityName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
           (a.description || '').toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  // Rupiah Formatter
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const getSearchPlaceholder = () => {
    switch (activeSubTab) {
      case 'adm_umum': return 'Cari nomor / subjek surat...';
      case 'personalia': return 'Cari nama / NIP pegawai...';
      case 'aset_inventaris': return 'Cari nama, kode, atau lokasi aset...';
      case 'keuangan': 
        if (financeSubTab === 'rekening_kegiatan') {
          return 'Cari kode kegiatan, nama belanja, program...';
        } else if (financeSubTab === 'spj_rutin') {
          return 'Cari SPJ, nomor berkas, kegunaan...';
        } else if (financeSubTab === 'bapp') {
          return 'Cari BAPP, nomor kontrak, pelaksana, paket pekerjaan...';
        } else {
          return 'Cari kode kegiatan, rekening, SPJ, atau dokumen...';
        }
      default: return 'Cari...';
    }
  };

  if (activeSubTab !== 'landing' && !isSubTabAllowed(activeSubTab)) {
    return (
      <div className="bg-red-50 border border-red-150 rounded-2xl p-8 text-center text-red-800 space-y-3 animate-fade-in my-8" id="sc-access-denied">
        <h3 className="font-extrabold text-sm uppercase tracking-wider">Akses Terbatas</h3>
        <p className="text-xs font-medium text-red-600 max-w-md mx-auto">
          Anda tidak memiliki wewenang atau hak akses seksi untuk melihat sub-halaman ini. Silakan hubungi Administrator untuk memperbarui hak akses Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="penatausahaan-tab-content">
      {/* LANDING PAGE DEFAULT EMPTY CUSTOMIZABLE AREA */}
      {activeSubTab === 'landing' && (
        <div className="space-y-6 animate-fade-in" id="penatausahaan-landing-panel">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="relative z-10 max-w-2xl">
              <span className="bg-blue-500/30 text-blue-100 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded">
                Seksi Tata Usaha (TU)
              </span>
              <h1 className="text-xl md:text-2xl font-black mt-3 uppercase tracking-tight">
                Penatausahaan Kantor
              </h1>
              <p className="text-xs text-blue-100 font-medium mt-2 leading-relaxed">
                Halaman utama Penatausahaan saat ini telah dikosongkan dan siap dikustomisasi sesuai dengan kebutuhan operasional spesifik Anda. Seluruh data sub-halaman telah dipindahkan sepenuhnya ke dalam daftar sub-halaman di menu samping (sidebar).
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="bg-white/10 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>System Customizable</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg text-[11px] font-semibold">
                  Seksi: Penatausahaan / TU
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: STATISTIK KEARSIPAN SURAT */}
          {isSubTabAllowed('adm_umum') && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-slate-500" />
                <span>Statistik Administrasi Kearsipan Surat</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Surat Masuk */}
                <div 
                  onClick={() => { onSubTabChange('adm_umum'); setMailSubTab('masuk'); }}
                  className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Surat Masuk</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-800 tracking-tight">
                        {mails.filter(m => m.type === 'masuk').length}
                      </span>
                      <span className="text-[11px] text-slate-500">Berkas surat diterima</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-bold group-hover:underline flex items-center gap-1">
                      Buka Administrasi Surat Masuk <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-105 transition-transform">
                    <Inbox className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 2: Surat Keluar */}
                <div 
                  onClick={() => { onSubTabChange('adm_umum'); setMailSubTab('keluar'); }}
                  className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Surat Keluar</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-800 tracking-tight">
                        {mails.filter(m => m.type === 'keluar').length}
                      </span>
                      <span className="text-[11px] text-slate-500">Berkas surat terkirim</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold group-hover:underline flex items-center gap-1">
                      Buka Administrasi Surat Keluar <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-105 transition-transform">
                    <Send className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: MONITORING KEPEGAWAIAN (< 1 TAHUN) */}
          {isSubTabAllowed('personalia') && (() => {
            const hasPension = pensionAlerts.length > 0;
            const hasPromotion = promotionAlerts.length > 0;
            const hasSalary = salaryAlerts.length > 0;
            const totalVisibleCols = [hasPension, hasPromotion, hasSalary].filter(Boolean).length;
            
            if (totalVisibleCols === 0) return null;

            return (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Monitoring Agenda Kepegawaian (Masa Efektif &lt; 1 Tahun)</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Peringatan berkala otomatis untuk mengantisipasi siklus kepegawaian esensial, disinkronisasikan dari pangkalan data personalia (Tanggal Lahir, Riwayat Kepangkatan, &amp; Riwayat Gaji Berkala).
                  </p>
                </div>

                <div className={`grid grid-cols-1 ${
                  totalVisibleCols === 3 ? 'md:grid-cols-3' : 
                  totalVisibleCols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'
                } gap-6 w-full`}>
                  {/* KOLOM A: RENCANA MASA PENSIUN */}
                  {hasPension && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                              <Heart className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-800">Masa Pensiun (58 Thn)</h4>
                              <p className="text-[9px] text-slate-400 font-semibold font-medium">Berdasarkan tanggal lahir</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                            {pensionAlerts.length} Pegawai
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                          {pensionAlerts.map(p => (
                            <div 
                              key={p.staff.id}
                              className="p-3 bg-amber-50/40 border border-amber-100/75 rounded-xl hover:bg-amber-50 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div 
                                    onClick={() => onSubTabChange('personalia')}
                                    className="font-bold text-[11px] text-slate-800 hover:text-blue-600 cursor-pointer hover:underline"
                                  >
                                    {p.staff.name}
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">NIP: {p.staff.nip}</div>
                                </div>
                                <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  {p.diffDays} Hari Lagi
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[9px] font-medium text-slate-500 border-t border-amber-100/30 pt-1.5">
                                <span>Lahir: {formatToIndoDate(p.formattedDate)}</span>
                                <span>Est: <strong>{formatToIndoDate(p.pensionDate)}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => onSubTabChange('personalia')}
                        className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg transition-colors border border-slate-100 cursor-pointer"
                      >
                        Kelola Personalia Pegawai →
                      </button>
                    </div>
                  )}

                  {/* KOLOM B: RENCANA KENAIKAN PANGKAT */}
                  {hasPromotion && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-800">Kenaikan Pangkat (4 Keatas)</h4>
                              <p className="text-[9px] text-slate-400 font-semibold font-medium">+4 tahun dari tanggal SK terakhir</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                            {promotionAlerts.length} Pegawai
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                          {promotionAlerts.map(p => (
                            <div 
                              key={p.staff.id}
                              className="p-3 bg-blue-50/40 border border-blue-100/75 rounded-xl hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div 
                                    onClick={() => onSubTabChange('personalia')}
                                    className="font-bold text-[11px] text-slate-800 hover:text-blue-600 cursor-pointer hover:underline"
                                  >
                                    {p.staff.name}
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                                    {p.staff.pangkat} &bull; <strong className="font-mono text-slate-700">{p.staff.golongan}</strong>
                                  </div>
                                </div>
                                <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  {p.diffDays} Hari Lagi
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[9px] font-medium text-slate-500 border-t border-blue-100/50 pt-1.5 font-semibold">
                                <span className="truncate max-w-[120px]" title={p.source}>Sumber: {p.source}</span>
                                <span>Rencana: <strong>{formatToIndoDate(p.nextPromotionDate)}</strong></span>
                              </div>
                              {p.diffDays <= 90 && (
                                <div className="mt-2 p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-[9px] text-rose-800 font-extrabold flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>Harus segera mengurus, sudah memasuki H-3 bulan!</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => onSubTabChange('personalia')}
                        className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg transition-colors border border-slate-100 cursor-pointer"
                      >
                        Kelola Personalia Pegawai →
                      </button>
                    </div>
                  )}

                  {/* KOLOM C: RENCANA KENAIKAN GAJI BERKALA */}
                  {hasSalary && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-800">Kenaikan Gaji Berkala (KGB)</h4>
                              <p className="text-[9px] text-slate-400 font-semibold font-medium">+2 tahun dari tanggal gaji terakhir</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                            {salaryAlerts.length} Pegawai
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                          {salaryAlerts.map(p => (
                            <div 
                              key={p.staff.id}
                              className="p-3 bg-indigo-50/40 border border-indigo-100/75 rounded-xl hover:bg-indigo-50 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div 
                                    onClick={() => onSubTabChange('personalia')}
                                    className="font-bold text-[11px] text-slate-800 hover:text-blue-600 cursor-pointer hover:underline"
                                  >
                                    {p.staff.name}
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">NIP: {p.staff.nip}</div>
                                </div>
                                <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  {p.diffDays} Hari Lagi
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[9px] font-medium text-slate-500 border-t border-indigo-100/50 pt-1.5 font-semibold">
                                <span className="truncate max-w-[120px]" title={p.source}>Sumber: {p.source}</span>
                                <span>Rencana: <strong>{formatToIndoDate(p.nextGajiDate)}</strong></span>
                              </div>
                              {p.diffDays <= 90 && (
                                <div className="mt-2 p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-[9px] text-rose-800 font-extrabold flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>Harus segera mengurus, sudah memasuki H-3 bulan!</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => onSubTabChange('personalia')}
                        className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg transition-colors border border-slate-100 cursor-pointer"
                      >
                        Kelola Personalia Pegawai →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {!isSubTabAllowed('adm_umum') && !isSubTabAllowed('personalia') && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-2" id="empty-landing-info">
              <h3 className="font-bold text-slate-800 text-sm">Selamat Datang di Bagian Penatausahaan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan gunakan menu samping (sidebar) untuk mengakses halaman administrasi, aset, atau keuangan sesuai wewenang Anda.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Page Header with Search context */}
      {activeSubTab !== 'landing' && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              {activeSubTab === 'adm_umum' && <><FileText className="w-4 h-4 text-blue-600" /><span>Administrasi Umum (Kearsipan Surat)</span></>}
              {activeSubTab === 'personalia' && <><Users className="w-4 h-4 text-blue-600" /><span>Ketenagakerjaan & Kepegawaian (Personalia)</span></>}
              {activeSubTab === 'aset_inventaris' && <><Box className="w-4 h-4 text-blue-600" /><span>Aset & Inventaris UPTD</span></>}
              {activeSubTab === 'keuangan' && <><Wallet className="w-4 h-4 text-blue-600" /><span>Keuangan & Kode Rekening</span></>}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {activeSubTab === 'adm_umum' && 'Kelola pencatatan surat masuk dan surat keluar resmi dinas.'}
              {activeSubTab === 'personalia' && 'Database rekap data kepegawaian, jabatan, dan strukural UPTD.'}
              {activeSubTab === 'aset_inventaris' && 'Daftar inventaris sarana prasarana, kendaraan dinas, dan peralatan ukur.'}
              {activeSubTab === 'keuangan' && 'Informasi arus kas transaksi keuangan serta pengelolaan daftar kode rekening kegiatan operasional & bank resmi UPTD.'}
            </p>
          </div>

          {/* Search, Filter & Export tools for the current sub page context */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium transition-all"
              />
            </div>

            {/* Conditionally render Year/Month Filter and Export to Excel on Administrative Umum (adm_umum) page */}
            {activeSubTab === 'adm_umum' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Year Filter (Manual) */}
                <div className="relative flex-1 sm:flex-initial flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Tahun..."
                    value={selectedYear}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // only allow numbers
                      setSelectedYear(val);
                    }}
                    className="bg-transparent text-xs font-bold text-slate-600 placeholder-slate-400 focus:outline-none w-16"
                  />
                  {selectedYear && (
                    <button
                      type="button"
                      onClick={() => setSelectedYear('')}
                      className="ml-1 text-slate-400 hover:text-slate-600 focus:outline-none shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Month Filter */}
                <div className="relative flex-1 sm:flex-initial flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="all">Semua Bulan</option>
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                </div>

                {/* Export Excel Button */}
                <button
                  type="button"
                  onClick={handleExportToExcel}
                  className="flex-1 sm:flex-initial py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-600/10 active:scale-95 cursor-pointer shrink-0"
                  title="Ekspor Data ke Excel (.csv)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="whitespace-nowrap">Ekspor Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}      {/* SUBTAB 1: SURAT MASUK KELUAR */}
      {activeSubTab === 'adm_umum' && (
        <div className="space-y-4 font-sans" id="surat-panel">
          
          {/* Header Action Control with sub-navigation */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 gap-4">
            {/* Sub-halaman: Surat Masuk & Surat Keluar selector */}
            <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-md w-full">
              <button
                onClick={() => { setMailSubTab('masuk'); setIsMailFormOpen(false); }}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  mailSubTab === 'masuk'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <MailOpen className="w-3.5 h-3.5" />
                <span>Surat Masuk</span>
                <span className={`text-[9px] py-0.5 px-2 rounded-full font-bold ${
                  mailSubTab === 'masuk' ? 'bg-blue-700 text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  {mails.filter(m => m.type === 'masuk').length}
                </span>
              </button>
              <button
                onClick={() => { setMailSubTab('keluar'); setIsMailFormOpen(false); }}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  mailSubTab === 'keluar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Surat Keluar</span>
                <span className={`text-[9px] py-0.5 px-2 rounded-full font-bold ${
                  mailSubTab === 'keluar' ? 'bg-blue-700 text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  {mails.filter(m => m.type === 'keluar').length}
                </span>
              </button>
            </div>

            {/* Input Action Trigger */}
            {canWriteAdmUmum ? (
              <button
                onClick={() => setIsMailFormOpen(!isMailFormOpen)}
                id="btn-add-mail"
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Entri {mailSubTab === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'} Baru</span>
              </button>
            ) : (
              <div className="text-[10px] bg-slate-100 px-3 py-1.5 text-slate-500 rounded-lg font-semibold flex items-center justify-center text-center">
                *Hanya TU / Admin yang dapat memasukkan data
              </div>
            )}
          </div>

          {/* Form Modal/Collapsible to insert mail */}
          {isMailFormOpen && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans select-none overflow-y-auto"
              onClick={() => {
                setIsMailFormOpen(false);
                setRefNumber('');
                setSender('');
                setRecipient('');
                setSubject('');
                setMailDate('');
                setOriginalLetterNumber('');
                setLetterDate('');
                setPdfFile('');
                setPdfName('');
              }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                id="mail-form-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 tracking-tight uppercase">
                    <FolderPlus className="w-4 h-4 text-blue-600" />
                    {editingMail ? 'Ubah Arsip Data Surat' : `Formulir Penatausahaan ${mailSubTab === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'} Baru`}
                  </h3>
                  <button 
                    onClick={() => {
                      setIsMailFormOpen(false);
                      setEditingMail(null);
                      setRefNumber('');
                      setSender('');
                      setRecipient('');
                      setSubject('');
                      setMailDate('');
                      setOriginalLetterNumber('');
                      setLetterDate('');
                      setPdfFile('');
                      setPdfName('');
                    }} 
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors"
                  >
                    Batal
                  </button>
                </div>

                <form onSubmit={handleMailSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs select-none">
                  {/* 1. KODE AGENDA / NO Rujukan */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {mailSubTab === 'masuk' ? 'Nomor Agenda Surat Masuk' : 'Nomor Surat Keluar Resmi'} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder={mailSubTab === 'masuk' ? "Contoh: B/132/PSDA-SU/V/2026" : "Contoh: 005/321/PSDA-SU/2026"}
                      value={refNumber}
                      onChange={(e) => setRefNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* 2. KHUSUS SURAT MASUK: NOMOR SURAT ASLI & TANGGAL SURAT */}
                  {mailSubTab === 'masuk' && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center">
                          Nomor Surat Asli <span className="text-[10px] text-slate-400 font-medium ml-1">(dari Pengirim)</span> <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="Contoh: 005/456/AS/2026"
                          value={originalLetterNumber}
                          onChange={(e) => setOriginalLetterNumber(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center">
                          Tanggal Fisik Surat <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                          type="date"
                          value={letterDate}
                          onChange={(e) => setLetterDate(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* 3. TANGGAL SURAT DITERIMA / DIKIRIM */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {mailSubTab === 'masuk' ? 'Tanggal Diterima Dinas' : 'Tanggal Pengiriman Surat'} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date"
                      value={mailDate}
                      onChange={(e) => setMailDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* 4. STATUS DISPOSISI / PENGIRIMAN */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {mailSubTab === 'masuk' ? 'Status Disposisi / Kelayakan' : 'Status Pengiriman'} <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={mailStatus} 
                      onChange={(e: any) => setMailStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                      required
                    >
                      {mailSubTab === 'masuk' ? (
                        <>
                          <option value="Diterima">Diterima (Proses Agenda)</option>
                          <option value="Diproses">Diproses & Disposisi</option>
                          <option value="Diarsipkan">Diarsipkan</option>
                        </>
                      ) : (
                        <>
                          <option value="Terkirim">Terkirim</option>
                          <option value="Diarsipkan">Diarsipkan</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* 5. INSTANSI PENGIRIM */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Instansi Pengirim / Asal <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder={mailSubTab === 'masuk' ? "Nama instansi pengirim / kelompok tani" : "UPTD PSDA Bah Bolon"}
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* 6. PENERIMA / TUJUAN */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Penerima / Tujuan Dokumen <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder={mailSubTab === 'masuk' ? "UPTD PSDA Bah Bolon" : "Dinas SDA Provsu / Camat"}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* 7. PERIHAL */}
                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      Subjek / Perihal Ringkasan Surat <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Undangan Koordinasi Pompanisasi / Permohonan Izin Aliran Air..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* 8. UPLOAD PDF DENGAN DRAG AND DROP */}
                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Upload Berkas / Lampiran Surat (Format PDF)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center cursor-pointer text-center ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50/40 shadow-inner' 
                          : pdfFile 
                            ? 'border-emerald-500 bg-emerald-50/10' 
                            : 'border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="pdf-file-upload-input"
                      />
                      
                      <label htmlFor="pdf-file-upload-input" className="w-full h-full cursor-pointer flex flex-col items-center justify-center">
                        {pdfFile ? (
                          <div className="space-y-3">
                            <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                              <FileIcon className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm max-w-md mx-auto truncate" title={pdfName}>{pdfName}</p>
                              <p className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase mt-0.5">Dokumen PDF Terlampir</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPdfFile('');
                                setPdfName('');
                              }}
                              className="py-1.5 px-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl text-[10px] font-bold inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Batalkan / Ganti File</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 py-2">
                            <div className="inline-flex p-3.5 bg-blue-50 rounded-2xl text-blue-600 ring-4 ring-blue-50/50">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-700 text-xs">
                                Seret & letakkan berkas PDF di sini, atau <span className="text-blue-600 hover:underline">cari berkas</span>
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">Menerima format dokumen .pdf (Maksimal ukuran file: 8 megabytes)</p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsMailFormOpen(false);
                        setEditingMail(null);
                        setRefNumber('');
                        setSender('');
                        setRecipient('');
                        setSubject('');
                        setMailDate('');
                        setOriginalLetterNumber('');
                        setLetterDate('');
                        setPdfFile('');
                        setPdfName('');
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      id="submit-mail-form"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-sm shadow-emerald-600/10 cursor-pointer"
                    >
                      {editingMail ? 'Simpan Perubahan' : 'Simpan & Daftarkan Surat'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Letter Log Directory Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-left border-collapse" id="mails-table">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="p-4 w-12">No.</th>
                    <th className="p-4">{mailSubTab === 'masuk' ? 'No. Agenda & Surat Asli' : 'No. Surat Keluar'}</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">{mailSubTab === 'masuk' ? 'Pengirim (Asal)' : 'Pengirim'}</th>
                    <th className="p-4">{mailSubTab === 'masuk' ? 'Penerima UPTD' : 'Penerima (Tujuan)'}</th>
                    <th className="p-4">Perihal/Subjek</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center w-32">Lampiran</th>
                    {canWriteAdmUmum && <th className="p-4 text-center w-24">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredMails.length > 0 ? (
                    filteredMails.map((mail, idx) => (
                      <tr key={mail.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-4 font-semibold text-slate-850">
                          <div className="font-mono font-bold text-blue-600">{mail.referenceNumber}</div>
                          {mail.type === 'masuk' && mail.originalLetterNumber && (
                            <div className="text-[10px] text-slate-500 mt-1 font-medium bg-slate-100/70 inline-block px-1.5 py-0.5 rounded-md">
                              No. Asli: <span className="font-mono font-semibold text-slate-700">{mail.originalLetterNumber}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          <div className="font-medium text-slate-700">{formatToIndoDate(mail.date)}</div>
                          {mail.type === 'masuk' && mail.letterDate && (
                            <div className="text-[10px] text-slate-400 mt-1 font-normal">
                              Tgl Surat: <span className="text-slate-500 font-semibold">{formatToIndoDate(mail.letterDate)}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-medium">{mail.sender}</td>
                        <td className="p-4 font-medium">{mail.recipient}</td>
                        <td className="p-4 font-semibold text-slate-800 max-w-xs truncate" title={mail.subject}>
                          {mail.subject}
                        </td>
                        <td className="p-4">
                          <span className={`py-1 px-2.5 rounded-full text-[10px] font-bold inline-block whitespace-nowrap ${
                            mail.status === 'Selesai' || mail.status === 'Terkirim' || mail.status === 'Diarsipkan'
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                              : 'bg-amber-50 border border-amber-100 text-amber-700'
                          }`}>
                            {mail.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {mail.pdfFile ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setViewingPdfMail(mail)}
                                className="py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
                                title="Pratinjau File Lampiran"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Lihat</span>
                              </button>
                              <a
                                href={mail.pdfFile}
                                download={mail.pdfName || `surat-${mail.referenceNumber}.pdf`}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-all"
                                title="Unduh File Lampiran"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">-</span>
                          )}
                        </td>
                        {canWriteAdmUmum && (
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleStartEditMail(mail)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors inline-block cursor-pointer"
                                title="Ubah Arsip Surat"
                                id={`edit-mail-${mail.id}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteMail(mail.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-block cursor-pointer"
                                title="Hapus Arsip Surat"
                                id={`delete-mail-${mail.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canWriteAdmUmum ? 9 : 8} className="p-8 text-center text-slate-400 font-medium">
                        Tidak ada arsip dokumen {mailSubTab === 'masuk' ? 'surat masuk' : 'surat keluar'} ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PDF PREVIEW MODAL */}
          {viewingPdfMail && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans select-none"
              onClick={() => setViewingPdfMail(null)}
            >
              <div 
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                      <FileIcon className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-extrabold text-xs text-slate-800 tracking-tight uppercase">Pratinjau Dokumen Lampiran</h3>
                      <p className="text-[10px] text-slate-500 font-semibold max-w-sm truncate" title={viewingPdfMail.pdfName || 'surat_lampiran.pdf'}>
                        {viewingPdfMail.pdfName || 'surat_lampiran.pdf'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <a 
                      href={viewingPdfMail.pdfFile} 
                      download={viewingPdfMail.pdfName || `surat-${viewingPdfMail.referenceNumber}.pdf`}
                      className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Berkas</span>
                    </a>
                    <button 
                      onClick={() => setViewingPdfMail(null)} 
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content Embedded Document Viewer */}
                <div className="p-4 flex-1 bg-slate-100 overflow-hidden flex justify-center items-center">
                  {viewingPdfMail.pdfFile ? (
                    <iframe 
                      src={viewingPdfMail.pdfFile} 
                      className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white"
                      title="PDF Document Viewer"
                    />
                  ) : (
                    <div className="text-center text-slate-400 font-medium">
                      Gagal menampilkan pratinjau dokumen. Silakan unduh berkas secara manual.
                    </div>
                  )}
                </div>

                {/* Footer details */}
                <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-[10px] text-slate-500 font-bold flex justify-between items-center uppercase tracking-wider">
                  <span>Agenda Rujukan: <strong className="text-slate-700 font-mono">{viewingPdfMail.referenceNumber}</strong></span>
                  <span>Sirkulasi: <strong className="text-slate-700">{viewingPdfMail.type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY PDF PREVIEW MODAL */}
          {viewingHistoryPdf && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans select-none"
              onClick={() => setViewingHistoryPdf(null)}
            >
              <div 
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                      <FileIcon className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-extrabold text-xs text-slate-800 tracking-tight uppercase">Pratinjau Berkas Lampiran</h3>
                      <p className="text-[10px] text-slate-500 font-semibold max-w-sm truncate" title={viewingHistoryPdf.name}>
                        {viewingHistoryPdf.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <a 
                      href={viewingHistoryPdf.file} 
                      download={viewingHistoryPdf.name || `lampiran-riwayat.pdf`}
                      className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Berkas</span>
                    </a>
                    <button 
                      onClick={() => setViewingHistoryPdf(null)} 
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 bg-slate-100 overflow-hidden flex justify-center items-center">
                  {viewingHistoryPdf.file ? (
                    <iframe 
                      src={viewingHistoryPdf.file} 
                      className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white"
                      title="PDF History Document Viewer"
                    />
                  ) : (
                    <div className="text-center text-slate-400 font-medium">
                      Gagal menampilkan pratinjau dokumen. Silakan unduh berkas secara manual.
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-[10px] text-slate-500 font-bold flex justify-between items-center uppercase tracking-wider">
                  <span>Nama Berkas: <strong className="text-slate-750 font-mono truncate max-w-xs">{viewingHistoryPdf.name}</strong></span>
                  <span>Format: <strong className="text-emerald-600 font-extrabold">PDF Dokumen</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: KETENAGAKERJAAN / PEGAWAI */}
      {activeSubTab === 'personalia' && (
        <div className="space-y-4" id="pegawai-panel">
          
          {/* Header Action Control */}
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{filteredStaff.length}</span> Pegawai UPTD PSDA Bah Bolon Sumut
            </div>
            
            {canCreateStaff ? (
              <button
                onClick={() => setIsStaffFormOpen(!isStaffFormOpen)}
                id="btn-add-staff"
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Pegawai</span>
              </button>
            ) : (
              <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                *Hanya Kepegawaian & Admin yang dapat menginput Pegawai baru
              </div>
            )}
          </div>

          {/* Form to insert details of a new Employee - POPUP MODAL */}
          {isStaffFormOpen && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans select-none overflow-y-auto"
              onClick={() => {
                setIsStaffFormOpen(false);
                setEditingStaff(null);
                setEditStaffDraft(null);
                setStaffName('');
                setStaffNip('');
                setStaffPosition('');
                setStaffPangkat('');
                setStaffGolongan('');
              }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 w-full ${editingStaff ? 'max-w-5xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}
                id="staff-form-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 tracking-tight uppercase">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    {editingStaff ? `Ubah Data Pegawai: ${editingStaff.name}` : 'Formulir Rekrutmen / Data Pegawai Baru'}
                  </h3>
                  <button 
                    onClick={() => {
                      setIsStaffFormOpen(false);
                      setEditingStaff(null);
                      setEditStaffDraft(null);
                      setStaffName('');
                      setStaffNip('');
                      setStaffPosition('');
                      setStaffPangkat('');
                      setStaffGolongan('');
                    }} 
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors"
                  >
                    Batal
                  </button>
                </div>

                {editingStaff ? (
                  /* EDIT MODE: MULTI-TAB WORKSPACE LAYOUT */
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                    
                    {/* Left tabs selector */}
                    <div className="md:col-span-1 border-r border-slate-100 pr-2 flex flex-col space-y-1">
                      <button
                        type="button"
                        onClick={() => setEditModalTab('biodata')}
                        className={`p-2.5 rounded-xl text-left font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                          editModalTab === 'biodata' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Users className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate">Data Lengkap</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTab('pangkat')}
                        className={`p-2.5 rounded-xl text-left font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                          editModalTab === 'pangkat' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Award className="w-4 h-4 flex-shrink-0 text-amber-500" />
                        <span className="truncate">Riwayat Pangkat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTab('gaji')}
                        className={`p-2.5 rounded-xl text-left font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                          editModalTab === 'gaji' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <DollarSign className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                        <span className="truncate">Riwayat Gaji (KGB)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTab('pendidikan')}
                        className={`p-2.5 rounded-xl text-left font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                          editModalTab === 'pendidikan' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4 flex-shrink-0 text-sky-500" />
                        <span className="truncate">Riwayat Pendidikan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTab('ortu')}
                        className={`p-2.5 rounded-xl text-left font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                          editModalTab === 'ortu' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Heart className="w-4 h-4 flex-shrink-0 text-purple-600" />
                        <span className="truncate">Riwayat Orang Tua</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTab('pasangan')}
                        className={`p-2.5 rounded-xl text-left font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                          editModalTab === 'pasangan' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Heart className="w-4 h-4 flex-shrink-0 text-pink-500 fill-pink-500/10" />
                        <span className="truncate">Riwayat Pasangan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTab('anak')}
                        className={`p-2.5 rounded-xl text-left font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                          editModalTab === 'anak' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Baby className="w-4 h-4 flex-shrink-0 text-rose-500" />
                        <span className="truncate">Riwayat Anak</span>
                      </button>
                    </div>

                    {/* Right core panel contents */}
                    <div className="md:col-span-3 space-y-4">
                      
                      {/* Subtab 1: BIODATA & DATA LENGKAP */}
                      {editModalTab === 'biodata' && (
                        <div className="space-y-4">
                          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-[11px] text-blue-700 font-medium">
                            Silakan perbarui biodata pokok dan alamat lengkap pegawai resmi di bawah ini.
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Upload Foto Profil */}
                            <div className="sm:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                              <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-inner flex items-center justify-center shrink-0">
                                {editStaffDraft?.photo ? (
                                  <img 
                                    src={editStaffDraft.photo}
                                    alt="Foto Profil Pegawai"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-slate-400 text-center">
                                    <UserIcon className="w-10 h-10 text-slate-350" />
                                    <span className="text-[9px] mt-1 font-bold text-slate-400">Belum Ada Foto</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow text-center sm:text-left space-y-2">
                                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5 animate-pulse-slow">
                                  <Camera className="w-4 h-4 text-blue-600" />
                                  <span>Foto Profil Resmi Pegawai</span>
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed max-w-lg">
                                  Unggah foto profil pegawai resmi UPTD. Format yang didukung: JPG, JPEG, atau PNG (Maksimal ukuran file 1MB).
                                </p>
                                <div className="flex items-center gap-2 justify-center sm:justify-start pt-0.5">
                                  <label className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] cursor-pointer inline-flex items-center space-x-1.5 transition-all shadow-sm shadow-blue-600/15">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Pilih File Foto</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.size > 1024 * 1024) {
                                            alert("Ukuran berkas terlalu besar. Maksimal adalah 1MB.");
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            updateDraftField('photo', event.target?.result as string);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {editStaffDraft?.photo && (
                                    <button
                                      type="button"
                                      onClick={() => updateDraftField('photo', '')}
                                      className="py-1.5 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Hapus Foto</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                value={staffName}
                                onChange={(e) => setStaffName(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai) <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                value={staffNip}
                                onChange={(e) => setStaffNip(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Pangkat <span className="text-red-500">*</span></label>
                              <select 
                                value={staffPangkat}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStaffPangkat(val);
                                  const matched = RANK_MAPPINGS.find(r => r.pangkat === val);
                                  setStaffGolongan(matched ? matched.golongan : '');
                                }}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                                required
                              >
                                <option value="">-- Pilih Kepangkatan --</option>
                                {RANK_MAPPINGS.map((rm) => (
                                  <option key={rm.pangkat} value={rm.pangkat}>{rm.pangkat} ({rm.golongan})</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Golongan Ruang</label>
                              <input 
                                type="text" 
                                value={staffGolongan ? `Golongan ${staffGolongan}` : ''}
                                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold focus:outline-none cursor-not-allowed"
                                readOnly
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block font-bold text-slate-700 mb-1">Jabatan / Kedudukan Dinas <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                value={staffPosition}
                                onChange={(e) => setStaffPosition(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
                              <input 
                                type="text" 
                                placeholder="Contoh: Pematangsiantar"
                                value={editStaffDraft?.tempatLahir || ''}
                                onChange={(e) => updateDraftField('tempatLahir', e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                              <input 
                                type="date" 
                                value={editStaffDraft?.tanggalLahir || ''}
                                onChange={(e) => updateDraftField('tanggalLahir', e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                              <select 
                                value={editStaffDraft?.jenisKelamin || 'Laki-laki'}
                                onChange={(e) => updateDraftField('jenisKelamin', e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                              >
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Agama</label>
                              <select 
                                value={editStaffDraft?.agama || 'Islam'}
                                onChange={(e) => updateDraftField('agama', e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                              >
                                <option value="Islam">Islam</option>
                                <option value="Kristen">Kristen</option>
                                <option value="Katolik">Katolik</option>
                                <option value="Hindu">Hindu</option>
                                <option value="Buddha">Buddha</option>
                                <option value="Konghucu">Konghucu</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">No. Telepon / Handphone</label>
                              <input 
                                type="tel" 
                                placeholder="Contoh: 0811xxxxxx"
                                value={editStaffDraft?.telepon || ''}
                                onChange={(e) => updateDraftField('telepon', e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">E-mail Pegawai</label>
                              <input 
                                type="email" 
                                placeholder="Contoh: nama.pegawai@mail.com"
                                value={editStaffDraft?.email || ''}
                                onChange={(e) => updateDraftField('email', e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block font-bold text-slate-700 mb-1">Alamat Rumah Lengkap</label>
                              <textarea 
                                placeholder="Tulis alamat domisili lengkap sekarang..."
                                value={editStaffDraft?.alamat || ''}
                                onChange={(e) => updateDraftField('alamat', e.target.value)}
                                rows={2}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subtab 2: RIWAYAT KEPANGKATAN */}
                      {editModalTab === 'pangkat' && (
                        <div className="space-y-4">


                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                            <h4 className="font-bold text-[11px] text-slate-700 uppercase flex items-center gap-1.5">
                              <Plus className="w-3.5 h-3.5 text-blue-600" />
                              Tambah Riwayat Kepangkatan Baru
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pangkat</label>
                                <select 
                                  value={newPangkatName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewPangkatName(val);
                                    const matched = RANK_MAPPINGS.find(r => r.pangkat === val);
                                    setNewPangkatGolongan(matched ? matched.golongan : '');
                                  }}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">-- Pilih --</option>
                                  {RANK_MAPPINGS.map((rm) => (
                                    <option key={rm.pangkat} value={rm.pangkat}>{rm.pangkat}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Golongan (Otomatis)</label>
                                <input 
                                  type="text"
                                  value={newPangkatGolongan}
                                  readOnly
                                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-bold text-[11px] focus:outline-none cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">TMT (Terhitung Mulai Tanggal)</label>
                                  <input 
                                    type="date"
                                    value={newPangkatTmt}
                                    onChange={(e) => setNewPangkatTmt(e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nomor SK Kepangkatan</label>
                                  <input 
                                    type="text"
                                    placeholder="Contoh: 821.2/015/KEP-BKP/2021"
                                    value={newPangkatNoSk}
                                    onChange={(e) => setNewPangkatNoSk(e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Tanggal SK</label>
                                  <input 
                                    type="date"
                                    value={newPangkatTglSk}
                                    onChange={(e) => setNewPangkatTglSk(e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-650 mb-1 flex items-center gap-1">
                                    <span>Unggah Dokumen SK (PDF)</span>
                                    <span className="text-slate-400 font-normal">(Maks. 8MB)</span>
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-150 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] font-black cursor-pointer text-slate-750 select-none shadow-3xs transition-all">
                                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Pilih PDF</span>
                                      <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            if (file.type !== 'application/pdf') {
                                              alert('Hanya diperbolehkan format PDF (*.pdf)');
                                              return;
                                            }
                                            if (file.size > 8 * 1024 * 1024) {
                                              alert('Batas ukuran file PDF adalah 8MB');
                                              return;
                                            }
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                              setNewPangkatPdfFile(ev.target?.result as string);
                                              setNewPangkatPdfName(file.name);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                    {newPangkatPdfName ? (
                                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg text-[10px] text-emerald-800 font-extrabold max-w-full">
                                        <FileIcon className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                        <span className="truncate max-w-[150px]">{newPangkatPdfName}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNewPangkatPdfFile('');
                                            setNewPangkatPdfName('');
                                          }}
                                          className="text-emerald-500 hover:text-emerald-700 cursor-pointer font-bold p-0.5 ml-1 shrink-0 bg-transparent border-none outline-none"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic font-medium">Belum ada file SK diunggah</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newPangkatName || !newPangkatTmt || !newPangkatNoSk) {
                                      alert('Harap lengkapi isi nama pangkat, TMT, dan nomor SK Kepangkatan.');
                                      return;
                                    }
                                    const items = editStaffDraft?.riwayatKepangkatan || [];
                                    const newItem = {
                                      id: 'rp-' + Math.random().toString(36).substring(2, 9),
                                      pangkat: newPangkatName,
                                      golongan: newPangkatGolongan,
                                      tmt: newPangkatTmt,
                                      noSk: newPangkatNoSk,
                                      tglSk: newPangkatTglSk,
                                      pdfFile: newPangkatPdfFile || undefined,
                                      pdfName: newPangkatPdfName || undefined
                                    };
                                    const updatedHistory = [...items, newItem];
                                    setEditStaffDraft({
                                      ...editStaffDraft!,
                                      riwayatKepangkatan: updatedHistory
                                    });
                                    syncMainPangkatWithHistory(updatedHistory);
                                    // Reset inputs
                                    setNewPangkatName('');
                                    setNewPangkatGolongan('');
                                    setNewPangkatTmt('');
                                    setNewPangkatNoSk('');
                                    setNewPangkatTglSk('');
                                    setNewPangkatPdfFile('');
                                    setNewPangkatPdfName('');
                                  }}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Tambah Data Riwayat
                                </button>
                              </div>
                            </div>

                            {/* Table of Ranks */}
                            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto shadow-inner">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-500">
                                    <th className="p-3.5 text-center w-8">No</th>
                                    <th className="p-3.5">Pangkat / Golongan</th>
                                    <th className="p-3.5 w-24">TMT</th>
                                    <th className="p-3.5">Keterangan SK</th>
                                    <th className="p-3.5 text-center w-12">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  {(!editStaffDraft?.riwayatKepangkatan || editStaffDraft.riwayatKepangkatan.length === 0) ? (
                                    <tr>
                                      <td colSpan={5} className="p-6 text-center text-slate-400 font-bold italic">Belum ada data riwayat kepangkatan pegawai.</td>
                                    </tr>
                                  ) : (
                                    editStaffDraft.riwayatKepangkatan.map((r, i) => (
                                      <tr key={r.id}>
                                        <td className="p-3 text-center text-slate-400">{i + 1}</td>
                                        <td className="p-3 font-bold text-slate-800">{r.pangkat} ({r.golongan})</td>
                                        <td className="p-3 text-blue-600 font-semibold">{formatToIndoDate(r.tmt)}</td>
                                        <td className="p-3 text-xs">
                                          <div>SK No: <span className="font-mono text-slate-800 font-bold">{r.noSk}</span></div>
                                          {r.tglSk && <div className="text-[10px] text-slate-400">Tanggal SK: {formatToIndoDate(r.tglSk)}</div>}
                                          {r.pdfFile && (
                                            <button
                                              type="button"
                                              onClick={() => setViewingHistoryPdf({ file: r.pdfFile!, name: r.pdfName || 'sk_kepangkatan.pdf' })}
                                              className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100/80 rounded hover:bg-rose-100 text-[9px] text-rose-650 font-black transition-all cursor-pointer shadow-3xs"
                                            >
                                              <FileText className="w-2.5 h-2.5 text-rose-500" />
                                              <span>Lihat SK PDF</span>
                                            </button>
                                          )}
                                        </td>
                                        <td className="p-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedHistory = editStaffDraft?.riwayatKepangkatan?.filter(item => item.id !== r.id) || [];
                                              setEditStaffDraft({
                                                ...editStaffDraft!,
                                                riwayatKepangkatan: updatedHistory
                                              });
                                              syncMainPangkatWithHistory(updatedHistory);
                                            }}
                                            className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                      )}

                      {/* Subtab 3: RIWAYAT GAJI BERKALA */}
                      {editModalTab === 'gaji' && (
                        <div className="space-y-4">


                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                            <h4 className="font-bold text-[11px] text-slate-700 uppercase flex items-center gap-1.5">
                              <Plus className="w-3.5 h-3.5 text-blue-600" />
                              Kenaikan Gaji Berkala (KGB) Baru
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">TMT Gaji</label>
                                <input 
                                  type="date"
                                  value={newGajiTmt}
                                  onChange={(e) => setNewGajiTmt(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Gaji Pokok Baru (Rp)</label>
                                <input 
                                  type="number"
                                  placeholder="Contoh: 3420000"
                                  value={newGajiNominal || ''}
                                  onChange={(e) => setNewGajiNominal(Number(e.target.value))}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pejabat Penandatangan SK</label>
                                <input 
                                  type="text"
                                  placeholder="Contoh: Kepala Dinas PSDA / Gubernur"
                                  value={newGajiPejabat}
                                  onChange={(e) => setNewGajiPejabat(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nomor SK KGB</label>
                                <input 
                                  type="text"
                                  placeholder="Contoh: 822.4/052/KGB/VI/2023"
                                  value={newGajiNoSk}
                                  onChange={(e) => setNewGajiNoSk(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Tanggal SK</label>
                                <input 
                                  type="date"
                                  value={newGajiTglSk}
                                  onChange={(e) => setNewGajiTglSk(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-650 mb-1 flex items-center gap-1">
                                  <span>Unggah SK KGB (PDF)</span>
                                  <span className="text-slate-400 font-normal">(Maks. 8MB)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-150 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] font-black cursor-pointer text-slate-750 select-none shadow-3xs transition-all">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Pilih PDF</span>
                                    <input
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.type !== 'application/pdf') {
                                            alert('Hanya diperbolehkan format PDF (*.pdf)');
                                            return;
                                          }
                                          if (file.size > 8 * 1024 * 1024) {
                                            alert('Batas ukuran file PDF adalah 8MB');
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            setNewGajiPdfFile(ev.target?.result as string);
                                            setNewGajiPdfName(file.name);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {newGajiPdfName ? (
                                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg text-[10px] text-emerald-800 font-extrabold max-w-full">
                                      <FileIcon className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                      <span className="truncate max-w-[150px]">{newGajiPdfName}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewGajiPdfFile('');
                                          setNewGajiPdfName('');
                                        }}
                                        className="text-emerald-500 hover:text-emerald-700 cursor-pointer font-bold p-0.5 ml-1 shrink-0 bg-transparent border-none outline-none"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic font-medium">Belum ada file SK KGB diunggah</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newGajiTmt || !newGajiNominal || !newGajiNoSk) {
                                    alert('Mohon cantumkan tanggal TMT Gaji, Nominal Gaji Pokok, dan Nomor SK KGB.');
                                    return;
                                  }
                                  const items = editStaffDraft?.riwayatGaji || [];
                                  const newItem = {
                                    id: 'rg-' + Math.random().toString(36).substring(2, 9),
                                    tmtGaji: newGajiTmt,
                                    gajiPokok: newGajiNominal,
                                    noSk: newGajiNoSk,
                                    tglSk: newGajiTglSk,
                                    pejabatPenandatangan: newGajiPejabat,
                                    pdfFile: newGajiPdfFile || undefined,
                                    pdfName: newGajiPdfName || undefined
                                  };
                                  setEditStaffDraft({
                                    ...editStaffDraft!,
                                    riwayatGaji: [...items, newItem]
                                  });
                                  // Clear inputs
                                  setNewGajiTmt('');
                                  setNewGajiNominal(0);
                                  setNewGajiNoSk('');
                                  setNewGajiTglSk('');
                                  setNewGajiPejabat('');
                                  setNewGajiPdfFile('');
                                  setNewGajiPdfName('');
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" /> Tambah KGB Baru
                              </button>
                            </div>
                          </div>

                          {/* Gaji List table */}
                          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto shadow-inner">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-500">
                                  <th className="p-3 text-center w-8">No</th>
                                  <th className="p-3 w-24">TMT Gaji</th>
                                  <th className="p-3">Gaji Pokok Baru</th>
                                  <th className="p-3">SK KGB / Pejabat</th>
                                  <th className="p-3 text-center w-12">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {(!editStaffDraft?.riwayatGaji || editStaffDraft.riwayatGaji.length === 0) ? (
                                  <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-400 font-bold italic">Belum ada berkas KGB yang ditambahkan.</td>
                                  </tr>
                                ) : (
                                  editStaffDraft.riwayatGaji.map((r, i) => (
                                    <tr key={r.id}>
                                      <td className="p-3 text-center text-slate-400">{i + 1}</td>
                                      <td className="p-3 text-blue-600 font-mono font-bold">{formatToIndoDate(r.tmtGaji)}</td>
                                      <td className="p-3 font-bold text-emerald-600">Rp {(r.gajiPokok || 0).toLocaleString('id-ID')}</td>
                                      <td className="p-3">
                                        <div className="font-semibold text-slate-800 animate-none">SK: {r.noSk}</div>
                                        <div className="text-[10px] text-slate-400">Penandatangan: {r.pejabatPenandatangan || '-'} {r.tglSk && `| tgl SK ${formatToIndoDate(r.tglSk)}`}</div>
                                        {r.pdfFile && (
                                          <button
                                            type="button"
                                            onClick={() => setViewingHistoryPdf({ file: r.pdfFile!, name: r.pdfName || 'sk_gaji_berkala.pdf' })}
                                            className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100/80 rounded hover:bg-rose-100 text-[9px] text-rose-650 font-black transition-all cursor-pointer shadow-3xs animate-none"
                                          >
                                            <FileText className="w-2.5 h-2.5 text-rose-500 animate-none" />
                                            <span>Lihat SK PDF</span>
                                          </button>
                                        )}
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditStaffDraft({
                                              ...editStaffDraft!,
                                              riwayatGaji: editStaffDraft?.riwayatGaji?.filter(item => item.id !== r.id) || []
                                            });
                                          }}
                                          className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Subtab 4: RIWAYAT PENDIDIKAN */}
                      {editModalTab === 'pendidikan' && (
                        <div className="space-y-4">


                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                            <h4 className="font-bold text-[11px] text-slate-700 uppercase flex items-center gap-1.5">
                              <Plus className="w-3.5 h-3.5 text-blue-600" />
                              Tambah Pendidikan Formal Baru
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Jenjang</label>
                                <select 
                                  value={newEduJenjang}
                                  onChange={(e) => setNewEduJenjang(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="SD">SD (Sekolah Dasar)</option>
                                  <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                                  <option value="SMA">SMA/SMK (Sekolah Menengah Atas)</option>
                                  <option value="D3">D3 (Diploma Tiga)</option>
                                  <option value="D4">D4 (Diploma Empat)</option>
                                  <option value="S1">S1 (Sarjana I)</option>
                                  <option value="S2">S2 (Magister II)</option>
                                  <option value="S3">S3 (Doktoral III)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nama Institusi / Lembaga</label>
                                <input 
                                  type="text"
                                  placeholder="Contoh: SMA Negeri 1 / ITB"
                                  value={newEduInstitusi}
                                  onChange={(e) => setNewEduInstitusi(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Jurusan / Program Studi</label>
                                <input 
                                  type="text"
                                  placeholder="Contoh: IPS / Teknik Pengairan"
                                  value={newEduJurusan}
                                  onChange={(e) => setNewEduJurusan(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Tahun Lulus</label>
                                <input 
                                  type="text"
                                  placeholder="Contoh: 2015"
                                  value={newEduTahun}
                                  onChange={(e) => setNewEduTahun(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nomor SN / Ijazah Resmi</label>
                                <input 
                                  type="text"
                                  placeholder="Tulis nomor ijazah jika ada..."
                                  value={newEduNoIjazah}
                                  onChange={(e) => setNewEduNoIjazah(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-650 mb-1 flex items-center gap-1">
                                  <span>Unggah Ijazah / Dokumen Akademik (PDF)</span>
                                  <span className="text-slate-400 font-normal">(Maks. 8MB)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-150 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] font-black cursor-pointer text-slate-755 select-none shadow-3xs transition-all">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Pilih PDF</span>
                                    <input
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.type !== 'application/pdf') {
                                            alert('Hanya diperbolehkan format PDF (*.pdf)');
                                            return;
                                          }
                                          if (file.size > 8 * 1024 * 1024) {
                                            alert('Batas ukuran file PDF adalah 8MB');
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            setNewEduPdfFile(ev.target?.result as string);
                                            setNewEduPdfName(file.name);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {newEduPdfName ? (
                                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg text-[10px] text-emerald-800 font-extrabold max-w-full">
                                      <FileIcon className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                      <span className="truncate max-w-[150px]">{newEduPdfName}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewEduPdfFile('');
                                          setNewEduPdfName('');
                                        }}
                                        className="text-emerald-500 hover:text-emerald-700 cursor-pointer font-bold p-0.5 ml-1 shrink-0 bg-transparent border-none outline-none"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic font-medium">Belum ada file ijazah diunggah</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newEduInstitusi || !newEduTahun) {
                                    alert('Mohon sebutkan nama sekolah/institusi, dan tahun kelulusan anda.');
                                    return;
                                  }
                                  const items = editStaffDraft?.riwayatPendidikan || [];
                                  const newItem = {
                                    id: 're-' + Math.random().toString(36).substring(2, 9),
                                    jenjang: newEduJenjang,
                                    institusi: newEduInstitusi,
                                    jurusan: newEduJurusan || '-',
                                    tahunLulus: newEduTahun,
                                    noIjazah: newEduNoIjazah || '',
                                    pdfFile: newEduPdfFile || undefined,
                                    pdfName: newEduPdfName || undefined
                                  };
                                  setEditStaffDraft({
                                    ...editStaffDraft!,
                                    riwayatPendidikan: [...items, newItem]
                                  });
                                  // Clear inputs
                                  setNewEduJenjang('S1');
                                  setNewEduInstitusi('');
                                  setNewEduJurusan('');
                                  setNewEduTahun('');
                                  setNewEduNoIjazah('');
                                  setNewEduPdfFile('');
                                  setNewEduPdfName('');
                                }}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" /> Tambah Jenjang
                              </button>
                            </div>
                          </div>

                          {/* Education Table list */}
                          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto shadow-inner">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-500">
                                  <th className="p-3 text-center w-8">No</th>
                                  <th className="p-3 w-16 text-center">Jenjang</th>
                                  <th className="p-3">Institusi & Jurusan</th>
                                  <th className="p-3 w-20 text-center">Tahun Lulus</th>
                                  <th className="p-3 text-center w-12">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {(!editStaffDraft?.riwayatPendidikan || editStaffDraft.riwayatPendidikan.length === 0) ? (
                                  <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-400 font-bold italic">Belum ada riwayat pendidikan terlampir.</td>
                                  </tr>
                                ) : (
                                  editStaffDraft.riwayatPendidikan.map((r, i) => (
                                    <tr key={r.id}>
                                      <td className="p-3 text-center text-slate-400">{i + 1}</td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-md font-extrabold text-[10px] block">
                                          {r.jenjang}
                                        </span>
                                      </td>
                                      <td className="p-3 text-slate-800">
                                        <div className="font-bold">{r.institusi}</div>
                                        <div className="text-[10px] text-slate-500">Program Studi: {r.jurusan} {r.noIjazah && `| Ijazah: ${r.noIjazah}`}</div>
                                        {r.pdfFile && (
                                          <button
                                            type="button"
                                            onClick={() => setViewingHistoryPdf({ file: r.pdfFile!, name: r.pdfName || 'ijazah.pdf' })}
                                            className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100/80 rounded hover:bg-rose-100 text-[9px] text-rose-650 font-black transition-all cursor-pointer shadow-3xs"
                                          >
                                            <FileText className="w-2.5 h-2.5 text-rose-500" />
                                            <span>Lihat Ijazah PDF</span>
                                          </button>
                                        )}
                                      </td>
                                      <td className="p-3 text-center font-bold text-slate-600 font-mono">{r.tahunLulus}</td>
                                      <td className="p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditStaffDraft({
                                              ...editStaffDraft!,
                                              riwayatPendidikan: editStaffDraft?.riwayatPendidikan?.filter(item => item.id !== r.id) || []
                                            });
                                          }}
                                          className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Subtab 5: RIWAYAT ORANG TUA */}
                      {editModalTab === 'ortu' && (
                        <div className="space-y-4">
                          <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50 text-[11px] text-purple-700 font-medium">
                            Kelola data lengkap tentang Orang Tua (Ayah & Ibu) pegawai resmi bersangkutan untuk arsip keluarga dinas.
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Ayah */}
                            <div className="p-4 border border-slate-200 rounded-2xl space-y-3 bg-slate-50/30">
                              <h4 className="font-extrabold text-[11px] text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between uppercase tracking-tight">
                                <span>1. Biodata Ayah</span>
                                <span className="text-[9px] font-mono text-purple-600 font-bold">PATERNAL</span>
                              </h4>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Lengkap Ayah</label>
                                <input 
                                  type="text" 
                                  placeholder="Nama lengkap Ayah..."
                                  value={editStaffDraft?.riwayatOrangTua?.namaAyah || ''}
                                  onChange={(e) => updateDraftNested('riwayatOrangTua', 'namaAyah', e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-250 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Pekerjaan Ayah</label>
                                <input 
                                  type="text" 
                                  placeholder="Contoh: Pensiunan PNS / Petani"
                                  value={editStaffDraft?.riwayatOrangTua?.pekerjaanAyah || ''}
                                  onChange={(e) => updateDraftNested('riwayatOrangTua', 'pekerjaanAyah', e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-250 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            {/* Ibu */}
                            <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/30">
                              <h4 className="font-extrabold text-[11px] text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between uppercase tracking-tight">
                                <span>2. Biodata Ibu</span>
                                <span className="text-[9px] font-mono text-purple-600 font-bold">MATERNAL</span>
                              </h4>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Lengkap Ibu</label>
                                <input 
                                  type="text" 
                                  placeholder="Nama lengkap Ibu..."
                                  value={editStaffDraft?.riwayatOrangTua?.namaIbu || ''}
                                  onChange={(e) => updateDraftNested('riwayatOrangTua', 'namaIbu', e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-250 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Pekerjaan Ibu</label>
                                <input 
                                  type="text" 
                                  placeholder="Contoh: Ibu Rumah Tangga (IRT)"
                                  value={editStaffDraft?.riwayatOrangTua?.pekerjaanIbu || ''}
                                  onChange={(e) => updateDraftNested('riwayatOrangTua', 'pekerjaanIbu', e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-250 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subtab 6: RIWAYAT PASANGAN */}
                      {editModalTab === 'pasangan' && (
                        <div className="space-y-4">


                          <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-4 max-w-xl mx-auto shadow-sm">
                            <h4 className="font-bold text-[11px] text-slate-850 border-b border-slate-200 pb-1.5 flex items-center justify-between uppercase">
                              <span>Identitas Suami / Istri Sah</span>
                              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-650 mb-1">Klasifikasi Pasangan</label>
                                <select 
                                  value={editStaffDraft?.riwayatPasangan?.statusPasangan || 'Istri'}
                                  onChange={(e) => updateDraftNested('riwayatPasangan', 'statusPasangan', e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-250 rounded-xl text-slate-700 font-medium focus:outline-none cursor-pointer"
                                >
                                  <option value="Istri">Istri (Untuk Pegawai Laki-laki)</option>
                                  <option value="Suami">Suami (Untuk Pegawai Perempuan)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-650 mb-1">Nama Pasangan Lengkap</label>
                                <input 
                                  type="text" 
                                  placeholder="Nama lengkap suami/istri..."
                                  value={editStaffDraft?.riwayatPasangan?.namaPasangan || ''}
                                  onChange={(e) => updateDraftNested('riwayatPasangan', 'namaPasangan', e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-250 rounded-xl text-slate-700 font-bold focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-650 mb-1">Pekerjaan Pasangan</label>
                                <input 
                                  type="text" 
                                  placeholder="Contoh: Pegawai BUMN / Guru / IRT"
                                  value={editStaffDraft?.riwayatPasangan?.pekerjaan || ''}
                                  onChange={(e) => updateDraftNested('riwayatPasangan', 'pekerjaan', e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-250 rounded-xl text-slate-700 font-medium focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-650 mb-1">Tanggal Lahir</label>
                                <input 
                                  type="date" 
                                  value={editStaffDraft?.riwayatPasangan?.tanggalLahir || ''}
                                  onChange={(e) => updateDraftNested('riwayatPasangan', 'tanggalLahir', e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-250 rounded-xl text-slate-700 font-medium focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-650 mb-1">Tanggal Pernikahan Resmi</label>
                                <input 
                                  type="date" 
                                  value={editStaffDraft?.riwayatPasangan?.tanggalNikah || ''}
                                  onChange={(e) => updateDraftNested('riwayatPasangan', 'tanggalNikah', e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-250 rounded-xl text-slate-700 font-medium focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
                                <label className="block text-[10px] font-bold text-slate-650 mb-1 flex items-center gap-1">
                                  <span>Unggah Buku Nikah / Dokumen Pasangan (PDF)</span>
                                  <span className="text-slate-400 font-normal">(Maks. 8MB)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-150 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] font-black cursor-pointer text-slate-750 select-none shadow-3xs transition-all pointer-events-auto">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Pilih PDF</span>
                                    <input
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.type !== 'application/pdf') {
                                            alert('Hanya diperbolehkan format PDF (*.pdf)');
                                            return;
                                          }
                                          if (file.size > 8 * 1024 * 1024) {
                                            alert('Batas ukuran file PDF adalah 8MB');
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            updateDraftNested('riwayatPasangan', 'pdfFile', ev.target?.result as string);
                                            updateDraftNested('riwayatPasangan', 'pdfName', file.name);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {editStaffDraft?.riwayatPasangan?.pdfFile ? (
                                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg text-[10px] text-emerald-850 font-extrabold max-w-full">
                                      <FileIcon className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                      <span className="truncate max-w-[130px]">{editStaffDraft.riwayatPasangan.pdfName || 'dokumen_pasangan.pdf'}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateDraftNested('riwayatPasangan', 'pdfFile', '');
                                          updateDraftNested('riwayatPasangan', 'pdfName', '');
                                        }}
                                        className="text-emerald-500 hover:text-emerald-700 cursor-pointer font-bold p-0.5 ml-1 shrink-0 bg-transparent border-none outline-none"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setViewingHistoryPdf({ file: editStaffDraft.riwayatPasangan!.pdfFile!, name: editStaffDraft.riwayatPasangan!.pdfName || 'buku_nikah.pdf' })}
                                        className="ml-1 px-1.5 py-0.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-[9px] font-black cursor-pointer shadow-3xs"
                                      >
                                        Lihat PDF
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic font-medium">Belum ada file dokumen pasangan diunggah</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subtab 7: RIWAYAT ANAK */}
                      {editModalTab === 'anak' && (
                        <div className="space-y-4">
                          <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/50 text-[11px] text-rose-700 font-medium">
                            Kelola data seluruh anak kandung / tiri / angkat sah demi pengurusan hak tunjangan/keluarga pegawai.
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                            <h4 className="font-bold text-[11px] text-slate-700 uppercase flex items-center gap-1.5">
                              <Plus className="w-3.5 h-3.5 text-blue-600" />
                              Tambah Data Anak Baru
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nama Anak Kandung/Sah</label>
                                <input 
                                  type="text"
                                  placeholder="Nama lengkap anak..."
                                  value={newAnakNama}
                                  onChange={(e) => setNewAnakNama(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Jenis Kelamin</label>
                                <select 
                                  value={newAnakJkel}
                                  onChange={(e) => setNewAnakJkel(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none cursor-pointer"
                                >
                                  <option value="Laki-laki">Laki-laki</option>
                                  <option value="Perempuan">Perempuan</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Tanggal Lahir</label>
                                <input 
                                  type="date"
                                  value={newAnakTglLahir}
                                  onChange={(e) => setNewAnakTglLahir(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Status Hubungan</label>
                                <select 
                                  value={newAnakStatus}
                                  onChange={(e) => setNewAnakStatus(e.target.value)}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-[11px] focus:outline-none cursor-pointer"
                                >
                                  <option value="Anak Kandung">Anak Kandung</option>
                                  <option value="Anak Angkat">Anak Angkat</option>
                                  <option value="Anak Tiri">Anak Tiri</option>
                                </select>
                              </div>
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-bold text-slate-650 mb-1 flex items-center gap-1">
                                  <span>Unggah Akta Kelahiran / KIA (PDF)</span>
                                  <span className="text-slate-400 font-normal">(Maks. 8MB)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-150 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] font-black cursor-pointer text-slate-750 select-none shadow-3xs transition-all">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Pilih PDF</span>
                                    <input
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.type !== 'application/pdf') {
                                            alert('Hanya diperbolehkan format PDF (*.pdf)');
                                            return;
                                          }
                                          if (file.size > 8 * 1024 * 1024) {
                                            alert('Batas ukuran file PDF adalah 8MB');
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            setNewAnakPdfFile(ev.target?.result as string);
                                            setNewAnakPdfName(file.name);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {newAnakPdfName ? (
                                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg text-[10px] text-emerald-800 font-extrabold max-w-full">
                                      <FileIcon className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                      <span className="truncate max-w-[150px]">{newAnakPdfName}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewAnakPdfFile('');
                                          setNewAnakPdfName('');
                                        }}
                                        className="text-emerald-500 hover:text-emerald-700 cursor-pointer font-bold p-0.5 ml-1 shrink-0 bg-transparent border-none outline-none"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic font-medium">Belum ada file dokumen anak diunggah</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newAnakNama || !newAnakTglLahir) {
                                    alert('Mohon sebutkan nama lengkap anak serta tanggal lahir anak.');
                                    return;
                                  }
                                  const items = editStaffDraft?.riwayatAnak || [];
                                  const newItem = {
                                    id: 'ra-' + Math.random().toString(36).substring(2, 9),
                                    namaAnak: newAnakNama,
                                    tanggalLahir: newAnakTglLahir,
                                    jenisKelamin: newAnakJkel,
                                    statusAnak: newAnakStatus,
                                    pdfFile: newAnakPdfFile || undefined,
                                    pdfName: newAnakPdfName || undefined
                                  };
                                  setEditStaffDraft({
                                    ...editStaffDraft!,
                                    riwayatAnak: [...items, newItem]
                                  });
                                  // Clear inputs
                                  setNewAnakNama('');
                                  setNewAnakTglLahir('');
                                  setNewAnakJkel('Laki-laki');
                                  setNewAnakStatus('Anak Kandung');
                                  setNewAnakPdfFile('');
                                  setNewAnakPdfName('');
                                }}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" /> Daftarkan Anak
                              </button>
                            </div>
                          </div>

                          {/* Kids table list */}
                          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto shadow-inner">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-500">
                                  <th className="p-2.5 text-center w-8">No</th>
                                  <th className="p-2.5">Nama Lengkap Anak</th>
                                  <th className="p-2.5">Gender</th>
                                  <th className="p-2.5 text-center">Tanggal Lahir</th>
                                  <th className="p-2.5">Status Hubungan</th>
                                  <th className="p-2.5 text-center w-12">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {(!editStaffDraft?.riwayatAnak || editStaffDraft.riwayatAnak.length === 0) ? (
                                  <tr>
                                    <td colSpan={6} className="p-5 text-center text-slate-400 font-bold italic">Belum ada data anak terlampir.</td>
                                  </tr>
                                ) : (
                                  editStaffDraft.riwayatAnak.map((r, i) => (
                                    <tr key={r.id}>
                                      <td className="p-2.5 text-center text-slate-400">{i + 1}</td>
                                      <td className="p-2.5 font-bold text-slate-800">
                                        <div>{r.namaAnak}</div>
                                        {r.pdfFile && (
                                          <button
                                            type="button"
                                            onClick={() => setViewingHistoryPdf({ file: r.pdfFile!, name: r.pdfName || 'akta_kelahiran.pdf' })}
                                            className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100/80 rounded hover:bg-rose-100 text-[9px] text-rose-650 font-black transition-all cursor-pointer shadow-3xs"
                                          >
                                            <FileText className="w-2.5 h-2.5 text-rose-500" />
                                            <span>Lihat Akta PDF</span>
                                          </button>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-slate-600">{r.jenisKelamin}</td>
                                      <td className="p-2.5 text-center font-mono font-bold text-slate-600">{formatToIndoDate(r.tanggalLahir)}</td>
                                      <td className="p-2.5">
                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full font-bold text-[10px]">
                                          {r.statusAnak}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditStaffDraft({
                                              ...editStaffDraft!,
                                              riwayatAnak: editStaffDraft?.riwayatAnak?.filter(item => item.id !== r.id) || []
                                            });
                                          }}
                                          className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Master Actions at edit-level bottom */}
                    <div className="md:col-span-4 flex justify-end gap-2 pt-4 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsStaffFormOpen(false);
                          setEditingStaff(null);
                          setEditStaffDraft(null);
                          setStaffName('');
                          setStaffNip('');
                          setStaffPosition('');
                          setStaffPangkat('');
                          setStaffGolongan('');
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-750 font-extrabold rounded-xl transition-all cursor-pointer"
                      >
                        Batalkan Sesi
                      </button>
                      <button 
                        type="button"
                        onClick={handleStaffSubmit}
                        id="submit-staff-form-edit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
                      >
                        Simpan Semua Riwayat Perubahan
                      </button>
                    </div>

                  </div>
                ) : (
                  /* ADD MODE: ORIGINAL MINI-FORM LAYOUTS FOR ONBOARDING */
                  <form onSubmit={handleStaffSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs select-none">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Hadi Wijaya, S.T."
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai) <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="Contoh: 19820415 201001 1 008"
                        value={staffNip}
                        onChange={(e) => setStaffNip(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pangkat <span className="text-red-500">*</span></label>
                      <select 
                        value={staffPangkat}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStaffPangkat(val);
                          const matched = RANK_MAPPINGS.find(r => r.pangkat === val);
                          if (matched) {
                            setStaffGolongan(matched.golongan);
                          } else {
                            setStaffGolongan('');
                          }
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                        required
                      >
                        <option value="">-- Pilih Jenjang Kepangkatan --</option>
                        {RANK_MAPPINGS.map((rm) => (
                          <option key={rm.pangkat} value={rm.pangkat}>
                            {rm.pangkat} ({rm.golongan})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Golongan Ruang <span className="text-blue-600 font-semibold ml-1">(Otomatis)</span></label>
                      <input 
                        type="text" 
                        placeholder="Terisi otomatis setelah memilih pangkat..."
                        value={staffGolongan ? `Golongan ${staffGolongan}` : ''}
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold focus:outline-none cursor-not-allowed"
                        readOnly
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Jabatan / Kedudukan Dinas <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Kepala Seksi Pembangunan"
                        value={staffPosition}
                        onChange={(e) => setStaffPosition(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsStaffFormOpen(false);
                          setEditingStaff(null);
                          setStaffName('');
                          setStaffNip('');
                          setStaffPosition('');
                          setStaffPangkat('');
                          setStaffGolongan('');
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit" 
                        id="submit-staff-form"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-sm shadow-emerald-600/10 cursor-pointer"
                      >
                        Daftarkan Pegawai Resmi
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}

          {/* Table view of Employee Directory */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="staff-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">Nama Lengkap & NIP</th>
                    <th className="p-4">Pangkat & Golongan</th>
                    <th className="p-4">Jabatan / Kedudukan</th>
                    {showStaffActionsColumn && <th className="p-4 text-center w-32">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((person, index) => (
                      <tr key={person.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {person.photo ? (
                                <img 
                                  src={person.photo} 
                                  alt={person.name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <UserIcon className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 text-sm truncate max-w-xs">{person.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center">
                                <CreditCard className="w-3.5 h-3.5 mr-1 shrink-0" />
                                <span className="truncate">NIP: {person.nip}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs text-slate-700 font-medium bg-slate-50 border border-slate-100 rounded px-2 py-0.5 w-fit">
                            {person.pangkat || '-'}
                          </div>
                          <div className="inline-block mt-1 theme-badge text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wide bg-blue-50 border-blue-150 text-blue-800">
                             {person.golongan}
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{person.position}</td>
                        {showStaffActionsColumn && (
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {canEditThisStaff(person.nip) ? (
                                <button
                                  onClick={() => handleStartEditStaff(person)}
                                  className="inline-flex text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg text-[10px] font-bold items-center transition-colors cursor-pointer border border-transparent hover:border-blue-150"
                                  id={`edit-staff-${person.id}`}
                                  title="Ubah Data Pegawai"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400" title="Anda hanya dapat mengubah data personalia sendiri">-</span>
                              )}
                              {canDeleteThisStaff() && (
                                <button
                                  onClick={() => onDeleteStaff(person.id)}
                                  className="inline-flex text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg text-[10px] font-bold items-center transition-colors cursor-pointer border border-transparent hover:border-red-150"
                                  id={`delete-staff-${person.id}`}
                                  title="Hapus Pegawai"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={showStaffActionsColumn ? 5 : 4} className="p-8 text-center text-slate-400 font-medium">
                        Tidak ada pegawai terdaftar dengan kata kunci tersebut.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ASET & INVENTARIS */}
      {activeSubTab === 'aset_inventaris' && (
        <div className="space-y-4" id="assets-panel">
          
          {/* Navigation Bar for Asset Subpages */}
          <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1.5 scrollbar-thin overflow-x-auto">
            <button
              onClick={() => setAssetSubTab('inventaris_kib')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                assetSubTab === 'inventaris_kib'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Inventaris Aset (KIB A s.d. F)</span>
            </button>
            <button
              onClick={() => setAssetSubTab('distribusi')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                assetSubTab === 'distribusi'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Distribusi Aset Dinas</span>
            </button>
            <button
              onClick={() => setAssetSubTab('persediaan')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                assetSubTab === 'persediaan'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Persediaan (Barang Habis Pakai)</span>
            </button>
          </div>

          {/* 1. SUBPAGE: INVENTARIS ASET (KIB A s.d F) */}
          {assetSubTab === 'inventaris_kib' && (
            <div className="space-y-4">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Macam Aset</div>
                    <div className="text-xl font-bold text-slate-800">{assets.length} item</div>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 text-emerald-600 rounded-xl bg-emerald-50 flex items-center justify-center font-bold">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Kondisi Baik (Terawat)</div>
                    <div className="text-xl font-bold text-slate-800">
                      {assets.filter(a => a.condition === 'Baik').reduce((acc, curr) => acc + curr.quantity, 0)} Pcs
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 text-amber-600 rounded-xl bg-amber-50 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Rusak / Servis</div>
                    <div className="text-xl font-bold text-slate-800">
                      {assets.filter(a => a.condition !== 'Baik').reduce((acc, curr) => acc + curr.quantity, 0)} Pcs
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Header bar with KIB classification switcher */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col space-y-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="text-xs text-slate-500 font-medium">
                    Pilih klasifikasi <strong>Kartu Inventaris Barang (KIB)</strong> untuk melihat rincian register aset dinas:
                  </div>
                  {canWriteAset ? (
                    <button
                      onClick={() => setIsAssetFormOpen(!isAssetFormOpen)}
                      id="btn-add-asset"
                      className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs flex items-center space-x-1.5 shadow transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Registrasi KIB Baru</span>
                    </button>
                  ) : (
                    <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                      *Hanya staf Aset / Admin yang dapat mengedit KIB
                    </div>
                  )}
                </div>

                {/* Horizontal Tab Filters for KIB classifications */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(['ALL', 'KIB A', 'KIB B', 'KIB C', 'KIB D', 'KIB E', 'KIB F'] as const).map((kib) => {
                    const kibNames: Record<string, string> = {
                      ALL: 'Semua KIB',
                      'KIB A': 'KIB A (Tanah)',
                      'KIB B': 'KIB B (Peralatan & Mesin)',
                      'KIB C': 'KIB C (Gedung & Bangunan)',
                      'KIB D': 'KIB D (Jalan, Irigasi & Jaringan)',
                      'KIB E': 'KIB E (Aset Tetap Lain)',
                      'KIB F': 'KIB F (Kontruksi Dlm Pengerjaan)'
                    };
                    return (
                      <button
                        key={kib}
                        onClick={() => setActiveKibFilter(kib)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          activeKibFilter === kib
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {kibNames[kib]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form to insert asset item */}
              {isAssetFormOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => {
                  setIsAssetFormOpen(false);
                  setEditingAsset(null);
                  setAssetName('');
                  setAssetCode('');
                  setAssetCondition('Baik');
                  setAssetLocation('');
                  setAssetQuantity(1);
                  setAssetDate('');
                  setAssetKibCategory('KIB B');
                  setAssetPrice(0);
                  setAssetBrand('');
                  setAssetNotes('');
                }}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-3xl text-xs max-h-[90vh] overflow-y-auto"
                    id="asset-form-container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center">
                        <Sliders className="w-4 h-4 text-blue-600 mr-2" />
                        {editingAsset ? 'Perbarui Data Kartu Inventaris Barang (KIB)' : 'Formulir Pengadaan / Registrasi KIB Baru'}
                      </h3>
                      <button
                        onClick={() => {
                          setIsAssetFormOpen(false);
                          setEditingAsset(null);
                          setAssetName('');
                          setAssetCode('');
                          setAssetCondition('Baik');
                          setAssetLocation('');
                          setAssetQuantity(1);
                          setAssetDate('');
                          setAssetKibCategory('KIB B');
                          setAssetPrice(0);
                          setAssetBrand('');
                          setAssetNotes('');
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleAssetSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nama Barang / Aset <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Mesin Pompa Air Diesel Honda, GPS"
                          value={assetName}
                          onChange={(e) => setAssetName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kode Register Aset <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="Contoh: 1.3.1.02.05.001.002"
                          value={assetCode}
                          onChange={(e) => setAssetCode(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Klasifikasi KIB <span className="text-red-500">*</span></label>
                        <select 
                          value={assetKibCategory} 
                          onChange={(e: any) => setAssetKibCategory(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                          required
                        >
                          <option value="KIB A">KIB A (Tanah)</option>
                          <option value="KIB B">KIB B (Peralatan & Mesin)</option>
                          <option value="KIB C">KIB C (Gedung & Bangunan)</option>
                          <option value="KIB D">KIB D (Jalan, Irigasi & Jaringan)</option>
                          <option value="KIB E">KIB E (Aset Tetap Lainnya)</option>
                          <option value="KIB F">KIB F (Konstruksi Dalam Pengerjaan)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Merek / Model / Ukuran</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Honda GX390 / Topcon GT-100"
                          value={assetBrand}
                          onChange={(e) => setAssetBrand(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kuantitas Jumlah Unit <span className="text-red-500">*</span></label>
                        <input 
                          type="number" 
                          min="1"
                          value={assetQuantity}
                          onChange={(e) => setAssetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kondisi Fisik Saat Ini <span className="text-red-500">*</span></label>
                        <select 
                          value={assetCondition} 
                          onChange={(e: any) => setAssetCondition(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                          required
                        >
                          <option value="Baik">🟢 Baik (Siap Operasi)</option>
                          <option value="Rusak Ringan">🟡 Rusak Ringan (Perlu Servis)</option>
                          <option value="Rusak Berat">🔴 Rusak Berat (Rusak Total)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Lokasi Penempatan <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Gudang Induk, Pos Pengamat Air Selesai"
                          value={assetLocation}
                          onChange={(e) => setAssetLocation(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nilai Harga Perolehan (Rp)</label>
                        <input 
                          type="number" 
                          placeholder="Contoh: 15000000"
                          value={assetPrice || ''}
                          onChange={(e) => setAssetPrice(Number(e.target.value) || 0)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tanggal Perolehan / Pembelian <span className="text-red-500">*</span></label>
                        <input 
                          type="date" 
                          value={assetDate}
                          onChange={(e) => setAssetDate(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block font-bold text-slate-700 mb-1">Keterangan / Deskripsi Lainnya</label>
                        <textarea 
                          placeholder="Tambahkan catatan khusus mengenai perolehan aset, spesifikasi teknis, nomor mesin, rangka dsb."
                          value={assetNotes}
                          onChange={(e) => setAssetNotes(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setIsAssetFormOpen(false);
                            setEditingAsset(null);
                            setAssetName('');
                            setAssetCode('');
                            setAssetCondition('Baik');
                            setAssetLocation('');
                            setAssetQuantity(1);
                            setAssetDate('');
                            setAssetKibCategory('KIB B');
                            setAssetPrice(0);
                            setAssetBrand('');
                            setAssetNotes('');
                          }}
                          className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl cursor-pointer transition-colors"
                        >
                          Batal
                        </button>
                        <button 
                          type="submit" 
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl cursor-pointer transition-colors shadow-sm"
                        >
                          {editingAsset ? 'Simpan Perubahan' : 'Daftarkan Ke SIM KIB'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Table rendering for select KIB Category */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" id="assets-table">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-150">
                        <th className="p-4 w-12 text-center">No-Rsg</th>
                        <th className="p-4">Klasifikasi KIB</th>
                        <th className="p-4">Nama Aset / Informasi Detail</th>
                        <th className="p-4">Kondisi</th>
                        <th className="p-4 text-center">Jumlah</th>
                        <th className="p-4 text-right">Nilai Perolehan</th>
                        <th className="p-4">Lokasi / Penempatan</th>
                        <th className="p-4">Tgl Beli</th>
                        {currentUser.role === 'admin' && <th className="p-4 text-center w-24">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {assets.filter(a => activeKibFilter === 'ALL' || a.kibCategory === activeKibFilter).length > 0 ? (
                        assets.filter(a => activeKibFilter === 'ALL' || a.kibCategory === activeKibFilter).map((asset, idx) => (
                          <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono text-slate-400 text-center">{idx + 1}</td>
                            <td className="p-4">
                              <span className="bg-blue-50 text-blue-700 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border border-blue-150">
                                {asset.kibCategory || 'KIB B'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-800 text-sm">{asset.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono tracking-wider">No. Reg: {asset.code}</div>
                              {asset.brand && <div className="text-[10px] text-slate-500 italic">Merek: {asset.brand}</div>}
                              {asset.notes && <div className="text-[10px] text-slate-400 line-clamp-1">Ket: {asset.notes}</div>}
                            </td>
                            <td className="p-4">
                              {asset.condition === 'Baik' && (
                                <span className="bg-emerald-100/70 text-emerald-800 border border-emerald-200 py-0.5 px-2 rounded-full font-bold text-[9px]">
                                  🟢 Baik
                                </span>
                              )}
                              {asset.condition === 'Rusak Ringan' && (
                                <span className="bg-amber-100/70 text-amber-800 border border-amber-200 py-0.5 px-2 rounded-full font-bold text-[9px]">
                                  🟡 Rusak Ringan
                                </span>
                              )}
                              {asset.condition === 'Rusak Berat' && (
                                <span className="bg-red-100/70 text-red-800 border border-red-200 py-0.5 px-2 rounded-full font-bold text-[9px]">
                                  🔴 Rusak Berat
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-750">{asset.quantity} Unit</td>
                            <td className="p-4 text-right font-mono font-bold text-blue-600">
                              {asset.price ? `Rp ${asset.price.toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td className="p-4 font-medium text-slate-600">{asset.location}</td>
                            <td className="p-4 text-slate-400 font-mono">{formatToIndoDate(asset.purchaseDate)}</td>
                            {currentUser.role === 'admin' && (
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEditAsset(asset)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors inline-block cursor-pointer"
                                    title="Ubah Data Aset"
                                    id={`edit-asset-${asset.id}`}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteAsset(asset.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-block cursor-pointer"
                                    title="Hapus / Lepas Aset"
                                    id={`delete-asset-${asset.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={currentUser.role === 'admin' ? 9 : 8} className="p-12 text-center text-slate-400 font-bold font-mono">
                            Belum ada data Kartu Inventaris Barang (KIB) yang tergolong dalam klasifikasi {activeKibFilter}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. SUBPAGE: DISTRIBUSI ASET DINAS */}
          {assetSubTab === 'distribusi' && (
            <div className="space-y-4">
              
              <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-2xl flex items-center space-x-3.5">
                <div className="bg-blue-100 p-2 text-blue-700 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-slate-800">Manajemen Alokasi & Distribusi Penanggungjawab Aset UPTD</h4>
                  <p className="text-slate-500 mt-0.5">Catat kepemilikan dan hak penggunaan alat berat, instrumen ukur, komputer dinas, serta sarana penunjang langsung pada pegawai penanggungjawab resmi.</p>
                </div>
              </div>

              {/* Action and Form triggers */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                <div className="text-xs text-slate-500 font-bold">
                  Daftar Peminjaman & Distribusi Aset Aktif ({distributions.length} Alokasi Berlangsung)
                </div>
                {canWriteAset ? (
                  <button
                    onClick={() => setIsDistFormOpen(!isDistFormOpen)}
                    className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs flex items-center space-x-1 shadow transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Alokasi Distribusi</span>
                  </button>
                ) : (
                  <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                    *Hanya staf Aset / Admin yang dapat mengalokasi
                  </div>
                )}
              </div>

              {/* Form to insert distribution record */}
              {isDistFormOpen && (() => {
                const activeDistribution = distAssetId 
                  ? distributions.find(d => d.assetId === distAssetId && (d.status === 'dipakai' || d.status === 'dipinjam'))
                  : null;
                return (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => {
                    setIsDistFormOpen(false);
                    setDistAssetId('');
                    setDistStaffId('');
                    setDistQuantity(1);
                    setDistStatus('dipakai');
                    setDistAllocationDate('');
                    setDistCondition('Baik');
                    setDistNotes('');
                  }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-3xl text-xs max-h-[90vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-sidebar-100">
                        <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                          <Share2 className="w-4 h-4 text-blue-600" />
                          Formulir Distribusi Baru / Serah Terima Barang Milik Pegawai
                        </h3>
                        <button
                          onClick={() => {
                            setIsDistFormOpen(false);
                            setDistAssetId('');
                            setDistStaffId('');
                            setDistQuantity(1);
                            setDistStatus('dipakai');
                            setDistAllocationDate('');
                            setDistCondition('Baik');
                            setDistNotes('');
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (activeDistribution) {
                            alert('Gagal: Aset ini masih dalam status dipakai / dipinjam dan tidak dapat didistribusikan saat ini!');
                            return;
                          }
                          if (!distAssetId || !distStaffId || distQuantity <= 0 || !distStatus || !distAllocationDate) {
                            alert('Harap isi semua kolom wajib pada formulir distribusi.');
                            return;
                          }
                          const selectedAsset = assets.find(a => a.id === distAssetId);
                          const selectedStaff = staff.find(s => s.id === distStaffId);
                          if (!selectedAsset || !selectedStaff) {
                            alert('Aset atau staf yang dipilih tidak ditemukan.');
                            return;
                          }

                          const newDist: AssetDistribution = {
                            id: 'dist-' + Math.random().toString(36).substring(2, 9),
                            assetId: distAssetId,
                            assetName: selectedAsset.name,
                            staffId: distStaffId,
                            staffName: selectedStaff.name,
                            quantity: Number(distQuantity),
                            status: distStatus,
                            location: distStatus === 'dipakai' ? 'Sedang Dipakai' : distStatus === 'dipinjam' ? 'Sedang Dipinjam' : 'Sudah Dipulangkan',
                            allocationDate: distAllocationDate,
                            conditionAtAllocation: distCondition,
                            notes: distNotes
                          };

                          setDistributions([newDist, ...distributions]);
                          setIsDistFormOpen(false);

                          // reset
                          setDistAssetId('');
                          setDistStaffId('');
                          setDistQuantity(1);
                          setDistStatus('dipakai');
                          setDistAllocationDate('');
                          setDistCondition('Baik');
                          setDistNotes('');
                        }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
                      >
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Pilih Barang / Aset <span className="text-red-500">*</span></label>
                          <select
                            value={distAssetId}
                            onChange={(e) => setDistAssetId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
                            required
                          >
                            <option value="">-- Pilih Barang --</option>
                            {assets.map((a) => (
                              <option key={a.id} value={a.id}>{a.name} ({a.code}) - {a.quantity} Unit Tersedia</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Penerima Alokasi / Staf <span className="text-red-500">*</span></label>
                          <select
                            value={distStaffId}
                            onChange={(e) => setDistStaffId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
                            required
                          >
                            <option value="">-- Pilih Pegawai --</option>
                            {staff.map((s) => (
                              <option key={s.id} value={s.id}>{s.name} (NIP: {s.nip})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Kuantitas Distribusi <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            min="1"
                            value={distQuantity}
                            onChange={(e) => setDistQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">TMT Tanggal Penyerahan <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            value={distAllocationDate}
                            onChange={(e) => setDistAllocationDate(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Kondisi Serah Terima <span className="text-red-500">*</span></label>
                          <select
                            value={distCondition}
                            onChange={(e: any) => setDistCondition(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                            required
                          >
                            <option value="Baik">🟢 Baik (Siap Digunakan)</option>
                            <option value="Rusak Ringan">🟡 Rusak Ringan</option>
                            <option value="Rusak Berat">🔴 Rusak Berat</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Status Distribusi <span className="text-red-500">*</span></label>
                          <select
                            value={distStatus}
                            onChange={(e: any) => setDistStatus(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold"
                            required
                          >
                            <option value="dipakai">💻 Dipakai (Operasional Rutin)</option>
                            <option value="dipinjam">🔑 Dipinjam (Sementara)</option>
                            <option value="dipulangkan">↩️ Dipulangkan (Gudang/Persediaan)</option>
                          </select>
                        </div>

                        <div className="md:col-span-4">
                          <label className="block font-bold text-slate-700 mb-1 font-extrabold text-blue-700">Keterangan / Berita Acara Alokasi</label>
                          <input
                            type="text"
                            placeholder="Contoh: Dipinjamkan untuk memfasilitasi survei kedaulatan tanah di UPTD Selesai selama 3 bulan."
                            value={distNotes}
                            onChange={(e) => setDistNotes(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                          />
                        </div>

                        {/* EXPLANATION OF CURRENT ACTIVE STATUS AND BLOCKED SYSTEM */}
                        {activeDistribution && (
                          <div className="md:col-span-4 p-4.5 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-2">
                            <div className="flex items-center gap-1.5 text-red-800 font-extrabold">
                              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                              <span>ALOKASI BARANG DIBATALKAN: Barang Masih Dipakai atau Dipinjamkan!</span>
                            </div>
                            <div className="text-[11px] text-red-700 space-y-1.5 bg-white/70 p-3.5 rounded-xl border border-red-100 font-medium animate-fade-in">
                              <p className="font-bold underline">Detail &amp; Keterangan Status Barang Saat Ini:</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                                <div>&bull; <strong>Nama Barang:</strong> {activeDistribution.assetName}</div>
                                <div>&bull; <strong>Status Alokasi:</strong> <span className="uppercase font-black px-2 py-0.5 rounded text-[9px] bg-red-100 text-red-800">{activeDistribution.status === 'dipakai' ? 'DIPAKAI' : 'DIPINJAM'}</span></div>
                                <div>&bull; <strong>Penanggung Jawab:</strong> {activeDistribution.staffName}</div>
                                <div>&bull; <strong>TMT Tanggal Penyerahan:</strong> {formatToIndoDate(activeDistribution.allocationDate)}</div>
                                <div>&bull; <strong>Kondisi Unit:</strong> {activeDistribution.conditionAtAllocation}</div>
                              </div>
                              {activeDistribution.notes && (
                                <p className="mt-1 pl-1 italic bg-white/50 p-2 rounded border border-red-50">
                                  <strong>Catatan:</strong> "{activeDistribution.notes}"
                                </p>
                              )}
                              <p className="text-[10px] text-red-600 font-bold border-t border-red-100 pt-2 mt-1">
                                *Data tidak dapat didistribusikan karena unit masih dalam kepemilikan aktif pegawai lain. Pulangkan aset terlebih dahulu menggunakan aksi "Recall Aset" di tabel kearsipan.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDistFormOpen(false);
                              setDistAssetId('');
                              setDistStaffId('');
                              setDistQuantity(1);
                              setDistStatus('dipakai');
                              setDistAllocationDate('');
                              setDistCondition('Baik');
                              setDistNotes('');
                            }}
                            className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={!!activeDistribution}
                            className={`px-5 py-2.5 text-white font-extrabold rounded-xl cursor-pointer shadow-sm transition-all ${
                              activeDistribution 
                                ? 'bg-slate-300 border-slate-200 text-slate-500 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            Serahkan / Catat Alokasi
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                );
              })()}

              {/* Table of Distributions */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs select-none">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <th className="p-4 w-12 text-center">No</th>
                        <th className="p-4">Barang / Aset yang Didistribusikan</th>
                        <th className="p-4">Pegawai Penanggung Jawab</th>
                        <th className="p-4 text-center">Jumlah Alokasi</th>
                        <th className="p-4">TMT Penyerahan</th>
                        <th className="p-4">Kondisi Serah</th>
                        <th className="p-4">Status &amp; Berita Acara</th>
                        {currentUser.role === 'admin' && <th className="p-4 text-center w-24">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700 font-medium">
                      {distributions.length > 0 ? (
                        distributions.map((d, index) => (
                          <tr key={d.id} className="hover:bg-slate-50/20 transition-all">
                            <td className="p-4 text-center font-mono text-slate-400">{index + 1}</td>
                            <td className="p-4">
                              <span className="font-extrabold text-slate-800 text-xs block">{d.assetName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Asset Ref ID: {d.assetId}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-800 text-xs block">{d.staffName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Recipient ID: {d.staffId}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="bg-blue-50 text-blue-800 font-bold border border-blue-150 py-0.5 px-2 rounded-full">
                                {d.quantity} Unit
                              </span>
                            </td>
                            <td className="p-4 text-blue-600 font-mono">{formatToIndoDate(d.allocationDate)}</td>
                            <td className="p-4">
                              {d.conditionAtAllocation === 'Baik' && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200">🟢 Baik</span>
                              )}
                              {d.conditionAtAllocation === 'Rusak Ringan' && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200">🟡 Rusak Ringan</span>
                              )}
                              {d.conditionAtAllocation === 'Rusak Berat' && (
                                <span className="bg-red-100 text-red-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-200">🔴 Rusak Berat</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-bold">
                                {d.status === 'dipakai' && <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-1 rounded-full border border-blue-200">💻 Dipakai</span>}
                                {d.status === 'dipinjam' && <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-full border border-amber-200">🔑 Dipinjam</span>}
                                {d.status === 'dipulangkan' && <span className="bg-slate-105 bg-slate-100 text-slate-800 text-[10px] font-black px-2 py-1 rounded-full border border-slate-200">↩️ Dipulangkan</span>}
                                {!d.status && <span className="text-slate-600 italic">Pos: {d.location}</span>}
                              </div>
                              {d.notes && <div className="text-[10px] text-slate-400 mt-1 italic">Catatan: "{d.notes}"</div>}
                            </td>
                            {currentUser.role === 'admin' && (
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => {
                                    if (confirm('Ubah status alokasi distribusi ini? Anda mengonfirmasi pemulangan barang ke persediaan umum.')) {
                                      setDistributions(distributions.filter(dist => dist.id !== d.id));
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 border border-red-200 hover:border-red-300 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                                  title="Pulangkan / Kembalikan Barang"
                                >
                                  Recall Aset
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={currentUser.role === 'admin' ? 8 : 7} className="p-12 text-center text-slate-400 font-bold italic">
                            Belum ada satupun register distribusi barang/alat yang tercatat aktif ke pegawai dinas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. SUBPAGE: PERSEDIAAN (BARANG HABIS PAKAI) */}
          {assetSubTab === 'persediaan' && (
            <div className="space-y-4">
              
              {/* Supply widgets metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Macam Persediaan</div>
                    <div className="text-xl font-bold text-slate-800">{supplies.length} Jenis Item</div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 text-emerald-600 rounded-xl bg-emerald-50 flex items-center justify-center font-bold">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Persediaan Aman</div>
                    <div className="text-xl font-bold text-slate-800">
                      {supplies.filter(s => s.stock > s.minStock).length} Item
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 animate-pulse">
                  <div className="h-10 w-10 text-rose-600 bg-rose-50 rounded-xl flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Stok Menipis / Perlu Beli</div>
                    <div className="text-xl font-bold text-slate-800 text-rose-600">
                      {supplies.filter(s => s.stock <= s.minStock).length} Jenis Item
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Filter row */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col space-y-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="text-xs text-slate-500 font-bold">
                    Inventaris Barang Persediaan Habis Pakai (ATK, Suku Cadang, & Bahan Bakar Operasional UPTD)
                  </div>
                  {canWriteAset ? (
                    <button
                      onClick={() => {
                        setEditingSupply(null);
                        setIsSupplyFormOpen(!isSupplyFormOpen);
                        setSupName('');
                        setSupStock(0);
                        setSupUnit('Pcs');
                        setSupMinStock(1);
                        setSupLocation('');
                      }}
                      className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs flex items-center space-x-1.5 shadow transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Item Persediaan</span>
                    </button>
                  ) : (
                    <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                      *Hanya staf Aset / Admin yang dapat meregistrasi stock
                    </div>
                  )}
                </div>

                {/* Sub category switcher for supplies */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(['ALL', 'ATK', 'Bahan Bakar/Oli', 'Alat Bersih', 'Suku Cadang', 'Lainnya'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveSupplyFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        activeSupplyFilter === cat
                          ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'ALL' ? 'Semua Persediaan' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form to insert details or edit consumable supplies */}
              {isSupplyFormOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => {
                  setIsSupplyFormOpen(false);
                  setEditingSupply(null);
                  setSupName('');
                  setSupStock(0);
                  setSupUnit('Pcs');
                  setSupMinStock(1);
                  setSupLocation('');
                }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-3xl text-xs max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                      <h3 className="font-bold text-xs text-slate-800 flex items-center uppercase gap-2">
                        <Inbox className="w-4 h-4 text-purple-600" />
                        {editingSupply ? `Update Item Persediaan: ${editingSupply.itemName}` : 'Daftarkan Barang Habis Pakai Baru'}
                      </h3>
                      <button
                        onClick={() => {
                          setIsSupplyFormOpen(false);
                          setEditingSupply(null);
                          setSupName('');
                          setSupStock(0);
                          setSupUnit('Pcs');
                          setSupMinStock(1);
                          setSupLocation('');
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!supName || supStock < 0 || !supLocation || !supUnit) {
                          alert('Silakan isi kolom Nama, Jumlah Stok, Satuan, dan Lokasi.');
                          return;
                        }

                        if (editingSupply) {
                          const updated = supplies.map(s => {
                            if (s.id === editingSupply.id) {
                              return {
                                ...s,
                                itemName: supName,
                                category: supCategory,
                                stock: Number(supStock),
                                unit: supUnit,
                                minStock: Number(supMinStock),
                                location: supLocation,
                                lastUpdated: new Date().toISOString().split('T')[0]
                              };
                            }
                            return s;
                          });
                          setSupplies(updated);
                          setEditingSupply(null);
                        } else {
                          const newSup: ConsumableSupply = {
                            id: 'sup-' + Math.random().toString(36).substring(2, 9),
                            itemName: supName,
                            category: supCategory,
                            stock: Number(supStock),
                            unit: supUnit,
                            minStock: Number(supMinStock),
                            location: supLocation,
                            lastUpdated: new Date().toISOString().split('T')[0],
                            history: [
                              {
                                id: 'sh-' + Math.random().toString(36).substring(2, 9),
                                date: new Date().toISOString().split('T')[0],
                                type: 'Masuk',
                                quantity: Number(supStock),
                                notes: 'Registrasi saldo awal stok barang habis pakai',
                                recordedBy: currentUser.name
                              }
                            ]
                          };
                          setSupplies([newSup, ...supplies]);
                        }

                        setIsSupplyFormOpen(false);
                        setSupName('');
                        setSupStock(0);
                        setSupUnit('Pcs');
                        setSupMinStock(1);
                        setSupLocation('');
                      }}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs"
                    >
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nama Barang Persediaan <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Contoh: Kertas A4 PaperOne, Pembersih Lantai"
                          value={supName}
                          onChange={(e) => setSupName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kategori Persediaan <span className="text-red-500">*</span></label>
                        <select
                          value={supCategory}
                          onChange={(e: any) => setSupCategory(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                          required
                        >
                          <option value="ATK">ATK (Alat Tulis Kantor)</option>
                          <option value="Bahan Bakar/Oli">Bahan Bakar & Pelumas Oli</option>
                          <option value="Alat Bersih">Alat Pembersih Kantor</option>
                          <option value="Suku Cadang">Suku Cadang / Servis Sipil</option>
                          <option value="Lainnya">Barang Lain-lain</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Jumlah Stok Fisik <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          min="0"
                          value={supStock}
                          onChange={(e) => setSupStock(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                          disabled={!!editingSupply} // Only modify through stock adjuster for exists
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Satuan <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Contoh: Rim, Botol, Pcs, Liter, Galon"
                          value={supUnit}
                          onChange={(e) => setSupUnit(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Limit Stok Minimal (Alarm Menipis) </label>
                        <input
                          type="number"
                          min="0"
                          value={supMinStock}
                          onChange={(e) => setSupMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block font-bold text-slate-700 mb-1">Detail Tempat Penyimpanan <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Contoh: Lemari Kayu Ruang TU, Gudang APD Sektor Selatan"
                          value={supLocation}
                          onChange={(e) => setSupLocation(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                          required
                        />
                      </div>

                      <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSupplyFormOpen(false);
                            setEditingSupply(null);
                            setSupName('');
                            setSupStock(0);
                            setSupUnit('Pcs');
                            setSupMinStock(1);
                            setSupLocation('');
                          }}
                          className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl"
                        >
                          {editingSupply ? 'Simpan' : 'Daftarkan Barang'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Stock adjustment popover modal overlay */}
              {adjustingSupply && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setAdjustingSupply(null)}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-md text-xs select-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                      <h4 className="font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        Logistik Keluar Masuk Persediaan
                      </h4>
                      <button onClick={() => setAdjustingSupply(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Nama Barang</span>
                      <span className="font-extrabold text-slate-800 text-sm">{adjustingSupply.itemName}</span>
                      <div className="mt-1 flex gap-2 font-bold text-[10px]">
                        <span className="text-slate-500">Stok Saat Ini: {adjustingSupply.stock} {adjustingSupply.unit}</span>
                        <span className="text-purple-600">Min Stok: {adjustingSupply.minStock} {adjustingSupply.unit}</span>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (adjustmentQty <= 0) return;
                        const change = adjustmentType === 'Masuk' ? adjustmentQty : -adjustmentQty;
                        const newStock = adjustingSupply.stock + change;

                        if (newStock < 0) {
                          alert('Kesalahan: Sisa stok tidak boleh kurang dari 0.');
                          return;
                        }

                        const updated = supplies.map(s => {
                          if (s.id === adjustingSupply.id) {
                            const currentHistory = s.history || [];
                            const newHistItem = {
                              id: 'sh-' + Math.random().toString(36).substring(2, 9),
                              date: new Date().toISOString().split('T')[0],
                              type: adjustmentType,
                              quantity: adjustmentQty,
                              notes: adjustmentNotes || (adjustmentType === 'Masuk' ? 'Stok Masuk Rutin' : 'Pengambilan Barang Kantor'),
                              recordedBy: currentUser.name
                            };
                            return {
                              ...s,
                              stock: newStock,
                              lastUpdated: new Date().toISOString().split('T')[0],
                              history: [newHistItem, ...currentHistory]
                            };
                          }
                          return s;
                        });

                        setSupplies(updated);
                        setAdjustingSupply(null);
                        setAdjustmentQty(1);
                        setAdjustmentNotes('');
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Aksi Penyesuaian STOK</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setAdjustmentType('Masuk')}
                            className={`p-2 rounded-xl text-center font-bold border transition-all ${
                              adjustmentType === 'Masuk'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            📥 Sisa Stok Bertambah (Masuk)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustmentType('Keluar')}
                            className={`p-2 rounded-xl text-center font-bold border transition-all ${
                              adjustmentType === 'Keluar'
                                ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            📤 Stok Diambil / Dipakai (Keluar)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Jumlah Unit ({adjustingSupply.unit}) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          min="1"
                          value={adjustmentQty}
                          onChange={(e) => setAdjustmentQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Keterangan Khusus / Berita Pemakaian</label>
                        <input
                          type="text"
                          placeholder="Contoh: Belanja sisa DIPA / Diambil untuk Seksi Pembangunan"
                          value={adjustmentNotes}
                          onChange={(e) => setAdjustmentNotes(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setAdjustingSupply(null)}
                          className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center rounded-xl font-extrabold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 p-2.5 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-xl font-extrabold cursor-pointer shadow-sm"
                        >
                          Simpan Distribusi Stock
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Table of Consumables */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs select-none">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-150">
                        <th className="p-4 w-12 text-center">No</th>
                        <th className="p-4">Kategori</th>
                        <th className="p-4">Nama Barang Persediaan</th>
                        <th className="p-4">Lokasi Penyimpanan Lemari</th>
                        <th className="p-4 text-center">Jumlah Stok Tersedia</th>
                        <th className="p-4">Batas Limit Minimal</th>
                        <th className="p-4">Status Ketersediaan</th>
                        <th className="p-4 text-center">Pengkinian Akhir</th>
                        {currentUser.role === 'admin' && <th className="p-4 text-center w-40">Tindakan Logistik</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {supplies.filter(s => activeSupplyFilter === 'ALL' || s.category === activeSupplyFilter).length > 0 ? (
                        supplies.filter(s => activeSupplyFilter === 'ALL' || s.category === activeSupplyFilter).map((s, index) => {
                          const isLow = s.stock <= s.minStock;
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/20 transition-all">
                              <td className="p-4 text-center font-mono text-slate-400">{index + 1}</td>
                              <td className="p-4">
                                <span className="bg-purple-50 text-purple-700 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase border border-purple-100">
                                  {s.category}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-extrabold text-slate-800 text-sm block">{s.itemName}</span>
                              </td>
                              <td className="p-4 text-slate-600 font-medium">{s.location}</td>
                              <td className="p-4 text-center">
                                <span className={`font-black text-xs px-2.5 py-1 rounded-lg border ${
                                  isLow ? 'bg-rose-50 border-rose-200 text-rose-800 font-mono' : 'bg-slate-50 border-slate-200 text-slate-800 font-mono'
                                }`}>
                                  {s.stock} {s.unit}
                                </span>
                              </td>
                              <td className="p-4 text-slate-500 font-mono font-medium">{s.minStock} {s.unit}</td>
                              <td className="p-4">
                                {isLow ? (
                                  <span className="bg-red-50 text-red-700 border border-red-200 font-extrabold px-2.5 py-0.5 rounded-full text-[9px] uppercase animate-pulse">
                                    ⚠️ Stok Menipis
                                  </span>
                                ) : (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 font-extrabold px-2.5 py-0.5 rounded-full text-[9px] uppercase">
                                    ✔️ Stok Aman
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center text-slate-400 font-mono">{s.lastUpdated}</td>
                              {currentUser.role === 'admin' && (
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => setAdjustingSupply(s)}
                                      className="py-1 px-2.5 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                                      title="Sesuaikan/Keluar Masuk Stok"
                                    >
                                      Stok Ledger
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingSupply(s);
                                        setSupName(s.itemName);
                                        setSupCategory(s.category);
                                        setSupStock(s.stock);
                                        setSupUnit(s.unit);
                                        setSupMinStock(s.minStock);
                                        setSupLocation(s.location);
                                        setIsSupplyFormOpen(true);
                                      }}
                                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors inline-block cursor-pointer"
                                      title="Ubah Rincian Barang"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Apakah Anda yakin ingin menghapus persediaan: ${s.itemName}?`)) {
                                          setSupplies(supplies.filter(item => item.id !== s.id));
                                        }
                                      }}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors inline-block cursor-pointer"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={currentUser.role === 'admin' ? 9 : 8} className="p-12 text-center text-slate-400 font-bold italic">
                            Belum ada registers persediaan barang dalam kategori {activeSupplyFilter}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Logger history for supplies */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-inner">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Log Jurnal Arus Masuk & Keluar Persediaan (UPTD Habis Pakai)
                </h4>
                <div className="bg-white border border-slate-150 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-[11px]">
                  {supplies.map(s => (s.history || []).map(h => ({ ...h, itemName: s.itemName, unit: s.unit }))).flat()
                    .sort((x, y) => x.date < y.date ? 1 : -1)
                    .map((log) => (
                      <div key={log.id} className="p-3 hover:bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center font-medium gap-1 text-slate-600 transition-colors">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${
                            log.type === 'Masuk'
                              ? 'bg-emerald-50 border border-emerald-150 text-emerald-700'
                              : 'bg-rose-50 border border-rose-150 text-rose-700'
                          }`}>
                            {log.type === 'Masuk' ? '📥 Masuk' : '📤 Penyesuaian / Dipakai'}
                          </span>
                          <span className="font-extrabold text-slate-800 text-xs">{log.itemName}</span>
                          <span className="text-slate-400 font-mono">({log.quantity} {log.unit})</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold font-mono">
                          <span className="text-slate-500">"{log.notes}"</span>
                          <span>Oleh: {log.recordedBy || 'Staf TU'}</span>
                          <span className="text-blue-600">{formatToIndoDate(log.date)}</span>
                        </div>
                      </div>
                    ))}
                    {supplies.map(s => (s.history || [])).flat().length === 0 && (
                      <div className="p-6 text-center text-slate-350 italic font-bold">
                        Belum ada aktivitas mutasi barang persediaan yang dicetak oleh pimpinan.
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 4: KEUANGAN */}
      {activeSubTab === 'keuangan' && (
        <div className="space-y-4" id="finances-panel">
          {/* Inner Subtabs for Keuangan */}
          <div className="flex border-b border-slate-150 gap-4 mb-2 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setFinanceSubTab('rekening_kegiatan')}
              className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                financeSubTab === 'rekening_kegiatan'
                  ? 'border-blue-700 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-655'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Kode Rekening</span>
            </button>
            <button
              onClick={() => setFinanceSubTab('spj_rutin')}
              className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                financeSubTab === 'spj_rutin'
                  ? 'border-blue-700 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-655'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SPJ Rutin</span>
            </button>
            <button
              onClick={() => setFinanceSubTab('bapp')}
              className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                financeSubTab === 'bapp'
                  ? 'border-blue-700 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-655'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Data Kontrak</span>
            </button>
          </div>

          {false && (
            <>
              {/* Budget balance summaries */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Akumulasi Pemasukan</div>
                <div className="text-sm font-bold text-slate-800">
                  {formatRupiah(finances.filter(f => f.type === 'pemasukan').reduce((acc, curr) => acc + curr.amount, 0))}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-650 flex items-center justify-center font-bold">
                <ArrowDownLeft className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Akumulasi Pengeluaran</div>
                <div className="text-sm font-bold text-slate-800">
                  {formatRupiah(finances.filter(f => f.type === 'pengeluaran').reduce((acc, curr) => acc + curr.amount, 0))}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Sisa Saldo Kas Aktif</div>
                <div className="text-sm font-bold text-blue-600">
                  {formatRupiah(
                    finances.filter(f => f.type === 'pemasukan').reduce((acc, curr) => acc + curr.amount, 0) -
                    finances.filter(f => f.type === 'pengeluaran').reduce((acc, curr) => acc + curr.amount, 0)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Header bar */}
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              Buku Anggaran Operasional Dinas, Pembelian ATK, Perjalanan Dinas, & Kas Rutin
            </div>
            {canWriteKeuangan ? (
              <button
                onClick={() => setIsFinanceFormOpen(!isFinanceFormOpen)}
                id="btn-add-finance"
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Transaksi Baru</span>
              </button>
            ) : (
              <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                *Hanya staf Keuangan / Admin yang dapat mengedit
              </div>
            )}
          </div>

          {/* Form to insert cash transaction */}
          <AnimatePresence>
            {isFinanceFormOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none" onClick={() => {
                setIsFinanceFormOpen(false);
                setEditingFinance(null);
                setFinanceDate('');
                setFinanceDescription('');
                setFinanceAmount(0);
                setFinanceType('pemasukan');
                setFinanceCategory('Anggaran Rutin');
              }}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-2xl text-left overflow-y-auto max-h-[90vh]"
                  id="finance-form-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center">
                      <Wallet className="w-4 h-4 text-blue-600 mr-1.5" />
                      {editingFinance ? 'Ubah Rincian Transaksi Kas' : 'Form Transaksi Kas Keuangan'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFinanceFormOpen(false);
                        setEditingFinance(null);
                        setFinanceDate('');
                        setFinanceDescription('');
                        setFinanceAmount(0);
                        setFinanceType('pemasukan');
                        setFinanceCategory('Anggaran Rutin');
                      }}
                      className="text-slate-400 hover:text-slate-655 text-xs font-bold cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                  
                  <form onSubmit={handleFinanceSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                      <input 
                        type="date" 
                        value={financeDate}
                        onChange={(e) => setFinanceDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tipe Transaksi</label>
                      <select 
                        value={financeType} 
                        onChange={(e: any) => setFinanceType(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold outline-none focus:bg-white"
                      >
                        <option value="pemasukan">📈 Pemasukan (Penerimaan)</option>
                        <option value="pengeluaran">📉 Pengeluaran (Belanja/Alokasi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kategori Transaksi</label>
                      <select 
                        value={financeCategory} 
                        onChange={(e: any) => setFinanceCategory(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold outline-none focus:bg-white"
                      >
                        <option value="Anggaran Rutin">Anggaran Negara / Rutin</option>
                        <option value="Perjalanan Dinas">Perjalanan Dinas Jabatan</option>
                        <option value="ATK & Cetak">Belanja Bahan & ATK</option>
                        <option value="Pemeliharaan">Biaya Pemeliharaan / Reparasi</option>
                        <option value="Konsumsi Rapat">Konsumsi Makan & Rapat</option>
                        <option value="Lainnya">Lainnya / Eksternal</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Deskripsi Tambahan / Keperluan Detail</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Pembelian tinta printer Epson 5 unit untuk seksi administrasi"
                        value={financeDescription}
                        onChange={(e) => setFinanceDescription(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nominal Rupiah (Keuangan)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-3 font-bold text-slate-400">Rp</span>
                        <input 
                          type="number" 
                          placeholder="Contoh: 1500000"
                          value={financeAmount || ''}
                          onChange={(e) => setFinanceAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full pl-8 pr-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-805 font-bold outline-none focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-3 flex justify-end gap-2 border-t border-slate-100 pt-3 mt-1">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsFinanceFormOpen(false);
                          setEditingFinance(null);
                          setFinanceDate('');
                          setFinanceDescription('');
                          setFinanceAmount(0);
                          setFinanceType('pemasukan');
                          setFinanceCategory('Anggaran Rutin');
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        {editingFinance ? 'Simpan Perubahan Kas' : 'Simpan Slip Transaksi'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Ledger table list */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="finances-table">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="p-4 w-12">No.</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Jenis Aliran</th>
                    <th className="p-4">Kategori Akun</th>
                    <th className="p-4">Deskripsi / Peruntukan</th>
                    <th className="p-4">Nominal</th>
                    <th className="p-4">Dokumentor</th>
                    {currentUser.role === 'admin' && <th className="p-4 text-center w-24">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredFinances.length > 0 ? (
                    filteredFinances.map((trans, idx) => (
                      <tr key={trans.id} className="hover:bg-slate-50/20 transition-all">
                        <td className="p-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-4 text-slate-500 font-mono font-medium whitespace-nowrap">{formatToIndoDate(trans.date)}</td>
                        <td className="p-4">
                          {trans.type === 'pemasukan' ? (
                            <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full font-bold text-[9px] uppercase tracking-wider py-0.5 px-2 inline-flex items-center">
                              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Pemasukan
                            </span>
                          ) : (
                            <span className="bg-rose-50 border border-rose-150 text-rose-700 rounded-full font-bold text-[9px] uppercase tracking-wider py-0.5 px-2 inline-flex items-center">
                              <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" /> Pengeluaran
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 rounded py-0.5 px-1.5 font-bold text-[10px]">
                            {trans.category}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-800 max-w-xs truncate" title={trans.description}>
                          {trans.description}
                        </td>
                        <td className={`p-4 font-bold ${trans.type === 'pemasukan' ? 'text-indigo-600' : 'text-rose-600'}`}>
                          {trans.type === 'pemasukan' ? '+' : '-'} {formatRupiah(trans.amount)}
                        </td>
                        <td className="p-4 text-slate-500 font-medium">{trans.registeredBy}</td>
                        {currentUser.role === 'admin' && (
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleStartEditFinance(trans)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors inline-block cursor-pointer animate-none"
                                title="Ubah Transaksi Kas"
                                id={`edit-finance-${trans.id}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteFinance(trans.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-block cursor-pointer animate-none"
                                title="Hapus Transaksi"
                                id={`delete-finance-${trans.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={currentUser.role === 'admin' ? 8 : 7} className="p-8 text-center text-slate-400">
                        Tidak ada transaksi keuangan terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}

          {financeSubTab === 'rekening_kegiatan' && (
            <div className="space-y-4 font-sans text-left" id="activity-accounts-panel">
              {/* Sub-summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Tag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Kode Rekening Kegiatan</div>
                    <div className="text-sm font-bold text-slate-800">{activityAccounts.length} Rekening</div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle className="w-5 h-5 text-emerald-650" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Pagu Terdaftar</div>
                    <div className="text-sm font-bold text-slate-800 font-sans">
                      {formatRupiah(activityAccounts.reduce((acc, curr) => acc + (curr.status === 'Aktif' ? curr.allocation : 0), 0))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Program Aktif</div>
                    <div className="text-sm font-bold text-slate-800 font-sans">
                      {new Set(activityAccounts.filter(a => a.status === 'Aktif').map(a => a.programName)).size} Program
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Header bar for Activity Accounts */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  Informasi Daftar Kode Rekening Kegiatan & Alokasi Anggaran Belanja UPTD Resmi
                </div>
                {canWriteKeuangan ? (
                  <button
                    onClick={() => {
                      setEditingActivityAccount(null);
                      setActivityCode('');
                      setActivityName('');
                      setActivityProgram('');
                      setActivityActName('');
                      setActivityAllocation(0);
                      setActivityDescription('');
                      setActivityStatus('Aktif');
                      setIsActivityFormOpen(true);
                    }}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftar Kode Rekening Kegiatan Baru</span>
                  </button>
                ) : (
                  <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                    *Hanya staf Keuangan / Admin yang dapat menambah/mengedit kode rekening kegiatan
                  </div>
                )}
              </div>

              {/* Activity Account Table */}
              <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden" id="activity-accounts-table-wrapper">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-150">
                        <th className="p-4 text-center w-12">No</th>
                        <th className="p-4 w-44">Kode Rekening</th>
                        <th className="p-4 min-w-[240px]">Uraian Kegiatan / Program</th>
                        <th className="p-4 min-w-[200px]">Deskripsi / Keterangan</th>
                        <th className="p-4 w-44 text-right">Alokasi Pagu (Rp)</th>
                        <th className="p-4 w-28 text-center">Status</th>
                        {canWriteKeuangan && <th className="p-4 w-24 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredActivityAccounts.length > 0 ? (
                        filteredActivityAccounts.map((act, index) => (
                          <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 text-center text-slate-400 font-medium">{index + 1}</td>
                            <td className="p-4">
                              <div 
                                onClick={() => {
                                  navigator.clipboard.writeText(act.code);
                                  alert('Kode rekening kegiatan berhasil disalin!');
                                }}
                                className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100 border border-blue-100 px-2 py-1 rounded-lg cursor-pointer transition-colors max-w-full truncate"
                                title="Klik untuk menyalin"
                              >
                                <span>{act.code}</span>
                              </div>
                            </td>
                            <td className="p-4 space-y-1">
                              <div className="font-extrabold text-slate-800 text-xs">{act.name}</div>
                              <div className="text-[10px] text-slate-500 space-y-0.5">
                                <span className="block"><strong className="text-slate-400">Prog:</strong> {act.programName}</span>
                                <span className="block"><strong className="text-slate-400">Sub-Keg:</strong> {act.activityName}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs whitespace-pre-line truncate-3-lines" title={act.description}>
                                {act.description || <em className="text-slate-400">Tidak ada keterangan</em>}
                              </p>
                            </td>
                            <td className="p-4 text-right font-bold text-slate-800">
                              {formatRupiah(act.allocation)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                act.status === 'Aktif' 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                                  : 'bg-slate-100 text-slate-550 border border-slate-200'
                              }`}>
                                {act.status}
                              </span>
                            </td>
                            {canWriteKeuangan && (
                              <td className="p-4">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => handleStartEditActivityAccount(act)}
                                    className="bg-white hover:bg-slate-50 text-blue-600 p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                                    title="Ubah Rekening Kegiatan"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteActivityAccount(act.id)}
                                    className="bg-white hover:bg-red-50 text-red-500 p-1.5 rounded-lg border border-slate-200 hover:border-red-300 transition-all cursor-pointer shadow-2xs"
                                    title="Hapus Rekening Kegiatan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={canWriteKeuangan ? 7 : 6} className="p-12 text-center text-slate-400 bg-white">
                            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-[pulse_2s_infinite]" />
                            <p className="text-xs font-semibold">Belum ada kode rekening kegiatan terdaftar.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Modal for Activity Account creation and update */}
              <AnimatePresence>
                {isActivityFormOpen && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none" onClick={() => {
                    setIsActivityFormOpen(false);
                    setEditingActivityAccount(null);
                    setActivityCode('');
                    setActivityName('');
                    setActivityProgram('');
                    setActivityActName('');
                    setActivityAllocation(0);
                    setActivityDescription('');
                    setActivityStatus('Aktif');
                  }}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-xl text-left overflow-y-auto max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-blue-700" />
                          <span>{editingActivityAccount ? 'Ubah Informasi Kode Rekening Kegiatan' : 'Daftarkan Kode Rekening Kegiatan Baru'}</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setIsActivityFormOpen(false);
                            setEditingActivityAccount(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>

                      <form onSubmit={handleActivitySubmit} className="space-y-4 text-xs font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Kode Rekening Kegiatan <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={activityCode}
                              onChange={(e) => setActivityCode(e.target.value)}
                              placeholder="misal: 5.1.02.01.01.0024"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold font-mono"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nama Rekening / Uraian Belanja <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={activityName}
                              onChange={(e) => setActivityName(e.target.value)}
                              placeholder="misal: Belanja Alat Tulis Kantor"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nama Program Urusan <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={activityProgram}
                              onChange={(e) => setActivityProgram(e.target.value)}
                              placeholder="misal: Program Penunjang Urusan Pemerintahan"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nama Kegiatan / Sub-Kegiatan <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={activityActName}
                              onChange={(e) => setActivityActName(e.target.value)}
                              placeholder="misal: Penyediaan Jasa Penunjang Urusan"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Plafond Pagu Anggaran (Rp) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              value={activityAllocation || ''}
                              onChange={(e) => setActivityAllocation(Number(e.target.value))}
                              placeholder="Masukkan nilai rupiah anggaran"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1.5">Status Keaktifan</label>
                            <div className="flex gap-4 pt-1">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="activityStatus"
                                  checked={activityStatus === 'Aktif'}
                                  onChange={() => setActivityStatus('Aktif')}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 pointer-events-auto"
                                />
                                <span className="font-semibold text-slate-700">Aktif</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="activityStatus"
                                  checked={activityStatus === 'Nonaktif'}
                                  onChange={() => setActivityStatus('Nonaktif')}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 pointer-events-auto"
                                />
                                <span className="font-semibold text-slate-700">Nonaktif</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <label className="block font-bold text-slate-700 mb-1">Catatan Fungsi / Deskripsi Belanja</label>
                          <textarea
                            value={activityDescription}
                            onChange={(e) => setActivityDescription(e.target.value)}
                            placeholder="Tuliskan catatan peruntukan atau detail belanja disini..."
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
                          />
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsActivityFormOpen(false);
                              setEditingActivityAccount(null);
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            {editingActivityAccount ? 'Simpan Perubahan' : 'Daftarkan Rekening'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {financeSubTab === 'spj_rutin' && (
            <div className="space-y-4 font-sans text-left animate-fadeIn">
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total SPJ Disetujui</div>
                    <div className="text-sm font-bold text-slate-800">
                      {formatRupiah(spjDocuments.filter(s => s.status === 'Disetujui').reduce((acc, curr) => acc + curr.amount, 0))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-650 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Menunggu Verifikasi</div>
                    <div className="text-sm font-bold text-slate-800">
                      {spjDocuments.filter(s => s.status === 'Diajukan' || s.status === 'Diverifikasi').length} Dokumen
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Ajuan Rencana Belanja</div>
                    <div className="text-sm font-bold text-slate-800">
                      {formatRupiah(spjDocuments.reduce((acc, curr) => acc + curr.amount, 0))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Header */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  Pengarsipan Surat Pertanggungjawaban (SPJ) Rutin Belanja UPTD Terpadu
                </div>
                {canWriteKeuangan ? (
                  <button
                    onClick={() => {
                      setEditingSpj(null);
                      setSpjNumber('SPJ/' + new Date().getFullYear() + '/' + (spjDocuments.length + 57));
                      setSpjDate(new Date().toISOString().split('T')[0]);
                      setSpjDescription('');
                      setSpjActivityCode(activityAccounts[0]?.code || '');
                      setSpjAmount(0);
                      setSpjRecipient('');
                      setSpjStatus('Draft');
                      setIsSpjFormOpen(true);
                    }}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftarkan SPJ Rutin Baru</span>
                  </button>
                ) : (
                  <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                    *Hanya staf Keuangan / Admin yang dapat mengedit SPJ Rutin
                  </div>
                )}
              </div>

              {/* SPJ Table */}
              <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-150">
                        <th className="p-4 text-center w-12">No</th>
                        <th className="p-4 w-44">Nomor SPJ</th>
                        <th className="p-4 w-28">Tanggal</th>
                        <th className="p-4 w-44">Kode Rekening</th>
                        <th className="p-4 min-w-[200px]">Uraian Belanja / Deskripsi Keperluan</th>
                        <th className="p-4">Penerima</th>
                        <th className="p-4 text-right">Nominal (Rp)</th>
                        <th className="p-4 w-28 text-center">Status</th>
                        {canWriteKeuangan && <th className="p-4 w-24 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-650">
                      {spjDocuments.length > 0 ? (
                        spjDocuments.map((spj, idx) => (
                          <tr key={spj.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                            <td className="p-4 font-mono font-bold text-slate-800">{spj.number}</td>
                            <td className="p-4 font-mono whitespace-nowrap">{formatToIndoDate(spj.date)}</td>
                            <td className="p-4">
                              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold border border-slate-200">
                                {spj.activityCode}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-slate-750">{spj.description}</td>
                            <td className="p-4 font-bold text-slate-800">{spj.recipient}</td>
                            <td className="p-4 text-right font-black text-slate-800">{formatRupiah(spj.amount)}</td>
                            <td className="p-4 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block border ${
                                spj.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-805 border-emerald-150' :
                                spj.status === 'Diverifikasi' ? 'bg-purple-50 text-purple-800 border-purple-150' :
                                spj.status === 'Diajukan' ? 'bg-blue-50 text-blue-805 border-blue-150' :
                                'bg-slate-50 text-slate-600 border-slate-205'
                              }`}>
                                {spj.status}
                              </span>
                            </td>
                            {canWriteKeuangan && (
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEditSpj(spj)}
                                    className="text-blue-500 hover:text-blue-750 hover:bg-blue-50 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                    title="Edit SPJ"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSpj(spj.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                    title="Hapus SPJ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={canWriteKeuangan ? 9 : 8} className="p-10 text-center text-slate-400">
                            Belum ada dokumen Surat Pertanggungjawaban (SPJ) Rutin terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Modal for SPJ */}
              <AnimatePresence>
                {isSpjFormOpen && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none" onClick={() => setIsSpjFormOpen(false)}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-xl text-left overflow-y-auto max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-700" />
                          <span>{editingSpj ? 'Ubah Surat Pertanggungjawaban (SPJ) Rutin' : 'Form SPJ Rutin Baru'}</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsSpjFormOpen(false)}
                          className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>

                      <form onSubmit={handleSpjSubmit} className="space-y-4 text-xs font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nomor SPJ <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={spjNumber}
                              onChange={(e) => setSpjNumber(e.target.value)}
                              placeholder="misal: 058/SPJ-RUTIN/UPTD/VI/2026"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-bold font-mono"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Tanggal SPJ <span className="text-red-500">*</span></label>
                            <input
                              type="date"
                              value={spjDate}
                              onChange={(e) => setSpjDate(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Hubungkan Kode Rekening Kegiatan <span className="text-red-500">*</span></label>
                            <select
                              value={spjActivityCode}
                              onChange={(e) => setSpjActivityCode(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold text-slate-755"
                              required
                            >
                              <option value="">-- Pilih Kode Rekening --</option>
                              {activityAccounts.map((act) => (
                                <option key={act.id} value={act.code}>
                                  {act.code} - {act.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nama Penerima Keuangan / Lembaga <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={spjRecipient}
                              onChange={(e) => setSpjRecipient(e.target.value)}
                              placeholder="misal: Toko Buku Merdeka / CV. Mandiri"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Jumlah Nominal SPJ (Rp) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              value={spjAmount || ''}
                              onChange={(e) => setSpjAmount(Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="misal: 1500000"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-bold text-blue-700"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Status Dokumen SPJ</label>
                            <select
                              value={spjStatus}
                              onChange={(e: any) => setSpjStatus(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold text-slate-755"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Diajukan">Diajukan</option>
                              <option value="Diverifikasi">Diverifikasi & Diproses</option>
                              <option value="Disetujui">Disetujui & Rampung</option>
                            </select>
                          </div>
                        </div>

                        <div className="text-left">
                          <label className="block font-bold text-slate-700 mb-1">Uraian Belanja / Deskripsi Keperluan <span className="text-red-500">*</span></label>
                          <textarea
                            value={spjDescription}
                            onChange={(e) => setSpjDescription(e.target.value)}
                            placeholder="Contoh: Pembayaran ATK seksi operasional berupa kertas F4, maps, pulpen, dan klip arsip semester I"
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-medium"
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
                          <button
                            type="button"
                            onClick={() => setIsSpjFormOpen(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            {editingSpj ? 'Simpan Perubahan SPJ' : 'Daftarkan Dokumen SPJ'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {financeSubTab === 'bapp' && (
            <div className="space-y-4 font-sans text-left animate-fadeIn">
              {/* BAPP Sub-Navigation (Tab Switcher) */}
              <div className="flex border-b border-slate-150 gap-4 mb-2 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setBappSubTab('data_kontrak')}
                  className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    bappSubTab === 'data_kontrak'
                      ? 'border-blue-700 text-blue-700 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-655'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Data Kontrak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBappSubTab('berkas_bapp')}
                  className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    bappSubTab === 'berkas_bapp'
                      ? 'border-blue-700 text-blue-700 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-655'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Berkas BAPP / BAP</span>
                </button>
              </div>

              {bappSubTab === 'berkas_bapp' ? (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn font-sans">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold">
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total BAP Lunas</div>
                        <div className="text-sm font-bold text-slate-800">
                          {formatRupiah(bappDocuments.filter(b => b.status === 'Lunas').reduce((acc, curr) => acc + curr.amount, 0))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Pekerjaan Rampung (Fisik 100%)</div>
                        <div className="text-sm font-bold text-slate-800">
                          {bappDocuments.filter(b => b.progress === 100).length} Laporan PHO/FHO
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-650 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Menunggu Verifikasi Pembayaran</div>
                        <div className="text-sm font-bold text-slate-800">
                          {bappDocuments.filter(b => b.status === 'Diverifikasi').length} Berkas
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Header bar for BAPP */}
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">
                      Berita Acara Pembayaran & Penyerahan (BAPP) Pembangunan & Pemeliharaan UPTD SDA Wilayah
                    </div>
                    {canWriteKeuangan ? (
                      <button
                        onClick={() => {
                          setEditingBapp(null);
                          setBappNumber('BAPP/PEMB/' + new Date().getFullYear() + '/' + (bappDocuments.length + 104));
                          setBappDate(new Date().toISOString().split('T')[0]);
                          setBappProjectName('');
                          setBappContractor('');
                          setBappAmount(0);
                          setBappProgress(0);
                          setBappTerms('Termin I (30%)');
                          setBappVerifiedBy('');
                          setBappStatus('Draft');
                          setIsBappFormOpen(true);
                        }}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buat BAPP Baru</span>
                      </button>
                    ) : (
                      <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                        *Hanya staf Keuangan / Admin yang dapat mengedit Berita Acara (BAPP)
                      </div>
                    )}
                  </div>

                  {/* BAPP Table */}
                  <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-150">
                            <th className="p-4 text-center w-12">No</th>
                            <th className="p-4 w-44">Nomor BAPP</th>
                            <th className="p-4 w-28">Tanggal</th>
                            <th className="p-4 min-w-[200px]">Nama Paket Pekerjaan</th>
                            <th className="p-4">Pelaksana / Kontraktor</th>
                            <th className="p-4 text-right">Nilai Termin (Rp)</th>
                            <th className="p-4 w-36">Kemajuan Fisik</th>
                            <th className="p-4">Tahapan / Termin</th>
                            <th className="p-4">Pejabat Verifikasi</th>
                            <th className="p-4 w-24 text-center">Status</th>
                            {canWriteKeuangan && <th className="p-4 w-24 text-center">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-650">
                          {bappDocuments.length > 0 ? (
                            bappDocuments.map((bapp, idx) => (
                              <tr key={bapp.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                                <td className="p-4 font-mono font-bold text-indigo-755">{bapp.number}</td>
                                <td className="p-4 font-mono whitespace-nowrap">{formatToIndoDate(bapp.date)}</td>
                                <td className="p-4 font-semibold text-slate-800">{bapp.projectName}</td>
                                <td className="p-4 font-bold text-slate-700">{bapp.contractor}</td>
                                <td className="p-4 text-right font-black text-slate-800">{formatRupiah(bapp.amount)}</td>
                                <td className="p-4">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-mono font-black text-slate-500">
                                      <span>{bapp.progress}%</span>
                                      <span>Target</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden font-sans">
                                      <div 
                                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                                        style={{ width: `${bapp.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-indigo-600">{bapp.terms}</td>
                                <td className="p-4 text-slate-450 font-medium whitespace-nowrap">{bapp.verifiedBy || <em className="text-slate-300">Belum didata</em>}</td>
                                <td className="p-4 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${
                                    bapp.status === 'Lunas' ? 'bg-emerald-50 text-emerald-855 border-emerald-150' :
                                    bapp.status === 'Diverifikasi' ? 'bg-indigo-50 text-indigo-855 border-indigo-150' :
                                    'bg-slate-50 text-slate-600 border-slate-205'
                                  }`}>
                                    {bapp.status}
                                  </span>
                                </td>
                                {canWriteKeuangan && (
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleStartEditBapp(bapp)}
                                        className="text-blue-500 hover:text-blue-750 hover:bg-blue-50 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                        title="Edit BAPP"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteBapp(bapp.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                        title="Hapus BAPP"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={canWriteKeuangan ? 11 : 10} className="p-10 text-center text-slate-400 font-medium">
                                Belum ada dokumen Berita Acara Pembayaran & Penyerahan (BAPP) terdaftar.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Data Kontrak sub-page */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn font-sans">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Briefcase className="w-5 h-5 text-indigo-650" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Total Paket Pekerjaan</div>
                        <div className="text-sm font-bold text-slate-800 font-sans">
                          {contracts.length} Dokumen Kontrak / SPK
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <FileCheck className="w-5 h-5 text-emerald-650" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Kode Rekening Terkait</div>
                        <div className="text-sm font-bold text-slate-800 font-sans">
                          {new Set(contracts.map(c => c.accountCode).filter(Boolean)).size} Rekening Kegiatan
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-655 flex items-center justify-center font-bold">
                        <Layers className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Jangka Waktu Pelaksanaan</div>
                        <div className="text-sm font-bold text-slate-800 font-sans">
                          {contracts.filter(c => c.duration).length} Berkas Memiliki Estimasi Durasi
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Header bar for Contracts */}
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium font-sans">
                      Data Kontrak & Surat Perintah Kerja (SPK) UPTD SDA Wilayah
                    </div>
                    {canWriteKeuangan ? (
                      <button
                        onClick={() => {
                          setEditingContract(null);
                          setContractNumber('CTR/SDA/PEMB/' + new Date().getFullYear() + '/' + (contracts.length + 101));
                          setContractRawDate(ymdToDmy(new Date().toISOString().substring(0, 10)));
                          setContractProjectName('');
                          setContractorName('');
                          setContractAmount(0);
                          setContractRawStartDate(ymdToDmy(new Date().toISOString().substring(0, 10)));
                          setContractRawEndDate(ymdToDmy(new Date().toISOString().substring(0, 10)));
                          setContractType('Pembangunan');
                          setContractStatus('Aktif');
                          setContractNotes('');

                          // reset details
                          setContractAddendums([]);
                          setContractClosingNumber('');
                          setContractClosingDate('');
                          setContractClosingNotes('');
                          setPejabatPPK('');
                          setNipPPK('');
                          setPejabatPPTK('');
                          setNipPPTK('');
                          setPejabatPengawas('');
                          setNipPengawas('');
                          setRekananDirektur('');
                          setRekananJabatan('');
                          setRekananNpwp('');
                          setRekananAddress('');
                          setRekananBankName('');
                          setRekananBankAccount('');
                          setRekananBankBranch('');

                          // reset temp addendum inputs
                          setTempAddendumNumber('');
                          setTempAddendumDate('');
                          setTempAddendumDescription('');
                          setTempAddendumAmount(0);
                          setTempAddendumDuration('');

                          setActiveContractTab('utama');
                          setIsContractFormOpen(true);
                        }}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buat Kontrak Baru</span>
                      </button>
                    ) : (
                      <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                        *Hanya staf Keuangan / Admin yang dapat mengedit Kontrak Kerja
                      </div>
                    )}
                  </div>

                  {/* Contracts Table */}
                  <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-150">
                            <th className="p-4 text-center w-12">No</th>
                            <th className="p-4 min-w-[200px]">Nama Paket Pekerjaan</th>
                            <th className="p-4 w-32">Kode Rekening</th>
                            <th className="p-4 w-40">No. Kontrak / Tanggal</th>
                            <th className="p-4 w-40">No. SPPBJ / Tanggal</th>
                            <th className="p-4 w-40">No. SPMK / Tanggal</th>
                            <th className="p-4 w-40">No. SPL / Tanggal</th>
                            <th className="p-4 w-32 text-center">Jangka Waktu</th>
                            <th className="p-4 w-32 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-650">
                          {contracts.length > 0 ? (
                            contracts.map((c, idx) => (
                              <React.Fragment key={c.id}>
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                                  <td className="p-4 font-semibold text-slate-800">
                                    <div className="text-slate-800 font-bold text-xs">{c.projectName}</div>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono">
                                      <span className="bg-rose-50 text-rose-750 font-extrabold px-1.5 py-0.5 rounded text-[10px] border border-rose-100 flex items-center">
                                        Nilai: {formatRupiah(c.amount || 0)}
                                      </span>
                                      {c.contractorName && (
                                        <span className="bg-slate-50 text-slate-550 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-slate-100 font-sans">
                                          Rekanan: {c.contractorName}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 font-mono font-bold">
                                    <span className="font-semibold bg-blue-50 text-blue-750 border border-blue-100 px-2 py-0.5 rounded text-[10px]">
                                      {c.accountCode || '-'}
                                    </span>
                                  </td>
                                  <td className="p-4 font-mono">
                                    <div className="font-bold text-indigo-755">{c.contractNumber}</div>
                                    <div className="text-[10px] text-slate-400">{c.contractDate ? formatToIndoDate(c.contractDate) : '-'}</div>
                                  </td>
                                  <td className="p-4 font-mono">
                                    <div className="font-bold text-slate-800">{c.sppbjNumber || '-'}</div>
                                    {c.sppbjDate && <div className="text-[10px] text-slate-400">{formatToIndoDate(c.sppbjDate)}</div>}
                                  </td>
                                  <td className="p-4 font-mono">
                                    <div className="font-bold text-slate-800">{c.spmkNumber || '-'}</div>
                                    {c.spmkDate && <div className="text-[10px] text-slate-400">{formatToIndoDate(c.spmkDate)}</div>}
                                  </td>
                                  <td className="p-4 font-mono">
                                    <div className="font-bold text-slate-800">{c.splNumber || '-'}</div>
                                    {c.splDate && <div className="text-[10px] text-slate-400">{formatToIndoDate(c.splDate)}</div>}
                                  </td>
                                  <td className="p-4 text-center font-semibold text-indigo-600 font-mono">
                                    {c.duration || '-'}
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => setExpandedContractId(expandedContractId === c.id ? null : c.id)}
                                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                          expandedContractId === c.id 
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs' 
                                            : 'text-slate-500 hover:text-slate-750 hover:bg-slate-50 border-slate-200'
                                        }`}
                                        title={expandedContractId === c.id ? "Sembunyikan Rincian" : "Tampilkan Rincian Detail"}
                                      >
                                        <Eye className="w-4 h-4 animate-pulse" />
                                      </button>
                                      {canWriteKeuangan && (
                                        <>
                                          <button
                                            onClick={() => handleStartEditContract(c)}
                                            className="text-blue-500 hover:text-blue-750 hover:bg-blue-50 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                            title="Edit Kontrak"
                                          >
                                            <Edit3 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteContract(c.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                            title="Hapus Kontrak"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {expandedContractId === c.id && (
                                  <tr className="bg-slate-50/75 transition-all text-xs">
                                    <td colSpan={9} className="p-4 border-b border-slate-200">
                                      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-left">
                                        
                                        {/* Header Detail */}
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                          <div className="flex items-center space-x-2 text-slate-800">
                                            <div className="h-6 w-6 bg-blue-50 rounded-md flex items-center justify-center font-bold text-blue-600">
                                              <Eye className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700">Rincian Lengkap Data Kontrak # {c.contractNumber}</span>
                                          </div>
                                          <span className={`px-2 py-0.5 text-[9px] uppercase font-black tracking-wide rounded-full border ${
                                            c.status === 'Aktif' 
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                              : 'bg-slate-100 text-slate-600 border-slate-200'
                                          }`}>
                                            Status: {c.status || 'Aktif'}
                                          </span>
                                        </div>

                                        {/* Status & Nilai Kontrak Overview */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                                          <div className="text-left animate-fadeIn">
                                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Nama Pekerjaan</span>
                                            <span className="font-extrabold text-slate-800 text-xs">{c.projectName}</span>
                                          </div>
                                          <div className="text-left animate-fadeIn">
                                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Kode Rekening</span>
                                            <span className="font-bold font-mono text-blue-700 inline-block bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[11px] mt-0.5">{c.accountCode || '-'}</span>
                                          </div>
                                          <div className="text-left animate-fadeIn">
                                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Nilai Kontrak Utama</span>
                                            <span className="font-black font-mono text-rose-700 text-sm inline-block bg-rose-50 border border-rose-100 px-2 py-0.5 rounded mt-0.5">{formatRupiah(c.amount || 0)}</span>
                                          </div>
                                        </div>

                                        {/* Grid detail */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          
                                          {/* Kolom Kiri: Pejabat Pelaksana */}
                                          <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-lg border border-slate-100 text-left">
                                            <h5 className="font-black text-[9px] uppercase tracking-widest text-indigo-700 flex items-center gap-1">
                                              <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
                                              Pejabat Pendukung Lapangan
                                            </h5>
                                            
                                            <div className="space-y-2">
                                              <div className="text-left">
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pejabat Pembuat Komitmen (PPK)</div>
                                                <div className="font-bold text-slate-800">{c.pejabatPPK || '-'}</div>
                                                <div className="text-[10px] text-slate-500 font-mono font-medium">NIP. {c.nipPPK || '-'}</div>
                                              </div>
                                              <div className="border-t border-slate-100 my-1 pt-1 text-left">
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pejabat Pelaksana Teknis Kegiatan (PPTK)</div>
                                                <div className="font-bold text-slate-800">{c.pejabatPPTK || '-'}</div>
                                                <div className="text-[10px] text-slate-500 font-mono font-medium">NIP. {c.nipPPTK || '-'}</div>
                                              </div>
                                              <div className="border-t border-slate-100 my-1 pt-1 text-left">
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pejabat / Petugas Pengawas Lapangan</div>
                                                <div className="font-bold text-slate-800">{c.pejabatPengawas || '-'}</div>
                                                <div className="text-[10px] text-slate-500 font-mono font-medium">{c.nipPengawas || '-'}</div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Kolom Kanan: Rincian Rekanan */}
                                          <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-lg border border-slate-100 text-left">
                                            <h5 className="font-black text-[9px] uppercase tracking-widest text-blue-700 flex items-center gap-1">
                                              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                                              Data Rekanan / Penyedia Jasa
                                            </h5>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                              <div className="text-left">
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nama Perusahaan</div>
                                                <div className="font-bold text-slate-800">{c.contractorName || '-'}</div>
                                              </div>
                                              <div className="text-left">
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Direktur / Pimpinan</div>
                                                <div className="font-semibold text-slate-800 flex flex-wrap items-center gap-1">
                                                  <span>{c.rekananDirektur || '-'}</span>
                                                  {c.rekananJabatan && (
                                                    <span className="text-[10px] text-slate-650 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                      {c.rekananJabatan}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="col-span-2 text-left">
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">NPWP Perusahaan</div>
                                                <div className="font-mono text-slate-800 font-medium">{c.rekananNpwp || '-'}</div>
                                              </div>
                                              <div className="col-span-2 text-left">
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Alamat Lengkap Perusahaan</div>
                                                <div className="font-medium text-slate-600">{c.rekananAddress || '-'}</div>
                                              </div>
                                              <div className="col-span-2 border-t border-slate-100 pt-1 text-left">
                                                <div className="text-[9px] text-blue-600 font-bold uppercase tracking-wider font-mono">Rekening Bank Penyedia</div>
                                                <div className="font-semibold text-slate-800">{c.rekananBankName || '-'}</div>
                                                <div className="font-mono font-bold text-blue-800 text-[11px]">{c.rekananBankAccount || '-'} <span className="font-sans text-[10px] text-slate-500 font-normal">({c.rekananBankBranch || 'Cabang -'})</span></div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Baris 3: Addendum & Closing */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                                          
                                          {/* Addendum */}
                                          <div className="space-y-2 text-left">
                                            <div className="text-[9px] text-yellow-600 font-black uppercase tracking-wider flex items-center gap-1">
                                              <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></span>
                                              Riwayat Addendum Kontrak ({c.addendums?.length || 0})
                                            </div>
                                            {c.addendums && c.addendums.length > 0 ? (
                                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                {c.addendums.map((add, idx) => (
                                                  <div key={idx} className="p-2 border border-slate-100 rounded-lg bg-yellow-50/20 text-left">
                                                    <div className="font-bold text-slate-800 flex items-center justify-between">
                                                      <span>Addendum Ke-{idx + 1}: <span className="font-mono text-yellow-700">{add.number}</span></span>
                                                      <span className="text-[10px] font-medium text-slate-500 font-mono">{add.date}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-600 font-medium">Uraian: {add.description || 'Tidak ada uraian'}</div>
                                                    {(add.amount && add.amount > 0) || add.duration ? (
                                                      <div className="text-[10px] mt-0.5 font-bold flex flex-wrap gap-x-2 text-slate-700">
                                                        {add.amount && add.amount > 0 && <span className="text-emerald-700">Nilai: {formatRupiah(add.amount)}</span>}
                                                        {add.duration && <span className="text-blue-700 font-sans">Waktu: + {add.duration}</span>}
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="text-[11px] text-slate-400 italic py-2 bg-slate-50 rounded-lg text-center font-medium">Belum ada kontrak addendum terdaftar.</div>
                                            )}
                                          </div>

                                          {/* Closing */}
                                          <div className="space-y-2 text-left">
                                            <div className="text-[9px] text-red-600 font-black uppercase tracking-wider flex items-center gap-1">
                                              <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
                                              Status Penyelesaian & Kontrak Penutup (Closing)
                                            </div>
                                            {c.closingContractNumber ? (
                                              <div className="p-3 border border-red-150 rounded-lg bg-red-50/20 text-left space-y-1">
                                                <div className="font-bold text-red-700">No. Kontrak Penutup: <span className="font-mono text-xs">{c.closingContractNumber}</span></div>
                                                <div className="text-[10px] text-slate-500 font-medium font-mono font-sans">Tanggal Closing: {c.closingContractDate ? formatToIndoDate(c.closingContractDate) : '-'}</div>
                                                {c.closingClosingNotes && <div className="text-[10px] text-slate-700 font-medium italic border-t border-slate-100 pt-1 mt-1">Catatan: {c.closingClosingNotes}</div>}
                                              </div>
                                            ) : (
                                              <div className="text-[11px] text-slate-400 italic py-3 bg-slate-50/50 rounded-lg text-center font-medium flex items-center justify-center min-h-[64px]">Kontrak ini belum memiliki Kontrak Penutup / Masih Aktif.</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={9} className="p-10 text-center text-slate-400 font-medium font-sans">
                                Belum ada data Kontrak Kerja terdaftar.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* BAPP Form Modal */}
              <AnimatePresence>
                {isBappFormOpen && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none" onClick={() => setIsBappFormOpen(false)}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-xl text-left overflow-y-auto max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-indigo-700" />
                          <span>{editingBapp ? 'Ubah Berita Acara Pembayaran & Penyerahan (BAPP)' : 'Buat Berita Acara Pembayaran (BAPP) Baru'}</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsBappFormOpen(false)}
                          className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>

                      <form onSubmit={handleBappSubmit} className="space-y-4 text-xs font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nomor BAPP <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={bappNumber}
                              onChange={(e) => setBappNumber(e.target.value)}
                              placeholder="misal: 104/BAPP/PEMB-UPTD/2026"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-bold font-mono"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-705 mb-1">Tanggal Berkas BAPP <span className="text-red-500">*</span></label>
                            <input
                              type="date"
                              value={bappDate}
                              onChange={(e) => setBappDate(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="text-left">
                          <label className="block font-bold text-slate-700 mb-1">Nama Paket Pekerjaan Konstruksi / Barang Jasa <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={bappProjectName}
                            onChange={(e) => setBappProjectName(e.target.value)}
                            placeholder="misal: Rehab Berat Saluran Irigasi Sekunder Way Tatayan Kiri"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Pelaksana / Kontraktor Rekanan <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={bappContractor}
                              onChange={(e) => setBappContractor(e.target.value)}
                              placeholder="misal: PT. Bumi Konstruksi Semesta"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Pejabat Verifikasi / PPTK Pendata <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={bappVerifiedBy}
                              onChange={(e) => setBappVerifiedBy(e.target.value)}
                              placeholder="misal: PPK Irigasi UPTD / Tim PPHP"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nominal Termin BAPP (Rp) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              value={bappAmount || ''}
                              onChange={(e) => setBappAmount(Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="misal: 68000000"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-bold text-blue-700"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Progres Kerja Fisik (%) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={bappProgress || ''}
                              onChange={(e) => setBappProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                              placeholder="misal: 100"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-bold text-emerald-700 font-mono"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Tahap Pembayaran / Termin <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={bappTerms}
                              onChange={(e) => setBappTerms(e.target.value)}
                              placeholder="misal: Termin Akhir / PHO (100%)"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold text-indigo-650"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Status Berita Acara</label>
                            <select
                              value={bappStatus}
                              onChange={(e: any) => setBappStatus(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white font-semibold text-slate-755"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Diverifikasi">Diverifikasi & Diproses PPK</option>
                              <option value="Lunas">Lunas / SP2D Selesai</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
                          <button
                            type="button"
                            onClick={() => setIsBappFormOpen(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            {editingBapp ? 'Simpan Perubahan BAPP' : 'Daftarkan BAPP'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Data Kontrak Form Modal */}
              <AnimatePresence>
                {isContractFormOpen && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none animate-fadeIn" onClick={() => setIsContractFormOpen(false)}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 w-full max-w-2xl text-left overflow-y-auto max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 animate-pulse">
                          <Briefcase className="w-4 h-4 text-indigo-755" />
                          <span>{editingContract ? 'Ubah Data Kontrak / SPK' : 'Daftarkan Kontrak / SPK Baru'}</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsContractFormOpen(false)}
                          className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>

                      <form onSubmit={handleContractSubmit} className="space-y-4 text-xs font-sans">
                        
                        {/* Tab Navigation Hub */}
                        <div className="flex border-b border-slate-205 overflow-x-auto select-none gap-1 bg-slate-50/65 p-1 rounded-xl border border-slate-100">
                          <button
                            type="button"
                            onClick={() => setActiveContractTab('utama')}
                            className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              activeContractTab === 'utama'
                                ? 'bg-blue-600 text-white shadow-sm font-black'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Data Utama</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setActiveContractTab('addendum')}
                            className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              activeContractTab === 'addendum'
                                ? 'bg-yellow-500 text-slate-950 shadow-sm font-black'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Addendum & Penutup</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveContractTab('pejabat')}
                            className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              activeContractTab === 'pejabat'
                                ? 'bg-teal-600 text-white shadow-sm font-black'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Pejabat Pelaksana</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveContractTab('rekanan')}
                            className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              activeContractTab === 'rekanan'
                                ? 'bg-indigo-600 text-white shadow-sm font-black'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Data Rekanan</span>
                          </button>
                        </div>

                        {/* SUB-HALAMAN 1: DATA UTAMA */}
                        {activeContractTab === 'utama' && (
                          <div className="space-y-4 animate-fadeIn">
                            {/* Bagian 1: Nama Pekerjaan & Rekening */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
                                Informasi Paket Pekerjaan
                              </h4>
                              
                              <div>
                                <label className="block font-bold text-slate-700 mb-1">Nama Pekerjaan (Data dari Deskripsi Kode Rekening) <span className="text-red-500">*</span></label>
                                <select
                                  value={activityAccounts.some(act => (act.description || act.name) === contractProjectName) ? contractProjectName : (contractProjectName ? '__manual__' : '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '__manual__') {
                                      setContractProjectName('');
                                      setContractAccountCode('');
                                    } else {
                                      handleSelectActivityAccount(val);
                                    }
                                  }}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                                >
                                  <option value="">-- Pilih Pekerjaan dari Kode Rekening --</option>
                                  {activityAccounts.map((act, idx) => {
                                    const actName = act.description || act.name;
                                    const isAccountSelected = contracts.some(c => 
                                      (!editingContract || c.id !== editingContract.id) && 
                                      c.projectName.trim().toLowerCase() === actName.trim().toLowerCase()
                                    );
                                    return (
                                      <option 
                                        key={act.id || act.code || idx} 
                                        value={actName}
                                        disabled={isAccountSelected}
                                        className={isAccountSelected ? "text-slate-400 bg-slate-100 italic" : ""}
                                      >
                                        {actName}{isAccountSelected ? " (Deskripsi pekerjaan sudah terdaftar kontrak)" : ""}
                                      </option>
                                    );
                                  })}
                                  <option value="__manual__">-- Input Manual Nama Pekerjaan Baru --</option>
                                </select>
                              </div>

                              {/* Kode rekening terisi otomatis */}
                              {activityAccounts.some(act => (act.description || act.name) === contractProjectName) && (
                                <div className="animate-fadeIn">
                                  <label className="block font-bold text-slate-500 mb-1">Kode Rekening <span className="text-xs text-blue-600 font-normal">(Otomatis Terisi)</span></label>
                                  <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg font-mono font-bold text-blue-800 flex items-center justify-between">
                                    <span>{contractAccountCode || '-'}</span>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-sans tracking-wide">Tersinkron</span>
                                  </div>
                                </div>
                              )}

                              {/* Input manual override */}
                              {(!activityAccounts.some(act => (act.description || act.name) === contractProjectName) || contractProjectName === '') && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                                  <div className="md:col-span-2">
                                    <label className="block font-bold text-slate-700 mb-1">Nama Pekerjaan <span className="text-red-500">*</span></label>
                                    <input
                                      type="text"
                                      value={contractProjectName}
                                      onChange={(e) => setContractProjectName(e.target.value)}
                                      placeholder="Ketik deskripsi pekerjaan..."
                                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-slate-700 mb-1">Kode Rekening <span className="text-red-500">*</span></label>
                                    <input
                                      type="text"
                                      value={contractAccountCode}
                                      onChange={(e) => setContractAccountCode(e.target.value)}
                                      placeholder="misal: 5.01.03.11"
                                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold font-mono text-slate-800"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="animate-fadeIn">
                                <label className="block font-bold text-slate-700 mb-1">Nilai Kontrak (Rp) <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  value={contractAmount || ''}
                                  onChange={(e) => setContractAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                  placeholder="misal: 154000000"
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold text-rose-700 font-sans"
                                  required
                                />
                              </div>
                            </div>

                            {/* Bagian 2: Informasi Kontrak & Pelaksanaan */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
                                Data Kontrak & Jangka Waktu
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">No. Kontrak <span className="text-red-500">*</span></label>
                                  <input
                                    type="text"
                                    value={contractNumber}
                                    onChange={(e) => setContractNumber(e.target.value)}
                                    placeholder="misal: 02/SP-PJ/UPTD-SDA/2026"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold font-mono text-indigo-755"
                                  />
                                </div>
                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">Tgl. Kontrak <span className="text-xs text-slate-400 font-medium">(dd/mm/yyyy)</span> <span className="text-red-500">*</span></label>
                                  <input
                                    type="text"
                                    value={contractRawDate}
                                    onChange={(e) => setContractRawDate(e.target.value)}
                                    placeholder="02/03/2026"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">Jangka Waktu Pelaksanaan <span className="text-red-500">*</span></label>
                                  <input
                                    type="text"
                                    value={contractDuration}
                                    onChange={(e) => setContractDuration(e.target.value)}
                                    placeholder="misal: 90 Hari Kalender"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold text-teal-650"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Bagian 3: Dokumen Pendukung Lapangan */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
                                Dokumen Pendukung Fisik (SPPBJ, SPMK, SPL)
                              </h4>

                              <div className="space-y-2.5">
                                {/* SPPBJ */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2 bg-white rounded-lg border border-slate-100">
                                  <div>
                                    <label className="block font-bold text-slate-600 mb-1">No. SPPBJ</label>
                                    <input
                                      type="text"
                                      value={contractSppbjNumber}
                                      onChange={(e) => setContractSppbjNumber(e.target.value)}
                                      placeholder="Nomor SPPBJ..."
                                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-lg font-mono outline-none focus:bg-white text-slate-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-slate-600 mb-1">Tgl. SPPBJ <span className="text-xs text-slate-400 font-normal">(dd/mm/yyyy)</span></label>
                                    <input
                                      type="text"
                                      value={contractSppbjRawDate}
                                      onChange={(e) => setContractSppbjRawDate(e.target.value)}
                                      placeholder="dd/mm/yyyy"
                                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-lg font-mono outline-none focus:bg-white text-slate-700"
                                    />
                                  </div>
                                </div>

                                {/* SPMK */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2 bg-white rounded-lg border border-slate-100">
                                  <div>
                                    <label className="block font-bold text-slate-600 mb-1">No. SPMK</label>
                                    <input
                                      type="text"
                                      value={contractSpmkNumber}
                                      onChange={(e) => setContractSpmkNumber(e.target.value)}
                                      placeholder="Nomor SPMK..."
                                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-lg font-mono outline-none focus:bg-white text-slate-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-slate-600 mb-1">Tgl. SPMK <span className="text-xs text-slate-400 font-normal">(dd/mm/yyyy)</span></label>
                                    <input
                                      type="text"
                                      value={contractSpmkRawDate}
                                      onChange={(e) => setContractSpmkRawDate(e.target.value)}
                                      placeholder="dd/mm/yyyy"
                                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-lg font-mono outline-none focus:bg-white text-slate-700"
                                    />
                                  </div>
                                </div>

                                {/* SPL */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2 bg-white rounded-lg border border-slate-100">
                                  <div>
                                    <label className="block font-bold text-slate-600 mb-1">No. SPL</label>
                                    <input
                                      type="text"
                                      value={contractSplNumber}
                                      onChange={(e) => setContractSplNumber(e.target.value)}
                                      placeholder="Nomor SPL..."
                                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-lg font-mono outline-none focus:bg-white text-slate-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-slate-600 mb-1">Tgl. SPL <span className="text-xs text-slate-400 font-normal">(dd/mm/yyyy)</span></label>
                                    <input
                                      type="text"
                                      value={contractSplRawDate}
                                      onChange={(e) => setContractSplRawDate(e.target.value)}
                                      placeholder="dd/mm/yyyy"
                                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-lg font-mono outline-none focus:bg-white text-slate-700"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUB-HALAMAN 2: KONTRAK ADDENDUM & PENUTUP */}
                        {activeContractTab === 'addendum' && (
                          <div className="space-y-4 animate-fadeIn">
                            {/* Bagian 4: Lampiran Kontrak Addendum */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></span>
                                Kontrak Addendum / Amandemen Jangka Waktu & Nilai
                              </h4>

                              {/* Daftar addendum yang sudah ditambahkan */}
                              {contractAddendums.length > 0 ? (
                                <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2">
                                  {contractAddendums.map((add, idx) => (
                                    <div key={add.id || idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-155 rounded-lg font-sans text-xs">
                                      <div className="text-left">
                                        <div className="font-bold text-slate-750">Addendum Ke-{idx + 1}: <span className="text-blue-700 font-mono">{add.number}</span></div>
                                        <div className="text-[10px] text-slate-500 font-medium">Tanggal: <span className="font-mono">{add.date}</span> | {add.duration ? `Tambahan Waktu: ${add.duration}` : 'Tanpa Tambahan Waktu'}</div>
                                        {add.description && <div className="text-[10px] text-slate-600 italic">Keterangan: {add.description}</div>}
                                        {add.amount && add.amount > 0 ? <div className="text-[10px] text-emerald-700 font-semibold">Perubahan Nilai: {formatRupiah(add.amount)}</div> : null}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAddendumFromList(add.id)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer animate-pulse"
                                        title="Hapus Addendum"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 bg-white text-center text-slate-400 border border-slate-150 rounded-lg text-[11px] italic">
                                  Belum ada kontrak addendum terdaftar. Silakan tambah bila kontrak mengalami perubahan/addendum lebih dari satu kali.
                                </div>
                              )}

                              {/* Box tambah addendum */}
                              <div className="p-3 bg-white rounded-lg border border-slate-155 space-y-2 mt-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Form Tambah Kontrak Addendum Baru</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-left">Nomor Addendum</label>
                                    <input
                                      type="text"
                                      value={tempAddendumNumber}
                                      onChange={(e) => setTempAddendumNumber(e.target.value)}
                                      placeholder="No. Addendum..."
                                      className="w-full p-2 bg-slate-50 border border-slate-250 rounded text-xs font-mono outline-none focus:bg-white text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-left">Tanggal Addendum <span className="text-slate-400 normal-case font-normal">(dd/mm/yyyy)</span></label>
                                    <input
                                      type="text"
                                      value={tempAddendumDate}
                                      onChange={(e) => setTempAddendumDate(e.target.value)}
                                      placeholder="dd/mm/yyyy"
                                      className="w-full p-2 bg-slate-50 border border-slate-250 rounded text-xs font-mono outline-none focus:bg-white text-slate-800"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-left">Perubahan Nilai (Rp) <span className="text-slate-400 font-normal">(Bila Ada)</span></label>
                                    <input
                                      type="number"
                                      value={tempAddendumAmount || ''}
                                      onChange={(e) => setTempAddendumAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                      placeholder="misal: 15000000"
                                      className="w-full p-2 bg-slate-50 border border-slate-250 rounded text-xs font-bold text-slate-800 outline-none focus:bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-left">Penambahan Waktu <span className="text-slate-400 font-normal">(Bila Ada)</span></label>
                                    <input
                                      type="text"
                                      value={tempAddendumDuration}
                                      onChange={(e) => setTempAddendumDuration(e.target.value)}
                                      placeholder="misal: 14 Hari Kalender"
                                      className="w-full p-2 bg-slate-50 border border-slate-255 rounded text-xs outline-none focus:bg-white text-slate-800"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 text-left">Materi Perubahan / Keterangan Addendum</label>
                                  <input
                                    type="text"
                                    value={tempAddendumDescription}
                                    onChange={(e) => setTempAddendumDescription(e.target.value)}
                                    placeholder="misal: Addendum I Perpanjangan Waktu Pelaksanaan..."
                                    className="w-full p-2 bg-slate-50 border border-slate-255 rounded text-xs outline-none focus:bg-white text-slate-800"
                                  />
                                </div>
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={handleAddAddendumToList}
                                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 text-[10px] font-bold rounded flex items-center gap-1 transition-colors outline-none cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Tambah ke Daftar Addendum
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Bagian 5: Kontrak Penutup */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
                                Kontrak Penutup (Closing Contract)
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-bold text-slate-600 mb-1 text-left">No. Kontrak Penutup</label>
                                  <input
                                    type="text"
                                    value={contractClosingNumber}
                                    onChange={(e) => setContractClosingNumber(e.target.value)}
                                    placeholder="Nomor Kontrak Penutup..."
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-mono outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                                  />
                                </div>
                                <div>
                                  <label className="block font-bold text-slate-600 mb-1 text-left">Tgl. Kontrak Penutup <span className="text-xs text-slate-400 font-normal">(dd/mm/yyyy)</span></label>
                                  <input
                                    type="text"
                                    value={contractClosingDate}
                                    onChange={(e) => setContractClosingDate(e.target.value)}
                                    placeholder="dd/mm/yyyy"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-mono outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block font-bold text-slate-600 mb-1 text-left">Catatan Kontrak Penutup</label>
                                <textarea
                                  value={contractClosingNotes}
                                  onChange={(e) => setContractClosingNotes(e.target.value)}
                                  placeholder="Ketik rincian penyelesaian kontrak penutup..."
                                  rows={2}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUB-HALAMAN 3: DATA PEJABAT PELAKSANA KEGIATAN */}
                        {activeContractTab === 'pejabat' && (
                          <div className="space-y-4 animate-fadeIn">
                            {/* Bagian 6: Data Pejabat */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-teal-500 rounded-full"></span>
                                Data Pejabat Pelaksana Kegiatan / Pengawas
                              </h4>

                              <div className="space-y-3">
                                {/* Pejabat Pembuat Komitment (PPK) */}
                                <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-2">
                                  <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest text-left">Pejabat Pembuat Komitmen (PPK)</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nama Pejabat PPK</label>
                                      <input
                                        type="text"
                                        value={pejabatPPK}
                                        onChange={(e) => setPejabatPPK(e.target.value)}
                                        placeholder="Nama Pejabat PPK..."
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">NIP PPK</label>
                                      <input
                                        type="text"
                                        value={nipPPK}
                                        onChange={(e) => setNipPPK(e.target.value)}
                                        placeholder="NIP PPK..."
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Pejabat Pelaksana Teknis Kegiatan (PPTK) */}
                                <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-2">
                                  <div className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest text-left">Pejabat Pelaksana Teknis Kegiatan (PPTK)</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nama Pejabat PPTK</label>
                                      <input
                                        type="text"
                                        value={pejabatPPTK}
                                        onChange={(e) => setPejabatPPTK(e.target.value)}
                                        placeholder="Nama PPTK..."
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">NIP PPTK</label>
                                      <input
                                        type="text"
                                        value={nipPPTK}
                                        onChange={(e) => setNipPPTK(e.target.value)}
                                        placeholder="NIP PPTK..."
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Pejabat / Pengawas Lapangan */}
                                <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-2">
                                  <div className="text-[10px] font-bold text-teal-700 uppercase tracking-widest text-left font-sans">Pejabat / Petugas Pengawas Lapangan</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nama Pengawas Lapangan</label>
                                      <input
                                        type="text"
                                        value={pejabatPengawas}
                                        onChange={(e) => setPejabatPengawas(e.target.value)}
                                        placeholder="Nama Pengawas..."
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">NIP / Jabatan Pengawas</label>
                                      <input
                                        type="text"
                                        value={nipPengawas}
                                        onChange={(e) => setNipPengawas(e.target.value)}
                                        placeholder="NIP Pengawas..."
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUB-HALAMAN 4: DATA REKANAN */}
                        {activeContractTab === 'rekanan' && (
                          <div className="space-y-4 animate-fadeIn">
                            {/* Bagian 7: Rincian Data Rekanan (Penyedia Jasa) */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                                Rincian Data Rekanan / Penyedia Jasa
                              </h4>

                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-2.5 rounded-lg border border-slate-100 text-left">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nama Rekanan / Perusahaan <span className="text-red-500">*</span></label>
                                    <input
                                      type="text"
                                      value={contractorName}
                                      onChange={(e) => setContractorName(e.target.value)}
                                      placeholder="misal: PT. Sinar Indah Konstruksi"
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:bg-white text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nama Direktur / Penanggungjawab</label>
                                    <input
                                      type="text"
                                      value={rekananDirektur}
                                      onChange={(e) => setRekananDirektur(e.target.value)}
                                      placeholder="Nama Direktur..."
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold outline-none focus:bg-white text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Jabatan Direksi</label>
                                    <input
                                      type="text"
                                      value={rekananJabatan}
                                      onChange={(e) => setRekananJabatan(e.target.value)}
                                      placeholder="misal: Direktur Utama / Kuasa Direksi"
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold outline-none focus:bg-white text-slate-800"
                                    />
                                  </div>
                                </div>

                                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-left">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nomor NPWP Perusahaan</label>
                                    <input
                                      type="text"
                                      value={rekananNpwp}
                                      onChange={(e) => setRekananNpwp(e.target.value)}
                                      placeholder="misal: 01.234.567.8-901.000"
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono outline-none focus:bg-white text-slate-800"
                                    />
                                  </div>
                                </div>

                                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-left">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5 font-sans">Alamat Lengkap Kantor Penyedia</label>
                                  <input
                                      type="text"
                                      value={rekananAddress}
                                      onChange={(e) => setRekananAddress(e.target.value)}
                                      placeholder="Jalan, No, Kota..."
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:bg-white text-slate-800 font-medium align-middle"
                                  />
                                </div>

                                <div className="p-3 bg-white rounded-lg border border-slate-150 space-y-2">
                                  <div className="text-[10px] font-bold text-blue-800 uppercase tracking-widest text-left font-mono">Informasi Rekening Bank Rekanan</div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-left">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nama Bank</label>
                                      <input
                                        type="text"
                                        value={rekananBankName}
                                        onChange={(e) => setRekananBankName(e.target.value)}
                                        placeholder="misal: Bank Sumut"
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 font-sans">No. Rekening Partner</label>
                                      <input
                                        type="text"
                                        value={rekananBankAccount}
                                        onChange={(e) => setRekananBankAccount(e.target.value)}
                                        placeholder="Nomor Rekening..."
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Kantor Cabang</label>
                                      <input
                                        type="text"
                                        value={rekananBankBranch}
                                        onChange={(e) => setRekananBankBranch(e.target.value)}
                                        placeholder="misal: Cabang Utama Medan"
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:bg-white text-slate-800"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                          <button
                            type="button"
                            onClick={() => setIsContractFormOpen(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            {editingContract ? 'Simpan Perubahan Kontrak' : 'Daftarkan Kontrak'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
