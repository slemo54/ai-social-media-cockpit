import { AbacusTextResponse, AbacusImageResponse, Templates } from '@/types';
import { getContentIntelligence, buildPromptEnhancement, buildImagePromptEnhancement } from './content-intelligence';

const ABACUS_BASE_URL = 'https://routellm.abacus.ai/v1';

interface RetryOptions {
  retries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_BACKOFF = 2;

function getAbacusApiKey(): string {
  const key = process.env.ABACUS_API_KEY || process.env.NEXT_PUBLIC_ABACUS_API_KEY;
  if (!key) {
    throw new Error('ABACUS_API_KEY not configured');
  }
  if (!process.env.ABACUS_API_KEY && process.env.NEXT_PUBLIC_ABACUS_API_KEY) {
    console.warn('[Abacus] Using NEXT_PUBLIC_ABACUS_API_KEY on server. Consider setting ABACUS_API_KEY.');
  }
  return key;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = 60000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response;
}

async function requestWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
  const backoffMultiplier = options.backoffMultiplier ?? DEFAULT_BACKOFF;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (
        lastError.message.includes('401') ||
        lastError.message.includes('403') ||
        lastError.message.includes('404')
      ) {
        throw lastError;
      }

      if (attempt < retries) {
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
        console.log(`[Abacus] Retry ${attempt + 1}/${retries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Brand Voice Italian Wine Podcast - Stile Stevie Kim (conversazionale, storytelling)
const SYSTEM_PROMPT_IWP = `Sei Stevie Kim, Managing Director di Vinitaly International e voce di Italian Wine Podcast.

STILE DI COMUNICAZIONE:
- Come una chiacchierata al bar con amici, MAI da manuale
- Storytelling personale: "I used to think... but then..."
- Hook diretti: "Ok, story time...", "Plot twist:", "So here's the thing..."
- Umiltà autentica: "I'm not an expert, but..."
- Italiano sparso naturale: "merende", "brioche all'albicocca", "restate sintonizzati"
- Autoironia: "taking a hit for the team", "Producer J", "the only daily wine podcast in the world"
- Connessione persona-persona, mai didascalico

REGOLE ASSOLUTE:
- ❌ MAI suonare come un manuale o una lezione
- ✅ Sempre includere "Cin Cin! 🍷" alla fine del body_copy
- ✅ Tono: curioso, entusiasta, autentico, zero snobismo
- ✅ Fare domande alla community per engagement
- ✅ Raccontare storie di persone, non solo di vino

RISPONDI SOLO IN QUESTO FORMATO JSON:
{
  "title": "Hook diretto e informale (max 100 char)",
  "body_copy": "Testo conversazionale con storytelling personale, umiltà, e chiusura con Cin Cin! 🍷",
  "hashtags": ["#ItalianWinePodcast", "#CinCin", "#altro1", "#altro2", "#altro3"],
  "image_prompt": "Descrizione visiva in inglese, stile editoriale vino"
}`;

// Brand Voice Italian Wine Academy - Based on @itawineacademy Instagram analysis
const SYSTEM_PROMPT_IWA = `Sei il content creator di Italian Wine Academy (@itawineacademy), accademia premium di formazione vinicola italiana, provider autorizzato WSET (Levels 1-3 + Champagne Specialist). Sede: Verona.

STILE DI COMUNICAZIONE (da analisi reale Instagram @itawineacademy):
- Professionale ma accessibile e friendly, MAI corporate o noioso
- Entusiasta ed educativo: "premium educativo moderno"
- Espressioni informali: "And we're baaack!", "Let us know in the comments below!"
- Mix strategico inglese/italiano (corsi specificati nella lingua di erogazione)
- Caption CORTE: 2-4 frasi massimo, focus su informazioni essenziali
- Struttura fissa: Hook coinvolgente → Info chiave (date, educatori, location) → CTA diretto
- Partnership: Bologna Business School, AIS Veneto, Vinitaly

REGOLE HASHTAG ED EMOJI:
- ❌ QUASI ZERO hashtag (strategia "clean") - massimo 2 hashtag brand se necessario
- ✅ Emoji: uso MODERATO e strategico, max 3-4 per post
- Emoji consentiti: 🍷 🍇 🥂 🍾 ✨ 🔥 👇 😄
- ✨ per enfatizzare date e novità
- 🔥 per urgenza ("Last Call")
- 👇 per CTA nei commenti

TIPOLOGIE DI POST (alterna tra queste):
1. Quiz educativi: "2 Truths 1 Lie", "Wine Region Quiz" - interattivi e divertenti
2. Promozionali corsi: "5 Reasons Why", "Last Call" - con date e dettagli pratici
3. Informativi: date corsi, WSET Level 1/2/3, Champagne Specialist
4. Statistiche: Pass Rates con percentuali concrete (social proof)
5. Celebrativi: "Meet Our Students", eventi completati, successi
6. Fotografici: studenti in aula, degustazioni, bottiglie

CALL-TO-ACTION (da post reali):
- "Let us know in the comments below!"
- "Join us for two intensive days..."
- Date evidenziate: "✨ February 13-14, 2026 ✨"
- "LAST CALL" per urgenza e FOMO
- Link in bio implicito per iscrizioni
- Stile: diretto ma non aggressivo, focus su esperienza e valore educativo

REGOLE ASSOLUTE:
- ✅ Tono: sofisticato ma non snob, informativo ma non noioso, professionale ma umano
- ✅ Valore educativo immediato o info pratica chiara
- ✅ Fatti verificabili e concreti (pass rates, numeri studenti, etc.)
- ✅ CTA chiare con date e dettagli pratici quando appropriato
- ✅ Evidenziare educatori e location (Verona)
- ❌ MAI hashtag spam
- ❌ MAI testi lunghi oltre 4 frasi

RISPONDI SOLO IN QUESTO FORMATO JSON:
{
  "title": "Hook breve e coinvolgente (max 80 char)",
  "body_copy": "Testo 2-4 frasi: professionale, accessibile, con CTA chiaro. Max 3-4 emoji strategici. Quasi zero hashtag.",
  "hashtags": ["#ItalianWineAcademy"],
  "image_prompt": "IMPORTANT: Describe a modern minimalist graphic design (NOT a photo) for Instagram 1080x1080px. Use Italian Wine Academy brand identity: bright blue (#0080FF) OR gold (#C9A875) + black OR black + white palette. Clean flat design, sans-serif bold uppercase titles, geometric shapes (circles, horizontal bands), subtle decorative elements. Logo placeholder top center. Professional premium wine education aesthetic."
}`;

// Template IWP - Stile storytelling conversazionale
const TEMPLATES_IWP: Templates = {
  'on-the-road': {
    name: '🚗 On the Road',
    prompt: 'Racconta un viaggio appena concluso in una regione vinicola italiana. Stile: "Just got back from...", entusiasta, aneddoti personali, "taking a hit for the team"',
  },
  'wine-geeks': {
    name: '🤓 Wine Geeks',
    prompt: 'Spiega un concetto enologico con un plot twist sorprendente. Stile: "Plot twist:", bite size, "If I can understand... anyone can"',
  },
  'cin-cin-community': {
    name: '🥂 Cin Cin Community',
    prompt: 'Post di puro engagement con la community internazionale. Chiedi come brindano nei loro paesi. Stile: "How do you say Cin Cin in your language?"',
  },
  'bit-of-scienza': {
    name: '🔬 A Bit of Scienza',
    prompt: 'Spiega scienza del vino come Professor Attilio Scienza. Stile: professore umile, accessibile, "il tuo professore preferito"',
  },
  'behind-the-scenes': {
    name: '🎬 Behind the Scenes',
    prompt: 'Dietro le quinte del podcast. Autoironia, Producer J, "merende", "brioche all\'albicocca". Stile: autentico, divertente, umano',
  },
  'new-discovery': {
    name: '✨ New Discovery',
    prompt: 'Racconta una scoperta vinicola personale. Stile: "Ok, story time...", umiltà, scoperta personale, cambio di prospettiva',
  },
  'wine2wine': {
    name: '🎤 wine2wine',
    prompt: 'Business del vino in modo umano. Stile: "wine business is people business", non corporativo, networking autentico',
  },
  'via-academy': {
    name: '🎓 VIA Academy',
    prompt: 'Conoscenza enologica di alto livello accessibile. Stile: gold standard, fatti concreti, Vinitaly International Academy',
  },
};

// Template IWA - Based on real @itawineacademy content types
const TEMPLATES_IWA: Templates = {
  'quiz-educativo': {
    name: '🧠 Quiz Educativo',
    prompt: 'Crea un quiz interattivo sul vino: "2 Truths 1 Lie" o "Wine Region Quiz". 3 affermazioni di cui una falsa, chiedi alla community di indovinare. Stile: divertente, educativo, engagement alto. CTA: "Let us know in the comments below!"',
  },
  'corso-promo': {
    name: '📣 Promo Corso',
    prompt: 'Post promozionale per un corso WSET. Includi: livello WSET, date specifiche, location Verona, nome educatore. Stile: "5 Reasons Why" o "Last Call". CTA diretto con senso di urgenza. Max 3 frasi.',
  },
  'pass-rates': {
    name: '📊 Pass Rates',
    prompt: 'Condividi statistiche di successo degli studenti: pass rates, distinction, merit. Usa percentuali concrete come social proof. Celebra i risultati. Stile: orgoglioso ma non presuntuoso.',
  },
  'meet-students': {
    name: '🎓 Meet Our Students',
    prompt: 'Post celebrativo: presenta studenti che hanno completato un corso, racconta la loro esperienza. Stile: autentico, personale, ispiratore. Foto autentiche, non staged.',
  },
  'wine-facts': {
    name: '🍇 Wine Facts',
    prompt: 'Fatto educativo sul vino italiano: vitigno, regione, o tecnica. Bite-size, una cosa nuova da imparare in 2-3 frasi. Stile: "Did you know?" professionale ma accessibile.',
  },
  'champagne-specialist': {
    name: '🍾 Champagne Specialist',
    prompt: 'Contenuto sul corso Champagne Specialist: approfondimento su Champagne, metodo classico, terroir. Stile premium con palette oro/nero. Stile: esclusivo ma accogliente.',
  },
  'corso-info': {
    name: '📅 Info Corso',
    prompt: 'Post informativo con dettagli pratici: date corso, livello WSET, durata (es. "two intensive days"), location Verona, come iscriversi. Stile: chiaro, essenziale, date evidenziate con ✨.',
  },
  'behind-the-classroom': {
    name: '📸 Behind the Classroom',
    prompt: 'Foto autentiche dell\'aula: studenti che degustano, flashcards, appunti, materiali didattici. Stile: naturale, non staged. Caption breve che racconta il momento.',
  },
};

export function getTemplates(project: 'IWP' | 'IWA'): Templates {
  return project === 'IWP' ? TEMPLATES_IWP : TEMPLATES_IWA;
}

// Export combined templates for dashboard
export const CONTENT_TEMPLATES: Templates = {
  ...TEMPLATES_IWP,
  ...TEMPLATES_IWA,
};

export async function generateTextContent(
  topic: string,
  project: 'IWP' | 'IWA' = 'IWP',
  platform: string = 'instagram'
): Promise<AbacusTextResponse | null> {
  const apiKey = getAbacusApiKey();

  let systemPrompt = project === 'IWP' ? SYSTEM_PROMPT_IWP : SYSTEM_PROMPT_IWA;
  const projectName = project === 'IWP' ? 'Italian Wine Podcast' : 'Italian Wine Academy';

  // Enrich with Content Intelligence
  try {
    const intelligence = await getContentIntelligence(project, platform);
    const enhancement = buildPromptEnhancement(intelligence);
    if (enhancement) {
      systemPrompt += `\n\n--- CONTENT INTELLIGENCE (basata su analisi di post reali ad alto engagement) ---\n${enhancement}`;
      console.log(`[Abacus] Prompt enriched with ${intelligence.voiceRules.length} rules`);
    }
  } catch (err) {
    console.warn('[Abacus] Content intelligence unavailable, using base prompt');
  }

  console.log(`[Abacus] Generating for ${projectName}: ${topic.substring(0, 50)}`);

  const response = await requestWithRetry(async () => {
    const res = await fetchWithTimeout(`${ABACUS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Crea un post Instagram per ${projectName} su questo argomento: ${topic}\n\nIMPORTANTE: Rispondi SOLO in formato JSON valido, senza testo aggiuntivo prima o dopo.` }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
      timeout: 30000,
    });
    return checkResponse(res);
  }, {
    retries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  });

  const data = await response.json();
  console.log('[Abacus] Raw response:', JSON.stringify(data).substring(0, 300));
  
  // Estrai il contenuto
  let content: AbacusTextResponse;
  
  if (data.choices?.[0]?.message?.content) {
    const messageContent = data.choices[0].message.content;
    
    if (typeof messageContent === 'string') {
      try {
        content = JSON.parse(messageContent);
      } catch (e) {
        console.error('[Abacus] JSON parse error:', messageContent);
        throw new Error('Invalid JSON format in AI response');
      }
    } else {
      content = messageContent;
    }
  } else {
    console.error('[Abacus] Unexpected format:', data);
    throw new Error('Unexpected response format from API');
  }

  // Validazione campi
  if (!content.title || !content.body_copy) {
    console.error('[Abacus] Missing fields:', content);
    throw new Error('AI response missing required fields');
  }

  // Normalizza hashtags
  if (!content.hashtags || !Array.isArray(content.hashtags) || content.hashtags.length === 0) {
    content.hashtags = project === 'IWP' 
      ? ['#ItalianWinePodcast', '#CinCin'] 
      : ['#ItalianWineAcademy', '#WineEducation'];
  }

  // Normalizza image_prompt
  if (!content.image_prompt) {
    content.image_prompt = `Professional wine photography, ${content.title}, Italian wine culture`;
  }

  // Per IWP, assicurati che ci sia "Cin Cin!" nel body
  if (project === 'IWP' && !content.body_copy.includes('Cin Cin')) {
    content.body_copy += ' Cin Cin! 🍷';
  }

  console.log('[Abacus] Content generated successfully');
  return content;
}

export async function generateImage(
  imagePrompt: string,
  options?: { brand?: 'IWP' | 'IWA'; platform?: string }
): Promise<AbacusImageResponse | null> {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleApiKey) {
    console.warn('[Image] GOOGLE_AI_API_KEY not set, skipping image generation');
    return null;
  }

  // IWA uses minimalist graphic design, IWP uses editorial photography
  const isIWA = options?.brand === 'IWA';
  let enhancedPrompt = isIWA
    ? `Modern minimalist graphic design for Instagram, ${imagePrompt}, clean flat design, sans-serif bold typography, geometric shapes, professional premium wine education aesthetic, 1080x1080px square format`
    : `Professional wine photography, Italian wine culture, ${imagePrompt}, elegant composition, warm lighting, authentic atmosphere, photorealistic, 8k quality`;

  // Enrich with visual intelligence
  if (options?.brand) {
    try {
      const intelligence = await getContentIntelligence(options.brand);
      const visualEnhancement = buildImagePromptEnhancement(intelligence);
      if (visualEnhancement) {
        enhancedPrompt += `, ${visualEnhancement}`;
        console.log('[Image] Prompt enriched with visual intelligence');
      }
    } catch {
      // Graceful degradation
    }
  }

  console.log('[Image] Generating image with Google Gemini...');

  const response = await requestWithRetry(async () => {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate a high-quality image: ${enhancedPrompt}` }],
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
        timeout: 90000,
      }
    );
    return checkResponse(res);
  }, {
    retries: 2,
    retryDelay: 2000,
    backoffMultiplier: 2,
  });

  const data = await response.json();
  console.log('[Image] Gemini response keys:', Object.keys(data));

  let imageBase64: string | undefined;

  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        imageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageBase64) {
    console.error('[Image] No image in response:', JSON.stringify(data).substring(0, 500));
    throw new Error('No image data received from Gemini API');
  }

  console.log('[Image] Image generated successfully');
  return { image_url: '', image_base64: imageBase64 };
}
