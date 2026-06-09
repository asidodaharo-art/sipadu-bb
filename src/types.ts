/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  section: 'all' | 'penatausahaan' | 'pembangunan' | 'operasional';
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

  // Riwayat Kepangkatan
  riwayatKepangkatan?: {
    id: string;
    pangkat: string;
    golongan: string;
    tmt: string;
    noSk: string;
    tglSk: string;
  }[];

  // Riwayat Gaji Berkala
  riwayatGaji?: {
    id: string;
    tmtGaji: string;
    gajiPokok: number;
    noSk: string;
    tglSk: string;
    pejabatPenandatangan: string;
  }[];

  // Riwayat Pendidikan
  riwayatPendidikan?: {
    id: string;
    jenjang: string;
    institusi: string;
    jurusan: string;
    tahunLulus: string;
    noIjazah?: string;
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
  };

  // Riwayat Anak
  riwayatAnak?: {
    id: string;
    namaAnak: string;
    tanggalLahir: string;
    jenisKelamin: string;
    statusAnak: string; // Anak Kandung, Anak Angkat, Anak Tiri, dsb.
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

