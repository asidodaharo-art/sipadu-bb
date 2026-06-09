import { User, Mail, Staff, Project, WaterLog, DamageReport, InstansiProfile, FooterConfig } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Administrator UPTD',
    role: 'admin',
    password: 'admin123',
    section: 'all'
  },
  {
    id: '2',
    username: 'pembangunan',
    name: 'Hadi Wijaya, S.T.',
    role: 'staff',
    password: 'staff123',
    section: 'pembangunan'
  },
  {
    id: '3',
    username: 'operasional',
    name: 'Budi Santoso, A.Md.',
    role: 'staff',
    password: 'staff123',
    section: 'operasional'
  },
  {
    id: '4',
    username: 'umum',
    name: 'Siti Rahma, S.Sos.',
    role: 'staff',
    password: 'staff123',
    section: 'penatausahaan'
  }
];

export const INITIAL_MAILS: Mail[] = [];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'staff-1',
    name: 'Ir. Muhammad Rusli, M.T.',
    nip: '19750812 200212 1 003',
    pangkat: 'Pembina Tingkat I',
    golongan: 'IV/b',
    position: 'Kepala UPTD PSDA Bah Bolon',
    tempatLahir: 'Medan',
    tanggalLahir: '1975-08-12',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    telepon: '081265439871',
    email: 'muhammad.rusli@sumutprov.go.id',
    alamat: 'Jl. Karya Wisata No. 34, Medan',
    riwayatPendidikan: [
      { id: 'edu-1a', jenjang: 'S1', institusi: 'Universitas Sumatera Utara', jurusan: 'Teknik Sipil', tahunLulus: '1998', noIjazah: 'USU-98-34125' },
      { id: 'edu-1b', jenjang: 'S2', institusi: 'Institut Teknologi Bandung', jurusan: 'Teknik Pengairan', tahunLulus: '2001', noIjazah: 'ITB-01-90872' }
    ]
  },
  {
    id: 'staff-2',
    name: 'Siti Rahma, S.Sos.',
    nip: '19820514 200604 2 001',
    pangkat: 'Penata Tingkat I',
    golongan: 'III/d',
    position: 'Kasi Rencana & Ketatausahaan',
    tempatLahir: 'Pematangsiantar',
    tanggalLahir: '1982-05-14',
    jenisKelamin: 'Perempuan',
    agama: 'Islam',
    telepon: '081370213344',
    email: 'siti.rahma@sumutprov.go.id',
    alamat: 'Jl. Kartini No. 12, Pematangsiantar',
    riwayatPendidikan: [
      { id: 'edu-2a', jenjang: 'S1', institusi: 'Universitas Muhammadiyah Sumatera Utara', jurusan: 'Administrasi Negara', tahunLulus: '2004', noIjazah: 'UMSU-04-1234' }
    ]
  },
  {
    id: 'staff-3',
    name: 'Hadi Wijaya, S.T.',
    nip: '19801123 200501 1 002',
    pangkat: 'Penata',
    golongan: 'III/c',
    position: 'Kasi Pembangunan & Rehabilitasi',
    tempatLahir: 'Binjai',
    tanggalLahir: '1980-11-23',
    jenisKelamin: 'Laki-laki',
    agama: 'Kristen',
    telepon: '085290807711',
    email: 'hadi.wijaya@sumutprov.go.id',
    alamat: 'Jl. Sudirman No. 89, Binjai',
    riwayatPendidikan: [
      { id: 'edu-3a', jenjang: 'S1', institusi: 'Universitas Islam Sumatera Utara', jurusan: 'Teknik Sipil', tahunLulus: '2003', noIjazah: 'UISU-03-8762' }
    ]
  },
  {
    id: 'staff-4',
    name: 'Budi Santoso, A.Md.T.',
    nip: '19881005 201101 1 004',
    pangkat: 'Pengatur',
    golongan: 'II/c',
    position: 'Pengawas Irigasi / Juru Pengairan',
    tempatLahir: 'Deli Serdang',
    tanggalLahir: '1988-10-05',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    telepon: '081244332211',
    email: 'budi.santoso@sumutprov.go.id',
    alamat: 'Mess Bendung Bah Bolon, Sergai',
    riwayatPendidikan: [
      { id: 'edu-4a', jenjang: 'D3', institusi: 'Politeknik Negeri Medan', jurusan: 'Teknik Sipil Hidro', tahunLulus: '2009', noIjazah: 'POLMED-09-5431' }
    ]
  },
  {
    id: 'staff-5',
    name: 'Fatimah Siregar, S.Kom.',
    nip: '19920315 201503 2 005',
    pangkat: 'Penata Muda Tingkat I',
    golongan: 'III/b',
    position: 'Pranata Komputer / Pengelola IT',
    tempatLahir: 'Padang Sidempuan',
    tanggalLahir: '1992-03-15',
    jenisKelamin: 'Perempuan',
    agama: 'Islam',
    telepon: '082199884433',
    email: 'fatimah.siregar@sumutprov.go.id',
    alamat: 'Jl. Sisingamangaraja No. 202, Pematangsiantar',
    riwayatPendidikan: [
      { id: 'edu-5a', jenjang: 'S1', institusi: 'Universitas Sumatera Utara', jurusan: 'Ilmu Komputer', tahunLulus: '2013', noIjazah: 'USU-13-90212' }
    ]
  },
  {
    id: 'staff-6',
    name: 'Andi Pratama, M.SP.',
    nip: '19790403 200801 1 003',
    pangkat: 'Penata Tingkat I',
    golongan: 'III/d',
    position: 'Perencana Teknis Pengelolaan Air',
    tempatLahir: 'Medan',
    tanggalLahir: '1979-04-03',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    telepon: '085377551122',
    email: 'andi.pratama@sumutprov.go.id',
    alamat: 'Jl. Cemara Asri No. B-45, Deli Serdang',
    riwayatPendidikan: [
      { id: 'edu-6a', jenjang: 'S1', institusi: 'Institut Teknologi Medan', jurusan: 'Teknik Planologi', tahunLulus: '2001', noIjazah: 'ITM-01-4432' },
      { id: 'edu-6b', jenjang: 'S2', institusi: 'Universitas Sumatera Utara', jurusan: 'Perencanaan Wilayah', tahunLulus: '2006', noIjazah: 'USU-06-7781' }
    ]
  },
  {
    id: 'staff-7',
    name: 'Diana Lestari, S.E.',
    nip: '19900824 201402 2 002',
    pangkat: 'Penata Muda',
    golongan: 'III/a',
    position: 'Bendahara Keuangan UPTD',
    tempatLahir: 'Tebing Tinggi',
    tanggalLahir: '1990-08-24',
    jenisKelamin: 'Perempuan',
    agama: 'Kristen',
    telepon: '081260449900',
    email: 'diana.lestari@sumutprov.go.id',
    alamat: 'Jl. Sutomo No. 56, Tebing Tinggi',
    riwayatPendidikan: [
      { id: 'edu-7a', jenjang: 'S1', institusi: 'Universitas Negeri Medan', jurusan: 'Akuntansi', tahunLulus: '2012', noIjazah: 'UNIMED-12-8876' }
    ]
  },
  {
    id: 'staff-8',
    name: 'Yusuf Kristiawan, A.Md.',
    nip: '19941112 201801 1 005',
    pangkat: 'Pengatur Muda Tingkat I',
    golongan: 'II/b',
    position: 'Teknisi Hidrologi & Pos Pantau',
    tempatLahir: 'Samosir',
    tanggalLahir: '1994-11-12',
    jenisKelamin: 'Laki-laki',
    agama: 'Katolik',
    telepon: '081397665544',
    email: 'yusuf.kris@sumutprov.go.id',
    alamat: 'Jl. Diponegoro No. 8, Pematangsiantar',
    riwayatPendidikan: [
      { id: 'edu-8a', jenjang: 'D3', institusi: 'Politeknik Negeri Medan', jurusan: 'Teknik Elektro', tahunLulus: '2016', noIjazah: 'POLMED-16-1144' }
    ]
  }
];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_WATER_LOGS: WaterLog[] = [];

export const INITIAL_DAMAGE_REPORTS: DamageReport[] = [];

export const INITIAL_PROFILE: InstansiProfile = {
  name: 'UPTD Pengelolaan Sumber Daya Air Bah Bolon',
  address: 'Jl. Merdeka No. 45, Kota Pematangsiantar, Sumatera Utara, 21111',
  email: 'uptd.psdabahbolon@sumutprov.go.id',
  phone: '(0622) 24531',
  headName: 'Ir. Muhammad Rusli, M.T.',
  headNip: '19750812 200212 1 003',
  logo: '' // We will render a beautifully crafted default vector canvas SVG if empty, or let them upload.
};

export const INITIAL_FOOTER: FooterConfig = {
  footerText: 'Sistem Informasi Terpadu UPTD PSDA Bah Bolon Dinas Sumber Daya Air, Cipta Karya dan Tata Ruang Provinsi Sumatera Utara.',
  copyrightText: '© 2026 UPTD PSDA Bah Bolon. Hak Cipta Dilindungi Undang-Undang.'
};
