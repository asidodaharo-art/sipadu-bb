import express from "express";
import path from "path";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Configure body-parser limits to support large base64 uploads (documents, photos, logos)
app.use(cors());
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Local database fallback path
const FALLBACK_DB_DIR = path.join(process.cwd(), "data");
const FALLBACK_DB_PATH = path.join(FALLBACK_DB_DIR, "local_db_fallback.json");

// Ensure fallback folder exists
if (!fs.existsSync(FALLBACK_DB_DIR)) {
  fs.mkdirSync(FALLBACK_DB_DIR, { recursive: true });
}

// Initial empty fallback database structure
const initialFallbackData = {
  users: [],
  mails: [],
  staff: [],
  projects: [],
  waterLogs: [],
  damageReports: [],
  assets: [],
  assetDistributions: [],
  consumableSupplies: [],
  financeTransactions: [],
  bankAccounts: [],
  activityAccounts: [],
  spjDocuments: [],
  bappDocuments: [],
  contracts: [],
  profile: null,
  footer: null,
  lastSync: null,
};

if (!fs.existsSync(FALLBACK_DB_PATH)) {
  fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(initialFallbackData, null, 2), "utf-8");
}

let pool: mysql.Pool | null = null;
let dbStatus = {
  isConnected: false,
  error: "Belum dicoba atau belum dikonfigurasi.",
  config: {
    host: process.env.MYSQL_HOST || "",
    port: process.env.MYSQL_PORT || "3306",
    user: process.env.MYSQL_USER || "",
    database: process.env.MYSQL_DATABASE || "",
  }
};

// Utility to create connection pool with current env variables or provided overriding config
async function initDatabase(customConfig?: typeof dbStatus.config & { password?: string, sslCa?: string }) {
  try {
    if (pool) {
      await pool.end();
      pool = null;
    }

    const host = customConfig?.host || process.env.MYSQL_HOST;
    const port = parseInt(customConfig?.port || process.env.MYSQL_PORT || "3306", 10);
    const user = customConfig?.user || process.env.MYSQL_USER;
    const password = customConfig?.password !== undefined ? customConfig.password : process.env.MYSQL_PASSWORD;
    const database = customConfig?.database || process.env.MYSQL_DATABASE;
    const sslCa = customConfig?.sslCa !== undefined ? customConfig.sslCa : process.env.MYSQL_SSL_CA;

    dbStatus.config = { host: host || "", port: String(port), user: user || "", database: database || "" };

    if (!host || !user || !database) {
      dbStatus.isConnected = false;
      dbStatus.error = "Variabel lingkungan koneksi MySQL (Host, User, Database) belum lengkap.";
      console.log("MySQL connection not configured. Running in Fallback/Hybrid Offline Mode.");
      return false;
    }

    const connectionConfig: mysql.PoolOptions = {
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 4000, // 4-second timeout to fail-fast on unreachable networks
    };

    // Aiven.io often requires SSL connection. Allow passing CA text directly or using standard.
    if (sslCa) {
      connectionConfig.ssl = {
        rejectUnauthorized: false,
        ca: sslCa,
      };
    } else {
      // Default to trusting server certificates for general cloud instances if requested or fallback to standard secure ssl
      connectionConfig.ssl = {
        rejectUnauthorized: false
      };
    }

    const localPool = mysql.createPool(connectionConfig);

    // Test connection
    const conn = await localPool.getConnection();
    conn.release();

    pool = localPool;

    dbStatus.isConnected = true;
    dbStatus.error = "";
    console.log(`Connected successfully to MySQL database at ${host}:${port}`);

    // Synchronously create all tables in background
    await createTablesIfNotExist();
    return true;
  } catch (err: any) {
    if (pool) {
      try {
        await pool.end();
      } catch (e) {}
      pool = null;
    }
    dbStatus.isConnected = false;
    dbStatus.error = err?.message || String(err);
    console.error("Database connection failed. Fallback mode is active.", err);
    return false;
  }
}

// Function to create tables
async function createTablesIfNotExist() {
  if (!pool) return;
  try {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        name VARCHAR(100),
        role VARCHAR(50),
        password VARCHAR(255),
        section VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS mails (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50),
        reference_number VARCHAR(100),
        sender VARCHAR(255),
        recipient VARCHAR(255),
        subject TEXT,
        date VARCHAR(50),
        status VARCHAR(100),
        original_letter_number VARCHAR(100),
        letter_date VARCHAR(50),
        pdf_file LONGTEXT,
        pdf_name VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100),
        nip VARCHAR(100),
        pangkat VARCHAR(100),
        golongan VARCHAR(50),
        position VARCHAR(100),
        tempat_lahir VARCHAR(100),
        tanggal_lahir VARCHAR(50),
        jenis_kelamin VARCHAR(50),
        agama VARCHAR(50),
        telepon VARCHAR(50),
        email VARCHAR(100),
        alamat TEXT,
        photo LONGTEXT,
        riwayat_kepangkatan LONGTEXT,
        riwayat_gaji LONGTEXT,
        riwayat_pendidikan LONGTEXT,
        riwayat_orang_tua TEXT,
        riwayat_pasangan TEXT,
        riwayat_anak LONGTEXT
      )`,
      `CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        location VARCHAR(255),
        budget DOUBLE,
        contractor VARCHAR(255),
        progress INT,
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        status VARCHAR(100)
      )`,
      `CREATE TABLE IF NOT EXISTS water_logs (
        id VARCHAR(50) PRIMARY KEY,
        location VARCHAR(255),
        tma DOUBLE,
        debit DOUBLE,
        status VARCHAR(100),
        date VARCHAR(50),
        recorded_by VARCHAR(100)
      )`,
      `CREATE TABLE IF NOT EXISTS damage_reports (
        id VARCHAR(50) PRIMARY KEY,
        reporter_name VARCHAR(255),
        reporter_phone VARCHAR(100),
        location TEXT,
        description TEXT,
        date VARCHAR(50),
        status VARCHAR(100)
      )`,
      `CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        code VARCHAR(100),
        \`condition\` VARCHAR(100),
        location VARCHAR(255),
        quantity INT,
        purchase_date VARCHAR(50),
        kib_category VARCHAR(100),
        price DOUBLE,
        brand VARCHAR(255),
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS asset_distributions (
        id VARCHAR(50) PRIMARY KEY,
        asset_id VARCHAR(50),
        asset_name VARCHAR(255),
        staff_id VARCHAR(50),
        staff_name VARCHAR(255),
        quantity INT,
        location VARCHAR(255),
        status VARCHAR(100),
        allocation_date VARCHAR(50),
        condition_at_allocation VARCHAR(100),
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS consumable_supplies (
        id VARCHAR(50) PRIMARY KEY,
        item_name VARCHAR(255),
        category VARCHAR(100),
        stock INT,
        unit VARCHAR(50),
        min_stock INT,
        location VARCHAR(255),
        last_updated VARCHAR(50),
        history LONGTEXT
      )`,
      `CREATE TABLE IF NOT EXISTS finance_transactions (
        id VARCHAR(50) PRIMARY KEY,
        date VARCHAR(50),
        description TEXT,
        amount DOUBLE,
        type VARCHAR(50),
        category VARCHAR(100),
        registered_by VARCHAR(100)
      )`,
      `CREATE TABLE IF NOT EXISTS bank_accounts (
        id VARCHAR(50) PRIMARY KEY,
        bank_name VARCHAR(255),
        account_number VARCHAR(100),
        account_holder VARCHAR(255),
        type VARCHAR(100),
        description TEXT,
        status VARCHAR(50)
      )`,
      `CREATE TABLE IF NOT EXISTS activity_accounts (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(100),
        name VARCHAR(255),
        program_name VARCHAR(255),
        activity_name VARCHAR(255),
        allocation DOUBLE,
        description TEXT,
        status VARCHAR(50)
      )`,
      `CREATE TABLE IF NOT EXISTS spj_documents (
        id VARCHAR(50) PRIMARY KEY,
        number VARCHAR(100),
        date VARCHAR(50),
        description TEXT,
        activity_code VARCHAR(100),
        amount DOUBLE,
        recipient VARCHAR(255),
        status VARCHAR(100),
        attachment_url LONGTEXT
      )`,
      `CREATE TABLE IF NOT EXISTS bapp_documents (
        id VARCHAR(50) PRIMARY KEY,
        number VARCHAR(100),
        date VARCHAR(50),
        project_name VARCHAR(255),
        contractor VARCHAR(255),
        amount DOUBLE,
        progress INT,
        terms TEXT,
        verified_by VARCHAR(255),
        status VARCHAR(100)
      )`,
      `CREATE TABLE IF NOT EXISTS contracts (
        id VARCHAR(50) PRIMARY KEY,
        project_name VARCHAR(255),
        account_code VARCHAR(100),
        contract_number VARCHAR(100),
        contract_date VARCHAR(50),
        sppbj_number VARCHAR(100),
        sppbj_date VARCHAR(50),
        spmk_number VARCHAR(100),
        spmk_date VARCHAR(50),
        spl_number VARCHAR(100),
        spl_date VARCHAR(50),
        duration VARCHAR(100),
        status VARCHAR(100),
        contractor_name VARCHAR(255),
        amount DOUBLE,
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        notes TEXT,
        addendums LONGTEXT,
        closing_contract_number VARCHAR(100),
        closing_contract_date VARCHAR(50),
        closing_notes TEXT,
        pejabat_ppk VARCHAR(255),
        nip_ppk VARCHAR(100),
        pejabat_pptk VARCHAR(255),
        nip_pptk VARCHAR(100),
        pejabat_pengawas VARCHAR(255),
        nip_pengawas VARCHAR(100),
        rekanan_direktur VARCHAR(255),
        rekanan_jabatan VARCHAR(100),
        rekanan_npwp VARCHAR(100),
        rekanan_address TEXT,
        rekanan_bank_name VARCHAR(255),
        rekanan_bank_account VARCHAR(100),
        rekanan_bank_branch VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS instansi_profile (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        address TEXT,
        email VARCHAR(100),
        phone VARCHAR(100),
        head_name VARCHAR(255),
        head_nip VARCHAR(100),
        logo LONGTEXT
      )`,
      `CREATE TABLE IF NOT EXISTS footer_config (
        id VARCHAR(50) PRIMARY KEY,
        footer_text TEXT,
        copyright_text TEXT
      )`
    ];

    for (const sql of queries) {
      await pool.execute(sql);
    }
    console.log("MySQL databases tables initialized successfully.");
  } catch (err) {
    console.error("Failed to automatically build MySQL tables:", err);
  }
}

// REST API for Aiven.io MySQL Connection status & credentials check
app.get("/api/mysql/status", (req, res) => {
  res.json({
    isConnected: dbStatus.isConnected,
    error: dbStatus.error,
    config: dbStatus.config
  });
});

// Endpoint to dynamically test and save a new connection setup via Settings panel (Bypass / Live connection check)
app.post("/api/mysql/test", async (req, res) => {
  const { host, port, user, password, database, sslCa } = req.body;
  
  if (!host || !user || !database) {
    return res.status(400).json({ 
      success: false, 
      message: "Data host, user, dan nama database wajib diisi." 
    });
  }

  const success = await initDatabase({ host, port, user, password, database, sslCa });
  
  if (success) {
    res.json({ 
      success: true, 
      message: "Koneksi ke Aiven.io MySQL berhasil! Tabel otomatis dibuat." 
    });
  } else {
    res.status(500).json({ 
      success: false, 
      message: `Koneksi gagal: ${dbStatus.error}` 
    });
  }
});

// BULK EXPORT CLIENT DATA TO MYSQL (OVERWRITE OR INSERT)
app.post("/api/mysql/push", async (req, res) => {
  const data = req.body;
  
  if (!pool) {
    // If not connected to MySQL, write to Local Disk Fallback JSON.
    try {
      fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
      return res.json({
        success: true,
        mode: "fallback",
        message: "Koneksi MySQL belum dikonfigurasi. Data Anda aman tersimpan di Sistem Lokal Server (Backup File)."
      });
    } catch (fsErr: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal menyimpan data lokal: ${fsErr?.message}`
      });
    }
  }

  let conn: mysql.PoolConnection;
  try {
    conn = await pool.getConnection();
  } catch (getConnErr: any) {
    console.error("Failed to acquire connection for MySQL pushing, falling back to local file writing:", getConnErr);
    
    // Disable faulty MySQL pool so that subsequent requests don't hang
    if (pool) {
      try {
        await pool.end();
      } catch (_) {}
      pool = null;
    }
    dbStatus.isConnected = false;
    dbStatus.error = `Koneksi putus: ${getConnErr?.message || getConnErr}`;

    // Gracefully write to local fallback
    try {
      fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
      return res.json({
        success: true,
        mode: "fallback",
        message: `Koneksi ke MySQL terputus (${getConnErr?.message || getConnErr}). Data telah disimpan secara lokal di Server.`
      });
    } catch (fsErr: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal menyimpan database lokal cadangan: ${fsErr?.message}`
      });
    }
  }

  try {
    await conn.beginTransaction();

    // 1. Users
    if (data.users && Array.isArray(data.users)) {
      await conn.execute("DELETE FROM users");
      for (const u of data.users) {
        await conn.execute(
          "INSERT INTO users (id, username, name, role, password, section) VALUES (?, ?, ?, ?, ?, ?)",
          [u.id, u.username, u.name, u.role, u.password || null, u.section || null]
        );
      }
    }

    // 2. Mails
    if (data.mails && Array.isArray(data.mails)) {
      await conn.execute("DELETE FROM mails");
      for (const m of data.mails) {
        await conn.execute(
          "INSERT INTO mails (id, type, reference_number, sender, recipient, subject, date, status, original_letter_number, letter_date, pdf_file, pdf_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            m.id, m.type, m.referenceNumber, m.sender, m.recipient, m.subject, m.date, m.status,
            m.originalLetterNumber || null, m.letterDate || null, m.pdfFile || null, m.pdfName || null
          ]
        );
      }
    }

    // 3. Staff
    if (data.staff && Array.isArray(data.staff)) {
      await conn.execute("DELETE FROM staff");
      for (const s of data.staff) {
        await conn.execute(
          "INSERT INTO staff (id, name, nip, pangkat, golongan, position, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, telepon, email, alamat, photo, riwayat_kepangkatan, riwayat_gaji, riwayat_pendidikan, riwayat_orang_tua, riwayat_pasangan, riwayat_anak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            s.id, s.name, s.nip, s.pangkat, s.golongan, s.position,
            s.tempatLahir || null, s.tanggalLahir || null, s.jenisKelamin || null, s.agama || null,
            s.telepon || null, s.email || null, s.alamat || null, s.photo || null,
            JSON.stringify(s.riwayatKepangkatan || []),
            JSON.stringify(s.riwayatGaji || []),
            JSON.stringify(s.riwayatPendidikan || []),
            JSON.stringify(s.riwayatOrangTua || null),
            JSON.stringify(s.riwayatPasangan || null),
            JSON.stringify(s.riwayatAnak || [])
          ]
        );
      }
    }

    // 4. Projects
    if (data.projects && Array.isArray(data.projects)) {
      await conn.execute("DELETE FROM projects");
      for (const p of data.projects) {
        await conn.execute(
          "INSERT INTO projects (id, name, location, budget, contractor, progress, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.name, p.location, p.budget, p.contractor, p.progress, p.startDate, p.endDate, p.status]
        );
      }
    }

    // 5. WaterLogs
    if (data.waterLogs && Array.isArray(data.waterLogs)) {
      await conn.execute("DELETE FROM water_logs");
      for (const w of data.waterLogs) {
        await conn.execute(
          "INSERT INTO water_logs (id, location, tma, debit, status, date, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [w.id, w.location, w.tma, w.debit, w.status, w.date, w.recordedBy]
        );
      }
    }

    // 6. DamageReports
    if (data.damageReports && Array.isArray(data.damageReports)) {
      await conn.execute("DELETE FROM damage_reports");
      for (const d of data.damageReports) {
        await conn.execute(
          "INSERT INTO damage_reports (id, reporter_name, reporter_phone, location, description, date, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [d.id, d.reporterName, d.reporterPhone, d.location, d.description, d.date, d.status]
        );
      }
    }

    // 7. Assets
    if (data.assets && Array.isArray(data.assets)) {
      await conn.execute("DELETE FROM assets");
      for (const a of data.assets) {
        await conn.execute(
          "INSERT INTO assets (id, name, code, \`condition\`, location, quantity, purchase_date, kib_category, price, brand, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            a.id, a.name, a.code, a.condition, a.location, a.quantity, a.purchaseDate,
            a.kibCategory || null, a.price || 0, a.brand || null, a.notes || null
          ]
        );
      }
    }

    // 8. AssetDistributions
    if (data.assetDistributions && Array.isArray(data.assetDistributions)) {
      await conn.execute("DELETE FROM asset_distributions");
      for (const ad of data.assetDistributions) {
        await conn.execute(
          "INSERT INTO asset_distributions (id, asset_id, asset_name, staff_id, staff_name, quantity, location, status, allocation_date, condition_at_allocation, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            ad.id, ad.assetId, ad.assetName, ad.staffId, ad.staffName, ad.quantity, ad.location || null,
            ad.status || null, ad.allocationDate, ad.conditionAtAllocation, ad.notes || null
          ]
        );
      }
    }

    // 9. ConsumableSupplies
    if (data.consumableSupplies && Array.isArray(data.consumableSupplies)) {
      await conn.execute("DELETE FROM consumable_supplies");
      for (const cs of data.consumableSupplies) {
        await conn.execute(
          "INSERT INTO consumable_supplies (id, item_name, category, stock, unit, min_stock, location, last_updated, history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            cs.id, cs.itemName, cs.category, cs.stock, cs.unit, cs.minStock, cs.location, cs.lastUpdated,
            JSON.stringify(cs.history || [])
          ]
        );
      }
    }

    // 10. FinanceTransactions
    if (data.financeTransactions && Array.isArray(data.financeTransactions)) {
      await conn.execute("DELETE FROM finance_transactions");
      for (const ft of data.financeTransactions) {
        await conn.execute(
          "INSERT INTO finance_transactions (id, date, description, amount, type, category, registered_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [ft.id, ft.date, ft.description, ft.amount, ft.type, ft.category, ft.registeredBy]
        );
      }
    }

    // 11. BankAccounts
    if (data.bankAccounts && Array.isArray(data.bankAccounts)) {
      await conn.execute("DELETE FROM bank_accounts");
      for (const ba of data.bankAccounts) {
        await conn.execute(
          "INSERT INTO bank_accounts (id, bank_name, account_number, account_holder, type, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [ba.id, ba.bankName, ba.accountNumber, ba.accountHolder, ba.type, ba.description || null, ba.status]
        );
      }
    }

    // 1活動. ActivityAccounts
    if (data.activityAccounts && Array.isArray(data.activityAccounts)) {
      await conn.execute("DELETE FROM activity_accounts");
      for (const aa of data.activityAccounts) {
        await conn.execute(
          "INSERT INTO activity_accounts (id, code, name, program_name, activity_name, allocation, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [aa.id, aa.code, aa.name, aa.programName, aa.activityName, aa.allocation, aa.description || null, aa.status]
        );
      }
    }

    // 13. SpjDocuments
    if (data.spjDocuments && Array.isArray(data.spjDocuments)) {
      await conn.execute("DELETE FROM spj_documents");
      for (const spj of data.spjDocuments) {
        await conn.execute(
          "INSERT INTO spj_documents (id, number, date, description, activity_code, amount, recipient, status, attachment_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [spj.id, spj.number, spj.date, spj.description, spj.activityCode, spj.amount, spj.recipient, spj.status, spj.attachmentUrl || null]
        );
      }
    }

    // 14. BappDocuments
    if (data.bappDocuments && Array.isArray(data.bappDocuments)) {
      await conn.execute("DELETE FROM bapp_documents");
      for (const bapp of data.bappDocuments) {
        await conn.execute(
          "INSERT INTO bapp_documents (id, number, date, project_name, contractor, amount, progress, terms, verified_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [bapp.id, bapp.number, bapp.date, bapp.projectName, bapp.contractor, bapp.amount, bapp.progress, bapp.terms, bapp.verifiedBy, bapp.status]
        );
      }
    }

    // 15. Contracts
    if (data.contracts && Array.isArray(data.contracts)) {
      await conn.execute("DELETE FROM contracts");
      for (const c of data.contracts) {
        await conn.execute(
          "INSERT INTO contracts (id, project_name, account_code, contract_number, contract_date, sppbj_number, sppbj_date, spmk_number, spmk_date, spl_number, spl_date, duration, status, contractor_name, amount, start_date, end_date, notes, addendums, closing_contract_number, closing_contract_date, closing_notes, pejabat_ppk, nip_ppk, pejabat_pptk, nip_pptk, pejabat_pengawas, nip_pengawas, rekanan_direktur, rekanan_jabatan, rekanan_npwp, rekanan_address, rekanan_bank_name, rekanan_bank_account, rekanan_bank_branch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            c.id, c.projectName, c.accountCode, c.contractNumber, c.contractDate,
            c.sppbjNumber, c.sppbjDate, c.spmkNumber, c.spmkDate, c.splNumber, c.splDate,
            c.duration, c.status || null, c.contractorName || null, c.amount || 0,
            c.startDate || null, c.endDate || null, c.notes || null,
            JSON.stringify(c.addendums || []),
            c.closingContractNumber || null, c.closingContractDate || null, c.closingClosingNotes || null,
            c.pejabatPPK || null, c.nipPPK || null, c.pejabatPPTK || null, c.nipPPTK || null,
            c.pejabatPengawas || null, c.nipPengawas || null, c.rekananDirektur || null,
            c.rekananJabatan || null, c.rekananNpwp || null, c.rekananAddress || null,
            c.rekananBankName || null, c.rekananBankAccount || null, c.rekananBankBranch || null
          ]
        );
      }
    }

    // 16. Profile
    if (data.profile) {
      await conn.execute("DELETE FROM instansi_profile");
      await conn.execute(
        "INSERT INTO instansi_profile (id, name, address, email, phone, head_name, head_nip, logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "instansi_main", data.profile.name, data.profile.address,
          data.profile.email, data.profile.phone, data.profile.headName,
          data.profile.headNip, data.profile.logo || null
        ]
      );
    }

    // 17. Footer
    if (data.footer) {
      await conn.execute("DELETE FROM footer_config");
      await conn.execute(
        "INSERT INTO footer_config (id, footer_text, copyright_text) VALUES (?, ?, ?)",
        ["footer_main", data.footer.footerText, data.footer.copyrightText]
      );
    }

    await conn.commit();
    
    // Also update current fallback JSON path
    try {
      fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (_) {}

    res.json({
      success: true,
      mode: "mysql",
      message: "Sukses mengunggah seluruh database lokal ke Aiven.io MySQL!"
    });
  } catch (dbErr: any) {
    await conn.rollback();
    console.error("MySQL push transaction rolled back:", dbErr);
    res.status(500).json({
      success: false,
      message: `Gagal mengunggah data ke MySQL: ${dbErr?.message || dbErr}`
    });
  } finally {
    conn.release();
  }
});

// BULK PULL DATA FROM MYSQL TO CLIENT
app.get("/api/mysql/pull", async (req, res) => {
  if (!pool) {
    // If not connected to MySQL, load from local disk fallback path
    try {
      if (fs.existsSync(FALLBACK_DB_PATH)) {
        const fileData = fs.readFileSync(FALLBACK_DB_PATH, "utf-8");
        return res.json({
          success: true,
          mode: "fallback",
          data: JSON.parse(fileData)
        });
      }
      return res.json({
        success: true,
        mode: "fallback",
        data: initialFallbackData
      });
    } catch (fsErr: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal memuat DB Backup Lokal: ${fsErr?.message}`
      });
    }
  }

  try {
    const data: any = { ...initialFallbackData };

    // 1. Users
    const [rowsUsers]: any = await pool.execute("SELECT * FROM users");
    data.users = rowsUsers.map((r: any) => ({
      id: r.id,
      username: r.username,
      name: r.name,
      role: r.role,
      password: r.password,
      section: r.section
    }));

    // 2. Mails
    const [rowsMails]: any = await pool.execute("SELECT * FROM mails");
    data.mails = rowsMails.map((r: any) => ({
      id: r.id,
      type: r.type,
      referenceNumber: r.reference_number,
      sender: r.sender,
      recipient: r.recipient,
      subject: r.subject,
      date: r.date,
      status: r.status,
      originalLetterNumber: r.original_letter_number,
      letterDate: r.letter_date,
      pdfFile: r.pdf_file,
      pdfName: r.pdf_name
    }));

    // 3. Staff
    const [rowsStaff]: any = await pool.execute("SELECT * FROM staff");
    data.staff = rowsStaff.map((r: any) => ({
      id: r.id,
      name: r.name,
      nip: r.nip,
      pangkat: r.pangkat,
      golongan: r.golongan,
      position: r.position,
      tempatLahir: r.tempat_lahir,
      tanggalLahir: r.tanggal_lahir,
      jenisKelamin: r.jenis_kelamin,
      agama: r.agama,
      telepon: r.telepon,
      email: r.email,
      alamat: r.alamat,
      photo: r.photo,
      riwayatKepangkatan: JSON.parse(r.riwayat_kepangkatan || "[]"),
      riwayatGaji: JSON.parse(r.riwayat_gaji || "[]"),
      riwayatPendidikan: JSON.parse(r.riwayat_pendidikan || "[]"),
      riwayatOrangTua: JSON.parse(r.riwayat_orang_tua || "null"),
      riwayatPasangan: JSON.parse(r.riwayat_pasangan || "null"),
      riwayatAnak: JSON.parse(r.riwayat_anak || "[]")
    }));

    // 4. Projects
    const [rowsProj]: any = await pool.execute("SELECT * FROM projects");
    data.projects = rowsProj.map((r: any) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      budget: r.budget,
      contractor: r.contractor,
      progress: r.progress,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status
    }));

    // 5. WaterLogs
    const [rowsWater]: any = await pool.execute("SELECT * FROM water_logs");
    data.waterLogs = rowsWater.map((r: any) => ({
      id: r.id,
      location: r.location,
      tma: r.tma,
      debit: r.debit,
      status: r.status,
      date: r.date,
      recordedBy: r.recorded_by
    }));

    // 6. DamageReports
    const [rowsDamage]: any = await pool.execute("SELECT * FROM damage_reports");
    data.damageReports = rowsDamage.map((r: any) => ({
      id: r.id,
      reporterName: r.reporter_name,
      reporterPhone: r.reporter_phone,
      location: r.location,
      description: r.description,
      date: r.date,
      status: r.status
    }));

    // 7. Assets
    const [rowsAssets]: any = await pool.execute("SELECT * FROM assets");
    data.assets = rowsAssets.map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      condition: r.condition,
      location: r.location,
      quantity: r.quantity,
      purchaseDate: r.purchase_date,
      kibCategory: r.kib_category,
      price: r.price,
      brand: r.brand,
      notes: r.notes
    }));

    // 8. AssetDistributions
    const [rowsAD]: any = await pool.execute("SELECT * FROM asset_distributions");
    data.assetDistributions = rowsAD.map((r: any) => ({
      id: r.id,
      assetId: r.asset_id,
      assetName: r.asset_name,
      staffId: r.staff_id,
      staffName: r.staff_name,
      quantity: r.quantity,
      location: r.location,
      status: r.status,
      allocationDate: r.allocation_date,
      conditionAtAllocation: r.condition_at_allocation,
      notes: r.notes
    }));

    // 9. ConsumableSupplies
    const [rowsCS]: any = await pool.execute("SELECT * FROM consumable_supplies");
    data.consumableSupplies = rowsCS.map((r: any) => ({
      id: r.id,
      itemName: r.item_name,
      category: r.category,
      stock: r.stock,
      unit: r.unit,
      minStock: r.min_stock,
      location: r.location,
      lastUpdated: r.last_updated,
      history: JSON.parse(r.history || "[]")
    }));

    // 10. FinanceTransactions
    const [rowsFT]: any = await pool.execute("SELECT * FROM finance_transactions");
    data.financeTransactions = rowsFT.map((r: any) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      amount: r.amount,
      type: r.type,
      category: r.category,
      registeredBy: r.registered_by
    }));

    // 11. BankAccounts
    const [rowsBA]: any = await pool.execute("SELECT * FROM bank_accounts");
    data.bankAccounts = rowsBA.map((r: any) => ({
      id: r.id,
      bankName: r.bank_name,
      accountNumber: r.account_number,
      accountHolder: r.account_holder,
      type: r.type,
      description: r.description,
      status: r.status
    }));

    // 12. ActivityAccounts
    const [rowsAA]: any = await pool.execute("SELECT * FROM activity_accounts");
    data.activityAccounts = rowsAA.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      programName: r.program_name,
      activityName: r.activity_name,
      allocation: r.allocation,
      description: r.description,
      status: r.status
    }));

    // 13. SpjDocuments
    const [rowsSPJ]: any = await pool.execute("SELECT * FROM spj_documents");
    data.spjDocuments = rowsSPJ.map((r: any) => ({
      id: r.id,
      number: r.number,
      date: r.date,
      description: r.description,
      activityCode: r.activity_code,
      amount: r.amount,
      recipient: r.recipient,
      status: r.status,
      attachmentUrl: r.attachment_url
    }));

    // 14. BappDocuments
    const [rowsBAPP]: any = await pool.execute("SELECT * FROM bapp_documents");
    data.bappDocuments = rowsBAPP.map((r: any) => ({
      id: r.id,
      number: r.number,
      date: r.date,
      projectName: r.project_name,
      contractor: r.contractor,
      amount: r.amount,
      progress: r.progress,
      terms: r.terms,
      verifiedBy: r.verified_by,
      status: r.status
    }));

    // 15. Contracts
    const [rowsC]: any = await pool.execute("SELECT * FROM contracts");
    data.contracts = rowsC.map((r: any) => ({
      id: r.id,
      projectName: r.project_name,
      accountCode: r.account_code,
      contractNumber: r.contract_number,
      contractDate: r.contract_date,
      sppbjNumber: r.sppbj_number,
      sppbjDate: r.sppbj_date,
      spmkNumber: r.spmk_number,
      spmkDate: r.spmk_date,
      splNumber: r.spl_number,
      splDate: r.spl_date,
      duration: r.duration,
      status: r.status,
      contractorName: r.contractor_name,
      amount: r.amount,
      startDate: r.start_date,
      endDate: r.end_date,
      notes: r.notes,
      addendums: JSON.parse(r.addendums || "[]"),
      closingContractNumber: r.closing_contract_number,
      closingContractDate: r.closing_contract_date,
      closingClosingNotes: r.closing_notes,
      pejabatPPK: r.pejabat_ppk,
      nipPPK: r.nip_ppk,
      pejabatPPTK: r.pejabat_pptk,
      nipPPTK: r.nip_pptk,
      pejabatPengawas: r.pejabat_pengawas,
      nipPengawas: r.nip_pengawas,
      rekananDirektur: r.rekanan_direktur,
      rekananJabatan: r.rekanan_jabatan,
      rekananNpwp: r.rekanan_npwp,
      rekananAddress: r.rekanan_address,
      rekananBankName: r.rekanan_bank_name,
      rekananBankAccount: r.rekanan_bank_account,
      rekananBankBranch: r.rekanan_bank_branch
    }));

    // 16. Profile
    const [rowsIP]: any = await pool.execute("SELECT * FROM instansi_profile LIMIT 1");
    if (rowsIP.length > 0) {
      const p = rowsIP[0];
      data.profile = {
        name: p.name,
        address: p.address,
        email: p.email,
        phone: p.phone,
        headName: p.head_name,
        headNip: p.head_nip,
        logo: p.logo
      };
    } else {
      data.profile = null;
    }

    // 17. Footer
    const [rowsFC]: any = await pool.execute("SELECT * FROM footer_config LIMIT 1");
    if (rowsFC.length > 0) {
      const f = rowsFC[0];
      data.footer = {
        footerText: f.footer_text,
        copyrightText: f.copyright_text
      };
    } else {
      data.footer = null;
    }

    // Save cache locally as fallback backup
    try {
      fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (_) {}

    res.json({
      success: true,
      mode: "mysql",
      data
    });
  } catch (err: any) {
    console.error("Failed to pull from MySQL. Automatically disabling MySQL pool and falling back to cached local database.", err);
    
    // Disable faulty MySQL pool so that subsequent requests don't hang
    if (pool) {
      try {
        await pool.end();
      } catch (_) {}
      pool = null;
    }
    dbStatus.isConnected = false;
    dbStatus.error = `Koneksi putus: ${err?.message || err}`;

    // Gracefully serve cached local database to the client
    try {
      if (fs.existsSync(FALLBACK_DB_PATH)) {
        const fileData = fs.readFileSync(FALLBACK_DB_PATH, "utf-8");
        return res.json({
          success: true,
          mode: "fallback",
          fallbackWarning: `Koneksi cloud database bermasalah (${err?.message || err}). Portal dialihkan ke mode offline lokal secara otomatis.`,
          data: JSON.parse(fileData)
        });
      }
      return res.json({
        success: true,
        mode: "fallback",
        fallbackWarning: `Koneksi cloud database bermasalah. Menggunakan database offline lokal.`,
        data: initialFallbackData
      });
    } catch (fsErr: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal beralih ke database lokal fallback: ${fsErr?.message}`
      });
    }
  }
});

// START THE SYSTEM SERVER
// Initialize the Aiven database pool on boot
initDatabase();

// In development, integrate Vite middleware.
// In production, serve built static files from `dist`.
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development Server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production Server running on http://0.0.0.0:${PORT}`);
  });
}
