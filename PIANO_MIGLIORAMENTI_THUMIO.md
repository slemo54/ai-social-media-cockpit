# Piano di Miglioramento AI Social Cockpit
## Integrazione Thumio-style + Dual-API Image System

> **Versione:** 1.0  
> **Data:** 2 Marzo 2026  
> **Obiettivo:** Trasformare AI Social Cockpit in una piattaforma professionale di template-based image editing, ispirata a Thumio.com, con sistema dual-API (Gemini + OpenAI) per generazione e editing avanzato delle immagini

---

## 📋 Indice

1. [Visione d'insieme](#visione-dinsieme)
2. [Analisi Esperienza Thumio / Corbin Brown](#analisi-esperienza-thumio)
3. [Architettura Dual-API](#architettura-dual-api)
4. [Sistema Template](#sistema-template)
5. [Script Generazione Template](#script-generazione-template)
6. [Piano Implementazione](#piano-implementazione)
7. [Specifiche Tecniche](#specifiche-tecniche)

---

## 🎯 Visione d'Insieme

### Da cosa partiamo
AI Social Cockpit è una web app Next.js che genera contenuti testuali per IWP/IWA via Abacus API (Claude) e immagini via Google Gemini. L'utente inserisce un topic, seleziona un template testuale e riceve 3 proposte di contenuto + immagini.

### Dove vogliamo arrivare
Una piattaforma **Thumio-style** dove:
- Gli utenti partono da **template visivi professionali** predefiniti
- Possono **personalizzare ogni elemento** (foto, testo, colori, layout)
- Un sistema **dual-API** (Gemini + OpenAI) gestisce:  
  - **Gemini**: Generazione infografiche complesse, layout strutturati, elementi grafici
  - **OpenAI GPT-4o/GPT-image**: Editing preciso, inpainting, restyling fotografico, rimozione/aggiunta elementi
- **Figura demo nera** al centro come placeholder per inserimento foto utente
- Workflow **drag-and-drop** o **wizard guidato** per la personalizzazione

---

## 🔍 Analisi Esperienza Thumio / Corbin Brown

### Pattern Identificati dai Template Analizzati

#### 1. **Template IWP - Stile Podcast/Social**
Caratteristiche visive rilevate nelle cartelle `/templates iwp`:

| Elemento | Descrizione |
|----------|-------------|
| **Layout** | Audio player style con controlli (play, pause, skip, shuffle) |
| **Sfondo** | Colori solidi bold (rosso bordeaux #8B2635, grigio antracite) |
| **Foto** | Figure umane centrali, spesso in cerchio (mask circolare) o sagoma ritagliata |
| **Testo** | Arch text (testo curvo) per titoli principali, sans-serif bold |
| **Branding** | Logo IWP in alto, titolo episodio, nome ospiti |
| **Varianti** | Ambassador's Corner, Italian Wine Unplugged, Slow Wine, wine2wine Forum |

**Esempi chiave:**
- `cbb4caeb-bdb7-401c-9c11-c87cb8bb119a.png` - Ambassador's Corner con cerchio bianco su sfondo rosso
- `us masterclass.png` - Due speaker professionali su sfondo rosso con titolo bold
- `2ce655cd-9e05-4a19-86b1-686772fd9f7e.png` - IWP in Slow Wine con controlli player

#### 2. **Template IWA - Stile Infografica/Corsi**
Caratteristiche da `/template immagini social date prossimo corso`:

| Elemento | Descrizione |
|----------|-------------|
| **Layout** | Infografica verticale pulita, gerarchia chiara |
| **Sfondo** | Colori pastello/crema (#FFF5E6) con accenti arancio (#F4A261) |
| **Illustrazioni** | Line art disegnata a mano (mani con bicchieri, figure stilizzate) |
| **Icone** | Set coerente: calendario, pin location, bandiere |
| **Tipografia** | Mix serif (titoli) e sans-serif (corpo), spaziatura ampia |
| **Logo** | IWA badge in alto a destra |

**Esempio chiave:**
- `download (3).jpeg` - WSET Level 1 con figura stilizzata in basso a destra, info data/luogo/educator

#### 3. **Template Thumio-Style (da replicare)**
Caratteristiche da `template.jpeg`:

| Elemento | Descrizione |
|----------|-------------|
| **Sfondo** | Chiaro, quasi bianco (#F5F5F5) o colori neutri pastello |
| **Illustrazioni** | Line art minimalista, mani/braccia che brindano da angoli |
| **Spazio negativo** | Generoso, focalizzato sul contenuto centrale |
| **Figura demo** | **Silhouette nera centrale** come placeholder per foto utente |
| **Stile** | Elegante, raffinato, "editorial fashion" |

---

### Flusso Utente Thumio (da implementare)

```
1. BROWSE      →  Gallery di template categorizzati (IWP/IWA/Tutti)
                 ↓
2. SELECT      →  Anteprima template con figura demo nera placeholder
                 ↓
3. CUSTOMIZE   →  Wizard di personalizzazione:
                   • Upload foto → Sostituisce silhouette nera
                   • Edit testo → Modifica titoli, sottotitoli
                   • Colori → Cambia palette (brand-compliant)
                   • Layout → Opzioni posizionamento elementi
                 ↓
4. AI ENHANCE  →  Dual-API processing:
                   • Gemini: Genera elementi grafici mancanti, infografiche
                   • OpenAI: Editing foto (bg remove, color correction, styling)
                 ↓
5. PREVIEW     →  Live preview con confronto before/after
                 ↓
6. EXPORT      →  Download multi-formato (PNG, JPG, MP4 per Stories)
```

---

## ⚙️ Architettura Dual-API

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Social Cockpit Frontend                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Template  │  │   Editor    │  │   Live Preview          │ │
│  │   Gallery   │  │   Canvas    │  │   (Konva/PixiJS)        │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘ │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Orchestration Layer                      │
│              (Route API: /api/image-process)                    │
└─────────────────────────────────────────────────────────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────┐    ┌──────────────────────────────────────┐
│   Google Gemini     │    │   OpenAI API (GPT-4o / DALL-E 3)     │
│   (Multimodal)      │    │                                      │
├─────────────────────┤    ├──────────────────────────────────────┤
│ • Layout complex    │    │ • Image editing (inpainting)         │
│ • Infographics      │    │ • Background removal/replacement     │
│ • Text rendering    │    │ • Style transfer                     │
│ • Element generation│    │ • Face retouching                    │
│ • Multi-step reason │    │ • Object manipulation                │
└─────────────────────┘    └──────────────────────────────────────┘
          │                           │
          └───────────┬───────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Storage                             │
│              (template-assets / user-generated)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Gemini API - Use Cases

#### 1. Generazione Infografiche Complesse
```typescript
// Esempio: Template corso IWA
const geminiPrompt = `
Crea un'infografica verticale 1080x1350 per un corso WSET.
Layout:
- Header: Banner arancione con testo "WSET LEVEL 1"
- Sezione data: Icona calendario + "6 March 2026"
- Sezione location: Icona pin + "Italian Wine Academy, Verona"
- Sezione educator: "Cynthia Chaplin"
- Footer: Figura stilizzata che brinda con bicchiere

Stile: Minimalista, colori pastello crema (#FFF5E6) e arancio (#F4A261),
illustrazioni line art, tipografia pulita.
`;
```

**Vantaggi Gemini:**
- Eccellente rendering testo integrato nell'immagine
- Capacità di seguire layout strutturati
- Generazione elementi grafici coerenti

#### 2. Generazione Elementi Template
```typescript
// Genera asset grafici per template
const assetPrompt = `
Genera una silhouette nera di una persona che brinda con un 
bicchiere di vino, vista frontale, stile minimalista, 
su sfondo trasparente. Formato PNG.
`;
```

---

### OpenAI API - Use Cases

#### 1. Image Editing (GPT-4o with vision)
```typescript
// API: POST https://api.openai.com/v1/images/edits
const openAIEditPayload = {
  model: "gpt-4o",  // o "dall-e-3" per generazione
  image: userPhotoBase64,  // Foto caricata dall'utente
  prompt: `
    Inserisci questa foto nel template fornito, 
    rimuovendo lo sfondo originale e applicando 
    uno stile professionale coerente con il brand wine.
    Mantieni l'illuminazione naturale.
  `,
  // opzioni aggiuntive per inpainting, mask, etc.
};
```

**Vantaggi OpenAI:**
- Editing preciso con inpainting
- Rimozione/sostituzione background
- Stile fotografico realistico
- Manipolazione oggetti

#### 2. Background Removal & Replacement
```typescript
const bgRemovePrompt = `
Rimuovi completamente lo sfondo dalla foto, mantenendo 
solo la persona. Restituisci PNG con trasparenza.
`;
```

#### 3. Style Transfer
```typescript
const styleTransferPrompt = `
Applica uno stile "corporate wine professional" alla foto:
- Tonalità calde, leggermente desaturate
- Contrasto moderato
- Look "editorial magazine"
`;
```

---

### Workflow Dual-API per Template Personalizzato

```typescript
// Esempio: Workflow completo template IWP Ambassador's Corner

async function generateCustomTemplate(userInputs: UserInputs) {
  const { userPhoto, guestName, episodeTitle, brand } = userInputs;
  
  // STEP 1: OpenAI - Preprocess foto utente
  const processedPhoto = await openAI.editImage({
    image: userPhoto,
    prompt: "Rimuovi sfondo, applica stile professionale wine, 
             mantieni solo la persona con bordo naturale"
  });
  
  // STEP 2: Gemini - Genera base template con elementi
  const templateBase = await gemini.generateImage({
    prompt: `
      Crea sfondo rosso bordeaux #8B2635, 1080x1080px.
      Aggiungi cerchio bianco al centro (diametro 600px).
      In alto testo curvo "AMBASSADOR'S CORNER" in bianco.
      In basso: controlli player (play, pause, skip) stile podcast.
      Sotto: linee decorative e nome ospite.
    `
  });
  
  // STEP 3: Composizione lato client (Canvas)
  // L'app combina templateBase + processedPhoto (inserita nel cerchio)
  
  // STEP 4: Gemini - Ottimizzazione finale
  const finalImage = await gemini.generateImage({
    prompt: `
      Prendi questi due elementi [templateBase, processedPhoto]
      e crea composizione finale professionale.
      Foto inserita perfettamente nel cerchio bianco.
      Aggiungi ombre sottili, effetto 3D leggero.
    `
  });
  
  return finalImage;
}
```

---

## 🎨 Sistema Template

### Struttura Template JSON

```typescript
// src/types/template.ts

interface Template {
  id: string;
  name: string;
  category: 'IWP' | 'IWA' | 'UNIVERSAL';
  type: 'podcast' | 'event' | 'course' | 'promo' | 'quote';
  
  // Dimensioni
  dimensions: {
    width: number;    // 1080
    height: number;   // 1080 | 1350 | 1920
    format: 'square' | 'portrait' | 'story';
  };
  
  // Struttura layer
  layers: TemplateLayer[];
  
  // Configurazione personalizzabile
  customization: CustomizationConfig;
  
  // Assets di base
  baseAssets: {
    background?: string;      // URL sfondo
    demoFigure?: string;      // Silhouette nera placeholder
    overlays?: string[];      // Elementi grafici
    fonts?: string[];         // Font richiesti
  };
  
  // Prompts per AI
  aiPrompts: {
    gemini: string;           // Prompt per generazione base
    openAI: string;           // Prompt per editing foto
  };
}

interface TemplateLayer {
  id: string;
  type: 'image' | 'text' | 'shape' | 'overlay';
  name: string;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  editable: boolean;
  
  // Configurazione specifica per tipo
  config: ImageLayerConfig | TextLayerConfig | ShapeLayerConfig;
}

interface ImageLayerConfig {
  type: 'image';
  placeholder: string;        // URL placeholder nero
  mask?: 'circle' | 'rounded' | 'none';
  allowUpload: boolean;
  aiProcessing: 'none' | 'bg-remove' | 'style-transfer' | 'full';
}

interface TextLayerConfig {
  type: 'text';
  defaultText: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
  maxLength: number;
  textTransform: 'none' | 'uppercase' | 'lowercase';
}
```

---

### Catalogo Template Proposto

#### Template IWP (12 template)

| ID | Nome | Tipo | Caratteristiche |
|----|------|------|-----------------|
| `iwp-ambassador-circle` | Ambassador's Corner | Podcast | Cerchio centrale, sfondo rosso, testo curvo |
| `iwp-unplugged-book` | Italian Wine Unplugged | Podcast | Libro/podcast in cerchio, lista vitigni |
| `iwp-slow-wine` | IWP in Slow Wine | Event | Due persone, sfondo evento, controlli player |
| `iwp-masterclass-duo` | Masterclass Duo | Promo | Due speaker, sfondo rosso bold, titolo grande |
| `iwp-wine2wine-forum` | wine2wine Forum | Event | Speaker professionali, sfondo stage, branding |
| `iwp-story-quote` | Quote Story | Story | Testo citazione, sfondo sfocato, minimal |
| `iwp-on-the-road` | On The Road | Vlog | Collage foto viaggio, elementi mappa |
| `iwp-wine-geeks` | Wine Geeks | Educational | Infografica vino, dati, icone |
| `iwp-cin-cin` | Cin Cin Community | Engagement | Brindisi, sfondo festivo, elementi social |
| `iwp-behind-scenes` | Behind The Scenes | BTS | Foto "dietro le quinte", look autentico |
| `iwp-new-discovery` | New Discovery | Discovery | Bottiglia highlight, sfondo elegante |
| `iwp-via-academy` | Via Academy | Educational | Elementi accademici, look istituzionale |

#### Template IWA (10 template)

| ID | Nome | Tipo | Caratteristiche |
|----|------|------|-----------------|
| `iwa-wset-level1` | WSET Level 1 | Course | Infografica corso, data, luogo, educator |
| `iwa-wset-level2` | WSET Level 2 | Course | Struttura simile L1, colori diversi |
| `iwa-wset-level3` | WSET Level 3 | Course | Design premium, più informazioni |
| `iwa-champagne-spec` | Champagne Specialist | Course | Elegante, dorature, minimal |
| `iwa-grape-deep-dive` | Grape Deep Dive | Educational | Illustrazione vitigno, caratteristiche |
| `iwa-region-focus` | Region Focus | Educational | Mappa regione, info territorio |
| `iwa-wine-food` | Wine & Food | Pairing | Piatto + vino, abbinamento |
| `iwa-study-tips` | Study Tips | Educational | Icone, checklist, consigli |
| `iwa-wine-career` | Wine Career | Promo | Percorso professionale, timeline |
| `iwa-sustainability` | Sustainability | Topic | Verde, icone eco, messaggio |

#### Template Universali Thumio-Style (8 template)

| ID | Nome | Caratteristiche |
|----|------|-----------------|
| `thm-minimal-bordeaux` | Minimal Bordeaux | Sfondo chiaro, mani brindisi, figura nera centro |
| `thm-line-art-toast` | Line Art Toast | Line art mani, spazio negativo, elegante |
| `thm-wine-glass-portrait` | Wine Glass Portrait | Bicchiere centrale, silhouette laterale |
| `thm-abstract-wine` | Abstract Wine | Forme astratte, colori vino, moderno |
| `thm-classic-cheers` | Classic Cheers | Stile classico, brindisi, caldo |
| `thm-vineyard-view` | Vineyard View | Paesaggio vigneto, figura in primo piano |
| `thm-cork-and-wine` | Cork & Wine | Sughero, bottiglia, minimal |
| `thm-terroir-map` | Terroir Map | Mappa stilizzata, elementi geografici |

---

### Figura Demo Nera (Placeholder System)

#### Specifiche Tecniche

```typescript
// Silhouette placeholder universale
const demoFigureSpec = {
  // File base
  url: '/templates/assets/demo-figure-black.png',
  svgUrl: '/templates/assets/demo-figure-black.svg',
  
  // Dimensioni
  viewBox: '0 0 400 600',
  aspectRatio: '2:3',
  
  // Varianti per tipo template
  variants: {
    portrait: { width: 400, height: 600 },
    bust: { width: 400, height: 400 },
    circle: { width: 500, height: 500, mask: 'circle' },
    duo: { width: 800, height: 600, layout: 'side-by-side' }
  },
  
  // Comportamento upload
  onUpload: {
    // OpenAI processing
    preprocess: 'bg-remove + style-transfer',
    
    // Composizione
    fitMode: 'cover',      // cover | contain | fill
    position: 'center',    // center | top | custom
    
    // Effetti
    addShadow: true,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowBlur: 20,
    
    // Bordo/maschera
    borderRadius: 0,       // 0 per default, varia per template
    maskShape: 'none'      // none | circle | rounded
  }
};
```

#### Flusso Sostituzione Figura

```
1. Utente vede template con SILHOUETTE NERA al centro
           ↓
2. Clicca su silhouette → Apre upload dialog
           ↓
3. Seleziona foto → Preview immediata
           ↓
4. Opzioni AI (toggle):
   ☑ Rimuovi sfondo automatico (OpenAI)
   ☑ Applica stile brand (OpenAI)
   ☐ Mantieni sfondo originale
           ↓
5. Processing OpenAI:
   • Remove background → PNG trasparente
   • Style transfer → Tonalità brand
   • Face enhancement (opzionale)
           ↓
6. Composizione Canvas:
   • Foto processata sostituisce silhouette
   • Maschera template applicata (cerchio, etc.)
   • Ombre/effetti aggiunti
           ↓
7. Preview live → Utente può:
   • Zoom/pan foto
   • Regolare posizione
   • Cambiare effetti
           ↓
8. Conferma → Salva in canvas
```

---

## 🖥️ Script Generazione Template

### Script 1: Inizializzazione Assets Template

```typescript
// scripts/init-template-assets.ts

import { createCanvas, loadImage, registerFont } from 'canvas';
import { supabase } from '@/lib/supabase';

interface AssetGenerationConfig {
  templateId: string;
  outputDir: string;
  variants: ('portrait' | 'bust' | 'circle' | 'duo')[];
}

/**
 * Genera gli assets di base per un nuovo template
 * inclusa la silhouette nera placeholder
 */
async function generateTemplateAssets(config: AssetGenerationConfig) {
  const { templateId, outputDir, variants } = config;
  
  console.log(`🎨 Generazione assets per template: ${templateId}`);
  
  for (const variant of variants) {
    // Genera silhouette placeholder
    const silhouetteBuffer = await generateSilhouette(variant);
    
    // Upload a Supabase Storage
    const fileName = `${templateId}/demo-figure-${variant}.png`;
    const { data, error } = await supabase.storage
      .from('template-assets')
      .upload(fileName, silhouetteBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Errore upload ${variant}:`, error);
      continue;
    }
    
    console.log(`✅ Generato: ${fileName}`);
  }
  
  // Genera anche la versione SVG scalabile
  const svgContent = generateSilhouetteSVG();
  await supabase.storage
    .from('template-assets')
    .upload(`${templateId}/demo-figure.svg`, svgContent, {
      contentType: 'image/svg+xml',
      upsert: true
    });
}

/**
 * Genera silhouette PNG usando Canvas
 */
async function generateSilhouette(variant: string): Promise<Buffer> {
  const dimensions = getVariantDimensions(variant);
  const canvas = createCanvas(dimensions.width, dimensions.height);
  const ctx = canvas.getContext('2d');
  
  // Sfondo trasparente
  ctx.clearRect(0, 0, dimensions.width, dimensions.height);
  
  // Disegna silhouette stilizzata
  ctx.fillStyle = '#1a1a1a'; // Nero quasi puro
  
  // Forma base corpo umano stilizzato
  drawStylizedFigure(ctx, dimensions, variant);
  
  return canvas.toBuffer('image/png');
}

function drawStylizedFigure(
  ctx: CanvasRenderingContext2D, 
  dims: { width: number; height: number },
  variant: string
) {
  const centerX = dims.width / 2;
  const bottomY = dims.height;
  
  ctx.beginPath();
  
  // Testa (ovale)
  const headY = dims.height * 0.15;
  const headRadius = dims.width * 0.12;
  ctx.ellipse(centerX, headY, headRadius, headRadius * 1.2, 0, 0, Math.PI * 2);
  
  // Collo
  ctx.moveTo(centerX - headRadius * 0.3, headY + headRadius);
  ctx.lineTo(centerX - headRadius * 0.4, headY + headRadius * 2);
  ctx.lineTo(centerX + headRadius * 0.4, headY + headRadius * 2);
  ctx.lineTo(centerX + headRadius * 0.3, headY + headRadius);
  
  // Spalle e torso
  const shoulderY = headY + headRadius * 2.5;
  const shoulderWidth = dims.width * 0.35;
  const torsoBottom = dims.height * 0.65;
  
  ctx.moveTo(centerX - shoulderWidth, shoulderY);
  ctx.quadraticCurveTo(
    centerX - shoulderWidth * 0.8, 
    (shoulderY + torsoBottom) / 2,
    centerX - shoulderWidth * 0.4,
    torsoBottom
  );
  ctx.lineTo(centerX + shoulderWidth * 0.4, torsoBottom);
  ctx.quadraticCurveTo(
    centerX + shoulderWidth * 0.8,
    (shoulderY + torsoBottom) / 2,
    centerX + shoulderWidth,
    shoulderY
  );
  
  ctx.closePath();
  ctx.fill();
  
  // Se variant è "duo", disegna seconda figura
  if (variant === 'duo') {
    ctx.save();
    ctx.translate(dims.width * 0.25, 0);
    // Disegna seconda silhouette...
    ctx.restore();
  }
}

function generateSilhouetteSVG(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
  <!-- Silhouette placeholder stilizzata -->
  <ellipse cx="200" cy="80" rx="50" ry="60" fill="#1a1a1a"/>
  <path d="M170,130 Q140,200 150,280 L140,400 L260,400 L250,280 Q260,200 230,130 Z" fill="#1a1a1a"/>
</svg>`;
}

// Entry point
async function main() {
  const templatesToInit = [
    { templateId: 'iwp-ambassador-circle', variants: ['circle', 'bust'] },
    { templateId: 'iwp-masterclass-duo', variants: ['duo'] },
    { templateId: 'iwa-wset-level1', variants: ['portrait'] },
    { templateId: 'thm-minimal-bordeaux', variants: ['portrait', 'bust'] },
  ];
  
  for (const tmpl of templatesToInit) {
    await generateTemplateAssets({
      templateId: tmpl.templateId,
      outputDir: `./public/templates/${tmpl.templateId}`,
      variants: tmpl.variants as any
    });
  }
}

main().catch(console.error);
```

---

### Script 2: Generazione Template Base con Gemini

```typescript
// scripts/generate-template-bases.ts

import { googleAI } from '@/lib/gemini-client';
import { supabase } from '@/lib/supabase';

interface TemplateGenerationJob {
  templateId: string;
  geminiPrompt: string;
  dimensions: { width: number; height: number };
  outputFormat: 'png' | 'jpeg';
}

/**
 * Genera le immagini base per i template usando Gemini
 */
async function generateTemplateBases(jobs: TemplateGenerationJob[]) {
  console.log('🚀 Avvio generazione template base con Gemini...\n');
  
  for (const job of jobs) {
    console.log(`📐 Generando: ${job.templateId}`);
    
    try {
      // Chiamata Gemini con retry logic
      const imageBuffer = await generateWithGemini({
        prompt: job.geminiPrompt,
        width: job.dimensions.width,
        height: job.dimensions.height,
        format: job.outputFormat
      });
      
      // Upload a Supabase
      const fileName = `templates/bases/${job.templateId}-base.${job.outputFormat}`;
      const { data, error } = await supabase.storage
        .from('social-images')
        .upload(fileName, imageBuffer, {
          contentType: `image/${job.outputFormat}`,
          upsert: true
        });
      
      if (error) throw error;
      
      // Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('social-images')
        .getPublicUrl(fileName);
      
      // Aggiorna database
      await supabase
        .from('templates')
        .update({ baseImageUrl: publicUrl })
        .eq('id', job.templateId);
      
      console.log(`✅ Completato: ${job.templateId}`);
      console.log(`   URL: ${publicUrl}\n`);
      
    } catch (error) {
      console.error(`❌ Errore ${job.templateId}:`, error);
    }
  }
}

async function generateWithGemini(params: {
  prompt: string;
  width: number;
  height: number;
  format: string;
}): Promise<Buffer> {
  const { prompt, width, height, format } = params;
  
  // Usa Gemini Pro Vision per generazione
  const model = googleAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp-image-generation'
  });
  
  const enhancedPrompt = `
    ${prompt}
    
    Specifiche tecniche:
    - Dimensioni: ${width}x${height} pixel
    - Formato: ${format.toUpperCase()}
    - Qualità: Alta risoluzione, professionale
    - Stile: Ottimizzato per social media
    
    Importante: L'immagine deve avere uno spazio CENTRALE VUOTO 
    o una SILHOUETTE NERA dove l'utente inserirà la propria foto.
  `;
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE']
    }
  });
  
  // Estrai immagine dalla risposta
  const response = await result.response;
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    part => part.inlineData
  );
  
  if (!imagePart?.inlineData?.data) {
    throw new Error('Nessuna immagine generata');
  }
  
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

// Template jobs definiti
const templateJobs: TemplateGenerationJob[] = [
  {
    templateId: 'iwp-ambassador-circle',
    dimensions: { width: 1080, height: 1080 },
    outputFormat: 'png',
    geminiPrompt: `
      Crea un template per podcast "Ambassador's Corner".
      Sfondo: Rosso bordeaux intenso (#8B2635) con texture sottile.
      Al centro: Cerchio bianco puro (diametro 550px) vuoto per foto.
      In alto: Testo curvo "AMBASSADOR'S CORNER" in bianco, 
               font serif elegante, tutto maiuscolo.
      In basso: Barra controlli player podcast stile iOS 
                (play, pause, skip, shuffle) in bianco semitrasparente.
      Sotto i controlli: Linea decorativa sottile e spazio per nome ospite.
      Logo IWP piccolo in alto a sinistra.
    `
  },
  {
    templateId: 'iwa-wset-level1',
    dimensions: { width: 1080, height: 1350 },
    outputFormat: 'jpeg',
    geminiPrompt: `
      Crea un template infografica verticale per corso WSET.
      Sfondo: Crema chiaro (#FFF8F0) texture carta.
      Header: Banner arancio (#F4A261) in alto con bordi irregolari,
              testo "WSET LEVEL 1" in bianco, font sans-serif bold.
      Logo IWA in alto a destra (cerchio blu con icona calice).
      
      Elementi decorativi:
      - In alto a sinistra: Illustrazione line art mano con flute champagne
      - In basso a destra: Figura stilizzata donna con bicchiere vino,
                          stile illustrazione, colori arancio/blu
      
      Aree testo (placeholder):
      - Data con icona calendario
      - Location con icona pin  
      - Nome educator
      - Info esame
      
      Stile: Pulito, professionale, accademico ma accattivante.
    `
  },
  {
    templateId: 'thm-minimal-bordeaux',
    dimensions: { width: 1080, height: 1350 },
    outputFormat: 'png',
    geminiPrompt: `
      Crea un template minimalista stile Thumio.
      Sfondo: Bianco sporco (#F5F5F0) leggera texture carta.
      
      Illustrazioni line art nere (spessore linea 2px):
      - In alto a sinistra: Braccio che entra con bicchiere vino rosso
      - In basso a destra: Mano che tiene calice champagne
      
      Al centro: Silhouette nera ovale di persona in piedi,
                 vista frontale, proporzioni realistiche,
                 spazio per sostituzione con foto utente.
      
      Stile: Editoriale, elegante, spazio negativo generoso,
             ispirato a illustrazioni fashion di alta qualità.
    `
  }
];

// Esegui
console.log('📦 Template Base Generation Script\n');
generateTemplateBases(templateJobs)
  .then(() => console.log('\n✨ Tutti i template generati!'))
  .catch(console.error);
```

---

### Script 3: Setup Database Template

```typescript
// scripts/setup-template-database.ts

import { supabase } from '@/lib/supabase';

/**
 * Inizializza le tabelle necessarie per il sistema template
 */
async function setupTemplateDatabase() {
  console.log('🗄️ Setup database template system...\n');
  
  // SQL per creazione tabelle
  const createTablesSQL = `
    -- Tabella templates
    CREATE TABLE IF NOT EXISTS templates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      template_id VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(50) NOT NULL CHECK (category IN ('IWP', 'IWA', 'UNIVERSAL')),
      type VARCHAR(50) NOT NULL,
      dimensions JSONB NOT NULL,
      layers JSONB NOT NULL DEFAULT '[]',
      customization JSONB NOT NULL DEFAULT '{}',
      base_assets JSONB NOT NULL DEFAULT '{}',
      ai_prompts JSONB NOT NULL DEFAULT '{}',
      base_image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabella template_categories
    CREATE TABLE IF NOT EXISTS template_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      slug VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      sort_order INTEGER DEFAULT 0
    );

    -- Tabella user_template_instances
    CREATE TABLE IF NOT EXISTS user_template_instances (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      template_id VARCHAR(100) NOT NULL REFERENCES templates(template_id),
      custom_data JSONB NOT NULL DEFAULT '{}',
      uploaded_images JSONB NOT NULL DEFAULT '[]',
      final_image_url TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Indici
    CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
    CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
    CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
    CREATE INDEX IF NOT EXISTS idx_user_instances_user ON user_template_instances(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_instances_template ON user_template_instances(template_id);

    -- Funzione per updated_at automatico
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Trigger per templates
    DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
    CREATE TRIGGER update_templates_updated_at
      BEFORE UPDATE ON templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- Trigger per user_template_instances
    DROP TRIGGER IF EXISTS update_user_instances_updated_at ON user_template_instances;
    CREATE TRIGGER update_user_instances_updated_at
      BEFORE UPDATE ON user_template_instances
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
  
  if (error) {
    console.error('❌ Errore creazione tabelle:', error);
    return;
  }
  
  console.log('✅ Tabelle create con successo\n');
  
  // Popola categorie
  const categories = [
    { slug: 'iwp-podcast', name: 'IWP Podcast', description: 'Template per episodi podcast', icon: 'mic', sort_order: 1 },
    { slug: 'iwp-events', name: 'IWP Eventi', description: 'Template per eventi e fiere', icon: 'calendar', sort_order: 2 },
    { slug: 'iwa-courses', name: 'IWA Corsi', description: 'Template per corsi WSET', icon: 'graduation-cap', sort_order: 3 },
    { slug: 'iwa-educational', name: 'IWA Educational', description: 'Contenuti educativi', icon: 'book-open', sort_order: 4 },
    { slug: 'universal', name: 'Template Universali', description: 'Stili adatti ad entrambi i brand', icon: 'layout', sort_order: 5 },
  ];
  
  const { error: catError } = await supabase
    .from('template_categories')
    .upsert(categories, { onConflict: 'slug' });
  
  if (catError) {
    console.error('❌ Errore inserimento categorie:', catError);
    return;
  }
  
  console.log('✅ Categorie inserite\n');
  
  // Popola template
  await insertDefaultTemplates();
  
  console.log('\n🎉 Database template system pronto!');
}

async function insertDefaultTemplates() {
  const templates = [
    {
      template_id: 'iwp-ambassador-circle',
      name: "Ambassador's Corner",
      category: 'IWP',
      type: 'podcast',
      dimensions: { width: 1080, height: 1080, format: 'square' },
      layers: JSON.stringify([
        { id: 'bg', type: 'shape', name: 'Background', zIndex: 0, editable: false },
        { id: 'photo-circle', type: 'image', name: 'Foto Ospite', zIndex: 1, editable: true, config: { mask: 'circle' } },
        { id: 'title-arch', type: 'text', name: 'Titolo', zIndex: 2, editable: true },
        { id: 'controls', type: 'overlay', name: 'Player Controls', zIndex: 3, editable: false },
        { id: 'guest-name', type: 'text', name: 'Nome Ospite', zIndex: 4, editable: true }
      ]),
      base_assets: JSON.stringify({
        background: '/templates/bases/iwp-ambassador-circle-base.png',
        demoFigure: '/templates/assets/demo-figure-circle.png',
        fonts: ['Playfair Display', 'Inter']
      }),
      ai_prompts: JSON.stringify({
        gemini: 'Genera sfondo rosso bordeaux con cerchio bianco centrale, controlli player podcast',
        openAI: 'Rimuovi sfondo foto, applica stile professionale wine, ottimizza per cerchio'
      })
    },
    // ... altri template
  ];
  
  const { error } = await supabase
    .from('templates')
    .upsert(templates, { onConflict: 'template_id' });
  
  if (error) {
    console.error('❌ Errore inserimento template:', error);
    return;
  }
  
  console.log(`✅ ${templates.length} template inseriti`);
}

setupTemplateDatabase().catch(console.error);
```

---

## 📅 Piano Implementazione

### Fase 1: Foundation (Settimana 1-2)

| Task | Stima | Dipendenze |
|------|-------|------------|
| Setup tabelle Supabase template | 4h | - |
| Script generazione assets | 8h | Tabelle DB |
| Creazione silhouette base | 4h | Canvas/SVG |
| Upload assets iniziali | 2h | Script |
| Test pipeline assets | 2h | Upload |

**Deliverable:** Template system DB + Assets base generati

---

### Fase 2: Dual-API Integration (Settimana 2-3)

| Task | Stima | Dipendenze |
|------|-------|------------|
| Setup client Gemini multimodal | 4h | - |
| Setup client OpenAI image | 4h | - |
| API route `/api/image-process` | 8h | Client API |
| Orchestration layer dual-API | 12h | API route |
| Retry logic & error handling | 4h | Orchestration |
| Test integrazione | 4h | Retry logic |

**Deliverable:** Backend dual-API funzionante

---

### Fase 3: Template Gallery UI (Settimana 3-4)

| Task | Stima | Dipendenze |
|------|-------|------------|
| Componente `TemplateGallery` | 8h | - |
| Filtri categorie (IWP/IWA/Universal) | 4h | Gallery |
| Preview card template | 6h | Gallery |
| Search & sort | 4h | Gallery |
| Responsive grid | 4h | Cards |
| Animazioni transizioni | 4h | Grid |

**Deliverable:** UI Gallery navigabile

---

### Fase 4: Template Editor (Settimana 4-6)

| Task | Stima | Dipendenze |
|------|-------|------------|
| Canvas editor (Konva/PixiJS) | 16h | - |
| Layer management system | 8h | Canvas |
| Upload foto & placeholder swap | 8h | Canvas |
| Edit testo inline | 6h | Canvas |
| Color picker brand-compliant | 4h | Canvas |
| AI processing toggle | 4h | Dual-API |
| Real-time preview | 8h | Canvas+API |

**Deliverable:** Editor template funzionante

---

### Fase 5: Enhancement & Polish (Settimana 6-7)

| Task | Stima | Dipendenze |
|------|-------|------------|
| Zoom/pan foto | 4h | Editor |
| Undo/redo system | 6h | Editor |
| Export multi-formato | 6h | Editor |
| Animazioni export (MP4 stories) | 8h | Export |
| UX refinement | 8h | Tutto |
| Bug fixing | 8h | Testing |

**Deliverable:** MVP Template System completo

---

### Timeline Totale: **7 Settimane**

```
Settimana 1-2: ████████░░░░░░░░░░░░░░░░░ Foundation + Assets
Settimana 2-3: ░░████████░░░░░░░░░░░░░░░ Dual-API Backend  
Settimana 3-4: ░░░░████████░░░░░░░░░░░░░ Gallery UI
Settimana 4-6: ░░░░░░████████████░░░░░░░ Template Editor
Settimana 6-7: ░░░░░░░░░░░░████████░░░░░ Enhancement
```

---

## 🔧 Specifiche Tecniche

### Stack Aggiuntivo Richiesto

| Componente | Tecnologia | Scopo |
|------------|------------|-------|
| Canvas Engine | **Konva.js** | Rendering editor template, layer management |
| Image Processing | **Sharp** (Node.js) | Resize, compressione, ottimizzazione |
| Animation | **GSAP** | Animazioni UI, export MP4 |
| Video Export | **FFmpeg.wasm** | Generazione stories animate |

---

### API Endpoints Nuovi

```typescript
// src/app/api/templates/route.ts
GET    /api/templates              // Lista template con filtri
GET    /api/templates/[id]         // Dettaglio singolo template

// src/app/api/templates/process/route.ts  
POST   /api/templates/process      // Processa template con foto utente
Body: {
  templateId: string;
  userPhoto: File;
  customizations: {
    textLayers: { id: string; text: string }[];
    colorOverrides: { layerId: string; color: string }[];
  };
  aiOptions: {
    removeBackground: boolean;
    styleTransfer: boolean;
    faceEnhancement: boolean;
  };
}

// src/app/api/image/dual-process/route.ts
POST   /api/image/dual-process     // Orchestrazione Gemini + OpenAI
Body: {
  image: File;
  operations: ('bg-remove' | 'style-transfer' | 'gemini-enhance')[];
  templateContext?: string;
}

// Webhook/Progress
WS     /ws/template-progress       // WebSocket per progresso generazione
```

---

### Environment Variables Aggiuntive

```bash
# OpenAI (nuovo)
OPENAI_API_KEY=sk-...
OPENAI_IMAGE_MODEL=gpt-4o
OPENAI_IMAGE_QUALITY=hd

# Gemini (esistente, confermare)
GOOGLE_AI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash-exp-image-generation

# Storage (esistente)
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...

# Processing
MAX_IMAGE_SIZE_MB=10
ENABLE_AI_PROCESSING=true
DEFAULT_AI_OPTIONS=bg-remove,style-transfer
```

---

### Flusso Dati

```
Utente seleziona template
        ↓
[UI] Carica foto → Silhouette nera sostituita con preview
        ↓
[UI] Modifica testi/colori → Live preview canvas
        ↓
[UI] Attiva AI options → Toggle switches
        ↓
[API] POST /api/templates/process
        ↓
[Server] Upload foto → Supabase temp
        ↓
[Server] OpenAI: Background removal
        ↓
[Server] OpenAI: Style transfer  
        ↓
[Server] Gemini: Composizione finale con template base
        ↓
[Server] Sharp: Ottimizzazione formato
        ↓
[Server] Upload risultato → Supabase social-images
        ↓
[API] Response: URL immagine finale + metadati
        ↓
[UI] Preview finale → Download/Share options
```

---

## 📊 KPI di Successo

| Metrica | Target | Misurazione |
|---------|--------|-------------|
| Tempo generazione template | < 15s | Backend logs |
| Qualità percepita | > 4.5/5 | User survey |
| Tasso completamento | > 70% | Analytics |
| Uso AI features | > 50% | Event tracking |
| Template più usato | Track | DB queries |

---

## 📝 Note Finali

### Vantaggi Sistema Dual-API

1. **Gemini eccelle in:**
   - Layout strutturati e complessi
   - Rendering testo integrato
   - Generazione elementi grafici coerenti
   - Follow precise di istruzioni visive

2. **OpenAI eccelle in:**
   - Editing fotografico realistico
   - Inpainting preciso
   - Rimozione/sostituzione sfondi
   - Stile fotografico professionale

3. **Combinazione ottimale:**
   - OpenAI preprocessa foto utente
   - Gemini genera base template
   - Canvas composizione client-side
   - Gemini finalizza output

### Prossimi Passi Immediate

1. ✅ Review e approvazione piano
2. 🔄 Setup nuove env vars OpenAI
3. 🔄 Run script setup database
4. 🔄 Generazione assets iniziali
5. 🔄 Implementazione API route base

---

*Documento creato per AI Social Cockpit*  
*Integrazione Thumio-style + Dual-API Image System*
