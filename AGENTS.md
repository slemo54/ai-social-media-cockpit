# AI Social Cockpit - AGENTS.md

> AI coding agent reference for the AI Social Cockpit project.
> This is a Next.js 16 application for generating social media content for Italian Wine Podcast (IWP) and Italian Wine Academy (IWA).

---

## 📚 Documentazione

- **[FUNZIONALITA.md](./FUNZIONALITA.md)** - Documentazione completa delle funzionalità attuali
- **[AGENTS.md](./AGENTS.md)** - Questo file: guida per coding agents

---

---

## Project Overview

**AI Social Cockpit** è un'applicazione web per la generazione di contenuti social media dedicati a due brand del settore vinicolo italiano:

- **IWP (Italian Wine Podcast)**: Podcast quotidiano sul vino italiano, stile conversazionale e storytelling personale
- **IWA (Italian Wine Academy)**: Provider WSET per formazione enologica professionale, stile educativo e autorevole

L'app utilizza AI (Abacus API con modello Gemini 2.5 Flash) per generare testi e immagini, con un sistema di "Content Intelligence" che analizza dati storici per migliorare la qualità dei contenuti generati.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| Runtime | React 19.2.3 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL + Storage) |
| AI APIs | Abacus.ai (LLM), Google Gemini (Images) |
| Auth | Supabase SSR |
| Icons | Lucide React |
| Toast | Sonner |

---

## Project Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── generate/      # POST: Genera contenuto (testo + immagine)
│   │   │   ├── intelligence/  # GET: Recupera Content Intelligence
│   │   │   ├── posts/recent/  # GET: Lista post recenti
│   │   │   ├── stats/         # GET: Statistiche dashboard
│   │   │   └── image/         # Image upload & editing
│   │   ├── dashboard/         # Dashboard page
│   │   ├── page.tsx           # Home (content generator)
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles + Tailwind
│   ├── components/            # React components
│   │   ├── InputSection.tsx   # Input form + template selector
│   │   ├── PreviewSection.tsx # Preview feed/story/linkedin
│   │   ├── EditorSection.tsx  # Text editor for generated content
│   │   ├── ImageEditor.tsx    # Image upload & AI editing
│   │   └── dashboard/         # Dashboard components
│   ├── hooks/                 # Custom React hooks
│   │   ├── usePostGenerator.ts
│   │   ├── useDashboardStats.ts
│   │   └── useRecentPosts.ts
│   ├── lib/                   # Utility libraries
│   │   ├── abacus.ts          # Abacus AI integration
│   │   ├── content-intelligence.ts  # Content Intelligence system
│   │   ├── api-client.ts      # Robust API client with retry
│   │   ├── supabase.ts        # Supabase client & DB operations
│   │   └── auth.ts            # Authentication helpers
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   ├── data/                  # Static data
│   │   └── content-intelligence-research.json
│   └── middleware.ts          # Next.js middleware (auth)
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

---

## Build and Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

---

## Environment Variables

Required environment variables (create `.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI APIs
ABACUS_API_KEY=your-abacus-key
GOOGLE_AI_API_KEY=your-google-key  # Optional, for image generation

# Optional: Disable auth for local development
DISABLE_AUTH=true
```

---

## Database Schema (Supabase)

### Tables

**posts**
- `id`: uuid, primary key
- `user_id`: uuid, references auth.users
- `created_at`: timestamp
- `topic`: text
- `title`: text
- `body_copy`: text
- `hashtags`: text[]
- `image_prompt`: text
- `image_url`: text
- `status`: enum('draft', 'published')
- `project`: enum('IWP', 'IWA')
- `platform`: text (default: 'instagram')
- `template_used`: text
- `generation_time_ms`: integer
- `word_count`: integer
- `ai_model`: text
- `prompt_length`: integer
- `is_favorite`: boolean
- `published_at`: timestamp
- `copied_count`: integer

**generation_logs**
- `id`: uuid
- `user_id`: uuid
- `started_at`: timestamp
- `completed_at`: timestamp
- `post_id`: uuid, references posts
- `prompt_input`: text
- `ai_model`: text
- `duration_ms`: integer
- `success`: boolean
- `error_message`: text

**user_stats** (cached stats)
- `user_id`: uuid
- `total_posts`: integer
- `published_posts`: integer
- `draft_posts`: integer
- `favorite_template`: text
- `total_words_generated`: integer
- `avg_generation_time_ms`: integer

**Content Intelligence Tables**
- `brand_voice_rules`: Regole di tono e stile per brand
- `engagement_patterns`: Pattern di engagement analizzati
- `visual_style_patterns`: Keyword per stili visuali
- `content_intelligence_posts`: Post storici ad alto engagement

---

## Key Features

### 1. Content Generation (`/api/generate`)
- Generazione testo via Abacus API (Gemini 2.5 Flash)
- Generazione immagini via Google Gemini
- Supporto upload immagine utente
- Salvataggio automatico in Supabase
- Logging generazione

### 2. Content Intelligence (`src/lib/content-intelligence.ts`)
Sistema che arricchisce i prompt con dati storici:
- Voice rules (tone, hooks, vocabulary, structure)
- Top hooks dai post più performanti
- Top hashtags
- Visual style keywords
- Pattern da evitare

Cache in-memory: 5 minuti

### 3. Template System (`src/lib/abacus.ts`)
**IWP Templates** (stile conversazionale):
- `on-the-road`: Viaggi in regioni vinicole
- `wine-geeks`: Concetti enologici con plot twist
- `cin-cin-community`: Engagement puro
- `bit-of-scienza`: Scienza accessibile
- `behind-the-scenes`: Dietro le quinte
- `new-discovery`: Scoperte personali
- `wine2wine`: Business del vino
- `via-academy`: Conoscenza di alto livello

**IWA Templates** (stile educativo):
- `wine-basics`: Fondamentali WSET L1-2
- `grape-deep-dive`: Analisi vitigni
- `region-focus`: Focus territoriale
- `wine-and-food`: Abbinamenti
- `study-tips`: Consigli studio
- `wine-career`: Percorsi professionali
- `sustainability`: Sostenibilità
- `masterclass`: Contenuti avanzati WSET L3

### 4. Brand Voice

**IWP** (Stevie Kim style):
- Tono: Chiacchierata al bar, mai da manuale
- Hook diretti: "Ok, story time...", "Plot twist:"
- Umiltà autentica: "I'm not an expert, but..."
- Italiano naturale: "merende", "brioche all'albicocca"
- Chiusura obbligatoria: "Cin Cin! 🍷"
- Zero snobismo

**IWA** (Professional educator):
- Tono: "Il professore che vorresti avere"
- Fatti precisi, spiegati semplicemente
- Focus WSET Levels 1-3, Champagne Specialist
- Call to action chiare
- Autorevole ma accessibile

### 5. Dashboard
- Statistiche contenuti (totali, pubblicati, bozze)
- Trend ultimi 7/30 giorni
- Template più usati
- Grafico attività settimanale
- Lista post recenti

### 6. Image Editor
- Upload immagini (JPG, PNG, WebP)
- Compressione automatica
- AI editing: aggiunta testo, rimozione testo, rimozione persone, enhancement
- Undo/Redo
- Download

---

## Code Style Guidelines

### TypeScript
- Strict mode abilitato
- Path alias: `@/*` mappa su `./src/*`
- Tipi centralizzati in `src/types/index.ts`
- Preferire `interface` over `type` per oggetti

### React Components
- Functional components con hooks
- 'use client' per componenti client-side
- Props interface definita esplicitamente
- Tailwind per styling (no CSS modules)

### Naming Conventions
- Components: PascalCase (es. `InputSection.tsx`)
- Hooks: camelCase con prefisso `use` (es. `usePostGenerator.ts`)
- Utils: camelCase (es. `api-client.ts`)
- Types: PascalCase (es. `Post`, `GenerateRequest`)

### Error Handling
- Try/catch nelle API routes
- Toast per feedback utente (libreria `sonner`)
- Console log con prefisso identificativo (es. `[Abacus]`, `[API]`)
- Graceful degradation (es. Content Intelligence opzionale)

### API Client Pattern
```typescript
// Retry automatico con backoff
const result = await apiClient.requestWithRetry(async () => {
  const response = await apiClient.fetchWithTimeout('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
    timeout: 60000,
  });
  return apiClient.checkResponse(response);
}, {
  retries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
});
```

---

## Testing

Il progetto non ha test automatizzati configurati. Per testare:

1. **Development**: `npm run dev` + test manuale
2. **Build**: `npm run build` per verificare errori TypeScript
3. **Lint**: `npm run lint` per verificare stile codice

---

## Security Considerations

1. **Authentication**: Supabase SSR con middleware. Bypass possibile con `DISABLE_AUTH=true`
2. **API Keys**: Mai esporre in client (usare server-side o `NEXT_PUBLIC_` solo se necessario)
3. **File Upload**: Validazione tipo e dimensione (max 10MB), compressione automatica
4. **CORS**: Gestito da Next.js API routes
5. **Rate Limiting**: Implementato in `api-client.ts` (1 secondo tra richieste)

---

## Deployment

L'app è configurata per deployment su piattaforme che supportano Next.js:

- **Vercel**: Deploy automatico da Git
- **Docker**: Possibile con `next.config.ts` standalone (non configurato)
- **Node.js**: `npm run build && npm run start`

---

## Common Tasks

### Aggiungere un nuovo template
1. Modifica `src/lib/abacus.ts`
2. Aggiungi a `TEMPLATES_IWP` o `TEMPLATES_IWA`
3. Template object: `{ name: string, prompt: string }`

### Aggiungere una nuova API route
1. Crea cartella in `src/app/api/nome/route.ts`
2. Esporta `async function GET/POST(request: NextRequest)`
3. Usa `getAuthenticatedUser()` per auth
4. Return `NextResponse.json(data)`

### Aggiungere un nuovo campo al Post
1. Aggiungi a `Post` interface in `src/types/index.ts`
2. Aggiorna `createPost` in `src/lib/supabase.ts`
3. Aggiorna schema Supabase (se necessario)

### Modificare lo stile
- Colori: `src/app/globals.css` (variabili CSS)
- Componenti: classi Tailwind nei file component
- Tema: gradienti purple/pink per IWP, blue/cyan per IWA

---

## Troubleshooting

**Errore "Supabase client not initialized"**
- Verifica env vars `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Generazione testo fallisce**
- Verifica `ABACUS_API_KEY`
- Controlla log in console per errori API

**Generazione immagine fallisce**
- `GOOGLE_AI_API_KEY` opzionale - se mancante, nessuna immagine generata

**Auth non funziona**
- Per development: imposta `DISABLE_AUTH=true`
- Per production: verifica Supabase Auth configuration

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Abacus AI Docs](https://abacus.ai)

---

*Last updated: 2026-02-18*
