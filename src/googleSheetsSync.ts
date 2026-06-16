import { getGoogleAccessToken, STORAGE_SYNC_MAP } from './firebase';

export interface SyncStatus {
  inProgress: boolean;
  message: string;
}

// Complete list of tabs to create on initialization
export const ALL_TABS = [
  'users',
  'mails',
  'staff',
  'projects',
  'projects_operasional',
  'water_logs',
  'damage_reports',
  'assets',
  'finances',
  'daerah_irigasi',
  'river_stations',
  'asset_distributions',
  'consumables',
  'activity_accounts',
  'spj',
  'bapp',
  'contracts',
  'bank_accounts',
  'job_proposals_operasional',
  'job_proposals_pembangunan',
  'inspection_logs',
  'profile_metadata',
  'footer_metadata'
];

interface SpreadsheetFileInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

/**
 * Searches for an existing "UPTD PSDA - Database Aplikasi" spreadsheet in Google Drive.
 */
export async function findExistingDatabaseSpreadsheet(token: string): Promise<SpreadsheetFileInfo | null> {
  const query = encodeURIComponent("name = 'UPTD PSDA - Database Aplikasi' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    let errMsg = `Status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch {
      try {
        const errText = await response.text();
        if (errText) errMsg = errText;
      } catch {}
    }
    throw new Error(`Drive search failed: ${errMsg}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return {
      id: data.files[0].id,
      name: data.files[0].name,
      webViewLink: data.files[0].webViewLink
    };
  }
  return null;
}

/**
 * Creates a brand new spreadsheet in Google Drive with all table tabs ready to roll.
 */
export async function createDatabaseSpreadsheet(token: string): Promise<SpreadsheetFileInfo> {
  const body = {
    properties: {
      title: 'UPTD PSDA - Database Aplikasi'
    },
    sheets: ALL_TABS.map(tabName => ({
      properties: {
        title: tabName
      }
    }))
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errMsg = await response.text();
    throw new Error(`Gagal membuat Spreadsheet: ${errMsg}`);
  }

  const result = await response.json();
  
  // Try retrieving webViewLink via Drive API for a complete user experience
  let webViewLink = `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`;
  try {
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${result.spreadsheetId}?fields=webViewLink`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (driveRes.ok) {
      const driveJson = await driveRes.json();
      if (driveJson.webViewLink) {
        webViewLink = driveJson.webViewLink;
      }
    }
  } catch (err) {
    console.warn('Could not fetch webViewLink from drive, falling back to default edit URL');
  }

  return {
    id: result.spreadsheetId,
    name: 'UPTD PSDA - Database Aplikasi',
    webViewLink
  };
}

/**
 * Erases existing content of a sheet tab so old data columns/rows don't stick around.
 */
export async function clearSheet(token: string, spreadsheetId: string, sheetTitle: string): Promise<void> {
  const range = `${sheetTitle}!A1:Z5000`;
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Packs local storage data of a particular sync map value, clearing old and pushing new row values.
 */
export async function exportCollectionToSheet(
  token: string,
  spreadsheetId: string,
  localStorageKey: string,
  sheetTitle: string,
  type: 'array' | 'object'
): Promise<void> {
  const rawData = localStorage.getItem(localStorageKey);
  if (!rawData) {
    // Nothing to export
    return;
  }

  try {
    const parsed = JSON.parse(rawData);
    let valuesToWrite: any[][] = [];

    if (type === 'array') {
      const items = Array.isArray(parsed) ? parsed : [];
      if (items.length === 0) {
        // Just write an indicator or leave clean
        return;
      }

      // 1. Gather all unique keys across all records for uniform column mapping
      const keySet = new Set<string>();
      items.forEach(item => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(k => keySet.add(k));
        }
      });

      const headers = Array.from(keySet);
      if (headers.length === 0) return;

      valuesToWrite.push(headers);

      // 2. Map row cells based on headers list
      items.forEach(item => {
        const row = headers.map(h => {
          const val = item[h];
          if (val === undefined || val === null) {
            return '';
          }
          if (typeof val === 'object') {
            // Stringify objects/arrays so they can be parsed back precisely
            return JSON.stringify(val);
          }
          return val;
        });
        valuesToWrite.push(row);
      });
    } else {
      // type === 'object' (e.g. metadata objects)
      if (typeof parsed !== 'object' || parsed === null) return;
      const keys = Object.keys(parsed);
      if (keys.length === 0) return;

      valuesToWrite.push(keys);
      const row = keys.map(k => {
        const val = parsed[k];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      });
      valuesToWrite.push(row);
    }

    if (valuesToWrite.length === 0) return;

    // First clear old data
    await clearSheet(token, spreadsheetId, sheetTitle);

    // Save range API
    const range = `${sheetTitle}!A1`;
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: valuesToWrite
      })
    });

    if (!response.ok) {
      throw new Error(`Sheet write failed: ${response.statusText}`);
    }
  } catch (err) {
    console.error(`Gagal mengekspor ${sheetTitle}:`, err);
  }
}

/**
 * Exports all local databases into their respective tabs in the active spreadsheet.
 */
export async function exportAllLocalDataToGoogleSheets(
  token: string, 
  spreadsheetId: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  const syncMappings = Object.entries(STORAGE_SYNC_MAP);
  
  for (let i = 0; i < syncMappings.length; i++) {
    const [localStorageKey, mapping] = syncMappings[i];
    if (onProgress) {
      onProgress(`Mengekspor halaman data: "${mapping.collection}" (${i + 1}/${syncMappings.length})...`);
    }
    await exportCollectionToSheet(token, spreadsheetId, localStorageKey, mapping.collection, mapping.type);
  }
}

/**
 * Fetches values from Google Sheet tab and populates them back into local storage, parsing nested JSON.
 */
export async function importCollectionFromSheet(
  token: string,
  spreadsheetId: string,
  localStorageKey: string,
  sheetTitle: string,
  type: 'array' | 'object'
): Promise<any> {
  const range = `${sheetTitle}!A1:Z5000`;
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.warn(`Could not read sheet "${sheetTitle}", spreadsheet might be blank.`);
    return null;
  }

  const data = await response.json();
  const rows = data.values as any[][];

  if (!rows || rows.length === 0) {
    return type === 'array' ? [] : {};
  }

  const headers = rows[0];
  if (type === 'array') {
    const items: any[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const item: any = {};
      
      headers.forEach((header, index) => {
        const val = row[index];
        if (val === undefined || val === null) {
          item[header] = '';
        } else {
          const trimmed = String(val).trim();
          if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try {
              item[header] = JSON.parse(trimmed);
            } catch {
              item[header] = val;
            }
          } else if (trimmed === 'true') {
            item[header] = true;
          } else if (trimmed === 'false') {
            item[header] = false;
          } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
            item[header] = Number(trimmed);
          } else {
            item[header] = val;
          }
        }
      });

      items.push(item);
    }

    localStorage.setItem(localStorageKey, JSON.stringify(items));
    return items;
  } else {
    // type === 'object'
    if (rows.length < 2) return null;
    const row = rows[1];
    const item: any = {};

    headers.forEach((header, index) => {
      const val = row[index];
      if (val === undefined || val === null) {
        item[header] = '';
      } else {
        const trimmed = String(val).trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            item[header] = JSON.parse(trimmed);
          } catch {
            item[header] = val;
          }
        } else if (trimmed === 'true') {
          item[header] = true;
        } else if (trimmed === 'false') {
          item[header] = false;
        } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
          item[header] = Number(trimmed);
        } else {
          item[header] = val;
        }
      }
    });

    localStorage.setItem(localStorageKey, JSON.stringify(item));
    return item;
  }
}

/**
 * Imports all worksheets from Google Sheets back into local storage to override local database.
 */
export async function importAllGoogleSheetsDataToLocal(
  token: string,
  spreadsheetId: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  const syncMappings = Object.entries(STORAGE_SYNC_MAP);

  for (let i = 0; i < syncMappings.length; i++) {
    const [localStorageKey, mapping] = syncMappings[i];
    if (onProgress) {
      onProgress(`Mengimpor halaman data: "${mapping.collection}" (${i + 1}/${syncMappings.length})...`);
    }
    await importCollectionFromSheet(token, spreadsheetId, localStorageKey, mapping.collection, mapping.type);
  }
}
