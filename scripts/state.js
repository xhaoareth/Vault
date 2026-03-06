const STORAGE_KEY = 'finvault.mobile.v1';

const DEFAULT_CATEGORIES = {
  income: ['Maaş', 'Faiz', 'Ek gelir'],
  expense: ['FastFood', 'Market', 'Fatura', 'Ulaşım', 'Eğlence', 'Sağlık', 'Diğer']
};

const seedData = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  tags: ['ev', 'iş', 'zorunlu'],
  wallets: [{ id: uid(), name: 'Ana Cüzdan' }, { id: uid(), name: 'Nakit' }],
  goals: [{ id: uid(), name: 'Acil Durum Fonu', target: 50000, current: 12000 }],
  reminders: [{ id: uid(), title: 'İnternet Faturası', amount: 420, dueDate: nextDate(4), category: 'Fatura' }],
  settings: {
    currency: 'TRY',
    monthStartDay: 1,
    theme: 'dark',
    language: 'tr',
    haptic: true
  }
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function nextDate(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = structuredClone(seedData);
    saveState(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    return migrateState(parsed);
  } catch {
    const fallback = structuredClone(seedData);
    saveState(fallback);
    return fallback;
  }
}

function migrateState(data) {
  return {
    transactions: data.transactions || [],
    categories: data.categories || structuredClone(DEFAULT_CATEGORIES),
    tags: data.tags || [],
    wallets: data.wallets || [],
    goals: data.goals || [],
    reminders: data.reminders || [],
    settings: { ...seedData.settings, ...(data.settings || {}) }
  };
}

function saveState(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function exportState() {
  return JSON.stringify(appState, null, 2);
}

function importState(jsonText) {
  const parsed = migrateState(JSON.parse(jsonText));
  appState = parsed;
  saveState(appState);
}

function resetState() {
  appState = structuredClone(seedData);
  saveState(appState);
}

let appState = loadState();
