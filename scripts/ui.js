const currencyMap = { TRY: '₺', USD: '$', EUR: '€' };
let activeTab = 'cashflow';
let editingTransactionId = null;
let txFilter = { type: 'all', category: 'all', tag: 'all' };

const viewRoot = document.getElementById('viewRoot');
const screenTitle = document.getElementById('screenTitle');
const navItems = [...document.querySelectorAll('.nav-item')];
const transactionModal = document.getElementById('transactionModal');
const transactionForm = document.getElementById('transactionForm');
const entityModal = document.getElementById('entityModal');
const entityForm = document.getElementById('entityForm');

function formatMoney(value) {
  return `${currencyMap[appState.settings.currency] || '₺'}${Math.abs(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthTransactions() {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return appState.transactions.filter((t) => monthKey(t.date) === key);
}

function calcSummary(transactions) {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return {
    income,
    expense,
    balance: income - expense,
    projected: income - expense + appState.reminders.reduce((s, r) => s - Number(r.amount || 0), 0)
  };
}

function render() {
  navItems.forEach((n) => n.classList.toggle('active', n.dataset.tab === activeTab));
  const titles = { cashflow: 'Nakit Akışı', analytics: 'Analitik', payments: 'Yaklaşan Ödemeler', extras: 'Ekstra Veriler', settings: 'Ayarlar' };
  screenTitle.textContent = titles[activeTab];
  if (activeTab === 'cashflow') renderCashflow();
  if (activeTab === 'analytics') renderAnalytics();
  if (activeTab === 'payments') renderPayments();
  if (activeTab === 'extras') renderExtras();
  if (activeTab === 'settings') renderSettings();
  refreshLists();
}

function renderCashflow() {
  const monthTx = getMonthTransactions();
  const filtered = monthTx.filter((t) => {
    if (txFilter.type !== 'all' && t.type !== txFilter.type) return false;
    if (txFilter.category !== 'all' && t.category !== txFilter.category) return false;
    if (txFilter.tag !== 'all' && !(t.tags || []).includes(txFilter.tag)) return false;
    return true;
  });
  const sum = calcSummary(monthTx);
  const categories = [...new Set(monthTx.map((t) => t.category))];

  viewRoot.innerHTML = `
    <section class="card">
      <div class="row"><strong>Dönem</strong><span class="muted">Aylık</span></div>
      <div class="summary-grid" style="margin-top:12px">
        <div><div class="muted">Mevcut Bakiye</div><div class="amount">${formatMoney(sum.balance)}</div></div>
        <div><div class="muted">Projeksiyon</div><div class="amount">${formatMoney(sum.projected)}</div></div>
      </div>
    </section>

    <section class="card">
      <div class="row"><strong>Gelir</strong><span class="income">${formatMoney(sum.income)}</span></div>
      <div class="row muted"><span>Beklenen</span><span>${formatMoney(sum.income)}</span></div>
      <div class="row muted"><span>Alınan</span><span>${formatMoney(sum.income)}</span></div>
      <div class="row muted"><span>Kalan</span><span>${formatMoney(0)}</span></div>
    </section>

    <section class="card">
      <div class="row"><strong>Gider</strong><span class="expense">${formatMoney(sum.expense)}</span></div>
      <div class="row muted"><span>Beklenen</span><span>${formatMoney(sum.expense + appState.reminders.reduce((s, r) => s + Number(r.amount), 0))}</span></div>
      <div class="row muted"><span>Ödenen</span><span>${formatMoney(sum.expense)}</span></div>
      <div class="row muted"><span>Kalan</span><span>${formatMoney(appState.reminders.reduce((s, r) => s + Number(r.amount), 0))}</span></div>
    </section>

    <section class="chips">
      <button class="chip ${txFilter.type === 'all' ? 'active' : ''}" data-filter-type="all">Tümü</button>
      <button class="chip ${txFilter.type === 'income' ? 'active' : ''}" data-filter-type="income">Gelir</button>
      <button class="chip ${txFilter.type === 'expense' ? 'active' : ''}" data-filter-type="expense">Gider</button>
      ${categories.map((c) => `<button class="chip ${txFilter.category === c ? 'active' : ''}" data-filter-category="${c}">${c}</button>`).join('')}
    </section>

    <section class="card">
      <div class="row"><strong>İşlemler</strong><span class="muted">${filtered.length} kayıt</span></div>
      <div class="list" style="margin-top:10px">
        ${
          filtered.length
            ? filtered
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(
                  (t) => `<button class="tx-item row" data-edit-tx="${t.id}">
                    <div><div>${t.title}</div><div class="muted">${t.category} · ${t.date}</div></div>
                    <strong class="${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}</strong>
                  </button>`
                )
                .join('')
            : `<div class="empty">Kayıt yok.<br><button class="pill primary" id="emptyAddBtn" style="margin-top:10px">İşlem ekle</button></div>`
        }
      </div>
    </section>`;
}

function renderAnalytics() {
  const tx = appState.transactions;
  const sum = calcSummary(tx);
  const topExpense = Object.entries(
    tx.filter((t) => t.type === 'expense').reduce((acc, t) => ((acc[t.category] = (acc[t.category] || 0) + t.amount), acc), {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  viewRoot.innerHTML = `
  <section class="card summary-grid">
    <div><div class="muted">Toplam Gelir</div><div class="amount income">${formatMoney(sum.income)}</div></div>
    <div><div class="muted">Toplam Gider</div><div class="amount expense">${formatMoney(sum.expense)}</div></div>
  </section>
  <section class="card">
    <div class="row"><strong>Trend</strong><span class="muted">Son 6 Ay</span></div>
    <canvas id="trendCanvas" width="460" height="160"></canvas>
  </section>
  <section class="card">
    <strong>En Yüksek 3 Gider Grubu</strong>
    <div class="list" style="margin-top:10px">${topExpense.length ? topExpense.map(([k, v]) => `<div class="row"><span>${k}</span><span class="expense">${formatMoney(v)}</span></div>`).join('') : '<div class="muted">Henüz gider kaydı yok.</div>'}</div>
  </section>
  <section class="card">
    <strong>Gelir Etiketleri</strong>
    <div class="chips" style="margin-top:8px">${collectTags('income').map((t) => `<span class="chip">#${t}</span>`).join('') || '<span class="muted">Etiket yok</span>'}</div>
    <strong style="display:block;margin-top:12px">Gider Etiketleri</strong>
    <div class="chips" style="margin-top:8px">${collectTags('expense').map((t) => `<span class="chip">#${t}</span>`).join('') || '<span class="muted">Etiket yok</span>'}</div>
  </section>`;

  drawTrend();
}

function collectTags(type) {
  return [...new Set(appState.transactions.filter((t) => t.type === type).flatMap((t) => t.tags || []))].slice(0, 8);
}

function drawTrend() {
  const canvas = document.getElementById('trendCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const labels = [...Array(6)].map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const data = labels.map((key) => {
    const monthly = appState.transactions.filter((t) => monthKey(t.date) === key);
    const s = calcSummary(monthly);
    return s.income - s.expense;
  });
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#5B6EF5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = 20 + i * ((canvas.width - 40) / (data.length - 1));
    const y = canvas.height - 20 - ((v - min) / (max - min || 1)) * (canvas.height - 40);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function renderPayments() {
  const reminders = [...appState.reminders].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  viewRoot.innerHTML = `
    <section class="card">
      <div class="row"><strong>Yaklaşan Ödemeler</strong><button class="pill" id="newReminderBtn">Hatırlatma ekle</button></div>
      <div class="list" style="margin-top:10px">
      ${reminders.length ? reminders.map((r) => `<div class="tx-item row"><div><div>${r.title}</div><div class="muted">Son tarih: ${r.dueDate}</div></div><strong class="expense">${formatMoney(r.amount)}</strong></div>`).join('') : '<div class="empty">Yaklaşan ödeme bulunmuyor.</div>'}
      </div>
    </section>`;
}

function renderExtras() {
  viewRoot.innerHTML = `
    <section class="card"><div class="row"><strong>Cüzdanlar</strong><button class="pill" data-open-entity="wallet">Ekle</button></div>
      <div class="list" style="margin-top:10px">${appState.wallets.map((w) => `<div class="row tx-item"><span>${w.name}</span></div>`).join('')}</div></section>
    <section class="card"><div class="row"><strong>Etiketler</strong><button class="pill" data-open-entity="tag">Ekle</button></div>
      <div class="chips" style="margin-top:10px">${appState.tags.map((t) => `<span class="chip">#${t}</span>`).join('')}</div></section>
    <section class="card"><div class="row"><strong>Hedefler</strong><button class="pill" data-open-entity="goal">Ekle</button></div>
      <div class="list" style="margin-top:10px">${appState.goals.map((g) => `<div class="tx-item"><div class="row"><strong>${g.name}</strong><span>${formatMoney(g.current)} / ${formatMoney(g.target)}</span></div><progress max="${g.target}" value="${g.current}" style="width:100%;margin-top:8px"></progress></div>`).join('')}</div></section>
    <section class="card"><div class="row"><strong>Borç & Hatırlatıcı</strong><button class="pill" id="newReminderInlineBtn">Ekle</button></div><p class="muted">Basit sürüm: yaklaşan ödeme listesinde yönetilir.</p></section>`;
}

function renderSettings() {
  viewRoot.innerHTML = `
    <section class="card">
      ${settingSelect('Para Birimi', 'currency', ['TRY', 'USD', 'EUR'])}
      ${settingSelect('Ay Başlangıç Günü', 'monthStartDay', Array.from({ length: 28 }, (_, i) => i + 1))}
      ${settingSelect('Tema', 'theme', ['dark', 'system'])}
      ${settingSelect('Dil', 'language', ['tr', 'en'])}
      <div class="settings-row row"><span>Haptic feedback</span><input id="hapticToggle" type="checkbox" ${appState.settings.haptic ? 'checked' : ''}></div>
      <div class="settings-row row"><button class="pill" id="exportBtn">Veriyi dışa aktar</button><button class="pill" id="importBtn">İçe aktar</button></div>
      <div class="settings-row"><button class="pill" id="resetBtn">Tüm veriyi sıfırla</button><input id="importFile" type="file" accept="application/json" hidden></div>
    </section>`;
}

function settingSelect(label, key, options) {
  return `<label class="settings-row">${label}<select data-setting="${key}">${options
    .map((o) => `<option ${String(appState.settings[key]) === String(o) ? 'selected' : ''}>${o}</option>`)
    .join('')}</select></label>`;
}

function refreshLists() {
  document.getElementById('categoryList').innerHTML = [...appState.categories.income, ...appState.categories.expense]
    .map((c) => `<option value="${c}"></option>`)
    .join('');
  document.getElementById('walletList').innerHTML = appState.wallets.map((w) => `<option value="${w.name}"></option>`).join('');
}

function openTransactionModal(transaction = null) {
  editingTransactionId = transaction?.id || null;
  document.getElementById('transactionModalTitle').textContent = editingTransactionId ? 'İşlemi Düzenle' : 'İşlem Ekle';
  document.getElementById('deleteTransactionBtn').style.visibility = editingTransactionId ? 'visible' : 'hidden';
  transactionForm.reset();
  transactionForm.date.value = new Date().toISOString().slice(0, 10);
  if (transaction) Object.entries(transaction).forEach(([k, v]) => transactionForm[k] && (transactionForm[k].value = Array.isArray(v) ? v.join(', ') : v));
  transactionForm.recurring.checked = Boolean(transaction?.recurring);
  transactionModal.showModal();
}

function openEntityModal(type) {
  entityForm.dataset.entityType = type;
  document.getElementById('entityModalTitle').textContent = `${type} ekle`;
  document.getElementById('entitySecondaryWrap').style.display = type === 'goal' ? 'grid' : 'none';
  entityForm.reset();
  entityModal.showModal();
}

function persist() {
  saveState(appState);
  render();
}

document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { activeTab = tab.dataset.tab; render(); }

  if (e.target.id === 'quickAddBtn' || e.target.id === 'emptyAddBtn') openTransactionModal();
  if (e.target.id === 'closeTxModal') transactionModal.close();
  if (e.target.id === 'closeEntityModal') entityModal.close();
  if (e.target.id === 'newReminderBtn' || e.target.id === 'newReminderInlineBtn') {
    appState.reminders.push({ id: uid(), title: 'Yeni Ödeme', amount: 0, dueDate: new Date().toISOString().slice(0, 10), category: 'Diğer' });
    persist();
  }

  const txBtn = e.target.closest('[data-edit-tx]');
  if (txBtn) openTransactionModal(appState.transactions.find((t) => t.id === txBtn.dataset.editTx));

  const fType = e.target.closest('[data-filter-type]');
  if (fType) { txFilter.type = fType.dataset.filterType; renderCashflow(); }

  const fCategory = e.target.closest('[data-filter-category]');
  if (fCategory) { txFilter.category = fCategory.dataset.filterCategory === txFilter.category ? 'all' : fCategory.dataset.filterCategory; renderCashflow(); }

  const entityBtn = e.target.closest('[data-open-entity]');
  if (entityBtn) openEntityModal(entityBtn.dataset.openEntity);

  if (e.target.id === 'deleteTransactionBtn' && editingTransactionId) {
    appState.transactions = appState.transactions.filter((t) => t.id !== editingTransactionId);
    transactionModal.close();
    persist();
  }

  if (e.target.id === 'exportBtn') {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finvault-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (e.target.id === 'importBtn') document.getElementById('importFile').click();
  if (e.target.id === 'resetBtn' && confirm('Tüm veriler silinsin mi?')) { resetState(); render(); }
});

transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(transactionForm);
  const payload = {
    id: editingTransactionId || uid(),
    type: form.get('type'),
    amount: Number(form.get('amount')),
    title: form.get('title').trim(),
    category: form.get('category').trim(),
    date: form.get('date'),
    wallet: form.get('wallet').trim(),
    tags: form.get('tags').split(',').map((t) => t.trim()).filter(Boolean),
    notes: form.get('notes').trim(),
    recurring: Boolean(form.get('recurring'))
  };

  if (editingTransactionId) {
    appState.transactions = appState.transactions.map((t) => (t.id === editingTransactionId ? payload : t));
  } else {
    appState.transactions.push(payload);
  }

  if (payload.type === 'income' && !appState.categories.income.includes(payload.category)) appState.categories.income.push(payload.category);
  if (payload.type === 'expense' && !appState.categories.expense.includes(payload.category)) appState.categories.expense.push(payload.category);
  payload.tags.forEach((tag) => !appState.tags.includes(tag) && appState.tags.push(tag));
  if (!appState.wallets.some((w) => w.name === payload.wallet)) appState.wallets.push({ id: uid(), name: payload.wallet });

  transactionModal.close();
  persist();
});

entityForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(entityForm);
  const type = entityForm.dataset.entityType;
  const name = form.get('name').trim();
  const secondary = Number(form.get('secondary'));

  if (type === 'wallet') appState.wallets.push({ id: uid(), name });
  if (type === 'tag') appState.tags.push(name);
  if (type === 'goal') appState.goals.push({ id: uid(), name, target: secondary || 0, current: 0 });

  entityModal.close();
  persist();
});

viewRoot.addEventListener('change', (e) => {
  const setting = e.target.dataset.setting;
  if (setting) {
    appState.settings[setting] = e.target.value;
    persist();
  }
  if (e.target.id === 'hapticToggle') {
    appState.settings.haptic = e.target.checked;
    persist();
  }

  if (e.target.id === 'importFile') {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((text) => {
      importState(text);
      render();
    });
  }
});

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  file.text().then((text) => {
    importState(text);
    render();
  });
});

render();
