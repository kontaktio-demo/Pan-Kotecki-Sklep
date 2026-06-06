# Pan Kotecki — backend API (Render)

Express + TypeScript. Łączy się z Supabase (service role) i wystawia API dla
sklepu oraz panelu.

## Lokalnie

```bash
cd backend
cp .env.example .env      # uzupełnij SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install
npm run dev               # http://localhost:10000/health
```

## Endpointy (etap 1)

- `GET /health`
- `GET /api/categories`
- `GET /api/products?kategoria=&szukaj=`
- `GET /api/products/:slug`

## Deploy na Render

1. New → **Web Service** → wskaż to repo, **Root Directory: `backend`**.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Dodaj zmienne środowiskowe z `.env.example` (bez `PORT` — Render ustawia sam).
