# AI Social Cockpit - Documentazione Funzionalità

> Documentazione completa delle funzionalità della web app per generazione contenuti social media IWP × IWA.
> Versione: 1.0.0 | Data: 2026-03-02

---

## 📋 Indice

1. [Overview del Prodotto](#1-overview-del-prodotto)
2. [Architettura Tecnica](#2-architettura-tecnica)
3. [Funzionalità Core](#3-funzionalità-core)
4. [Interfaccia Utente](#4-interfaccia-utente)
5. [Sistema di Template](#5-sistema-di-template)
6. [Content Intelligence](#6-content-intelligence)
7. [Image Editor](#7-image-editor)
8. [Dashboard Analytics](#8-dashboard-analytics)
9. [API Routes](#9-api-routes)
10. [Database & Storage](#10-database--storage)
11. [Flussi Utente](#11-flussi-utente)

---

## 1. Overview del Prodotto

**AI Social Cockpit** è un'applicazione web che genera contenuti social media ottimizzati per due brand del settore vinicolo italiano:

| Brand | Descrizione | Stile di Comunicazione |
|-------|-------------|----------------------|
| **IWP** (Italian Wine Podcast) | Podcast quotidiano sul vino italiano | Conversazionale, storytelling personale, "Stevie Kim al bar" |
| **IWA** (Italian Wine Academy) | Provider WSET per formazione enologica | Educativo professionale, autorevole ma accessibile |

### Value Proposition
- 🎯 **AI-Powered**: Generazione testo via Abacus AI (Gemini 2.5 Flash)
- 🖼️ **Immagini AI**: Creazione/generazione immagini con Google Gemini
- 📊 **Data-Driven**: Content Intelligence basata su post storici
- ✍️ **Human-in-the-Loop**: Editor integrato per revisione contenuti

---

## 2. Architettura Tecnica

### Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|------------|----------|
| Framework | Next.js | 16.1.6 (App Router) |
| Runtime | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | Supabase | PostgreSQL + Storage |
| Auth | Supabase SSR | - |
| AI APIs | Abacus.ai | Claude Opus 4.6 |
| Image AI | Google Gemini | 2.5 Flash |
| Icons | Lucide React | - |
| Toast | Sonner | - |

### Struttura Progetto

```
src/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── generate/        # POST: Genera contenuto
│   │   ├── intelligence/    # GET: Content Intelligence
│   │   ├── posts/recent/    # GET: Lista post recenti
│   │   ├── stats/           # GET: Statistiche dashboard
│   │   ├── image/upload/    # POST: Upload immagine
│   │   ├── image/edit/      # POST: Modifica immagine AI
│   │   └── health/          # GET: Health check
│   ├── dashboard/           # Dashboard page
│   ├── page.tsx             # Home (content generator)
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── InputSection.tsx     # Input form + template selector
│   ├── PreviewSection.tsx   # Preview feed/story/linkedin
│   ├── EditorSection.tsx    # Text editor
│   ├── ImageEditor.tsx      # Image upload & AI editing
│   └── dashboard/           # Dashboard components
├── hooks/                   # Custom React hooks
│   ├── usePostGenerator.ts
│   ├── useDashboardStats.ts
│   └── useRecentPosts.ts
├── lib/                     # Utility libraries
│   ├── abacus.ts            # Abacus AI integration
│   ├── content-intelligence.ts
│   ├── api-client.ts        # API client robusto
│   ├── supabase.ts          # Supabase client
│   └── auth.ts              # Auth helpers
├── types/                   # TypeScript types
│   └── index.ts
└── middleware.ts            # Next.js middleware
```

---

## 3. Funzionalità Core

### 3.1 Generazione Contenuti (`usePostGenerator`)

Hook principale che gestisce l'intero flusso di generazione:

| Feature | Descrizione |
|---------|-------------|
| `generatePost()` | Avvia generazione testo + immagine |
| `updatePost()` | Aggiorna campi del post (editor) |
| `copyToClipboard()` | Copia contenuto formattato |
| `downloadImage()` | Scarica immagine generata |
| `markAsPublished()` | Marca post come pubblicato |
| `cancelGeneration()` | Annulla generazione in corso |
| `selectImage()` | Seleziona tra 3 proposte immagine |

**Stati gestiti:**
- `post`: Post corrente (null | Post)
- `isLoading`: Generazione in corso
- `isCancelling`: Annullamento in corso
- `error`: Messaggio errore
- `previewMode`: 'feed' | 'story' | 'linkedin'
- `project`: 'IWP' | 'IWA'

### 3.2 Brand Voice Engine (`lib/abacus.ts`)

Sistema di prompt engineering che definisce il tono di voce per ogni brand.

#### IWP - Italian Wine Podcast

**Personalità**: "Stevie Kim al bar" — come una chiacchierata con l'amica più informata sul vino.

**Caratteristiche:**
- Tono conversazionale, MAI da manuale
- Hook diretti: "Ok, story time...", "Plot twist:"
- Storytelling personale: "I used to think... but then..."
- Mix italiano-inglese: "merende", "brioche all'albicocca"
- Autoironia: "taking a hit for the team", "Producer J saves me"
- Chiusura obbligatoria: "Cin Cin! 🍷"
- Max 150 parole per body_copy
- 5-8 hashtag per post (sempre #ItalianWinePodcast #CinCin)

**Colori Brand:**
- Italian Green: #008C45
- Italian Red: #CD212A
- Wine Purple: #4A0E4E

#### IWA - Italian Wine Academy

**Personalità**: "Il professore che vorresti avere" — autorevole ma accessibile

**Caratteristiche:**
- Premium educativo moderno
- Caption CORTE: 2-4 frasi massimo
- Struttura: Hook → Info chiave → CTA
- Espressioni: "And we're baaack!", "Let us know..."
- Fatti concreti: pass rates, numeri studenti
- Max 2-3 emoji per post (uso strategico)
- QUASI ZERO hashtag (strategia "clean")

**Colori Brand:**
- WSET Purple: #5C2D91
- Vinitaly Red: #C8102E
- Champagne Gold: #D4AF37

### 3.3 Generazione Immagini

**Flusso:**
1. Se utente carica immagine → usa quella (upload a Supabase Storage)
2. Altrimenti → genera 3 proposte con Google Gemini

**Parametri per IWP:**
```
Warm editorial wine photography
Golden hour lighting
Authentic Italian settings
Human element (hands, winemaker)
Rich warm tones
NOT stock photography
1080x1080px
```

**Parametri per IWA:**
```
Modern minimalist graphic design
WSET Purple (#5C2D91) palette
Champagne Gold (#D4AF37) accents
Clean flat design
Sans-serif bold uppercase typography
NOT a photo — vector/graphic style
```

---

## 4. Interfaccia Utente

### 4.1 Layout Principale (`page.tsx`)

Struttura a 3 colonne (4 quando Image Editor è aperto):

```
┌─────────────────────────────────────────────────────────────┐
│  Header (Logo, Nav, Badge "Human-in-the-Loop")             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Colonna 1  │  │   Colonna 2  │  │   Colonna 3  │      │
│  │  InputSection│  │PreviewSection│  │ EditorSection│      │
│  │              │  │              │  │              │      │
│  │  - Template  │  │  - Feed      │  │  - Titolo    │      │
│  │  - Upload    │  │  - Story     │  │  - Body      │      │
│  │  - Topic     │  │  - LinkedIn  │  │  - Hashtags  │      │
│  │  - Generate  │  │              │  │  - Actions   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Componenti UI

#### InputSection
- **Selector Brand**: Toggle IWP/IWA con colori brand
- **Template Grid**: 10 template per brand con icone
- **Image Upload**: Drag & drop, compressione automatica (max 10MB, JPG/PNG/WebP)
- **Topic Input**: Textarea con placeholder dinamico
- **Generate Button**: Stato loading con spinner

#### PreviewSection
- **Mode Toggle**: Feed / Story / LinkedIn
- **Instagram Feed Preview**: Mock realistico con actions, likes, caption
- **Story Preview**: Frame smartphone 9:16 con progress bar
- **LinkedIn Preview**: Layout professional con reactions
- **Image Selector**: Griglia 3 proposte quando disponibili
- **Prompt Display**: Mostra prompt immagine usato

#### EditorSection
- **Title Field**: Input testo per hook/titolo
- **Body Field**: Textarea per testo principale
- **Hashtags Field**: Input separato da spazi
- **Full Preview**: Anteprima completa testo
- **Action Buttons**:
  - Copia (clipboard)
  - Scarica (immagine)
  - Pubblica (marca come published)
  - Share (Web Share API)

#### ImageEditor
- **Upload**: Caricamento nuova immagine
- **Undo/Redo**: History stack (max 10 stati)
- **Tools AI**:
  - Aggiungi testo (con posizione: top/center/bottom)
  - Rimuovi testo
  - Rimuovi persone
  - Migliora qualità
- **Download**: Salva immagine modificata

---

## 5. Sistema di Template

### 5.1 Template IWP (10 template)

| Template | Nome | Prompt |
|----------|------|--------|
| `story-time` | 📖 Story Time | Racconta storia personale, apri con "Ok, story time..." |
| `plot-twist` | 🔄 Plot Twist | Concetto enologico con colpo di scena |
| `on-the-road` | 🚗 On the Road | Viaggio in regione vinicola, "Just got back from..." |
| `cin-cin-community` | 🥂 Cin Cin Community | Engagement puro con community |
| `behind-the-scenes` | 🎬 Behind the Scenes | Dietro le quinte, Producer J, autoironia |
| `hot-take` | 🔥 Hot Take | Opinione controcorrente |
| `wine-people` | 👥 Wine People | Presenta persona del mondo vino |
| `new-discovery` | ✨ New Discovery | Scoperta vinicola, "Can we talk about..." |
| `bit-of-scienza` | 🔬 A Bit of Scienza | Scienza accessibile, stile Prof. Scienza |
| `wine2wine` | 🎤 wine2wine | Business del vino attraverso persone |

### 5.2 Template IWA (10 template)

| Template | Nome | Prompt |
|----------|------|--------|
| `quiz-educativo` | 🧠 Quiz Educativo | "2 Truths 1 Lie", interattivo |
| `last-call` | 🔥 Last Call | Urgency per corsi WSET in partenza |
| `five-reasons` | 5️⃣ 5 Reasons Why | Lista benefici corso |
| `pass-rates` | 📊 Pass Rates | Statistiche di successo |
| `meet-students` | 🎓 Meet Our Students | Celebrazione studenti |
| `wine-facts` | 🍇 Wine Facts | Fatto educativo bite-size |
| `champagne-specialist` | 🍾 Champagne Specialist | Approfondimento Champagne |
| `corso-info` | 📅 Info Corso | Dettagli pratici corso |
| `behind-the-classroom` | 📸 Behind the Classroom | Momenti autentici dall'aula |
| `wset-explainer` | 📚 WSET Explainer | Spiega percorso WSET |

---

## 6. Content Intelligence

Sistema che arricchisce i prompt con dati storici per migliorare qualità contenuti.

### 6.1 Architettura (`lib/content-intelligence.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Intelligence                      │
├─────────────────────────────────────────────────────────────┤
│  Cache In-Memory (5 min TTL)                                 │
│  ├── Key: "{brand}:{platform}"                              │
│  └── Data: ContentIntelligence                              │
├─────────────────────────────────────────────────────────────┤
│  Database Tables                                             │
│  ├── brand_voice_rules       (tone, hooks, vocabulary)      │
│  ├── engagement_patterns     (pattern_type, avg_score)      │
│  ├── visual_style_patterns   (prompt_keywords)              │
│  └── content_intelligence_posts (historical top posts)      │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Dati Recuperati

| Categoria | Descrizione |
|-----------|-------------|
| `voiceRules` | Regole di tono con esempi e confidence score |
| `topHooks` | Primi 5 hook dai post più performanti |
| `topHashtags` | Hashtag più usati nei post di successo |
| `engagementInsights` | Pattern con engagement score medio |
| `visualStyleKeywords` | Keyword per stili visuali performanti |
| `avoidPatterns` | Pattern da evitare assolutamente |

### 6.3 Prompt Enhancement

Il sistema aggiunge al prompt base:

```
--- CONTENT INTELLIGENCE ---
REGOLE DI TONO (data-driven):
- [regola] (es: "esempio")

HOOK PATTERNS (alto engagement):
- [pattern]

HOOK DAI POST PIU PERFORMANTI:
- "[hook reale]"

HASHTAG TOP: #tag1 #tag2 #tag3

DA EVITARE ASSOLUTAMENTE:
- ❌ [pattern]
```

---

## 7. Image Editor

### 7.1 Funzionalità

| Operazione | Descrizione | API Usata |
|------------|-------------|-----------|
| Upload | Carica immagine locale | `/api/image/upload` |
| Add Text | Aggiunge testo sovrapposto | `/api/image/edit` (Gemini) |
| Remove Text | Rimuove testo esistente | `/api/image/edit` (Gemini) |
| Remove Person | Rimuove persone dall'immagine | `/api/image/edit` (Gemini) |
| Enhance | Migliora qualità generale | `/api/image/edit` (Gemini) |

### 7.2 History & Undo

- Stack history: massimo 10 stati
- Undo: ripristina stato precedente
- Ogni operazione salva nuovo stato
- Cambio immagine resetta history

### 7.3 Compressione Immagini

Parametri di default:
- Max width: 1200px
- Max height: 1200px
- Quality: 0.85 (JPEG)
- Max file size: 10MB

---

## 8. Dashboard Analytics

### 8.1 Metriche Tracciate

| Metrica | Descrizione | Fonte |
|---------|-------------|-------|
| Contenuti Totali | Numero totale post creati | user_stats / posts |
| Pubblicati | Post con status 'published' | posts |
| In Bozza | Post con status 'draft' | posts |
| Tasso Conversione | % published / totali | Calcolato |
| Parole Generate | Somma word_count | posts |
| Tempo Medio Generazione | avg_generation_time_ms | user_stats |
| Template Preferito | template_used più frequente | posts |

### 8.2 Trend Analysis

- **Last 30 Days**: Totale, published, words
- **Last 7 Days**: Totale, published, words
- **Growth Rate**: Variazione % 7 giorni vs 7 giorni precedenti

### 8.3 Visualizzazioni

| Componente | Descrizione |
|------------|-------------|
| StatCard | Card metrica con icona, valore, trend % |
| ActivityChart | Grafico a barre ultimi 7 giorni |
| TemplateStats | Top 5 template più usati con progress bar |
| RecentPostsList | Lista ultimi 10 post con preview |
| QuickActions | Grid 8 template per accesso rapido |

---

## 9. API Routes

### 9.1 Endpoint Reference

| Endpoint | Metodo | Descrizione | Auth |
|----------|--------|-------------|------|
| `/api/generate` | POST | Genera testo + immagine | ✅ |
| `/api/intelligence` | GET | Recupera Content Intelligence | ✅ |
| `/api/posts/recent` | GET | Lista post recenti | ✅ |
| `/api/stats` | GET | Statistiche dashboard | ✅ |
| `/api/image/upload` | POST | Upload immagine a Supabase | ✅ |
| `/api/image/edit` | POST | Modifica immagine con AI | ✅ |
| `/api/health` | GET | Health check sistema | ✅ |

### 9.2 Request/Response Examples

#### POST /api/generate

```typescript
// Request
{
  topic: string;
  project: 'IWP' | 'IWA';
  imageUrl?: string;
  platform?: string;
  template?: string;
}

// Response
{
  success: boolean;
  data?: Post & {
    image_proposals?: string[];
    selected_image_index?: number;
  };
  error?: string;
}
```

#### GET /api/intelligence

```typescript
// Query: ?brand=IWP&platform=instagram

// Response
{
  brand: 'IWP';
  platform: 'instagram';
  rulesCount: 12;
  categories: ['tone', 'hooks', 'vocabulary'];
  topHooks: string[];
  topHashtags: string[];
  insightsCount: 8;
  visualKeywords: string[];
  avoidPatterns: string[];
  hasData: true;
}
```

### 9.3 API Client (`lib/api-client.ts`)

Features del client HTTP robusto:

| Feature | Implementazione |
|---------|-----------------|
| Timeout | Default 60s, configurabile |
| Retry | 3 tentativi con backoff esponenziale |
| Rate Limiting | 1 secondo minimo tra richieste |
| Queue | Coda richieste con priorità |
| Cancellation | AbortController support |
| Compressione | Canvas-based image compression |

---

## 10. Database & Storage

### 10.1 Schema Tabelle

#### `posts`
```sql
- id: UUID PRIMARY KEY
- created_at: TIMESTAMP
- user_id: UUID
- topic: TEXT
- title: TEXT
- body_copy: TEXT
- hashtags: TEXT[]
- image_prompt: TEXT
- image_url: TEXT
- status: 'draft' | 'published'
- project: 'IWP' | 'IWA'
- platform: TEXT (default 'instagram')
- template_used: TEXT
- generation_time_ms: INTEGER
- word_count: INTEGER
- ai_model: TEXT
- prompt_length: INTEGER
- is_favorite: BOOLEAN
- published_at: TIMESTAMP
- copied_count: INTEGER
```

#### `generation_logs`
```sql
- id: UUID PRIMARY KEY
- user_id: UUID
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- post_id: UUID → posts
- prompt_input: TEXT
- ai_model: TEXT
- duration_ms: INTEGER
- success: BOOLEAN
- error_message: TEXT
```

#### `user_stats` (cache)
```sql
- user_id: UUID PRIMARY KEY
- total_posts: INTEGER
- published_posts: INTEGER
- draft_posts: INTEGER
- favorite_template: TEXT
- total_words_generated: INTEGER
- avg_generation_time_ms: INTEGER
- updated_at: TIMESTAMP
```

### 10.2 Row Level Security

Policy attuali (modalità sviluppo):
```sql
"Allow all operations" ON posts FOR ALL USING (true)
"Allow all operations on logs" ON generation_logs FOR ALL USING (true)
```

### 10.3 Storage

- **Bucket**: `social-images`
- **Path**: `posts/{timestamp}-{filename}`
- **Public**: true
- **Max Size**: 10MB
- **Tipi**: JPG, PNG, WebP

---

## 11. Flussi Utente

### 11.1 Flusso Generazione Contenuto

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Utente    │───▶│  Seleziona  │───▶│   Sceglie   │
│   Entra     │    │    Brand    │    │  Template   │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                              │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Copia     │◀───│  Visualizza │◀───│  Inserisce  │
│  Contenuto  │    │   Preview   │    │    Topic    │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                              │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Pubblica   │◀───│    Edita    │◀───│   Clicca    │
│   Post      │    │   Testo     │    │  "Genera"   │
└─────────────┘    └─────────────┘    └─────────────┘
                           ▲
                           │
                    ┌─────────────┐
                    │  Seleziona  │
                    │   Immagine  │
                    │  (3 props)  │
                    └─────────────┘
```

### 11.2 Flusso Image Editor

```
1. Utente clicca "Editor Immagine" nel header
2. Si apre pannello ImageEditor (4a colonna)
3. Opzioni:
   a. Carica nuova immagine
   b. Modifica immagine esistente
4. Modifiche disponibili:
   - Aggiungi testo (+ posizione)
   - Rimuovi testo
   - Rimuovi persone
   - Migliora qualità
5. Undo/Redo per ogni operazione
6. Download immagine finale
```

### 11.3 Flusso Dashboard

```
1. Utente clicca "Dashboard" nel header
2. Caricamento statistiche:
   - Overview cards
   - Activity chart
   - Template stats
   - Recent posts
3. Interazioni:
   - Clicca template rapido → redirect a /?template=x
   - Clicca post recente → redirect a /?edit=id
   - Refresh dati
   - Nuovo contenuto
```

---

## 12. Configurazione Ambiente

### 12.1 Variabili d'Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI APIs
ABACUS_API_KEY=your-abacus-key
GOOGLE_AI_API_KEY=your-google-key  # Optional

# Optional
DISABLE_AUTH=true  # Bypass auth per development
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=social-images
```

### 12.2 Auth Modes

| Mode | DISABLE_AUTH | Comportamento |
|------|--------------|---------------|
| Development | `true` | Bypass auth, user_id anonimo |
| Production | `false` | Supabase SSR auth required |

---

## 13. Note Tecniche

### 13.1 Performance

| Ottimizzazione | Implementazione |
|----------------|-----------------|
| Image Compression | Canvas-based, max 1200px |
| Content Intelligence Cache | In-memory, 5 min TTL |
| Lazy Loading | Componenti dashboard |
| AbortController | Cancella richieste pendenti |

### 13.2 Error Handling

| Scenario | Comportamento |
|----------|---------------|
| AI Timeout | Retry 3x con backoff |
| Upload Fallito | Toast errore, retry manuale |
| DB Error | Log console, graceful degradation |
| Auth Error | Redirect o messaggio |

### 13.3 Limiti

| Risorsa | Limite |
|---------|--------|
| Max file upload | 10MB |
| Image dimensioni | 1200x1200px (compresso) |
| History Image Editor | 10 stati |
| Retry API | 3 tentativi |
| Rate limit | 1s tra richieste |

---

## 14. Roadmap Suggerita

| Priorità | Feature | Stima |
|----------|---------|-------|
| Alta | Pubblicazione diretta Instagram API | 3-5gg |
| Alta | Scheduling post | 2-3gg |
| Media | A/B testing varianti | 2-3gg |
| Media | Analytics engagement reali | 3-4gg |
| Bassa | Multi-language support | 2-3gg |
| Bassa | Mobile app (PWA) | 5-7gg |

---

*Documento generato automaticamente dal codebase il 2026-03-02*
