# Printbox Embed — Gallery Link demo

Aplikacja do tworzenia projektów Printbox z platformy zdjęciowej. Static HTML + React (in-browser Babel) frontend + Vercel serverless backend. Bez build steps.

## Architektura

- **`index.html` + `src/*.jsx` + `tweaks-panel.jsx`** — Encore React frontend od zespołu frontowego (skanowanie biletu → wybór produktu → memories picker → upload własnych zdjęć → handoff).
- **`api/create-project.js`** — Vercel function: OAuth client_credentials → `POST /api/ec/v4/projects/` → zwraca `uuid`.
- **`api/upload-photo.js`** — Vercel function: raw binary → Vercel Blob (`access: 'public'`) → zwraca public URL.
- **`editor.html`** — boot edytora Printbox. Czyta URL params `projectId` / `familyId` / `siteName` / `customImageUrl` i woła `printbox.setEditorConfig(...)`. Gdy brak paramów — fallback manual config form (advanced/dev).

## User flow

1. Landing (`/`) → React Encore: ticket scan / manual code.
2. Memories: user wybiera zdjęcia z gali koncertowej; produkt zmienia min/max liczbę zdjęć.
3. Upload (opcjonalne): user dorzuca własne zdjęcia (max 7).
4. _Create [Product]_ → `DoneScreen`:
   - Pierwsze własne zdjęcie (jeśli jest) → `POST /api/upload-photo` → public URL (Blob).
   - `POST /api/create-project` z `{ productKey, photos }` → `{ uuid, siteName, familyId, ... }`.
   - Redirect: `/editor.html?projectId=<uuid>&familyId=<id>&siteName=<name>&customImageUrl=<url>`.
5. `editor.html` ładuje init.min.js i woła `setEditorConfig` z `projectId` + (opcjonalnie) `personalizedPresentationContent.components.customerImage1`.

Refresh / duplicate-tab na `/editor.html?...` re-otwiera projekt bezpośrednio (paramy w URL = source of truth).

## Produkty

| UI id   | UI name    | Backend productKey | family_id | product_id | min photos |
|---------|------------|--------------------|-----------|------------|------------|
| `book`  | Photobook  | `Photobook`        | 305       | 7605       | 26         |
| `cal`   | Calendar   | `Calendar`         | 220       | 5809       | 13         |
| `frame` | Frame      | `Frame`            | 299       | 7365       | 1          |

Mapowanie id → productKey jest w `src/upload.jsx` (`PRODUCT_KEY_BY_ID`). Aktualne listy `PRODUCTS` po obu stronach muszą zgadzać się minimami — frontend nie pozwoli przejść dalej z mniejszą liczbą zdjęć niż backendowy minimum.

## Produkty Gallery Link

| Produkt   | family_id | product_id | min photos |
|-----------|-----------|------------|------------|
| Photobook | 305       | 7605       | 26         |
| Calendar  | 220       | 5809       | 13         |
| Frame     | 299       | 7365       | 1          |

Domyślny zestaw zdjęć (concert gallery, hostowany na `storage.googleapis.com/pbx2-sales-demo`) jest wbudowany w backend i sliced do `min_photos` per produkt. Frontend może podać własne URL-e (textarea, jeden na linię) — wtedy override.

## Wymagane env vars (Vercel)

| Var                       | Wymagane | Default                                     | Opis                                       |
|---------------------------|----------|---------------------------------------------|--------------------------------------------|
| `client_id_sales_demo`      | ✅       | —                                           | OAuth2 client_id (rejestracja: `/o/applications/` na sales-demo-pbx2) |
| `client_secret_sales_demo`  | ✅       | —                                           | OAuth2 client_secret                       |
| `PBX_STORE_ID`              | —        | `1`                                         | store_id z `/api/ec/v4/stores/`            |
| `PBX_BASE_URL`              | —        | `https://sales-demo-pbx2.getprintbox.com`   | base URL instancji                         |
| `PBX_SITE_NAME`             | —        | `sales_demo`                                | site_name w URL-u JS CDN (underscores)     |
| `BLOB_READ_WRITE_TOKEN`     | auto     | —                                           | wymagane dla `api/upload-photo` — auto-wstrzykiwane po stworzeniu Blob store |

Set in Vercel: Project → Settings → Environment Variables. Po dodaniu zrób redeploy.

## Vercel Blob (dla personalization upload)

Funkcja `api/upload-photo.js` wymaga Vercel Blob storage. Setup jednorazowy:

1. Vercel dashboard → twój projekt → **Storage** → **Create Database** → **Blob**
2. Link store do tego projektu (env var `BLOB_READ_WRITE_TOKEN` dodaje się automatycznie)
3. Redeploy

Pliki idą do prefixu `gallery-link/` z random suffixem (multi-upload safe). Public URL ma format `https://<store-hash>.public.blob.vercel-storage.com/gallery-link/customer-image-<hash>.<ext>`.

## Deploy na Vercel

**Opcja A — Vercel CLI (najszybsza):**
```bash
cd /Users/jakubkusmider/AI/printbox-vercel-demo
npx vercel
# Set up and deploy? Y
# Link to existing project? N
# Project name? printbox-vercel-demo
# Directory? ./
# Override settings? N
# → deploy URL pojawi się w terminalu

# Production deploy:
npx vercel --prod
```

**Opcja B — Git + Vercel dashboard:**
```bash
cd /Users/jakubkusmider/AI/printbox-vercel-demo
git init && git add . && git commit -m "init"
# Push do GitHub, potem Import w https://vercel.com/new
```

Vercel automatycznie wykryje to jako static site. Brak `package.json` jest celowy — nie ma nic do builda.

## Po deploy

1. Otwórz URL z Vercela
2. **Najpierw** — poproś Printbox support o whitelisting domeny `*.vercel.app` (lub konkretnego URL-a) dla twojej instancji
3. Wpisz parametry, kliknij **Launch Editor**

## Pułapki na które warto uważać

- **`site_name`** używa **podkreśleń** (np. `masterpiece_ai`), nie myślników jak subdomena API (`masterpiece-ai-pbx2.…`)
- **`productId`** to **slug** (np. `hoodie-black`), nie numeryczne ID — resolve przez `GET /api/ec/v4/products/{id}/` → `friendly_url`
- **`ecommerceUrlPart`** musi być bez trailing slash — w kodzie już to robię (`.replace(/\/$/, '')`)
- **Anonymous orders**: jeśli twoja instancja nie pozwala na guest checkout, edytor odpali `authUserRequest` i będzie czekał na niepuste `sessionId` — wypełnij pole Session ID
- **CORS**: jeśli init.min.js zwraca 404 z `application/xml` (Google Cloud Storage NoSuchKey) → zła nazwa site_name

## Smoke test

```bash
# 1. Czy site_name jest poprawne?
curl -I https://js-cdn.getprintbox.com/init/<site_name>/init.min.js
# Oczekujemy: 200 + Content-Type: application/javascript

# 2. Czy CORS jest skonfigurowany dla twojej domeny?
# Otwórz DevTools → Network, odpal edytor, szukaj błędów CORS

# 3. Czy callback działa?
# Kliknij "Add to cart" w edytorze → powinien pojawić się alert z project ID
```

## Pliki

- `index.html` — React Encore shell (od frontend team), ładuje React 18 UMD + Babel-standalone z CDN
- `src/app.jsx` — orchestrator: state machine (scan → memories → upload → done) + nawigacja
- `src/scan.jsx` — ScanScreen / TicketScreen / UnlockScreen
- `src/memories.jsx` — pro-shots picker (masonry, lightbox)
- `src/upload.jsx` — UploadScreen (własne zdjęcia) + `DoneScreen` (backend handoff)
- `src/data.jsx` — PRODUCTS, CONCERTS, icons, ProductSheet
- `tweaks-panel.jsx` — `useTweaks` hook (theming)
- `assets/photobook.jpg` — product card image
- `editor.html` — boot Printbox edytora + fallback manual config (przeniesione z poprzedniego index.html)
- `api/create-project.js` — Vercel serverless function: OAuth + `POST /api/ec/v4/projects/`
- `api/upload-photo.js` — Vercel serverless function: file → Vercel Blob → public URL
- `package.json` — deklaruje dep `@vercel/blob`
- `vercel.json` — czystsze URL-e (`cleanUrls: true`)
- `pbx-docs/` — referencyjna dokumentacja Printbox (nie commitowana — local-only)
- `README.md` — to co czytasz

## Co dalej

Po potwierdzeniu że edytor się odpala, kolejne kroki to:
- Server-to-server OAuth (`POST /o/token/`) — żeby tworzyć customerów i sesje z backendu zamiast hardcode'ować sessionId
- Implementacja prawdziwego `goToCartFinished` (zamiast `alert`) — POST do twojego backendu
- `setupEcommercePricesIntegration` — jeśli ceny mają iść z twojego stacka, nie Printboxa
- Subskrypcja webhooków (`POST /api/ec/v4/subscriptions/`) — żeby śledzić cykl produkcyjny

Detal w wewnętrznym `PRINTBOX-EMBED-KNOWLEDGE.md`.
