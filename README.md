# Printbox Embed — Gallery Link demo

Apka do testowania edytora Printbox + flow Gallery Link (backend tworzy projekt → frontend otwiera w edytorze). Static HTML + Vercel serverless function, bez build steps.

## Dwa tryby

**1. Gallery Link (główny):** wybierz produkt (Photobook / Calendar / Frame), kliknij _Create Project & Launch Editor_. Backend (`api/create-project.js`) wymienia OAuth credentials na token, woła `POST /api/ec/v4/projects/` na `sales-demo-pbx2` z odpowiednim `family_id`/`product_id` i zestawem zdjęć, zwraca `uuid` — frontend otwiera edytor z tym `projectId`.

**2. Manual config (advanced):** klasyczny formularz instancji do testowania innych site_name / paramów edytora. Wartości zapamiętane w `localStorage`.

## Produkty Gallery Link

| Produkt   | family_id | product_id | min photos |
|-----------|-----------|------------|------------|
| Photobook | 275       | 7488       | 26         |
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
| `PBX_SITE_NAME`             | —        | `sales_demo_pbx2`                           | site_name w URL-u JS CDN (underscores)     |

Set in Vercel: Project → Settings → Environment Variables. Po dodaniu zrób redeploy.

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

- `index.html` — frontend (Gallery Link picker + manual config form + boot edytora)
- `api/create-project.js` — Vercel serverless function: OAuth + `POST /api/ec/v4/projects/`
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
