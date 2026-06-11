import { User, Mail, Staff, Project, WaterLog, DamageReport, InstansiProfile, FooterConfig, Asset } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Administrator UPTD',
    role: 'admin',
    password: 'admin123',
    section: 'all'
  }
];

export const INITIAL_MAILS: Mail[] = [];

export const INITIAL_STAFF: Staff[] = [];

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

export const INITIAL_ASSETS: Asset[] = [];
