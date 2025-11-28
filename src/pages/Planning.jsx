import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Briefcase, FileText, Copy, Download, Plus, Trash2, Upload, Database } from 'lucide-react';
import { dataStore } from '@/api/dataStore';

// ===== CONFIGURACIÓ =====

const DAY_TYPES = {
  M: { name: 'Treballat', color: 'bg-blue-600', colorWeekend: 'bg-blue-900', textColor: 'text-white' },
  FS: { name: 'Descans', color: 'bg-white', colorHoliday: 'bg-gray-300', textColor: 'text-gray-700', border: 'border border-gray-300' },
  VE: { name: 'Vacances Estiu', color: 'bg-cyan-400', textColor: 'text-white', total: 3, isBlock: true },
  VS: { name: 'Setmana Santa', color: 'bg-purple-600', textColor: 'text-white', total: 2 },
  DS: { name: 'Adicional SS', color: 'bg-purple-400', textColor: 'text-white', total: 1 },
  VN: { name: 'Nadal', color: 'bg-red-600', textColor: 'text-white', total: 2 },
  LD: { name: 'Lliure Disposició', color: 'bg-lime-500', textColor: 'text-white', total: 3 },
  VC: { name: 'Jornada Intensiva', color: 'bg-amber-500', textColor: 'text-white', total: 3 },
  CH: { name: 'Compensació Hores (assignats pel planificador)', color: 'bg-pink-500', textColor: 'text-white', total: 4 },
  FR: { name: 'Festiu Recuperable', color: 'bg-orange-500', textColor: 'text-white' }
};

const MONTHS = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];

const MONTH_NAME_MAP = {
  gener: 1,
  enero: 1,
  january: 1,
  febrer: 2,
  febrero: 2,
  february: 2,
  març: 3,
  marzo: 3,
  march: 3,
  abril: 4,
  april: 4,
  maig: 5,
  mayo: 5,
  may: 5,
  juny: 6,
  junio: 6,
  june: 6,
  juliol: 7,
  julio: 7,
  july: 7,
  agost: 8,
  agosto: 8,
  august: 8,
  setembre: 9,
  septiembre: 9,
  september: 9,
  octubre: 10,
  october: 10,
  novembre: 11,
  noviembre: 11,
  november: 11,
  desembre: 12,
  diciembre: 12,
  december: 12,
};

const HOLIDAY_STORAGE_KEY = 'official-holidays-text-by-year';
const CYCLE_INDEX_STORAGE_KEY = 'cycle-index-by-year';
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function readHolidayText(year) {
  if (!isBrowser) return '';

  try {
    const stored = window.localStorage.getItem(HOLIDAY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return parsed[year] || '';
      }
    }
  } catch (err) {
    console.warn('No s\'ha pogut llegir festius locals:', err);
  }

  // Compatibilitat amb l'emmagatzematge antic per any
  const legacy = window.localStorage.getItem(`official-holidays-text-${year}`);
  return legacy || '';
}

function writeHolidayText(year, text) {
  if (!isBrowser) return;

  try {
    const stored = window.localStorage.getItem(HOLIDAY_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    const byYear = parsed && typeof parsed === 'object' ? parsed : {};

    const nextByYear = { ...byYear, [year]: text || '' };
    window.localStorage.setItem(HOLIDAY_STORAGE_KEY, JSON.stringify(nextByYear));
  } catch (err) {
    console.warn('No s\'ha pogut desar festius locals:', err);
  }
}

function readCycleIndexLocal(year) {
  if (!isBrowser) return null;

  try {
    const raw = window.localStorage.getItem(CYCLE_INDEX_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const value = parsed?.[year];
    return typeof value === 'number' ? value : null;
  } catch (err) {
    console.warn('No s\'ha pogut llegir l\'índex de cicle local:', err);
    return null;
  }
}

function writeCycleIndexLocal(year, value) {
  if (!isBrowser || typeof value !== 'number') return;

  try {
    const raw = window.localStorage.getItem(CYCLE_INDEX_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const byYear = parsed && typeof parsed === 'object' ? parsed : {};

    const nextByYear = { ...byYear, [year]: value };
    window.localStorage.setItem(CYCLE_INDEX_STORAGE_KEY, JSON.stringify(nextByYear));
  } catch (err) {
    console.warn('No s\'ha pogut desar l\'índex de cicle local:', err);
  }
}

const DAY_INFO = {
  VE: { deadline: '28 febrer', period: '1 juny - 30 setembre' },
  VS: { deadline: '31 gener', period: '1 mes abans/després Divendres Sant' },
  DS: { deadline: '31 gener', period: '1 mes abans/després Divendres Sant' },
  VN: { deadline: '15 octubre', period: '1 desembre - 28 febrer' },
  LD: { deadline: 'Durant l\'any', period: 'Tot l\'any, excepcionalment fins 31 gener' },
  VC: { deadline: 'Durant l\'any', period: 'Tot l\'any, excepcionalment fins 31 gener' },
  CH: { deadline: 'Assignats pel planificador', period: 'Dins del mateix any (no transferibles)' }
};

const { CalendarDay, ManualFR, PendingDay, CourseHours, CycleIndex, _calendar: calendarHelpers } = dataStore;
const MIN_YEAR = 2026;

const BASE_FIRST_FRIDAY = (() => {
  const start = new Date(MIN_YEAR, 0, 1);
  const firstFriday = new Date(start);
  while (firstFriday.getDay() !== 5) {
    firstFriday.setDate(firstFriday.getDate() + 1);
  }
  return firstFriday;
})();

async function loadCycleIndex(year) {
  const localValue = readCycleIndexLocal(year);
  if (typeof localValue === 'number') return localValue;

  try {
    const stored = await CycleIndex.filter({ year });
    const persisted = stored?.[0]?.last_cycle_index;
    if (typeof persisted === 'number') {
      writeCycleIndexLocal(year, persisted);
      return persisted;
    }
  } catch (err) {
    console.warn('No s\'ha pogut recuperar l\'índex de cicle:', err);
  }

  return null;
}

async function saveCycleIndex(year, lastCycleIndex) {
  if (typeof lastCycleIndex !== 'number') return;

  writeCycleIndexLocal(year, lastCycleIndex);

  try {
    await CycleIndex.replaceAll({
      year,
      records: [{ year, last_cycle_index: lastCycleIndex }]
    });
  } catch (err) {
    console.warn('No s\'ha pogut desar l\'índex de cicle al núvol:', err);
  }
}

// ===== FUNCIONS =====

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateDisplay(dateKey) {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

function parseDate(dateStr) {
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
}

function normalizeYear(rawYear, fallbackYear) {
  if (!rawYear) return fallbackYear;
  const numericYear = rawYear.length === 2 ? Number(`20${rawYear}`) : Number(rawYear);
  return Number.isFinite(numericYear) ? numericYear : fallbackYear;
}

function extractDateFromLine(line, year) {
  const numericMatch = line.match(/(\d{1,2})[\/\.\-\s](\d{1,2})(?:[\/\.\-\s](\d{2,4}))?/);
  if (numericMatch) {
    const [, dayStr, monthStr, rawYear] = numericMatch;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const normalizedYear = normalizeYear(rawYear, year);
    if (normalizedYear !== year) return null;

    const parsedDate = new Date(normalizedYear, month - 1, day);
    if (parsedDate.getFullYear() !== normalizedYear || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
      return null;
    }

    const label = line.replace(numericMatch[0], '').replace(/^[\s:;\-–,\.]+/, '').trim();
    return {
      date: `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${normalizedYear}`,
      label,
    };
  }

  const textMatch = line.toLowerCase().match(/(\d{1,2})\s*(?:de\s+|d['’]\s*)?([a-zçñà-ÿ]+)/i);
  if (textMatch) {
    const [, dayStr, monthNameRaw] = textMatch;
    const cleanedMonth = monthNameRaw.replace(/[\.,'’]/g, '');
    const month = MONTH_NAME_MAP[cleanedMonth];
    if (!month) return null;

    const yearMatch = line.match(/\b(\d{2,4})\b(?!.*\b\d{2,4}\b)/);
    const normalizedYear = normalizeYear(yearMatch?.[1], year);
    if (normalizedYear !== year) return null;

    const day = Number(dayStr);
    const parsedDate = new Date(normalizedYear, month - 1, day);
    if (parsedDate.getFullYear() !== normalizedYear || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
      return null;
    }

    const label = line.replace(textMatch[0], '').replace(yearMatch?.[0] || '', '').replace(/^[\s:;\-–,\.]+/, '').trim();
    return {
      date: `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${normalizedYear}`,
      label,
    };
  }

  return null;
}

function getFridayOnOrBefore(date) {
  const friday = new Date(date);
  while (friday.getDay() !== 5) { // 5 = divendres
    friday.setDate(friday.getDate() - 1);
  }
  return friday;
}

function generateWorkPattern(year, options = {}) {
  const { continueFromPreviousYear = false, previousCycleIndex = null } = options;
  const pattern = {};

  // Inicialitza tots els dies com a descans
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    pattern[key] = { date: key, day_type: 'FS' };
  }

  let currentFriday;
  let cycleIndex;

  if (continueFromPreviousYear && typeof previousCycleIndex === 'number') {
    const fridayBeforeOrOnStart = getFridayOnOrBefore(startDate);
    const firstFridayThisYear = new Date(startDate);
    while (firstFridayThisYear.getDay() !== 5) {
      firstFridayThisYear.setDate(firstFridayThisYear.getDate() + 1);
    }

    if (fridayBeforeOrOnStart.getFullYear() < year) {
      currentFriday = fridayBeforeOrOnStart;
      cycleIndex = previousCycleIndex;
    } else {
      currentFriday = firstFridayThisYear;
      cycleIndex = previousCycleIndex + 1;
    }
  } else {
    // Primer divendres de l'any = inici cicle
    currentFriday = new Date(startDate);
    while (currentFriday.getDay() !== 5) { // 5 = divendres
      currentFriday.setDate(currentFriday.getDate() + 1);
    }

    // Continuïtat cicle 4/3 respecte MIN_YEAR
    const weeksSinceBase = Math.floor((currentFriday - BASE_FIRST_FRIDAY) / (7 * 24 * 60 * 60 * 1000));
    cycleIndex = weeksSinceBase >= 0 ? weeksSinceBase : 0;
  }

  while (currentFriday <= endDate) {
    const workOffsets = cycleIndex % 2 === 0 ? [0, 1, 2, 3] : [0, 1, 2];

    workOffsets.forEach((offset) => {
      const workDate = new Date(currentFriday);
      workDate.setDate(workDate.getDate() + offset);
      if (workDate < startDate || workDate > endDate) return;

      // Assegurem descans fix cada dimarts, dimecres i dijous
      const dayOfWeek = workDate.getDay();
      if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) return;

      const key = formatDateKey(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
      pattern[key] = { date: key, day_type: 'M' };
    });

    currentFriday.setDate(currentFriday.getDate() + 7);
    cycleIndex++;
  }

  return { pattern, lastCycleIndex: cycleIndex - 1 };
}

function isWeekend(dateKey) {
  const [year, month, day] = dateKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isOfficialHoliday(dateKey, holidays = []) {
  const [y, month, day] = dateKey.split('-');
  const displayDate = `${day}-${month}-${y}`;
  return holidays.some(h => h.date === displayDate);
}

function getHolidayName(dateKey, holidays = []) {
  const [y, month, day] = dateKey.split('-');
  const displayDate = `${day}-${month}-${y}`;
  const holiday = holidays.find(h => h.date === displayDate);
  return holiday ? holiday.label : null;
}

function calculateFRPeriod(dateStr) {
  if (!dateStr || dateStr.length < 10) return { period: '-', deadline: '-' };
  
  const [day, month, year] = dateStr.split('-');
  const monthNum = parseInt(month);
  
  if (monthNum >= 3 && monthNum <= 5) {
    return { period: 'Març-Maig', deadline: '31 gener' };
  } else if (monthNum >= 6 && monthNum <= 9) {
    return { period: 'Juny-Set', deadline: '28 febrer' };
  } else if (monthNum === 10 || monthNum === 11) {
    return { period: 'Oct-Nov', deadline: '15 abril' };
  } else if (monthNum === 12 || monthNum === 1 || monthNum === 2) {
    return { period: 'Des-Gen-Feb', deadline: '15 octubre' };
  }

  return { period: '-', deadline: '-' };
}

function parseHolidayText(text, year) {
  if (!text) return [];

  const holidays = [];
  const seenDates = new Set();

  text.split(/\n+/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const parsed = extractDateFromLine(line, year);
    if (!parsed) return;

    const { date, label } = parsed;
    if (seenDates.has(date)) return;

    const { period, deadline } = calculateFRPeriod(date);
    holidays.push({
      date,
      label: label || 'Festiu oficial',
      period,
      deadline,
    });
    seenDates.add(date);
  });

  return holidays.sort((a, b) => new Date(parseDate(a.date)) - new Date(parseDate(b.date)));
}

function dateInputToDisplay(dateInput) {
  if (!dateInput) return '';
  const [year, month, day] = dateInput.split('-');
  return `${day}-${month}-${year}`;
}

function dateDisplayToInput(dateDisplay) {
  if (!dateDisplay) return '';
  const [day, month, year] = dateDisplay.split('-');
  return `${year}-${month}-${day}`;
}

function getDayOfWeekName(dayOfWeek) {
  const days = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
  return days[dayOfWeek];
}

function calculateGoodFriday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  const easterSunday = new Date(year, month - 1, day);
  const goodFriday = new Date(easterSunday);
  goodFriday.setDate(goodFriday.getDate() - 2);
  
  const months = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
  
  return `${goodFriday.getDate()} de ${months[goodFriday.getMonth()]}`;
}

// ===== COMPONENT =====

export default function Planning() {
  const [year, setYear] = useState(() => Math.max(MIN_YEAR, new Date().getFullYear()));
  const [calendar, setCalendar] = useState({});
  const [assigningSlot, setAssigningSlot] = useState(null);
  const [assigningFR, setAssigningFR] = useState(null);
  const [assigningPending, setAssigningPending] = useState(null);
  const [expandingContract, setExpandingContract] = useState(false);
  const [manualFR, setManualFR] = useState([]);
  const [pending2025, setPending2025] = useState([]);
  const [courseHours, setCourseHours] = useState([]);
  const [showNormativa, setShowNormativa] = useState(false);
  const [showSolicitud, setShowSolicitud] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [holidayText, setHolidayText] = useState('');
  const [deletingAssignment, setDeletingAssignment] = useState(false);

  const [baseWorkPattern, setBaseWorkPattern] = useState({});
  const [lastCycleIndex, setLastCycleIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const computePattern = async () => {
      const previousIndex = await loadCycleIndex(year - 1);
      const { pattern, lastCycleIndex: computedLastCycleIndex } = generateWorkPattern(year, {
        continueFromPreviousYear: typeof previousIndex === 'number',
        previousCycleIndex: previousIndex,
      });

      if (!cancelled) {
        setBaseWorkPattern(pattern);
        setLastCycleIndex(computedLastCycleIndex);
      }

      await saveCycleIndex(year, computedLastCycleIndex);
    };

    computePattern();

    return () => {
      cancelled = true;
    };
  }, [year]);

  const officialHolidays = useMemo(() => parseHolidayText(holidayText, year), [holidayText, year]);
  const officialFRs = useMemo(() => {
    const allowedDays = new Set([1, 5, 6]); // dilluns, divendres, dissabte

    return officialHolidays
      .map((holiday, idx) => {
        const dateKey = parseDate(holiday.date);
        const day = new Date(`${dateKey}T00:00:00`).getDay();
        const isWorked = baseWorkPattern[dateKey]?.day_type === 'M';

        if (isWorked && allowedDays.has(day) && day !== 0) {
          return { ...holiday, id: `official-${idx}`, dateKey };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
  }, [officialHolidays, baseWorkPattern, year]);

  const getBaseDayType = (dateKey) => baseWorkPattern[dateKey]?.day_type || 'FS';

  const restoreDay = (dateKey) => {
    const existingEntry = calendar[dateKey];
    if (!existingEntry) return;

    const baseType = getBaseDayType(dateKey);
    const newCalendar = { ...calendar, [dateKey]: { date: dateKey, day_type: baseType } };

    if (existingEntry.fromPreviousYear && typeof existingEntry.pendingIndex === 'number') {
      const updatedPending = [...pending2025];
      if (updatedPending[existingEntry.pendingIndex]) {
        updatedPending[existingEntry.pendingIndex].date = '';
        savePending2025(updatedPending);
      }
    }

    saveCalendar(newCalendar);
  };

  useEffect(() => {
    setHolidayText(readHolidayText(year));
  }, [year, baseWorkPattern]);

  useEffect(() => {
    writeHolidayText(year, holidayText);
  }, [holidayText, year]);

  useEffect(() => {
    if (!baseWorkPattern || Object.keys(baseWorkPattern).length === 0) return;

    const loadData = async () => {
      if (year < MIN_YEAR) {
        setYear(MIN_YEAR);
        return;
      }

      try {
        const storedHolidayText = readHolidayText(year);
        setHolidayText(storedHolidayText);

        // Carregar dies del calendari
        const calendarDays = await CalendarDay.filter({ year });

        if (calendarDays.length > 0) {
          // Hi ha dades al núvol - carregar-les
          const calendarObj = calendarHelpers.fromRecords(calendarDays);
          setCalendar(calendarObj);
          setHistory([calendarObj]);
          setHistoryIndex(0);
          console.log(`☁️ Calendari ${year} carregat del núvol (${calendarDays.length} dies)`);
        } else {
          // Només generar patró si no hi ha res
          const pattern = baseWorkPattern;
          const records = calendarHelpers.toRecords(pattern, year);
          await CalendarDay.replaceAll({ year, records });
          setCalendar(pattern);
          setHistory([pattern]);
          setHistoryIndex(0);
          console.log(`🔄 Calendari ${year} generat nou i guardat`);
        }

        // Carregar FR manuals
        const frRecords = await ManualFR.filter({ year });
        if (frRecords.length > 0) {
          const firstFR = frRecords[0];
          setManualFR([{ label: firstFR.label || 'SCR / RRHH', date: firstFR.date || '' }]);
        } else {
          setManualFR([
            { label: 'SCR / RRHH', date: '' }
          ]);
        }

        // Carregar dies pendents
        const pendingRecords = await PendingDay.filter({ year });
        pendingRecords.sort((a, b) => a.order_index - b.order_index);

        if (pendingRecords.length === 0 && year === 2026) {
          const defaultPending = [
            { type: 'LD25', date: '' },
            { type: 'FR 06-12-2025', date: '' },
            { type: 'FR 08-12-2025', date: '' },
            { type: 'VN25', date: '' },
            { type: 'VN25', date: '' }
          ];
          await savePending2025(defaultPending);
        } else {
          setPending2025(pendingRecords.map(p => ({ type: p.type, date: p.date || '' })));
        }

        // Carregar hores de cursos
        const courseRecords = await CourseHours.filter({ year });
        courseRecords.sort((a, b) => a.order_index - b.order_index);
        setCourseHours(courseRecords.map(c => ({
          name: c.name || '',
          date: c.date || '',
          hours: c.hours || 0,
          used: c.used || 0
        })));

        // Prepara l'any següent sense tocar l'actual
        const nextYear = year + 1;
        const nextCalendarDays = await CalendarDay.filter({ year: nextYear });
        if (nextCalendarDays.length === 0 && nextYear >= MIN_YEAR) {
          const persistedCycleIndex = await loadCycleIndex(year);
          const baseCycleIndex = typeof lastCycleIndex === 'number' ? lastCycleIndex : persistedCycleIndex;

          const { pattern: nextPattern, lastCycleIndex: nextCycleIndex } = generateWorkPattern(nextYear, {
            continueFromPreviousYear: typeof baseCycleIndex === 'number',
            previousCycleIndex: baseCycleIndex,
          });
          const records = calendarHelpers.toRecords(nextPattern, nextYear);
          await CalendarDay.replaceAll({ year: nextYear, records });
          await saveCycleIndex(nextYear, nextCycleIndex);
          console.log(`🆕 Any ${nextYear} preparat automàticament sense sobreescriure dades`);
        } else if (nextCalendarDays.length > 0) {
          console.log(`✅ Any ${nextYear} ja existeix, no es regenera`);
        }
      } catch (error) {
        console.error('Error carregant dades:', error);
        const pattern = baseWorkPattern;
        setCalendar(pattern);
        setHistory([pattern]);
        setHistoryIndex(0);
      }
    };

    loadData();
    }, [year, baseWorkPattern, lastCycleIndex]);

  const saveCalendar = async (newCalendar) => {
    setCalendar(newCalendar);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCalendar);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    try {
      // Crear nous registres (només camps amb valor definit)
      const records = calendarHelpers.toRecords(newCalendar, year);

      await CalendarDay.replaceAll({ year }, records);
      console.log('✅ Calendari guardat al núvol');
    } catch (error) {
      console.error('Error guardant calendari:', error);
    }
  };

  const saveManualFR = async (newFR) => {
    const normalizedFR = newFR.slice(0, 1);
    setManualFR(normalizedFR);

    try {
      const records = normalizedFR.map((fr) => ({
        year,
        label: typeof fr.label === 'string' ? fr.label : 'SCR / RRHH',
        date: typeof fr.date === 'string' ? fr.date : ''
      }));
      await ManualFR.replaceAll({ year }, records);
    } catch (error) {
      console.error('Error guardant FR manuals:', error);
      alert('⚠️ Error guardant FR manuals al núvol');
    }
  };

  const savePending2025 = async (newPending) => {
    setPending2025(newPending);

    try {
      // Crear nous registres
      const records = newPending
        .filter(p => p.type && p.type.trim() !== '') // Només guardar els que tenen tipus
        .map((p, idx) => ({
          year,
          type: p.type,
          date: p.date || '',
          order_index: idx
        }));

      await PendingDay.replaceAll({ year }, records);
      console.log('✅ Dies pendents guardats');
    } catch (error) {
      console.error('Error guardant dies pendents:', error);
    }
  };

  const saveCourseHours = async (newCourses) => {
    setCourseHours(newCourses);

    try {
      const records = newCourses.map((c, idx) => ({
        year,
        name: typeof c.name === 'string' ? c.name : '',
        date: typeof c.date === 'string' ? c.date : '',
        hours: typeof c.hours === 'number' ? c.hours : 0,
        used: typeof c.used === 'number' ? c.used : 0,
        order_index: idx
      }));
      await CourseHours.replaceAll({ year }, records);
    } catch (error) {
      console.error('Error guardant hores de cursos:', error);
      alert('⚠️ Error guardant cursos al núvol');
    }
  };

  const addCourseHours = () => {
    const newCourses = [...courseHours, { name: '', date: '', hours: 0, used: 0 }];
    saveCourseHours(newCourses);
  };

  const removeCourseHours = (idx) => {
    const newCourses = courseHours.filter((_, i) => i !== idx);
    saveCourseHours(newCourses);
  };

  const undo = async () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevCalendar = history[newIndex];
      setCalendar(prevCalendar);

      try {
        const records = calendarHelpers.toRecords(prevCalendar, year);
        await CalendarDay.replaceAll({ year }, records);
      } catch (error) {
        console.error('Error en undo:', error);
      }
    }
  };

  const redo = async () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const nextCalendar = history[newIndex];
        setCalendar(nextCalendar);

        try {
          const records = calendarHelpers.toRecords(nextCalendar, year);
        await CalendarDay.replaceAll({ year }, records);
      } catch (error) {
        console.error('Error en redo:', error);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setAssigningSlot(null);
        setAssigningFR(null);
        setAssigningPending(null);
        setExpandingContract(false);
        setDeletingAssignment(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const generateSolicitudText = () => {
    let text = `SOL·LICITUD DE DIES - ANY ${year}\n`;
    text += `${'='.repeat(50)}\n\n`;

    const totalVE = (assigned.VE?.[0]?.length || 0) + (assigned.VE?.[1]?.length || 0) + (assigned.VE?.[2]?.length || 0);
    text += `📅 VACANCES D'ESTIU (${totalVE}/31 dies)\n`;
    text += `${'-'.repeat(50)}\n`;
    
    assigned.VE?.forEach((block, idx) => {
      if (block && block.length > 0) {
        const first = formatDateDisplay(block[0]);
        const last = formatDateDisplay(block[block.length - 1]);
        text += `Període ${idx + 1}: Del ${first} al ${last} (${block.length} dies naturals)\n`;
      }
    });
    text += `\n`;

    if (assigned.VS?.some(d => d) || assigned.DS?.some(d => d)) {
      text += `🟣 SETMANA SANTA\n`;
      text += `${'-'.repeat(50)}\n`;
      assigned.VS?.forEach((date, idx) => {
        if (date) text += `VS ${idx + 1}: ${formatDateDisplay(date)}\n`;
      });
      assigned.DS?.forEach((date, idx) => {
        if (date) text += `DS: ${formatDateDisplay(date)}\n`;
      });
      text += `\n`;
    }

    if (assigned.VN?.some(d => d)) {
      text += `🔴 NADAL\n`;
      text += `${'-'.repeat(50)}\n`;
      assigned.VN?.forEach((date, idx) => {
        if (date) text += `VN ${idx + 1}: ${formatDateDisplay(date)}\n`;
      });
      text += `\n`;
    }

    const assignedFRs = Object.entries(calendar)
      .filter(([_, entry]) => entry.day_type === 'FR')
      .map(([dateKey, entry]) => ({ dateKey, label: getFRLabel(entry.frId) }));
    
    if (assignedFRs.length > 0) {
      text += `🔶 FESTIUS RECUPERABLES\n`;
      text += `${'-'.repeat(50)}\n`;
      assignedFRs.forEach(({ dateKey, label }) => {
        text += `${label}: ${formatDateDisplay(dateKey)}\n`;
      });
      text += `\n`;
    }

    if (assigned.LD?.some(d => d)) {
      text += `🟢 LLIURE DISPOSICIÓ\n`;
      text += `${'-'.repeat(50)}\n`;
      assigned.LD?.forEach((date, idx) => {
        if (date) text += `LD ${idx + 1}: ${formatDateDisplay(date)}\n`;
      });
      text += `\n`;
    }

    if (assigned.VC?.some(d => d)) {
      text += `🟡 JORNADA INTENSIVA\n`;
      text += `${'-'.repeat(50)}\n`;
      assigned.VC?.forEach((date, idx) => {
        if (date) text += `VC ${idx + 1}: ${formatDateDisplay(date)}\n`;
      });
      text += `\n`;
    }

    if (assigned.CH?.some(d => d)) {
      text += `🟣 COMPENSACIÓ HORES\n`;
      text += `${'-'.repeat(50)}\n`;
      assigned.CH?.forEach((date, idx) => {
        if (date) text += `CH ${idx + 1}: ${formatDateDisplay(date)}\n`;
      });
      text += `\n`;
    }

    const pendingAssigned = pending2025.filter(p => p.date);
    if (pendingAssigned.length > 0) {
      text += `📅 DIES PENDENTS ${year - 1}\n`;
      text += `${'-'.repeat(50)}\n`;
      pendingAssigned.forEach(p => {
        text += `${p.type}: ${p.date}\n`;
      });
      text += `\n`;
    }

    text += `${'='.repeat(50)}\n`;
    text += `Data de sol·licitud: ${new Date().toLocaleDateString('ca-ES')}\n`;

    return text;
  };

  const copySolicitud = () => {
    const text = generateSolicitudText();
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Sol·licitud copiada al portapapers');
    });
  };

  const downloadSolicitud = () => {
    const text = generateSolicitudText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solicitud-${year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addPending2025Row = () => {
    const newPending = [...pending2025, { type: '', date: '' }];
    savePending2025(newPending);
  };

  const removePending2025Row = (idx) => {
    const pendingDate = pending2025[idx].date;
    if (pendingDate) {
      const [day, month, year] = pendingDate.split('/');
      const dateKey = `${year}-${month}-${day}`;

      const newCalendar = { ...calendar };
      if (newCalendar[dateKey]?.fromPreviousYear && newCalendar[dateKey]?.pendingIndex === idx) {
        newCalendar[dateKey] = {
          date: dateKey,
          day_type: getBaseDayType(dateKey)
        };
      }
      
      Object.keys(newCalendar).forEach(key => {
        if (newCalendar[key].fromPreviousYear && newCalendar[key].pendingIndex > idx) {
          newCalendar[key].pendingIndex -= 1;
        }
      });
      saveCalendar(newCalendar);
    }
    
    const newPending = pending2025.filter((_, i) => i !== idx);
    savePending2025(newPending);
    
    if (assigningPending?.index === idx) {
      setAssigningPending(null);
    } else if (assigningPending?.index > idx) {
      setAssigningPending({ ...assigningPending, index: assigningPending.index - 1 });
    }
  };

  const moveDayToNextYear = async (code, index) => {
    const assignedData = assigned[code]?.[index];
    if (!assignedData) {
      alert('⚠️ Aquest dia no està assignat encara');
      return;
    }

    const typeLabel = `${code}${String(year).slice(-2)}`;
    
    try {
      const nextYear = year + 1;
      const existingPending = await PendingDay.filter({ year: nextYear });
      const newOrderIndex = existingPending.length;

      await PendingDay.append({
        year: nextYear,
        record: {
          type: typeLabel,
          date: '',
          order_index: newOrderIndex,
        },
      });
      
      alert(`✅ ${code} marcat com a pendent per ${nextYear}`);
    } catch (error) {
      console.error('Error movent dia al proper any:', error);
      alert('Error guardant el dia pendent');
    }
  };

  const handleDayClick = (dateKey) => {
    if (deletingAssignment) {
      restoreDay(dateKey);
      setAssigningSlot(null);
      setAssigningFR(null);
      setAssigningPending(null);
      setExpandingContract(false);
      return;
    }

    if (expandingContract) {
      const currentEntry = calendar[dateKey];

      if (currentEntry?.contractExpansion) {
        const newCalendar = { ...calendar };
        newCalendar[dateKey] = { date: dateKey, day_type: getBaseDayType(dateKey) };
        saveCalendar(newCalendar);
        return;
      }

      if (!currentEntry || currentEntry.day_type !== 'FS') {
        alert('⚠️ Ampliació només es pot fer sobre dies de descans (FS)');
        return;
      }
      
      const newCalendar = { ...calendar };
      newCalendar[dateKey] = { 
        date: dateKey, 
        day_type: 'M',
        contractExpansion: true
      };
      saveCalendar(newCalendar);
      return;
    }
    
    if (assigningPending) {
      const currentEntry = calendar[dateKey];

      if (currentEntry?.fromPreviousYear && currentEntry?.pendingIndex === assigningPending.index) {
        restoreDay(dateKey);
        const newPending = [...pending2025];
        newPending[assigningPending.index].date = '';
        savePending2025(newPending);
        setAssigningPending(null);
        return;
      }
      
      const pendingType = assigningPending.type;
      let dayType = null;
      
      if (pendingType.startsWith('VN')) {
        dayType = 'VN';
      } else if (pendingType.startsWith('LD')) {
        dayType = 'LD';
      } else if (pendingType.startsWith('VC')) {
        dayType = 'VC';
      } else if (pendingType.startsWith('CH')) {
        dayType = 'CH';
      } else if (pendingType.startsWith('FR')) {
        dayType = 'FR';
        if (!currentEntry || currentEntry.day_type !== 'M') {
          alert('⚠️ Els FR pendents només es poden assignar en dies treballats (M)');
          return;
        }
      }
      
      const newPending = [...pending2025];
      newPending[assigningPending.index].date = formatDateDisplay(dateKey);
      
      if (dayType) {
        const newCalendar = { ...calendar };
        newCalendar[dateKey] = { 
          date: dateKey, 
          day_type: dayType,
          fromPreviousYear: true,
          pendingIndex: assigningPending.index,
          pendingLabel: pendingType
        };
        saveCalendar(newCalendar);
      }
      
      savePending2025(newPending);
      setAssigningPending(null);
      return;
    }
    
    if (assigningFR) {
      const currentEntry = calendar[dateKey];
      
      if (currentEntry?.day_type === 'FR' && currentEntry?.frId === assigningFR.id) {
        const newCalendar = { ...calendar };
        newCalendar[dateKey] = { date: dateKey, day_type: 'M' };
        saveCalendar(newCalendar);
        setAssigningFR(null);
        return;
      }
      
      if (!currentEntry || currentEntry.day_type !== 'M') {
        alert('⚠️ Els FR només es poden assignar en dies treballats (M)');
        return;
      }
      
      const newCalendar = { ...calendar };
      newCalendar[dateKey] = {
        date: dateKey,
        day_type: 'FR',
        frId: assigningFR.id,
        originallyWorked: true
      };
      saveCalendar(newCalendar);
      setAssigningFR(null);
      return;
    }

    if (!assigningSlot) {
      // Si no estem assignant res, però cliquem sobre un dia amb tipus especial (VN, LD, etc.), el desassignem
      const existingEntry = calendar[dateKey];
      if (existingEntry && existingEntry.slotIndex !== undefined && ['VE', 'VS', 'DS', 'VN', 'LD', 'VC', 'CH'].includes(existingEntry.day_type)) {
        restoreDay(dateKey);
      }
      return;
    }

    const newCalendar = { ...calendar };
    const existingEntry = newCalendar[dateKey];
    
    // Si cliquem sobre un dia ja assignat al mateix slot, el desassignem
    if (existingEntry &&
        existingEntry.day_type === assigningSlot.type &&
        existingEntry.slotIndex === assigningSlot.index) {
      // Recuperar el patró base (M o FS segons el patró de treball)
      const baseType = getBaseDayType(dateKey);
      newCalendar[dateKey] = { date: dateKey, day_type: baseType };
      saveCalendar(newCalendar);
      return;
    }
    
    if (DAY_TYPES[assigningSlot.type]?.isBlock) {
      newCalendar[dateKey] = { 
        date: dateKey, 
        day_type: assigningSlot.type,
        slotIndex: assigningSlot.index 
      };
      saveCalendar(newCalendar);
    } else {
      // Per tipus no-bloc, primer esborrar l'anterior si existeix
      const previousAssigned = Object.entries(newCalendar).find(
        ([_, entry]) => entry.day_type === assigningSlot.type && entry.slotIndex === assigningSlot.index
      );
      if (previousAssigned) {
        const [prevDateKey] = previousAssigned;
        const baseType = getBaseDayType(prevDateKey);
        newCalendar[prevDateKey] = { date: prevDateKey, day_type: baseType };
      }
      
      newCalendar[dateKey] = { 
        date: dateKey, 
        day_type: assigningSlot.type,
        slotIndex: assigningSlot.index 
      };
      saveCalendar(newCalendar);
      setAssigningSlot(null);
    }
  };

  const handleSlotClick = (type, index) => {
    setAssigningSlot({ type, index });
    setAssigningFR(null);
    setAssigningPending(null);
    setExpandingContract(false);
    setDeletingAssignment(false);
  };
  
  const handleFRClick = (frId, label) => {
    setAssigningFR({ id: frId, label });
    setAssigningSlot(null);
    setAssigningPending(null);
    setExpandingContract(false);
    setDeletingAssignment(false);
  };
  
  const handlePendingClick = (index, type) => {
    setAssigningPending({ index, type });
    setAssigningSlot(null);
    setAssigningFR(null);
    setExpandingContract(false);
    setDeletingAssignment(false);
  };
  
  const handleFinishBlock = () => {
    setAssigningSlot(null);
  };

  const getAssignedDates = () => {
    const assigned = {};
    Object.keys(DAY_TYPES).forEach(type => {
      if (DAY_TYPES[type].total) {
        assigned[type] = [];
        for (let i = 0; i < DAY_TYPES[type].total; i++) {
          if (DAY_TYPES[type].isBlock) {
            const dates = Object.entries(calendar)
              .filter(([_, entry]) => entry.day_type === type && entry.slotIndex === i)
              .map(([key]) => key)
              .sort();
            assigned[type][i] = dates;
          } else {
            const found = Object.entries(calendar).find(
              ([_, entry]) => entry.day_type === type && entry.slotIndex === i
            );
            assigned[type][i] = found ? found[0] : null;
          }
        }
      }
    });
    return assigned;
  };
  
  const getAssignedFR = (frId) => {
    const found = Object.entries(calendar).find(
      ([_, entry]) => entry.day_type === 'FR' && entry.frId === frId
    );
    return found ? found[0] : null;
  };
  
  const getFRLabel = (frId) => {
    if (!frId) return null;

    if (frId.startsWith('official-')) {
      const index = parseInt(frId.replace('official-', ''));
      return officialHolidays[index]?.label || null;
    }
    
    if (frId.startsWith('manual-')) {
      const index = parseInt(frId.replace('manual-', ''));
      return manualFR[index]?.label || 'SCR / RRHH';
    }
    
    return null;
  };

  const assigned = getAssignedDates();
  
  const formatBlockDates = (dates) => {
    if (!dates || dates.length === 0) return '-';
    if (dates.length === 1) return formatDateDisplay(dates[0]);
    const first = formatDateDisplay(dates[0]);
    const last = formatDateDisplay(dates[dates.length - 1]);
    return `${first} → ${last} (${dates.length} dies)`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">PLANNING</h1>
                <p className="text-sm text-gray-600">Hospital del Mar - 25,38h</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={year}
                onChange={(e) => {
                  const selectedYear = Math.max(MIN_YEAR, Number(e.target.value));
                  setYear(selectedYear);
                  setAssigningSlot(null);
                  setAssigningFR(null);
                  setAssigningPending(null);
                  setExpandingContract(false);
                  setDeletingAssignment(false);
                }}
                className="border rounded px-3 py-2 font-bold"
              >
                {(() => {
                  const currentYear = Math.max(MIN_YEAR, new Date().getFullYear());
                  return Array.from({ length: 5 }, (_, idx) => currentYear + idx).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ));
                })()}
              </select>

              <button
                onClick={() => {
                  setExpandingContract(!expandingContract);
                  setAssigningSlot(null);
                  setAssigningFR(null);
                  setAssigningPending(null);
                  setDeletingAssignment(false);
                }}
                className={`px-4 py-2 rounded flex items-center gap-2 ${expandingContract ? 'bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                <Briefcase className="w-4 h-4" />
                Ampliació
              </button>

              <button
                onClick={() => {
                  const nextState = !deletingAssignment;
                  setDeletingAssignment(nextState);
                  if (nextState) {
                    setAssigningSlot(null);
                    setAssigningFR(null);
                    setAssigningPending(null);
                    setExpandingContract(false);
                  }
                }}
                className={`px-3 py-2 rounded flex items-center gap-2 text-sm ${deletingAssignment ? 'bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                title="Activa el mode esborrar assignació"
              >
                <Trash2 className="w-4 h-4" />
                Borrar assignació
              </button>

              <button
                onClick={() => setShowSolicitud(!showSolicitud)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Sol·licitud</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    const calendarDays = await CalendarDay.filter({ year });
                    const frRecords = await ManualFR.filter({ year });
                    const pendingRecords = await PendingDay.filter({ year });
                    const courseRecords = await CourseHours.filter({ year });
                    
                    const backup = {
                      year,
                      date: new Date().toISOString(),
                      calendar: calendarDays,
                      manualFR: frRecords,
                      pending: pendingRecords,
                      courses: courseRecords
                    };
                    
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup-${year}-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    alert('✅ Backup descarregat');
                  } catch (error) {
                    alert('Error creant backup');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-2"
                title="Descarregar backup de totes les dades"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Backup</span>
              </button>
              
              <button
                onClick={() => setShowNormativa(!showNormativa)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
              >
                {showNormativa ? 'Amagar' : 'Normativa'}
              </button>
            </div>
          </div>
        </div>

          {expandingContract && (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 rounded">
              <p className="font-bold text-green-900">
                💼 Ampliant contracte (29h)
              </p>
              <p className="text-sm text-green-800">
                Clica sobre dies de descans (FS) per convertir-los temporalment en dies treballats (M) sense alterar el patró base. Pensat per ampliar de divendres a dilluns, però pots afegir altres dies puntualment si cal. Els dies ampliats es marcaran amb 💼.
                <button onClick={() => setExpandingContract(false)} className="underline ml-2 font-bold">Finalitzar</button>
              </p>
            </div>
          )}

        {assigningSlot && (
          <div className="bg-yellow-100 border-l-4 border-yellow-600 p-4 rounded">
            <p className="font-bold text-yellow-900">
              ⚡ Assignant: {assigningSlot.type} - {DAY_TYPES[assigningSlot.type]?.isBlock ? `Bloc #${assigningSlot.index + 1}` : `#${assigningSlot.index + 1}`}
            </p>
            {DAY_TYPES[assigningSlot.type]?.isBlock ? (
              <p className="text-sm text-yellow-800">
                Clica sobre dies del calendari per afegir-los al bloc. Clica de nou per esborrar-los. 
                <button onClick={handleFinishBlock} className="underline font-bold ml-2">✓ Finalitzar bloc</button>
              </p>
            ) : (
              <p className="text-sm text-yellow-800">
                Clica sobre un dia del calendari per assignar-lo. 
                <button onClick={() => setAssigningSlot(null)} className="underline">Cancel·lar</button>
              </p>
            )}
          </div>
        )}
        
        {assigningPending && (
          <div className="bg-purple-100 border-l-4 border-purple-600 p-4 rounded">
            <p className="font-bold text-purple-900">
              📅 Assignant dia pendent: {assigningPending.type}
            </p>
            <p className="text-sm text-purple-800">
              {assigningPending.type.startsWith('FR') ? (
                <>Clica sobre un <strong>dia treballat (M)</strong> del calendari per assignar aquest FR pendent de {year - 1}. Els dies M tenen anell morat parpellejant. Clica de nou sobre el dia assignat per desassignar-lo.</>
              ) : (
                <>Clica sobre qualsevol dia del calendari per assignar aquest dia pendent de {year - 1}. Clica de nou sobre el dia assignat per desassignar-lo.</>
              )}
              <button onClick={() => setAssigningPending(null)} className="underline ml-2 font-bold">Cancel·lar</button>
            </p>
          </div>
        )}
        
        {assigningFR && (
          <div className="bg-orange-100 border-l-4 border-orange-600 p-4 rounded">
            <p className="font-bold text-orange-900">
              🔶 Assignant FR: {assigningFR.label}
            </p>
            <p className="text-sm text-orange-800">
              Clica sobre un <strong>dia treballat (M)</strong> per assignar aquest FR (els dies M tenen anell taronja parpellejant). 
              Clica sobre el FR assignat per tornar-lo a M.
              <button onClick={() => setAssigningFR(null)} className="underline ml-2 font-bold">Cancel·lar</button>
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Calendari {year}</h2>
          
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex mb-2">
                <div className="w-24" />
                <div className="flex gap-1">
                  {Array.from({ length: 31 }, (_, i) => (
                    <div key={i} className="w-8 text-[10px] text-center font-bold text-gray-500">
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
              
              {MONTHS.map((month, mi) => {
                const daysInMonth = getDaysInMonth(year, mi);
                
                return (
                  <React.Fragment key={mi}>
                    <div className="flex mb-1">
                      <div className="w-24 font-bold text-sm text-right pr-3 flex items-center justify-end">
                        {month}
                      </div>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = i + 1;
                        if (day > daysInMonth) {
                          return <div key={i} className="w-8 h-8" />;
                        }
                        
                        const dateKey = formatDateKey(year, mi, day);
                        const entry = calendar[dateKey];
                        const baseDayType = baseWorkPattern[dateKey]?.day_type || 'FS';
                        const dayType = entry?.day_type || baseDayType;
                        const config = DAY_TYPES[dayType];
                        
                        const isActiveBlock = assigningSlot && 
                          entry?.day_type === assigningSlot.type && 
                          entry?.slotIndex === assigningSlot.index;
                          
                        const isActiveFR = assigningFR &&
                          entry?.day_type === 'FR' &&
                          entry?.frId === assigningFR.id;
                        
                        const weekend = isWeekend(dateKey);
                        const holiday = isOfficialHoliday(dateKey, officialHolidays);
                        const holidayName = getHolidayName(dateKey, officialHolidays);
                        const date = new Date(year, mi, day);
                        const dayOfWeek = date.getDay();

                        let bgColor = config.color;
                        let textColor = config.textColor;
                        let borderClass = '';
                        let showStar = false;

                        const isSundayHoliday = holiday && dayOfWeek === 0;
                        const starClass = isSundayHoliday ? 'text-gray-400' : 'text-yellow-400';

                        const workedHoliday = holiday && baseDayType === 'M';

                        if (workedHoliday) {
                          bgColor = DAY_TYPES.M.colorWeekend;
                          textColor = DAY_TYPES.M.textColor;
                          showStar = true;
                        } else if (dayType === 'M') {
                          if (weekend) {
                            bgColor = config.colorWeekend;
                          }
                          if (holiday) {
                            bgColor = config.colorWeekend;
                            showStar = true;
                          }
                        } else if (holiday) {
                          bgColor = DAY_TYPES.FS.colorHoliday;
                          textColor = DAY_TYPES.FS.textColor;
                        } else if (dayType === 'FS') {
                          bgColor = config.color;
                          borderClass = config.border;
                        }
                        
                        const dayName = getDayOfWeekName(dayOfWeek);
                        let tooltipText = `${dayName}, ${day} ${month} - ${config.name}`;
                        if (dayType === 'FR' && entry?.frId) {
                          const frLabel = getFRLabel(entry.frId);
                          tooltipText += ` (FR: ${frLabel})`;
                        }
                        if (entry?.fromPreviousYear) {
                          const pendingLabel = entry?.pendingLabel || 'Any anterior';
                          tooltipText += ` - Pendent ${year - 1} (${pendingLabel})`;
                        }
                        if (holiday && holidayName) {
                          tooltipText += ` - ${holidayName}`;
                        }
                        
                        const canAssignFR = assigningFR && dayType === 'M';
                        const isFRAndAssigning = assigningFR && dayType === 'FR';
                        const isAssigningPending = assigningPending !== null;
                        const canAssignPendingFR = assigningPending?.type.startsWith('FR') && dayType === 'M';
                        const isActivePending = assigningPending && 
                          entry?.fromPreviousYear && 
                          entry?.pendingIndex === assigningPending.index;
                        const canExpandContract = expandingContract && dayType === 'FS';
                        const isContractExpansion = entry?.contractExpansion;
                        
                        return (
                          <button
                            key={i}
                          onClick={() => handleDayClick(dateKey)}
                          className={`w-8 h-8 ${bgColor} ${borderClass} ${textColor} text-[10px] font-bold rounded hover:opacity-80 ${
                            assigningSlot ? 'ring-2 ring-yellow-400' : ''
                          } ${isActiveBlock ? 'ring-4 ring-green-500' : ''} ${
                            isActiveFR ? 'ring-4 ring-green-500' : ''
                            } ${
                              canAssignFR ? 'ring-2 ring-orange-500 animate-pulse' : ''
                            } ${
                              isFRAndAssigning && !isActiveFR ? 'ring-2 ring-gray-400' : ''
                            } ${
                              isAssigningPending && !canAssignPendingFR && !isActivePending ? 'ring-2 ring-purple-500 animate-pulse' : ''
                            } ${
                              canAssignPendingFR ? 'ring-2 ring-purple-600 animate-pulse' : ''
                            } ${
                              isActivePending ? 'ring-4 ring-purple-700' : ''
                            } ${
                              canExpandContract ? 'ring-2 ring-green-500 animate-pulse' : ''
                          } ${
                            isContractExpansion ? 'ring-2 ring-green-700' : ''
                          } flex items-center justify-center relative`}
                          title={tooltipText}
                        >
                          <span>{dayType}</span>
                          {showStar && (
                            <span className={`absolute top-0 right-0 text-[8px] ${starClass}`}>
                              ★
                            </span>
                          )}
                          {entry?.fromPreviousYear && <span className="absolute bottom-0 left-0 text-[8px]">📌</span>}
                          {isContractExpansion && <span className="absolute top-0 left-0 text-[8px]">💼</span>}
                        </button>
                      );
                    })}
                    </div>
                  </div>
                  
                  {mi === 11 && (
                    <div className="flex mt-1">
                      <div className="w-24" />
                      <div className="flex gap-1">
                        {Array.from({ length: 31 }, (_, i) => (
                          <div key={i} className="w-8 text-[10px] text-center font-bold text-gray-500">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {showNormativa && (
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-900">📋 Normativa</h2>
            
            <div className="space-y-4 text-sm text-blue-800">
              <div>
                <h3 className="font-bold text-blue-900 mb-2">📅 Vacances d'Estiu (VE)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>31 dies naturals anuals total</li>
                  <li>Es divideixen en <strong>3 blocs</strong> separats</li>
                  <li>Sol·licitar abans del <strong>28 de febrer</strong></li>
                  <li>Gaudir entre <strong>1 juny - 30 setembre</strong></li>
                  <li>Mínim 7 dies naturals per bloc</li>
                  <li>Mínim 7 dies naturals entre blocs</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-blue-900 mb-2">🟣 Setmana Santa (VS + DS)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>2 dies festius (VS) + 1 dia addicional (DS)</li>
                  <li>Sol·licitar abans del <strong>31 de gener</strong></li>
                  <li>Gaudir: 1 mes abans/després Divendres Sant</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-blue-900 mb-2">🔴 Nadal (VN)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>2 dies festius</li>
                  <li>Sol·licitar abans del <strong>15 d'octubre</strong></li>
                  <li>Gaudir entre <strong>1 desembre - 28 febrer</strong></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-blue-900 mb-2">🔶 Festius Recuperables (FR)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Març-Maig:</strong> sol·licitar abans 31 gener</li>
                  <li><strong>Juny-Setembre:</strong> sol·licitar abans 28 febrer</li>
                  <li><strong>Octubre-Novembre:</strong> sol·licitar abans 15 abril</li>
                  <li><strong>Desembre-Gener-Febrer:</strong> sol·licitar abans 15 octubre</li>
                  <li>S'han de gaudir dins del mateix període trimestral</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-blue-900 mb-2">🟢 Lliure Disposició i Jornada Intensiva</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>LD:</strong> 3 dies, durant tot l'any</li>
                  <li><strong>VC:</strong> 3 dies, durant tot l'any</li>
                  <li>Excepcionalment fins 31 gener de l'any següent</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-blue-900 mb-2">🕓 Compensació d'Hores (CH)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Total anual:</strong> 4 dies</li>
                  <li><strong>Assignació:</strong> els assigna el planificador dins del calendari oficial del servei</li>
                  <li><strong>Elecció:</strong> l'usuari NO pot triar els dies de CH; només els marca al calendari quan ja consten al planning oficial</li>
                  <li><strong>Període de gaudiment:</strong> dins del mateix any natural, no es poden traslladar a l'any següent</li>
                  <li><strong>Finalitat:</strong> compensen hores extres derivades de la jornada anual de 25,38 h setmanals</li>
                  <li><strong>Proporcionalitat:</strong> per contractes de 25,38 h equival aproximadament a 4,44 dies → 4 CH</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-red-800">📌 Festius oficials {year}</h3>
            <span className="text-xs text-gray-600">{officialHolidays.length} detectats</span>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            Enganxa aquí el llistat oficial de festius ({year}) en format lliure. Accepta dates com
            <strong className="ml-1">01/01/{year}</strong>, <strong>{`1-1-${year}`}</strong> o
            <strong className="ml-1">1 de gener {year}</strong>. Només es marcaran al calendari les dates detectades (incloent diumenges si hi apareixen al llistat).
          </p>

          <textarea
            value={holidayText}
            onChange={(e) => setHolidayText(e.target.value)}
            rows={6}
            className="w-full border rounded p-2 text-sm font-mono"
            placeholder={`01/01/${year} Any Nou\n06/01/${year} Reis\n15/08/${year} Assumpció`}
          />

          <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
            <span>Detectats {officialHolidays.length} festius. Els diumenges només es marquen si són al llistat.</span>
            <button
              onClick={() => setHolidayText('')}
              className="text-red-600 hover:text-red-800 font-bold"
            >
              Buidar
            </button>
          </div>

          {officialHolidays.length > 0 && (
            <ul className="mt-3 space-y-1 max-h-32 overflow-y-auto text-xs text-gray-800">
              {officialHolidays.map((holiday) => (
                <li key={holiday.date} className="flex items-center gap-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{holiday.date}</span>
                  <span className="flex-1">{holiday.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-lg mb-3 text-orange-800">🔶 FR - Festius Recuperables</h3>
            
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-orange-100">
                  <th className="border p-1 w-16">Tipus</th>
                  <th className="border p-1 w-32">Gaudit</th>
                  <th className="border p-1">Demanar abans de</th>
                  <th className="border p-1">Període per gaudir</th>
                  <th className="border p-1 w-12">→ {year + 1}</th>
                </tr>
              </thead>
              <tbody>
                {officialFRs
                  .map((fr) => {
                    const frId = fr.id;
                    const assignedDate = getAssignedFR(frId);
                    const isActive = assigningFR?.id === frId;
                    const canMoveToNextYear = fr.period === 'Des-Gen-Feb';
                    
                      return (
                        <tr
                          key={frId}
                          className={`cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-yellow-100' : ''}`}
                          onClick={() => handleFRClick(frId, fr.label)}
                        >
                        <td className="border p-1 text-center">
                          <div className="bg-orange-500 text-white font-bold text-[10px] rounded px-1 py-0.5">
                            FR {fr.date}
                          </div>
                        </td>
                        <td className="border p-1 text-center font-mono text-[10px]">
                          {assignedDate ? formatDateDisplay(assignedDate) : '-'}
                        </td>
                        <td className="border p-1 text-center text-[11px]">{fr.deadline}</td>
                        <td className="border p-1 text-center text-[11px]">{fr.period}</td>
                        <td className="border p-1 text-center">
                          {canMoveToNextYear && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const nextYear = year + 1;
                                  const existingPending = await PendingDay.filter({ year: nextYear });
                                  const newOrderIndex = existingPending.length;

                                  await PendingDay.append({
                                    year: nextYear,
                                    record: {
                                      type: `FR ${fr.date}`,
                                      date: '',
                                      order_index: newOrderIndex,
                                    }
                                  });

                                  alert(`✅ FR ${fr.label} marcat com a pendent per ${nextYear}`);
                                } catch (error) {
                                  console.error('Error:', error);
                                  alert('Error guardant FR pendent');
                                }
                              }}
                              className="text-purple-600 hover:text-purple-800 font-bold"
                              title={`Marcar com a pendent per ${year + 1}`}
                            >
                              →
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                
                {manualFR.map((fr, idx) => {
                  const frId = `manual-${idx}`;
                  const assignedDate = getAssignedFR(frId);
                  const isActive = assigningFR?.id === frId;
                  const calculatedInfo = calculateFRPeriod(fr.date);
                  
                  return (
                    <tr 
                      key={`manual-${idx}`}
                      className={`cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-yellow-100' : ''}`}
                      onClick={() => handleFRClick(frId, fr.label)}
                    >
                      <td className="border p-1 text-center">
                        <div className="bg-orange-500 text-white font-bold text-[10px] rounded px-1 py-0.5 flex items-center justify-center gap-1">
                          <span className="text-[9px] uppercase tracking-tight">{fr.label || 'SCR / RRHH'}</span>
                          <input
                            type="date"
                            value={dateDisplayToInput(fr.date)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newFR = [...manualFR];
                              newFR[idx].date = dateInputToDisplay(e.target.value);
                              saveManualFR(newFR);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent text-center text-white text-[10px] border-none outline-none cursor-pointer w-20"
                            style={{ 
                              colorScheme: 'dark',
                              fontSize: '10px'
                            }}
                          />
                        </div>
                      </td>
                      <td className="border p-1 text-center font-mono text-[10px]">
                        {assignedDate ? formatDateDisplay(assignedDate) : '-'}
                      </td>
                      <td className="border p-1 text-center text-[11px]">
                        {calculatedInfo.deadline}
                      </td>
                      <td className="border p-1 text-center text-[11px]">
                        {calculatedInfo.period}
                      </td>
                      <td className="border p-1 text-center"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-3 text-xs text-gray-600">
              <p>💡 Només es mostren els festius oficials treballats (divendres, dissabte o dilluns; mai diumenges) segons el patró 4/3.</p>
              <p className="mt-1">📅 Per als FR manuals, clica sobre el calendari 📅 per seleccionar la data del festiu - el període i deadline es calcularan automàticament</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-lg mb-3">📅 Dies per Demanar</h3>
            
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border p-1 w-12">Tipus</th>
                  <th className="border p-1 w-32">Gaudit</th>
                  <th className="border p-1">Demanar abans de</th>
                  <th className="border p-1">Període per gaudir</th>
                  <th className="border p-1 w-12">→ {year + 1}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(DAY_TYPES)
                  .filter(([code, config]) => config.total)
                  .map(([code, config]) => (
                    Array.from({ length: config.total }, (_, idx) => {
                      const assignedData = assigned[code]?.[idx];
                      const isActive = assigningSlot?.type === code && assigningSlot?.index === idx;
                      
                      let displayText = '-';
                      if (config.isBlock) {
                        displayText = formatBlockDates(assignedData);
                      } else {
                        displayText = assignedData ? formatDateDisplay(assignedData) : '-';
                      }
                      
                      const canMoveToNextYear = ['VN', 'LD', 'VC'].includes(code);
                      
                      const isAssigned = config.isBlock 
                        ? (assignedData && assignedData.length > 0)
                        : (assignedData !== null && assignedData !== undefined);
                      
                      return (
                        <tr 
                          key={`${code}-${idx}`}
                          className={`cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-yellow-100' : ''} ${isAssigned ? 'bg-gray-100' : ''}`}
                          onClick={() => handleSlotClick(code, idx)}
                        >
                          <td className={`border p-1 text-center font-bold ${config.color} ${config.textColor}`}>
                            {code}{config.isBlock ? ` P${idx + 1}` : ''}
                          </td>
                          <td className="border p-1 text-center font-mono text-[10px]">
                            {displayText}
                          </td>
                          <td className="border p-1 text-center text-[11px]">{DAY_INFO[code].deadline}</td>
                          <td className="border p-1 text-center text-[11px]">{DAY_INFO[code].period}</td>
                          <td className="border p-1 text-center">
                            {canMoveToNextYear && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveDayToNextYear(code, idx);
                                }}
                                className="text-purple-600 hover:text-purple-800 font-bold"
                                title={`Marcar com a pendent per ${year + 1}`}
                              >
                                →
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ))}
              </tbody>
            </table>
            
            <div className="mt-3 p-2 bg-cyan-100 rounded">
              <div className="text-sm font-bold text-cyan-900">
                Total Vacances Estiu: {
                  (assigned.VE?.[0]?.length || 0) + 
                  (assigned.VE?.[1]?.length || 0) + 
                  (assigned.VE?.[2]?.length || 0)
                } / 31 dies
              </div>
              <div className="text-xs text-cyan-800 mt-2">
                <strong>P1, P2, P3:</strong> Períodes de vacances d'estiu (mínim 7 dies naturals per període, mínim 7 dies entre períodes)
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-purple-100 rounded">
              <div className="text-xs text-purple-900">
                <strong>📅 Divendres Sant {year}:</strong> {calculateGoodFriday(year)}
              </div>
            </div>
          </div>
        </div>

        {showSolicitud && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-purple-800">📝 Sol·licitud de Dies</h3>
              <div className="flex gap-2">
                <button
                  onClick={copySolicitud}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
                <button
                  onClick={downloadSolicitud}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Descarregar
                </button>
              </div>
            </div>
            
            <pre className="bg-gray-50 p-4 rounded border text-xs overflow-x-auto whitespace-pre-wrap font-mono">
              {generateSolicitudText()}
            </pre>
          </div>
        )}

        {courseHours.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-indigo-800">🎓 Hores de Cursos</h3>
              <button
                onClick={addCourseHours}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Afegir
              </button>
            </div>
            
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-indigo-100">
                  <th className="border p-2 text-left">Nom del Curs</th>
                  <th className="border p-2 w-28">Data</th>
                  <th className="border p-2 w-20">Hores Totals</th>
                  <th className="border p-2 w-20">Hores Usades</th>
                  <th className="border p-2 w-20">Disponibles</th>
                  <th className="border p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {courseHours.map((course, idx) => {
                  const available = course.hours - course.used;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2">
                        <input
                          type="text"
                          value={course.name}
                          onChange={(e) => {
                            const newCourses = [...courseHours];
                            newCourses[idx].name = e.target.value;
                            saveCourseHours(newCourses);
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="Nom del curs"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="date"
                          value={course.date || ''}
                          onChange={(e) => {
                            const newCourses = [...courseHours];
                            newCourses[idx].date = e.target.value;
                            saveCourseHours(newCourses);
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="border p-2 text-center">
                        <input
                          type="number"
                          value={course.hours}
                          onChange={(e) => {
                            const newCourses = [...courseHours];
                            newCourses[idx].hours = Number(e.target.value);
                            saveCourseHours(newCourses);
                          }}
                          className="w-full px-2 py-1 border rounded text-xs text-center"
                          min="0"
                          step="0.5"
                        />
                      </td>
                      <td className="border p-2 text-center">
                        <input
                          type="number"
                          value={course.used}
                          onChange={(e) => {
                            const newCourses = [...courseHours];
                            newCourses[idx].used = Number(e.target.value);
                            saveCourseHours(newCourses);
                          }}
                          className="w-full px-2 py-1 border rounded text-xs text-center"
                          min="0"
                          step="0.5"
                          max={course.hours}
                        />
                      </td>
                      <td className="border p-2 text-center font-bold text-indigo-700">
                        {available.toFixed(1)}h
                      </td>
                      <td className="border p-2 text-center">
                        <button
                          onClick={() => removeCourseHours(idx)}
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50 font-bold">
                  <td className="border p-2 text-right" colSpan="4">Total Disponible:</td>
                  <td className="border p-2 text-center text-indigo-800">
                    {courseHours.reduce((sum, c) => sum + (c.hours - c.used), 0).toFixed(1)}h
                  </td>
                  <td className="border p-2"></td>
                </tr>
              </tfoot>
            </table>
            
            <div className="mt-3 p-3 bg-indigo-50 rounded text-xs text-indigo-900">
              <p><strong>💡 Com funcionen les hores de cursos:</strong></p>
              <p className="mt-1">• Afegeix cada curs amb les hores totals assignades</p>
              <p>• Marca les hores ja utilitzades per veure les disponibles</p>
              <p>• Aquestes hores es poden recuperar de manera flexible (entrar més tard, marxar abans, etc.)</p>
              <p className="mt-2 font-bold text-indigo-700">Total hores disponibles: {courseHours.reduce((sum, c) => sum + (c.hours - c.used), 0).toFixed(1)}h</p>
            </div>
          </div>
        )}

        {courseHours.length === 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-indigo-800 mb-2">🎓 Hores de Cursos</h3>
                <p className="text-sm text-gray-600">Afegeix hores de cursos hospitalaris per gestionar les hores recuperables</p>
              </div>
              <button
                onClick={addCourseHours}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Afegir Curs
              </button>
            </div>
          </div>
        )}

        {pending2025.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-lg mb-3 text-purple-800">📅 Dies Pendents Any Anterior</h3>
            
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100">
                  <th className="border p-1 w-24">Tipus</th>
                  <th className="border p-1 w-32">Gaudit</th>
                  <th className="border p-1">Període per gaudir</th>
                  <th className="border p-1 w-20">Assignar</th>
                  <th className="border p-1 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {pending2025.map((item, idx) => {
                  let typeDisplay = item.type;
                  let bgColor = 'bg-gray-500';
                  let textColor = 'text-white';
                  
                  if (item.type.startsWith('FR')) {
                    bgColor = 'bg-orange-500';
                    textColor = 'text-white';
                  } else if (item.type.startsWith('VN')) {
                    bgColor = 'bg-red-600';
                    textColor = 'text-white';
                  } else if (item.type.startsWith('LD')) {
                    bgColor = 'bg-lime-500';
                    textColor = 'text-white';
                  } else if (item.type.startsWith('VC')) {
                    bgColor = 'bg-amber-500';
                    textColor = 'text-white';
                  } else if (item.type.startsWith('CH')) {
                    bgColor = 'bg-pink-500';
                    textColor = 'text-white';
                  }
                  
                  const isActive = assigningPending?.index === idx;
                  
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-gray-50 ${isActive ? 'bg-purple-200' : ''}`}
                    >
                      <td className="border p-1 text-center">
                        <div className={`${bgColor} ${textColor} font-bold text-[10px] rounded px-1 py-0.5`}>
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newPending = [...pending2025];
                              newPending[idx].type = e.target.value;
                              savePending2025(newPending);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-transparent text-center placeholder-white placeholder-opacity-50"
                            placeholder="VN25"
                          />
                        </div>
                      </td>
                      <td className="border p-1 text-center">
                        <input
                          type="text"
                          value={item.date}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newPending = [...pending2025];
                            newPending[idx].date = e.target.value;
                            savePending2025(newPending);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-1 text-center bg-transparent font-mono text-[10px]"
                          placeholder="DD/MM/YYYY"
                          readOnly
                          title="Clica la fila per seleccionar al calendari"
                        />
                      </td>
                      <td className="border p-1 text-center text-[11px] text-gray-600">Gener {year}</td>
                      <td className="border p-1 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePendingClick(idx, item.type);
                          }}
                          className={`text-xs px-2 py-1 rounded font-bold ${isActive ? 'bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                        >
                          {isActive ? '✓ Actiu' : 'Assignar'}
                        </button>
                      </td>
                      <td className="border p-1 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePending2025Row(idx);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={addPending2025Row}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-xs py-2 rounded"
              >
                + Afegir dia pendent {year - 1}
              </button>
              {year === 2026 && (
                <button
                  onClick={() => {
                    const defaultPending = [
                      { type: 'LD25', date: '' },
                      { type: 'FR 06-12-2025', date: '' },
                      { type: 'FR 08-12-2025', date: '' },
                      { type: 'VN25', date: '' },
                      { type: 'VN25', date: '' }
                    ];
                    savePending2025(defaultPending);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded"
                  title="Carregar dies pendents de 2025"
                >
                  🔄 Carregar dies 2025
                </button>
              )}
            </div>
            
            <div className="mt-3 text-xs text-gray-600">
              <p>💡 Dies de {year - 1} que es poden gaudir excepcionalment fins al 31 gener {year}</p>
              <p className="mt-1 font-bold text-purple-700">👆 Clica el botó "Assignar" i després selecciona el dia al calendari</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">🎨 Codis</h3>
          <div className="grid grid-cols-6 gap-3">
            {Object.entries(DAY_TYPES).map(([code, config]) => (
              <div key={code} className="flex items-center gap-2">
                <div className={`w-8 h-8 ${config.color} ${config.border || ''} rounded flex items-center justify-center ${config.textColor} font-bold text-xs`}>
                  {code}
                </div>
                <span className="text-sm">{config.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center font-bold text-xs">FS</div>
              <span>Descans normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center font-bold text-xs">FS</div>
              <span>Festiu oficial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
              <span>Treballat normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
              <span>Treballat en cap de setmana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold text-xs relative">
                M<span className="absolute top-0 right-0 text-[8px]">⭐</span>
              </div>
              <span>Treballat en festiu oficial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs relative">
                VN<span className="absolute bottom-0 left-0 text-[8px]">📌</span>
              </div>
              <span>Dia pendent any anterior</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs relative">
                M<span className="absolute top-0 left-0 text-[8px]">💼</span>
              </div>
              <span>Ampliació contracte 29h</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}