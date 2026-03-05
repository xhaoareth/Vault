# Vault

## Geliştirme Notları

### Güvenlik iyileştirmeleri
- Kullanıcı girdileri arayüzde render edilmeden önce HTML-escape edilir (`eH` helper).
- Dinamik listelerde string tabanlı inline `onclick` yerine `data-action` + event delegation kullanılır.
- OCR akışı frontend'den doğrudan LLM sağlayıcısına gitmez; `/api/receipt-parse` backend proxy endpoint'i beklenir.

### OCR proxy beklentisi
Frontend, fiş görselini aşağıdaki endpoint'e gönderir:

- `POST /api/receipt-parse`
- `multipart/form-data` body: `receipt=<image file>`
- Beklenen JSON yanıtı:

```json
{
  "desc": "Market alışverişi",
  "amount": 1520.5,
  "category": "Market",
  "note": "Fiş no: 123"
}
```

Önerilen backend korumaları:
- API key sadece sunucu tarafında environment variable olarak tutulmalı.
- MIME ve boyut doğrulaması (örn. max 5MB).
- Timeout ve rate-limit uygulanmalı.
- Hata durumlarında standart JSON hata kontratı dönülmeli.

### Güvenlik smoke kontrol listesi
Aşağıdaki payloadları açıklama/not/kategori alanlarına girip script çalışmadığını doğrulayın:
- `<img src=x onerror=alert(1)>`
- `"><svg/onload=alert(1)>`
- `<script>alert('x')</script>`

Beklenen sonuç:
- Payloadlar metin olarak görünür.
- Alert veya beklenmeyen script çalışmaz.
