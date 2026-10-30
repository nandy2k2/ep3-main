import { SSF } from 'xlsx';

export const studentDobValue = (value, date1904 = false) => {
  const format = (year, month, day) => `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : format(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  if (typeof value === 'number') {
    const date = SSF.parse_date_code(value, { date1904 });
    return date ? format(date.y, date.m, date.d) : '';
  }
  return String(value ?? '').trim();
};

export const studentDobInputValue = value => {
  const raw = studentDobValue(value);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  const local = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!iso && !local) return '';
  const year = iso ? iso[1] : local[3], month = iso ? iso[2] : local[2].padStart(2, '0'), day = iso ? iso[3] : local[1].padStart(2, '0');
  const formatted = `${year}-${month}-${day}`, date = new Date(`${formatted}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === formatted ? formatted : '';
};
