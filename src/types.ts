/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'staff' | 'surveyor';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  section: string;
}

export interface Mail {
  id: string;
  type: 'masuk' | 'keluar';
  referenceNumber: string;
  sender: string;
  recipient: string;
  subject: string;
  date: string;
  status: 'Diterima' | 'Diproses' | 'Diarsipkan' | 'Terkirim' | 'Selesai';
  originalLetterNumber?: string;
  letterDate?: string;
  pdfFile?: string;
  pdfName?: string;
}

export interface Staff {
  id: string;
  name: string;
  nip: string;
  pangkat: string;
  golongan: string;
  position: string;
  
  // Data Lengkap
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  agama?: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  photo?: string;

  // Riwayat Kepangkatan
  riwayatKepangkatan?: {
    id: string;
    pangkat: string;
    golongan: string;
    tmt: string;
    noSk: string;
    tglSk: string;
    pdfFile?: string;
    pdfName?: string;
  }[];

  // Riwayat Gaji Berkala
  riwayatGaji?: {
    id: string;
    tmtGaji: string;
    gajiPokok: number;
    noSk: string;
    tglSk: string;
    pejabatPenandatangan: string;
    pdfFile?: string;
    pdfName?: string;
  }[];

  // Riwayat Pendidikan
  riwayatPendidikan?: {
    id: string;
    jenjang: string;
    institusi: string;
    jurusan: string;
    tahunLulus: string;
    noIjazah?: string;
    pdfFile?: string;
    pdfName?: string;
  }[];

  // Riwayat Orang Tua
  riwayatOrangTua?: {
    namaAyah: string;
    pekerjaanAyah?: string;
    namaIbu: string;
    pekerjaanIbu?: string;
  };

  // Riwayat Pasangan
  riwayatPasangan?: {
    namaPasangan: string;
    pekerjaan?: string;
    tanggalLahir?: string;
    tanggalNikah?: string;
    statusPasangan: string; // Suami/Istri
    pdfFile?: string;
    pdfName?: string;
  };

  // Riwayat Anak
  riwayatAnak?: {
    id: string;
    namaAnak: string;
    tanggalLahir: string;
    jenisKelamin: string;
    statusAnak: string; // Anak Kandung, Anak Angkat, Anak Tiri, dsb.
    pdfFile?: string;
    pdfName?: string;
  }[];
}

export interface Project {
  id: string;
  name: string;
  location: string;
  budget: number;
  contractor: string;
  progress: number; // 0 - 100
  startDate: string;
  endDate: string;
  status: 'Perencanaan' | 'Konstruksi' | 'Selesai' | 'Tertunda';
}

export interface WaterLog {
  id: string;
  location: string; // e.g., Bendung Bah Bolon Hulu, Bah Bolon Hilir
  tma: number; // Tinggi Muka Air in cm
  debit: number; // Debit air in m3/s
  status: 'Normal' | 'Waspada' | 'Siaga' | 'Awas';
  date: string;
  recordedBy: string;
}

export interface DamageReport {
  id: string;
  reporterName: string;
  reporterPhone: string;
  location: string;
  description: string;
  date: string;
  status: 'Laporan Masuk' | 'Ditinjau' | 'Proses Perbaikan' | 'Selesai';
}

export interface InstansiProfile {
  name: string;
  address: string;
  email: string;
  phone: string;
  headName: string;
  headNip: string;
  logo: string; // Base64 encoding
}

export interface FooterConfig {
  footerText: string;
  copyrightText: string;
}

export interface Asset {
  id: string;
  name: string;
  code: string;
  condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  location: string;
  quantity: number;
  purchaseDate: string;
  kibCategory?: 'KIB A' | 'KIB B' | 'KIB C' | 'KIB D' | 'KIB E' | 'KIB F';
  price?: number;
  brand?: string;
  notes?: string;
}

export interface AssetDistribution {
  id: string;
  assetId: string;
  assetName: string;
  staffId: string;
  staffName: string;
  quantity: number;
  location?: string;
  status?: 'dipakai' | 'dipinjam' | 'dipulangkan';
  allocationDate: string;
  conditionAtAllocation: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  notes?: string;
}

export interface ConsumableSupply {
  id: string;
  itemName: string;
  category: 'ATK' | 'Bahan Bakar/Oli' | 'Alat Bersih' | 'Suku Cadang' | 'Lainnya';
  stock: number;
  unit: string; // e.g., Rim, Botol, Pcs, Liter
  minStock: number;
  location: string;
  lastUpdated: string;
  history?: {
    id: string;
    date: string;
    type: 'Masuk' | 'Keluar';
    quantity: number;
    notes?: string;
    recordedBy?: string;
  }[];
}

export interface FinanceTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'pemasukan' | 'pengeluaran';
  category: string;
  registeredBy: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  type: string;
  description?: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface ActivityAccount {
  id: string;
  code: string; // e.g., 5.1.02.01.01.0024
  name: string; // e.g., Belanja Alat Tulis Kantor
  programName: string; // e.g., Program Penunjang Urusan Pemerintahan Daerah
  activityName: string; // e.g., Penyediaan Jasa Penunjang Urusan Pemerintahan Daerah
  allocation: number; // Plafond Anggaran, e.g., Rp. 25.000.000
  description?: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface SpjDocument {
  id: string;
  number: string;
  date: string;
  description: string;
  activityCode: string; // reference to act code
  amount: number;
  recipient: string;
  status: 'Draft' | 'Diajukan' | 'Diverifikasi' | 'Disetujui';
  attachmentUrl?: string;
}

export interface BappDocument {
  id: string;
  number: string;
  date: string;
  projectName: string;
  contractor: string;
  amount: number;
  progress: number;
  terms: string;
  verifiedBy: string;
  status: 'Draft' | 'Diverifikasi' | 'Lunas';
}

export interface Contract {
  id: string;
  projectName: string;
  accountCode: string;
  contractNumber: string;
  contractDate: string;
  sppbjNumber: string;
  sppbjDate: string;
  spmkNumber: string;
  spmkDate: string;
  splNumber: string;
  splDate: string;
  duration: string;
  status?: 'Aktif' | 'Selesai' | 'Amandemen' | 'Putus Kontrak';
  contractorName?: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;

  // Detail Tambahan: Kontrak Addendum (bisa lebih dari satu kali)
  addendums?: {
    id: string;
    number: string;
    date: string;
    description?: string;
    amount?: number;
    duration?: string;
  }[];

  // Detail Tambahan: Kontrak Penutup
  closingContractNumber?: string;
  closingContractDate?: string;
  closingClosingNotes?: string;

  // Detail Tambahan: Data Pejabat
  pejabatPPK?: string;
  nipPPK?: string;
  pejabatPPTK?: string;
  nipPPTK?: string;
  pejabatPengawas?: string;
  nipPengawas?: string;

  // Detail Tambahan: Data Rekanan (Partner)
  rekananDirektur?: string;
  rekananJabatan?: string;
  rekananNpwp?: string;
  rekananAddress?: string;
  rekananBankName?: string;
  rekananBankAccount?: string;
  rekananBankBranch?: string;
}



