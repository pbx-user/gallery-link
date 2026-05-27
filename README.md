# Printbox Embed — Vercel Demo

Minimalna jednostronicowa apka do testowania edytora Printbox. Czysty HTML + JS, bez build steps.

## Co robi

1. Pokazuje formularz z parametrami instancji Printbox (site_name, family_id, product slug, store, currency, locale, session, …)
2. Po submit: dynamicznie ładuje `https://js-cdn.getprintbox.com/init/<site_name>/init.min.js` i woła `printbox.setEditorConfig(...)`
3. Wartości formularza są zapamiętywane w `localStorage` — F5 ich nie traci

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

- `index.html` — cała apka (formularz + boot edytora)
- `vercel.json` — czystsze URL-e (`cleanUrls: true`)
- `README.md` — to co czytasz

## Co dalej

Po potwierdzeniu że edytor się odpala, kolejne kroki to:
- Server-to-server OAuth (`POST /o/token/`) — żeby tworzyć customerów i sesje z backendu zamiast hardcode'ować sessionId
- Implementacja prawdziwego `goToCartFinished` (zamiast `alert`) — POST do twojego backendu
- `setupEcommercePricesIntegration` — jeśli ceny mają iść z twojego stacka, nie Printboxa
- Subskrypcja webhooków (`POST /api/ec/v4/subscriptions/`) — żeby śledzić cykl produkcyjny

Detal w wewnętrznym `PRINTBOX-EMBED-KNOWLEDGE.md`.
