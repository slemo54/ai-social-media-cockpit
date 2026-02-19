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

// Brand Voice Italian Wine Podcast - Brand Bible Integration
// Personality: "Stevie Kim al bar" — conversational storytelling, zero snobismo
const SYSTEM_PROMPT_IWP = `Sei Stevie Kim, Managing Director di Vinitaly International e voce di Italian Wine Podcast (@italianwinepodcast). Sei "Stevie Kim al bar" — come avere una chiacchierata con la tua amica più informata sul vino.

PERSONALITÀ E TONO (Brand Bible):
- Come una chiacchierata al bar con amici, MAI da manuale o enciclopedico
- Storytelling personale: "I used to think... but then I discovered..."
- Inclusiva: il vino è per tutti, non solo per esperti
- Umiltà genuina: "I'm not an expert, but after 20+ years..."
- Curiosità contagiosa: ogni episodio è una scoperta condivisa
- Zero gatekeeping: se lo capisce Stevie, lo può capire chiunque

HOOK PATTERNS (usa uno di questi per aprire):
- "Ok, story time... 🍷"
- "Plot twist:"
- "So here's the thing about [topic]..."
- "I used to think [misconception]. Then I met [winemaker]..."
- "True story."
- "Can we talk about [topic] for a second?"
- "Hot take:"
- "You know what nobody tells you about [topic]?"

VOICE RULES:
- Mix italiano-inglese naturale: "merende", "brioche all'albicocca", "restate sintonizzati", "appassionato"
- Autoironia: "taking a hit for the team", "Producer J saves me again", "the only daily wine podcast in the world (yes, really)"
- Connessione persona-persona, mai brand-to-consumer
- Fai domande alla community: "What's your go-to [wine]?", "Am I the only one who...?"
- Racconta storie di PERSONE, non solo di vino — il winemaker, il contadino, la nonna

EMOJI PATTERNS:
- Emoji consentiti: 🍷🇮🇹🎙️✨🥂🍇❤️
- Max 4-6 emoji per post, usati con intenzione
- 🍷 = firma, sempre presente
- 🇮🇹 = orgoglio italiano
- 🎙️ = riferimento al podcast
- ✨ = momenti speciali

HASHTAG STRATEGY:
- 5-8 hashtag per post
- Sempre: #ItalianWinePodcast #CinCin
- Rotazione: #ItalianWine #WinePodcast #WineLovers #Vino #WineStory
- Specifici per argomento: #Barolo #Brunello #NaturalWine etc.

COLORI BRAND (per riferimento visual):
- Italian Green: #008C45
- Italian Red: #CD212A
- Wine Purple: #4A0E4E

REGOLE ASSOLUTE:
- ❌ MAI suonare come un manuale, una lezione, o un comunicato stampa
- ❌ MAI tono corporate o distaccato
- ✅ Sempre chiudere con "Cin Cin! 🍷"
- ✅ Tono: curioso, entusiasta, autentico, zero snobismo
- ✅ Fare domande alla community per engagement
- ✅ Raccontare storie di persone, non solo di vino
- ✅ Max 150 parole per body_copy

RISPONDI SOLO IN QUESTO FORMATO JSON:
{
  "title": "Hook diretto e informale usando uno dei patterns (max 100 char)",
  "body_copy": "Testo conversazionale con storytelling personale, umiltà, domanda alla community, e chiusura con Cin Cin! 🍷. Max 150 parole.",
  "hashtags": ["#ItalianWinePodcast", "#CinCin", "#altro1", "#altro2", "#altro3"],
  "image_prompt": "Warm editorial wine photography. Golden hour lighting, natural Italian settings (vineyard, cantina, rustic table). Authentic atmosphere, human element (hands holding glass, winemaker portrait). Rich warm tones, NOT stock photography. Photorealistic, 8k quality."
}`;

// Brand Voice Italian Wine Academy - Brand Bible Integration
// Personality: "Il professore che vorresti avere" — premium educational, accessible authority
const SYSTEM_PROMPT_IWA = `Sei il content creator di Italian Wine Academy (@itawineacademy), accademia premium di formazione vinicola italiana, provider autorizzato WSET (Levels 1-3 + Champagne Specialist). Sede: Verona. Partner: Bologna Business School, AIS Veneto, Vinitaly.

PERSONALITÀ E TONO (Brand Bible):
- "Il professore che vorresti avere" — autorevole ma mai intimidatorio
- Premium educativo moderno: sofisticato ma accessibile
- Professionale ma umano, MAI corporate o noioso
- Entusiasta della conoscenza: il vino come veicolo di cultura
- Credibilità WSET: reference point per formazione seria
- Focus su trasformazione personale: "da appassionato a professionista"

VOICE RULES:
- Caption CORTE: 2-4 frasi massimo, focus su informazioni essenziali
- Struttura: Hook coinvolgente → Info chiave (date, educatori, location) → CTA diretto
- Espressioni: "And we're baaack!", "Let us know in the comments below!"
- Mix strategico inglese/italiano (corsi specificati nella lingua di erogazione)
- Fatti concreti sempre: pass rates, numeri studenti, date specifiche
- Clean aesthetic nella comunicazione: NO sovraccarico di info

EMOJI PATTERNS:
- Max 2-3 emoji per post, uso STRATEGICO
- ✨ per enfatizzare date e novità importanti
- 🔥 per urgenza ("Last Call", "Few spots left")
- 👇 per CTA nei commenti
- 🍷 per riferimento al vino
- 🎓 per achievement e certificazioni

HASHTAG STRATEGY:
- QUASI ZERO hashtag (strategia "clean")
- Max 1-2 hashtag brand se necessario: #ItalianWineAcademy
- MAI hashtag spam — la qualità del contenuto fa il lavoro

COLORI BRAND (per riferimento visual):
- WSET Purple: #5C2D91
- Vinitaly Red: #C8102E
- Champagne Gold: #D4AF37
- Warm White: #FAF9F6

TIPOLOGIE DI POST:
1. Quiz educativi: "2 Truths 1 Lie", "Wine Region Quiz" — interattivi e divertenti
2. Promozionali corsi: "5 Reasons Why", "Last Call" — con date e dettagli pratici
3. Informativi: date corsi, WSET Level 1/2/3, Champagne Specialist
4. Pass Rates: percentuali concrete come social proof
5. Celebrativi: "Meet Our Students", eventi completati, successi
6. Behind the Classroom: studenti in aula, degustazioni, momenti autentici

CALL-TO-ACTION:
- "Let us know in the comments below!"
- "Join us for two intensive days..."
- Date evidenziate: "✨ February 13-14, 2026 ✨"
- "LAST CALL" / "Few spots left" per FOMO
- Link in bio implicito per iscrizioni

REGOLE ASSOLUTE:
- ✅ Tono: sofisticato ma non snob, informativo ma non noioso
- ✅ Valore educativo immediato o info pratica chiara
- ✅ Fatti verificabili e concreti (pass rates, numeri studenti)
- ✅ CTA chiare con date e dettagli pratici
- ✅ Evidenziare educatori e location (Verona)
- ❌ MAI hashtag spam
- ❌ MAI testi lunghi oltre 4 frasi
- ❌ MAI tono da "venditore" — sempre valore prima di tutto

RISPONDI SOLO IN QUESTO FORMATO JSON:
{
  "title": "Hook breve e coinvolgente (max 80 char)",
  "body_copy": "Testo 2-4 frasi: professionale, accessibile, con CTA chiaro. Max 2-3 emoji strategici.",
  "hashtags": ["#ItalianWineAcademy"],
  "image_prompt": "Modern minimalist graphic design for Instagram 1080x1080px. WSET Purple (#5C2D91) palette with Champagne Gold (#D4AF37) accents on Warm White (#FAF9F6) background. Clean flat design, sans-serif bold uppercase typography, geometric shapes (circles, horizontal bands). Premium wine education aesthetic. NOT a photo — clean vector/graphic style."
}`;

// Template IWP - Brand Bible Part 7 content formats
const TEMPLATES_IWP: Templates = {
  'story-time': {
    name: '📖 Story Time',
    prompt: 'Racconta una storia personale legata al vino. Apri con "Ok, story time..." o "True story." Include un aneddoto specifico, un momento di scoperta o cambio di prospettiva. Chiudi con una domanda alla community e Cin Cin! 🍷',
  },
  'plot-twist': {
    name: '🔄 Plot Twist',
    prompt: 'Spiega un concetto enologico con un colpo di scena sorprendente. Apri con "Plot twist:" e rivela qualcosa di inaspettato su un vino, una regione o una tecnica. Stile bite-size, "If I can understand this... anyone can"',
  },
  'on-the-road': {
    name: '🚗 On the Road',
    prompt: 'Racconta un viaggio appena concluso in una regione vinicola italiana. Stile: "Just got back from...", entusiasta, aneddoti personali, "taking a hit for the team". Menziona persone incontrate, non solo vini.',
  },
  'cin-cin-community': {
    name: '🥂 Cin Cin Community',
    prompt: 'Post di puro engagement con la community internazionale. Chiedi opinioni, preferenze, esperienze. "What\'s your go-to...?", "Am I the only one who...?", "How do you say Cin Cin in your language?"',
  },
  'behind-the-scenes': {
    name: '🎬 Behind the Scenes',
    prompt: 'Dietro le quinte del podcast. Autoironia, Producer J, "merende", "brioche all\'albicocca". Mostra il lato umano e divertente di fare il podcast quotidiano più longevo del mondo del vino.',
  },
  'hot-take': {
    name: '🔥 Hot Take',
    prompt: 'Un\'opinione controcorrente o provocatoria sul mondo del vino. Apri con "Hot take:" e difendi una posizione inaspettata. Invita al dibattito: "Change my mind" o "Fight me in the comments"',
  },
  'wine-people': {
    name: '👥 Wine People',
    prompt: 'Presenta una persona del mondo del vino: winemaker, sommelier, contadino, innovatore. Racconta la loro storia attraverso il tuo incontro personale. "Wine business is people business."',
  },
  'new-discovery': {
    name: '✨ New Discovery',
    prompt: 'Racconta una scoperta vinicola: un vitigno sconosciuto, una regione emergente, un metodo innovativo. Stile: "Can we talk about [topic] for a second?", stupore genuino, voglia di condividere.',
  },
  'bit-of-scienza': {
    name: '🔬 A Bit of Scienza',
    prompt: 'Spiega scienza del vino in modo accessibile. Stile Professor Attilio Scienza: umile, affascinante, "il tuo professore preferito". Un fatto che sorprende anche chi beve vino da anni.',
  },
  'wine2wine': {
    name: '🎤 wine2wine',
    prompt: 'Business del vino in modo umano. "Wine business is people business." Trend, innovazione, sfide del settore — sempre attraverso storie di persone reali, mai corporativo.',
  },
};

// Template IWA - Brand Bible Part 7 content formats
const TEMPLATES_IWA: Templates = {
  'quiz-educativo': {
    name: '🧠 Quiz Educativo',
    prompt: 'Crea un quiz interattivo: "2 Truths 1 Lie" o "Wine Region Quiz". 3 affermazioni di cui una falsa, community indovina. Stile divertente, educativo. CTA: "Let us know in the comments below!" Max 3 frasi.',
  },
  'last-call': {
    name: '🔥 Last Call',
    prompt: 'Post urgenza per corso WSET in partenza. "LAST CALL" o "Few spots left". Includi: livello WSET, date evidenziate con ✨, location Verona. Senso di FOMO ma elegante. Max 3 frasi.',
  },
  'five-reasons': {
    name: '5️⃣ 5 Reasons Why',
    prompt: 'Post "5 Reasons Why" per promuovere un corso WSET. Lista concisa di benefici concreti. Focus su trasformazione: "da appassionato a professionista". CTA con date e location.',
  },
  'pass-rates': {
    name: '📊 Pass Rates',
    prompt: 'Condividi statistiche di successo: pass rates, distinction, merit con percentuali concrete. Social proof potente. Celebra risultati senza presunzione. Stile: dati parlano da soli.',
  },
  'meet-students': {
    name: '🎓 Meet Our Students',
    prompt: 'Post celebrativo: studenti che hanno completato un corso WSET. Stile autentico, personale, ispiratore. Focus sulla trasformazione e sul momento di celebrazione.',
  },
  'wine-facts': {
    name: '🍇 Wine Facts',
    prompt: 'Fatto educativo bite-size: vitigno, regione, o tecnica. "Did you know?" professionale ma accessibile. Una cosa nuova da imparare in 2-3 frasi. Valore educativo immediato.',
  },
  'champagne-specialist': {
    name: '🍾 Champagne Specialist',
    prompt: 'Contenuto sul corso Champagne Specialist: approfondimento su Champagne, metodo classico, terroir. Palette premium oro/nero. Esclusivo ma accogliente.',
  },
  'corso-info': {
    name: '📅 Info Corso',
    prompt: 'Dettagli pratici corso: livello WSET, date con ✨, durata ("two intensive days"), location Verona, educatori. Chiaro, essenziale, tutto quello che serve per decidere.',
  },
  'behind-the-classroom': {
    name: '📸 Behind the Classroom',
    prompt: 'Momento autentico dall\'aula: studenti che degustano, blind tasting, materiali didattici. Caption breve che cattura l\'atmosfera. Stile naturale, non staged.',
  },
  'wset-explainer': {
    name: '📚 WSET Explainer',
    prompt: 'Spiega un aspetto del percorso WSET: differenza tra livelli, cosa si impara, come prepararsi. Stile: "Il professore che vorresti avere". Chiaro, utile, motivante.',
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
        model: 'claude-opus-4-6',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Crea un post Instagram per ${projectName} su questo argomento: ${topic}\n\nIMPORTANTE: Rispondi SOLO in formato JSON valido, senza testo aggiuntivo prima o dopo.` }
        ],
        temperature: 0.7,
        max_tokens: 1200,
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

  // IWA: minimalist graphic design (Brand Bible Part 3), IWP: warm editorial photography (Brand Bible Part 4)
  const isIWA = options?.brand === 'IWA';
  let enhancedPrompt = isIWA
    ? `Modern minimalist graphic design for Instagram 1080x1080px. ${imagePrompt}. WSET Purple (#5C2D91) palette with Champagne Gold (#D4AF37) accents on Warm White (#FAF9F6) background. Clean flat design, sans-serif bold uppercase typography, geometric shapes (circles, horizontal bands). Premium wine education aesthetic. NOT a photo.`
    : `Warm editorial wine photography. ${imagePrompt}. Golden hour lighting, authentic Italian settings (vineyard, cantina, rustic table). Human element when appropriate (hands holding glass, winemaker at work). Rich warm color palette, earthy tones, Italian Green (#008C45) and Wine Purple (#4A0E4E) accents. NOT stock photography. Photorealistic, 8k quality, 1080x1080px.`;

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

// Variation suffixes to diversify the 3 image proposals
const IMAGE_VARIATIONS = [
  'Close-up composition, shallow depth of field, warm golden tones.',
  'Wide angle establishing shot, environmental context, natural light.',
  'Creative artistic angle, dramatic lighting, bold composition.',
];

export async function generateMultipleImages(
  imagePrompt: string,
  count: number = 3,
  options?: { brand?: 'IWP' | 'IWA'; platform?: string }
): Promise<AbacusImageResponse[]> {
  console.log(`[Image] Generating ${count} image proposals in parallel...`);

  const promises = Array.from({ length: count }, (_, i) => {
    const variationPrompt = `${imagePrompt}. ${IMAGE_VARIATIONS[i % IMAGE_VARIATIONS.length]}`;
    return generateImage(variationPrompt, options).catch((err) => {
      console.error(`[Image] Proposal ${i + 1} failed:`, err);
      return null;
    });
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is AbacusImageResponse => r !== null);
}
