/**
 * Utility functions for UPTD application
 */

export function formatToIndoDate(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return '-';
  
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return '-';
    const day = String(dateVal.getDate()).padStart(2, '0');
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const year = dateVal.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const trimmed = String(dateVal).trim();
  if (!trimmed) return '-';

  // 1. Matches: YYYY-MM-DD
  const matchYMD = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchYMD) {
    return `${matchYMD[3]}/${matchYMD[2]}/${matchYMD[1]}`;
  }

  // 2. Matches: YYYY-MM-DD with hours/times or ISO string e.g. YYYY-MM-DDTHH:mm:ss.sssZ
  const matchISO = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (matchISO) {
    return `${matchISO[3]}/${matchISO[2]}/${matchISO[1]}`;
  }

  // 3. Already DD/MM/YYYY
  const matchDMY = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (matchDMY) {
    return trimmed;
  }

  // 4. Try parsing as an general Javascript date if it has any numbers or characters
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // ignore
  }

  return trimmed;
}
