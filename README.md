# FinVault Mobile (Statik GitHub Pages Uyumlu)

## 1) Proje Mimarisi
- **Tamamen frontend-only SPA**: Vanilla HTML + CSS + JavaScript.
- **Persistence**: Tüm veri `localStorage` içinde JSON şema ile tutulur.
- **Routing yaklaşımı**: URL route kullanılmaz, sekme tabanlı tek sayfa görünümü kullanılır (GitHub Pages subpath sorunsuz).
- **Ekranlar**:
  - Nakit Akışı
  - Analitik
  - Yaklaşan Ödemeler
  - Ekstra Veriler (cüzdan/etiket/hedef/borç-hatırlatma)
  - Ayarlar
- **Modallar**:
  - İşlem Ekle/Düzenle
  - Varlık Ekle (cüzdan/etiket/hedef)

## 2) Klasör Yapısı
```txt
/
├─ index.html
├─ styles/
│  └─ main.css
├─ scripts/
│  ├─ state.js
│  └─ ui.js
└─ README.md
```

## 3) Full Source Code
Bu repo içerisindeki dosyaların tamamı çalışır kaynak koddur:
- `index.html`
- `styles/main.css`
- `scripts/state.js`
- `scripts/ui.js`

## 4) Reusable Components
- **Card** (`.card`): Tüm finans blokları.
- **Pill Button** (`.pill`): CTA, filtre, aksiyonlar.
- **Chip** (`.chip`): Kategori/etiket filtreleri.
- **Bottom Navigation** (`.bottom-nav` + `.nav-item`): Mobil sabit alt menü.
- **Sheet Modal** (`dialog.sheet`): İşlem ve veri giriş modalları.
- **Summary Blocks** (`.summary-grid`, `.amount`): Büyük tipografik finans özetleri.

## 5) Local Storage Data Model
Ana anahtar: `finvault.mobile.v1`

```json
{
  "transactions": [
    {
      "id": "string",
      "type": "income|expense",
      "amount": 0,
      "title": "string",
      "category": "string",
      "date": "YYYY-MM-DD",
      "wallet": "string",
      "tags": ["string"],
      "notes": "string",
      "recurring": false
    }
  ],
  "categories": {
    "income": ["Maaş", "Faiz", "Ek gelir"],
    "expense": ["FastFood", "Market", "Fatura", "Ulaşım", "Eğlence", "Sağlık", "Diğer"]
  },
  "tags": ["string"],
  "wallets": [{ "id": "string", "name": "Ana Cüzdan" }],
  "goals": [{ "id": "string", "name": "Acil Durum Fonu", "target": 50000, "current": 12000 }],
  "reminders": [{ "id": "string", "title": "İnternet Faturası", "amount": 420, "dueDate": "YYYY-MM-DD", "category": "Fatura" }],
  "settings": {
    "currency": "TRY",
    "monthStartDay": 1,
    "theme": "dark",
    "language": "tr",
    "haptic": true
  }
}
```

## 6) Seed / Varsayılan Veriler
- Gelir kategorileri: **Maaş, Faiz, Ek gelir**
- Gider kategorileri: **FastFood, Market, Fatura, Ulaşım, Eğlence, Sağlık, Diğer**
- Cüzdan: **Ana Cüzdan, Nakit**
- Örnek hedef: **Acil Durum Fonu**
- Örnek yaklaşan ödeme: **İnternet Faturası**

## 7) GitHub Pages Deployment
1. Repo köküne bu dosyaları push edin.
2. GitHub’da **Settings → Pages** bölümüne girin.
3. **Source** olarak `Deploy from a branch` seçin.
4. Branch: `main` (veya çalıştığınız branch), folder: `/ (root)` seçin.
5. Kaydedin ve deploy URL’ini açın.

> Neden subpath uyumlu?
- Uygulama hash/history route kullanmaz.
- Tüm asset path’leri relative (`styles/main.css`, `scripts/*.js`).

## 8) Gelecek Yükseltmeler
- **PWA**: manifest + service worker ile offline-first.
- **Sync opsiyonu**: Supabase veya Firebase ile isteğe bağlı bulut yedekleme.
- **IndexedDB geçişi**: daha büyük veri setleri için.
- **Gerçek grafikler**: lightweight chart kütüphanesi (statik deploy uyumlu).
- **Bütçe kuralları**: kategori limit alarmı, ödeme günü bildirim planlayıcı.
