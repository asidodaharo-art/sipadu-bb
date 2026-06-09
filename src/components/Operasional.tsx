import React, { useState } from 'react';
import { WaterLog, DamageReport, User } from '../types';
import { 
  Droplet, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Flame, 
  ShieldAlert, 
  FileCheck, 
  Activity, 
  Gauge, 
  MapPin, 
  PhoneCall, 
  FileSpreadsheet, 
  FolderEdit,
  Wrench,
  CheckCircle,
  Clock,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { motion } from 'motion/react';

interface OperasionalProps {
  currentUser: User;
  waterLogs: WaterLog[];
  damageReports: DamageReport[];
  onAddWaterLog: (newLog: WaterLog) => void;
  onUpdateWaterLog: (updatedLog: WaterLog) => void;
  onAddDamageReport: (newReport: DamageReport) => void;
  onUpdateDamageReport: (updatedReport: DamageReport) => void;
  onUpdateDamageStatus: (id: string, status: DamageReport['status']) => void;
  onDeleteWaterLog: (id: string) => void;
  onDeleteDamageReport: (id: string) => void;
}

export default function Operasional({
  currentUser,
  waterLogs,
  damageReports,
  onAddWaterLog,
  onUpdateWaterLog,
  onAddDamageReport,
  onUpdateDamageReport,
  onUpdateDamageStatus,
  onDeleteWaterLog,
  onDeleteDamageReport
}: OperasionalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'hidrologi' | 'pengaduan'>('hidrologi');

  const [editingWaterLog, setEditingWaterLog] = useState<WaterLog | null>(null);
  const [editingDamageReport, setEditingDamageReport] = useState<DamageReport | null>(null);

  // Water Log Form States
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [logLocation, setLogLocation] = useState('Bendung Utama Bah Bolon (Pematangsiantar)');
  const [customLocation, setCustomLocation] = useState('');
  const [logTma, setLogTma] = useState<number>(100);
  const [logDebit, setLogDebit] = useState<number>(10);
  const [logStatus, setLogStatus] = useState<WaterLog['status']>('Normal');

  // Damage Report Form States
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [damageLocation, setDamageLocation] = useState('');
  const [damageDescription, setDamageDescription] = useState('');

  const handleStartEditWaterLog = (log: WaterLog) => {
    setEditingWaterLog(log);
    if (['Bendung Utama Bah Bolon (Pematangsiantar)', 'Bendung Paya Lombang (Serdang Bedagai)', 'Pos TMA Kota Tebing Tinggi'].includes(log.location)) {
      setLogLocation(log.location);
      setCustomLocation('');
    } else {
      setLogLocation('Lainnya');
      setCustomLocation(log.location);
    }
    setLogTma(log.tma);
    setLogDebit(log.debit);
    setLogStatus(log.status);
    setIsLogFormOpen(true);
  };

  const handleStartEditDamageReport = (report: DamageReport) => {
    setEditingDamageReport(report);
    setReporterName(report.reporterName);
    setReporterPhone(report.reporterPhone || '');
    setDamageLocation(report.location);
    setDamageDescription(report.description);
    setIsReportFormOpen(true);
  };

  const canWrite = currentUser.role === 'admin' || currentUser.section === 'operasional';

  const handleWaterLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = logLocation === 'Lainnya' ? customLocation : logLocation;
    if (!finalLocation) {
      alert('Lokasi pos pantau wajib diisi.');
      return;
    }

    if (editingWaterLog) {
      const updatedLog: WaterLog = {
        ...editingWaterLog,
        location: finalLocation,
        tma: Number(logTma),
        debit: Number(logDebit),
        status: logStatus
      };
      onUpdateWaterLog(updatedLog);
    } else {
      const newLog: WaterLog = {
        id: 'wl-' + Math.random().toString(36).substring(2, 9),
        location: finalLocation,
        tma: Number(logTma),
        debit: Number(logDebit),
        status: logStatus,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        recordedBy: currentUser.name
      };
      onAddWaterLog(newLog);
    }

    setIsLogFormOpen(false);
    setEditingWaterLog(null);

    // Reset Form
    setCustomLocation('');
    setLogTma(100);
    setLogDebit(10);
    setLogStatus('Normal');
  };

  const handleDamageReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName || !reporterPhone || !damageLocation || !damageDescription) {
      alert('Mohon isi semua data pengaduan dengan lengkap.');
      return;
    }

    if (editingDamageReport) {
      const updatedReport: DamageReport = {
        ...editingDamageReport,
        reporterName,
        reporterPhone,
        location: damageLocation,
        description: damageDescription
      };
      onUpdateDamageReport(updatedReport);
    } else {
      const newReport: DamageReport = {
        id: 'dr-' + Math.random().toString(36).substring(2, 9),
        reporterName,
        reporterPhone,
        location: damageLocation,
        description: damageDescription,
        date: new Date().toISOString().substring(0, 10),
        status: 'Laporan Masuk'
      };
      onAddDamageReport(newReport);
    }

    setIsReportFormOpen(false);
    setEditingDamageReport(null);

    // Reset Form
    setReporterName('');
    setReporterPhone('');
    setDamageLocation('');
    setDamageDescription('');
  };

  return (
    <div className="space-y-6" id="operasional-tab-content">
      {/* Sub Tabs Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('hidrologi')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'hidrologi'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
            id="subtab-hidrologi"
          >
            <Activity className="w-4 h-4" />
            <span>Pemantauan Tinggi Muka Air (TMA)</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('pengaduan')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'pengaduan'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
            id="subtab-pengaduan"
          >
            <Wrench className="w-4 h-4" />
            <span>Pengaduan Kerusakan Saluran (GP3A)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
          Pos Monitor Hidrologi Sungai Bah Bolon
        </div>
      </div>

      {/* TAB 1: HIDROLOGI */}
      {activeSubTab === 'hidrologi' && (
        <div className="space-y-4" id="hidrologi-panel">
          {/* Action Trigger Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-4">
            <div>
              <h2 className="font-bold text-sm text-slate-800">Pencatatan Tinggi Muka Air (TMA) & Debit Air</h2>
              <p className="text-xs text-slate-500">Mencakup pencatatan debit hulu, debit serah, dsb. Pembaruan berkala oleh Staf Juru Pengairan.</p>
            </div>

            {canWrite ? (
              <button
                onClick={() => setIsLogFormOpen(!isLogFormOpen)}
                id="btn-add-waterlog"
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Debit Air Pos</span>
              </button>
            ) : (
              <div className="text-[10px] bg-slate-100 px-2 py-1 text-slate-500 rounded font-medium">
                *Masuk sebagai petugas Juru OP / Admin untuk memperbarui data
              </div>
            )}
          </div>

          {/* Form to insert details of a Hydrological Check */}
          {isLogFormOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-md space-y-4"
              id="waterlog-form-container"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                <h3 className="font-bold text-sm text-slate-800 flex items-center">
                  <Activity className="w-4 h-4 text-blue-600 mr-2" />
                  {editingWaterLog ? 'Ubah Laporan Debit Air Harian' : 'Pencatatan Laporan Debit Air Harian'}
                </h3>
                <button 
                  onClick={() => {
                    setIsLogFormOpen(false);
                    setEditingWaterLog(null);
                    setCustomLocation('');
                    setLogTma(100);
                    setLogDebit(10);
                    setLogStatus('Normal');
                  }} 
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleWaterLogSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pos Penjagaan / Lokasi Monitor</label>
                  <select 
                    value={logLocation} 
                    onChange={(e: any) => setLogLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold"
                  >
                    <option value="Bendung Utama Bah Bolon (Pematangsiantar)">Bendung Utama Bah Bolon (Pematangsiantar)</option>
                    <option value="Bendung Paya Lombang (Serdang Bedagai)">Bendung Paya Lombang (Serdang Bedagai)</option>
                    <option value="Pos TMA Kota Tebing Tinggi">Pos TMA Kota Tebing Tinggi</option>
                    <option value="Lainnya">Stasiun / Pos Lain (Tulis Kustom)</option>
                  </select>
                </div>

                {logLocation === 'Lainnya' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tulis Nama Pos Kustom</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Saluran Sekunder S10"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tinggi Muka Air (TMA) / cm</label>
                  <input 
                    type="number" 
                    value={logTma}
                    onChange={(e) => {
                      const tma = Number(e.target.value);
                      setLogTma(tma);
                      if (tma >= 300) setLogStatus('Awas');
                      else if (tma >= 220) setLogStatus('Siaga');
                      else if (tma >= 150) setLogStatus('Waspada');
                      else setLogStatus('Normal');
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Pengaruh tinggi terhadap status siaga (220 cm)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Debit Air (m³ / Detik)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={logDebit}
                    onChange={(e) => setLogDebit(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kritis Air</label>
                  <select 
                    value={logStatus} 
                    onChange={(e: any) => setLogStatus(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold text-blue-800"
                  >
                    <option value="Normal">Normal (Aman)</option>
                    <option value="Waspada">Waspada (Banjir Ringan / Kurang Air)</option>
                    <option value="Siaga">Siaga (Melimpah Rendah Ruas)</option>
                    <option value="Awas">Awas (Potensi Bencana Banjir Bandang)</option>
                  </select>
                </div>

                <div className="md:col-span-3 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsLogFormOpen(false);
                      setEditingWaterLog(null);
                      setCustomLocation('');
                      setLogTma(100);
                      setLogDebit(10);
                      setLogStatus('Normal');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    id="submit-waterlog-btn"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    {editingWaterLog ? 'Simpan Perubahan Laporan' : 'Simpan Laporan Hidrologi'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Table representing all hydrological records */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="waterlogs-table">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="p-4 w-12">No.</th>
                    <th className="p-4">Stasiun / Pos TMA</th>
                    <th className="p-4">Tinggi Muka Air</th>
                    <th className="p-4">Estimasi Debit</th>
                    <th className="p-4">Peringatan Status</th>
                    <th className="p-4">Petugas Pencatat (Juru OP)</th>
                    <th className="p-4 text-slate-400 font-mono whitespace-nowrap">Waktu Monitor</th>
                    {currentUser.role === 'admin' && <th className="p-4 text-center w-24">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {waterLogs.length > 0 ? (
                    waterLogs.map((log, idx) => {
                      const statusColors = {
                        'Normal': 'bg-emerald-100 text-emerald-800',
                        'Waspada': 'bg-yellow-105 text-yellow-800 bg-yellow-50',
                        'Siaga': 'bg-amber-100 text-amber-800 animate-pulse font-bold',
                        'Awas': 'bg-red-150 text-red-700 bg-red-50 animate-pulse font-bold'
                      };
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-4 font-bold text-slate-700">{log.location}</td>
                          <td className="p-4 font-mono font-bold text-slate-800">{log.tma} cm</td>
                          <td className="p-4 font-mono text-slate-500">{log.debit} m³/s</td>
                          <td className="p-4">
                            <span className={`py-0.5 px-2 rounded text-[10px] uppercase font-bold inline-block border border-black/5 ${statusColors[log.status] || 'bg-slate-100'}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{log.recordedBy}</td>
                          <td className="p-4 text-slate-400 font-mono whitespace-nowrap">{log.date}</td>
                          {currentUser.role === 'admin' && (
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleStartEditWaterLog(log)}
                                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors inline-block cursor-pointer animate-none"
                                  title="Ubah Catatan Debit"
                                  id={`edit-waterlog-${log.id}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteWaterLog(log.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-block cursor-pointer animate-none"
                                  title="Hapus Catatan Debit"
                                  id={`delete-waterlog-${log.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={currentUser.role === 'admin' ? 8 : 7} className="p-8 text-center text-slate-400">
                        Tidak ada laporan ketinggian muka air tanah/hidrologi terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENGADUAN COMPLAINTS */}
      {activeSubTab === 'pengaduan' && (
        <div className="space-y-4" id="pengaduan-panel">
          
          {/* Action Trigger Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-4">
            <div>
              <h2 className="font-bold text-sm text-slate-800">Laporan Kerusakan & Gangguan Saluran Irigasi</h2>
              <p className="text-xs text-slate-500">Menerima aduan dari petani / kelompok tani GP3A wilayah kerja Bah Bolon untuk proses rehabilitasi.</p>
            </div>

            <button
              onClick={() => setIsReportFormOpen(!isReportFormOpen)}
              id="btn-add-complaint"
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Laporan Baru</span>
            </button>
          </div>

          {/* Form to submit damage details */}
          {isReportFormOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-md space-y-4"
              id="complaint-form-container"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500 mr-2" />
                  {editingDamageReport ? 'Ubah Rincian Laporan Pengaduan Kerusakan' : 'Laporkan Kerusakan Fasilitas / Saluran Sekunder'}
                </h3>
                <button 
                  onClick={() => {
                    setIsReportFormOpen(false);
                    setEditingDamageReport(null);
                    setReporterName('');
                    setReporterPhone('');
                    setDamageLocation('');
                    setDamageDescription('');
                  }} 
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleDamageReportSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pelapor (Ketua Poktan / Warga)</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Warisno (GP3A Makmur)"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon Pelapor</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 0812XXXXXXXX"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Kebocoran / Kerusakan Saluran</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Saluran Sekunder S7 DI Bah Bolon Kanan, Kec. Bandar"
                    value={damageLocation}
                    onChange={(e) => setDamageLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi Kerusakan Fisik Lapangan</label>
                  <textarea 
                    rows={3}
                    placeholder="Tulis kronologis, perkiraan dimensi dinding saluran runtuh dsb secara detail agar memudahkan survei..."
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsReportFormOpen(false);
                      setEditingDamageReport(null);
                      setReporterName('');
                      setReporterPhone('');
                      setDamageLocation('');
                      setDamageDescription('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    id="submit-complaint"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    {editingDamageReport ? 'Simpan Perubahan Pengaduan' : 'Kirim Laporan Pengaduan'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Cards for complaints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="complaints-grid">
            {damageReports.length > 0 ? (
              damageReports.map((report) => {
                const statusConfig = {
                  'Laporan Masuk': { bg: 'bg-red-50 text-red-800 border-red-100', icon: Clock },
                  'Ditinjau': { bg: 'bg-amber-50 text-amber-800 border-amber-100', icon: Activity },
                  'Proses Perbaikan': { bg: 'bg-blue-50 text-blue-800 border-blue-100', icon: Wrench },
                  'Selesai': { bg: 'bg-emerald-50 text-emerald-800 border-emerald-100', icon: CheckCircle }
                }[report.status] || { bg: 'bg-slate-50', icon: Clock };
                const Icon = statusConfig.icon;

                return (
                  <div key={report.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`py-0.5 px-2 rounded-full font-bold uppercase tracking-wide border flex items-center gap-1 ${statusConfig.bg}`}>
                          <Icon className="w-3 h-3" />
                          {report.status}
                        </span>
                        <span className="text-slate-400 font-mono">{report.date}</span>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Titik Lokasi Kerusakan</div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                          {report.location}
                        </h4>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl text-slate-600 leading-relaxed text-xs border border-slate-100">
                        {report.description}
                      </div>

                      <div className="border-t border-slate-150 pt-2 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="block text-[9px] text-slate-400 font-bold uppercase">Pelapor</span>
                          <strong className="text-slate-700 font-bold">{report.reporterName}</strong>
                        </div>
                        <a 
                          href={`tel:${report.reporterPhone}`} 
                          className="flex items-center text-blue-600 font-mono font-bold hover:underline"
                        >
                          <PhoneCall className="w-3.5 h-3.5 mr-1" />
                          {report.reporterPhone}
                        </a>
                      </div>
                    </div>

                    {/* Action for updating status of damaged logs */}
                    {canWrite && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold">Tindak Lanjut Staf OP:</span>
                        <div className="flex gap-1.5">
                          {report.status !== 'Selesai' && (
                            <select
                              value={report.status}
                              onChange={(e: any) => onUpdateDamageStatus(report.id, e.target.value)}
                              className="bg-slate-100 hover:bg-slate-150 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 outline-none"
                              id={`select-status-${report.id}`}
                            >
                              <option value="Laporan Masuk">Laporan Masuk</option>
                              <option value="Ditinjau">Ditinjau / Survei</option>
                              <option value="Proses Perbaikan">Mulai Pekerjaan OP</option>
                              <option value="Selesai">Tandai Selesai OP</option>
                            </select>
                          )}
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => handleStartEditDamageReport(report)}
                              className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg hover:text-blue-700 border border-transparent hover:border-blue-100 transition-all inline-block cursor-pointer"
                              title="Ubah Rincian Laporan"
                              id={`edit-complaint-${report.id}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => onDeleteDamageReport(report.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg hover:text-red-700 border border-transparent hover:border-red-100 transition-all inline-block cursor-pointer"
                              title="Hapus Aduan"
                              id={`delete-complaint-${report.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 shadow-sm">
                Tidak ada laporan pengaduan kerusakan yang aktif untuk kawasan Bah Bolon.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
