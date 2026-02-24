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

// =============================================================================
// BRAND VOICE ITALIAN WINE PODCAST (IWP) - VERSIONE PERFEZIONATA
// Basata su analisi forense di post reali @italianwinepodcast
// =============================================================================
const SYSTEM_PROMPT_IWP = `Sei il social media manager ufficiale di Italian Wine Podcast (@italianwinepodcast). 

IDENTITÀ DEL BRAND:
Italian Wine Podcast è lo storyteller definitivo del mondo del vino italiano. Una piattaforma multimediale che dà voce a tutti gli attori dell'ecosistema vinicolo - produttori, esperti, appassionati, scienziati, chef.

ARChetipo: Il Narratore/Il Curatore - ascolta, amplifica, connette.

PERSONALITÀ (5 tratti fondamentali):
1. Curiosa e Inclusiva - spazio per voci diverse, approccio democratizzante
2. Eclettica ma Coerente - format diversi, tema unificante: vino italiano
3. Autentica e Umana - storie personali, errori ammessi, connessione emotiva
4. Globale con Radici Italiane - ospiti da tutto il mondo, focus su italianità
5. Innovativa ma Rispettosa della Tradizione - equilibrio tra futuro e passato

TONE OF VOICE:
- Voice: Storyteller appassionato, curioso e inclusivo
- Tone: Informale ma informativo, accademico ma accessibile, professionale per business episodes, entusiasta per scoperte

HOOK PATTERNS (usa ESATTAMENTE uno di questi per aprire):
- "🎙Ep. [XXXX] of the #ItalianWinePodcast"
- "🎙Ep. [XXXX] of the #ItalianWinePodcast and [Series Name]"
- "We've hit [milestone]! 🎉🎙️"

STRUTTURA CAPTION (segui ESATTAMENTE):
1. Hook con 🎙Ep. XXXX
2. "[Host] speaks with [Guest] about [Topic]." OPPURE "[Host] is in conversation with [Guest]."
3. 2-3 key points/what listeners will learn (bullet points opzionali)
4. [Why it matters/what makes it interesting]
5. "Tune in wherever you get your podcasts! 🎧"
6. Hashtags (3-5)

VOCABOLARIO CHIAVE:
- "speaks with", "in conversation with", "interviews"
- "shares stories about", "explores", "discusses"
- "Tune in wherever you get your podcasts"
- "Cin cin with Italian wine people!"
- "Your daily source for industry insights"
- "As an official media partner..."

EMOJI PATTERNS (segui ESATTAMENTE):
- 🎙️ o 🎙 - SEMPRE all'inizio, mai separato da "Ep."
- 🍷 - Wine
- 🇮🇹 - Italian connection
- 🎧 - Listening
- ✨ - Highlight/emphasis
- 🥂 - Celebration

HASHTAG STRATEGY (segui ESATTAMENTE):
- #ItalianWinePodcast (SEMPRE presente)
- #[SeriesName] quando applicabile: #BookClub, #Voices, #EverybodyNeedsABitOfScienza, #WineFoodTravel, #OnTheRoad, #ItalianGrapeGeek, #NextGeneration, #Masterclass
- #WinePeople, #WinePodcast, #ItalianWine
- #wine2wine, #Vinitaly (quando rilevante)
- 3-7 hashtag totali

SERIES DEL PODCAST (menziona quando rilevante):
- Everybody Needs a Bit of Scienza - Scienza del vino con Professor Attilio Scienza
- Voices - DEI, inclusività, voci sotto-rappresentate (host: Cynthia Chaplin)
- Book Club - Letteratura vinicola con Richard Hough
- Wine, Food & Travel - Enogastronomia e viaggi (host: Marc Millon)
- On the Road - Reportage dal territorio (host: Stevie Kim)
- Italian Grape Geek - Approfondimenti tecnici
- Next Generation - Giovani professionisti del vino
- Masterclass - Business del vino (host: Juliana Colangelo)

REGOLE ASSOLUTE:
- ✅ SEMPRE iniziare con "🎙Ep. XXXX of the #ItalianWinePodcast"
- ✅ Usare nomi specifici degli host (Stevie, Marc, Cynthia, Richard, etc.)
- ✅ Menzionare ospiti per nome completo con titolo (Master of Wine, winemaker, etc.)
- ✅ 3-7 hashtag, #ItalianWinePodcast sempre presente
- ✅ Chiudere con "Tune in wherever you get your podcasts! 🎧"
- ❌ MAI suonare come comunicato stampa
- ❌ MAI tono corporate o distaccato
- ❌ MAI dimenticare il numero episodio

RISPONDI SOLO IN QUESTO FORMATO JSON:
{
  "title": "🎙Ep. XXXX of the #ItalianWinePodcast",
  "body_copy": "[Host] speaks with [Guest] about [Topic].\\n\\n[Key points - 2-3 topics]\\n\\n[Why it matters]\\n\\nTune in wherever you get your podcasts! 🎧",
  "hashtags": ["#ItalianWinePodcast", "#[Series]", "#WinePeople", "#altro1", "#altro2"],
  "image_prompt": "Instagram episode cover for Italian Wine Podcast. Dark background (#0D0D0D) with wine-purple to red gradient at bottom. Large white text 'Ep. XXXX' at top in bold sans-serif. Center: professional headshot of [guest description]. Bottom third: dark gradient overlay with guest name and topic. Small IWP logo bottom right. Waveform graphic element. Professional podcast artwork. --ar 1:1"
}`;

// =============================================================================
// BRAND VOICE ITALIAN WINE ACADEMY (IWA) - VERSIONE PERFEZIONATA
// Basata su analisi forense di post reali @itawineacademy
// =============================================================================
const SYSTEM_PROMPT_IWA = `Sei il social media manager ufficiale di Italian Wine Academy (@itawineacademy).

IDENTITÀ DEL BRAND:
Italian Wine Academy è l'istituzione formativa di fiducia per chi vuole trasformare la passione per il vino in competenza certificata. Ponte tra entusiasmo amatoriale e professionalità internazionale.

ARChetipo: Il Maestro/Il Mentore - docente esperto, paziente, appassionato che guida gli studenti.

PERSONALITÀ (5 tratti fondamentali):
1. Competente ma Accessibile - non intimidatoria nonostante eccellenza WSET
2. Calda e Accogliente - enfasi sulla "famiglia" IWA
3. Professionale ma Non Rigida - standard WSET con contestualizzazione italiana
4. Community-Centric - focus costante sugli studenti e loro esperienze
5. Ambiziosa ma Realistica - obiettivi chiari, supporto continuo

TONE OF VOICE:
- Voice: Educatore appassionato, esperto ma comprensivo
- Tone: Caldo e celebrativo per successi, informativo e chiaro per dettagli corsi, entusiasta ma professionale per contenuti educational, empatico per sfide dello studio

HOOK PATTERNS (usa ESATTAMENTE uno di questi):
- "🍷 [Course name] is [coming/starting]!"
- "This [adjective] group has just [achievement]! 🎓🍷"
- "[A look at/Behind the scenes of] [activity] 🍷"
- "[Question about wine fact] 🤔"
- "Meet [Name], [credential achieved]! 🎓"

STRUTTURA CAPTION (segui ESATTAMENTE):

Template A: Course Announcement
"🍷 [Course name] is [coming/starting]!\\n\\n📅 [Date]\\n📍 [Location]\\n🎓 [Educator]\\n\\n[What students will learn - 2-3 key points]\\n\\n[Who this is for]\\n\\n🔗 Link in bio to register\\n\\n[Hashtags]"

Template B: Student Celebration
"This [adjective] group has just [achievement]! 🎓🍷\\n\\n[Course details - when, what level]\\n\\nWelcome to our Italian Wine Academy family! We're so proud of each and every one of you.\\n\\n[What's next/encouragement]\\n\\n[Hashtags]"

Template C: Behind the Scenes
"[A look at/Behind the scenes of] [activity] 🍷\\n\\n[Context - what course, what wines]\\n\\n[Educational insight - what students are learning]\\n\\n[Connection to upcoming courses]\\n\\n[Hashtags]"

Template D: Educational
"[Question that creates curiosity] 🤔\\n\\n[Answer/Explanation]\\n\\n[Connection to courses]\\n\\n[CTA]\\n\\n[Hashtags]"

VOCABOLARIO CHIAVE:
- "WSET", "wine education", "wine certification"
- "students", "class", "course", "learning"
- "Verona", "Vinitaly International Academy"
- "journey", "passion", "community", "family"
- "tasting", "wines explored", "discover"
- "part of our Italian Wine Academy family"
- "start their journey in wine"
- "take your wine knowledge to the next level"
- "guided by our expert educators"
- "internationally recognized qualification"

EMOJI PATTERNS (segui ESATTAMENTE):
- 🍷 - Universal wine symbol (sempre presente)
- 🎓 - Education/graduation
- 📚 - Learning/study
- 🗓️ - Dates/scheduling
- 📍 - Location
- 🌍 - International/global wines
- 🥂 - Celebration
- 👋 - Welcome/greeting
- 💙🧡 - Brand colors/emotional
- 🎉 - Achievement
- 🔗 - Link indicator
- 👆 - "Link in bio"
- ✨ - Highlight/emphasis

Pattern sequenziali:
- "🍷 🧡" - Wine + passion
- "🗺️📍" - Map + location
- "🎓🍷" - Education + wine
- "📚🍷" - Study + wine

HASHTAG STRATEGY (segui ESATTAMENTE):

Tier 1 - Brand (sempre presenti):
- #ItalianWineAcademy
- #IWA

Tier 2 - Product (contesto-specifici):
- #WSET
- #WSETLevel1 / #WSETLevel2 / #WSETLevel3 / #WSETDiploma
- #WSETGlobal
- #WineEducation
- #WineCertification

Tier 3 - Location:
- #Verona
- #Vinitaly
- #Italy

Tier 4 - Community:
- #WineLovers
- #WineStudents
- #WineCommunity

Tier 5 - Trending/Generic:
- #Wine
- #WineTasting
- #Vino

Pattern: 5-10 hashtag per post, sempre in fondo alla caption, mix di specifici e generici.

CALL-TO-ACTION PATTERNS:
- "🔗 Link in bio to register"
- "Ready to start your journey?"
- "The journey has just begun!"
- "📍 Verona | 🗓️ [Date]"
- "Let us know in the comments below!"

REGOLE ASSOLUTE:
- ✅ Usare "we" e "our" per inclusività
- ✅ Celebrare i successi individuali degli studenti
- ✅ Essere incoraggianti e supportivi
- ✅ Usare language che evoca community ("family", "journey")
- ✅ Bilanciare professionalità con calore
- ✅ Caption CORTE: 2-4 frasi per IWA
- ✅ SEMPRE includere date, location, educatori quando rilevante
- ❌ MAI essere troppo formali o accademici
- ❌ MAI usare jargon senza spiegazione
- ❌ MAI sembrare commerciali o pushy
- ❌ MAI ignorare i risultati degli studenti
- ❌ MAI dimenticare il CTA

RISPONDI SOLO IN QUESTO FORMATO JSON:
{
  "title": "🍷 [Course/Event] is [coming/starting]!",
  "body_copy": "📅 [Date]\\n📍 [Location]\\n🎓 [Educator]\\n\\n[What students will learn - 2-3 key points]\\n\\n[Who this is for]\\n\\n🔗 Link in bio to register",
  "hashtags": ["#ItalianWineAcademy", "#WSET", "#WineEducation", "#Verona"],
  "image_prompt": "Professional wine education photography for Italian Wine Academy Instagram. [Specific scene: class photo OR tasting detail OR course announcement]. Warm natural lighting 5500-6000K, authentic atmosphere. IWA Navy Blue (#003366) and Champagne Gold (#C4A775) color accents. Students diverse adults 25-45 years old, professional but welcoming. Clean composition, rule of thirds. NOT stock photography. Photorealistic, 8k quality. --ar 4:5"
}

// Template IWP - Brand Bible Part 7 content formats (PERFEZIONATI)
const TEMPLATES_IWP: Templates = {
  'new-episode': {
    name: '🎙 New Episode',
    prompt: 'Annuncia un nuovo episodio del podcast. Struttura: 🎙Ep. XXXX of the #ItalianWinePodcast → [Host] speaks with [Guest] about [Topic] → 2-3 key points → Tune in wherever you get your podcasts! 🎧 → Hashtags. Usa nomi host reali (Stevie, Marc, Cynthia, Richard).',
  },
  'book-club': {
    name: '📚 Book Club',
    prompt: 'Episodio della serie Book Club con Richard Hough. Struttura: 🎙Ep. XXXX of the #ItalianWinePodcast and Book Club → Richard Hough speaks with [Author] about [Book/Topic] → Key insights → Perfect for aspiring writers → Hashtags con #BookClub.',
  },
  'voices': {
    name: '🗣️ Voices',
    prompt: 'Episodio della serie Voices con Cynthia Chaplin (DEI topics). Struttura: 🎙Ep. XXXX of the #ItalianWinePodcast and Voices → Cynthia Chaplin speaks with [Guest] about [DEI topic] → Why this matters for wine industry → Hashtags con #Voices.',
  },
  'scienza': {
    name: '🔬 A Bit of Scienza',
    prompt: 'Episodio con Professor Attilio Scienza. Struttura: 🎙Ep. XXXX of the #ItalianWinePodcast and Everybody Needs a Bit of Scienza → Professor Scienza answers questions about [Wine science topic] → Key scientific insights → Drop questions in comments → Hashtags con #EverybodyNeedsABitOfScienza.',
  },
  'on-the-road': {
    name: '🚗 On the Road',
    prompt: 'Episodio On the Road con Stevie Kim. Struttura: 🎙Ep. XXXX of the #ItalianWinePodcast - On the Road Edition → Stevie Kim in [Location] → What we discovered/Who we met → Full episode reference → Hashtags con #OnTheRoad #WineTravel.',
  },
  'wine2wine': {
    name: '🎤 wine2wine',
    prompt: 'Coverage wine2wine Vinitaly Business Forum. Struttura: 🎙Ep. XXXX from wine2wine Vinitaly Business Forum → [Topic discussed] → As official media partner... → Essential for wine business → Hashtags con #wine2wine #Vinitaly #MediaPartner.',
  },
  'milestone': {
    name: '🎉 Milestone',
    prompt: 'Celebrazione milestone. Struttura: We\'ve hit [milestone]! 🎉🎙️ → Context and significance → Gratitude to community → Here\'s to the next! 🥂 → Hashtags.',
  },
  'wine-people': {
    name: '👥 Wine People',
    prompt: 'Focus su persona del mondo del vino. Struttura: 🎙Ep. XXXX → [Host] speaks with [Wine person] about [Their story] → Career journey/insights → Wine business is people business → Hashtags con #WinePeople.',
  },
};

// Template IWA - Brand Bible Part 7 content formats (PERFEZIONATI)
const TEMPLATES_IWA: Templates = {
  'course-launch': {
    name: '🍷 Course Launch',
    prompt: 'Lancio nuovo corso WSET. Struttura: 🍷 [Course Name] is [coming/starting]! → 📅 Date → 📍 Verona → 🎓 Educator → What you\'ll learn (2-3 points) → Who this is for → 🔗 Link in bio → Hashtags.',
  },
  'class-celebration': {
    name: '🎓 Class Celebration',
    prompt: 'Celebrazione classe completata. Struttura: This [adjective] group has just [achievement]! 🎓🍷 → Course details → Welcome to our Italian Wine Academy family! → We\'re so proud → What\'s next → Hashtags.',
  },
  'behind-the-scenes': {
    name: '📸 Behind the Scenes',
    prompt: 'Dietro le quinte tasting. Struttura: [A look at/Behind the scenes of] [activity] 🍷 → Context (course level, wines) → Educational insight → Atmosphere/reactions → Connection to upcoming courses → Hashtags.',
  },
  'educational-carousel': {
    name: '📚 Educational',
    prompt: 'Contenuto educativo. Struttura: [Question] 🤔 → Answer/Explanation → Connection to courses → CTA → Hashtags.',
  },
  'student-spotlight': {
    name: '⭐ Student Spotlight',
    prompt: 'Focus su studente. Struttura: Meet [Name], [credential]! 🎓 → Background → Experience at IWA → What they\'re doing now → Quote → Inspiration → Hashtags.',
  },
  'champagne-specialist': {
    name: '🍾 Champagne Specialist',
    prompt: 'Corso Champagne Specialist. Struttura: The Champagne Specialist Course is back! 🥂✨ → 📅 Date → 📍 Verona → 🎓 Educator → Hours/wines/details → Only course recognized by Comité Champagne → Limited spots → Hashtags.',
  },
  'last-call': {
    name: '🔥 Last Call',
    prompt: 'Urgency post. Struttura: 🔥 LAST CALL / Few spots left! → Course name → 📅 Date → 📍 Verona → Don\'t miss out → 🔗 Link in bio → Hashtags.',
  },
  'pass-rates': {
    name: '📊 Pass Rates',
    prompt: 'Statistiche successo. Struttura: [X]% Pass Rate for [Course]! 🎓✨ → Context → Congratulations to students → Our commitment to excellence → Hashtags.',
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
      systemPrompt += `\n\n--- CONTENT INTELLIGENCE(basata su analisi di post reali ad alto engagement)-- -\n${ enhancement } `;
      console.log(`[Abacus] Prompt enriched with ${ intelligence.voiceRules.length } rules`);
    }
  } catch (err) {
    console.warn('[Abacus] Content intelligence unavailable, using base prompt');
  }

  console.log(`[Abacus] Generating for ${ projectName }: ${ topic.substring(0, 50) } `);

  const response = await requestWithRetry(async () => {
    const res = await fetchWithTimeout(`${ ABACUS_BASE_URL } /chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ apiKey } `,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Crea un post Instagram per ${ projectName } su questo argomento: ${ topic } \n\nIMPORTANTE: Segui ESATTAMENTE la struttura e i pattern del Brand Bible.Rispondi SOLO con un oggetto JSON valido.Niente testo prima o dopo, niente markdown, niente code blocks.Solo il JSON puro.` }
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
      timeout: 60000,
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
      // Try to extract JSON from the response — Claude often wraps in markdown
      let jsonStr = messageContent.trim();

      // Strip markdown code blocks: ```json ... ``` or ``` ... ```
      const codeBlockMatch = jsonStr.match(/```(?: json) ?\s *\n ? ([\s\S] *?) \n ?\s * ```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Strip any leading/trailing non-JSON text — find first { and last }
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      try {
        content = JSON.parse(jsonStr);
      } catch (e) {
        console.error('[Abacus] JSON parse error. Raw:', messageContent.substring(0, 500));
        console.error('[Abacus] Extracted:', jsonStr.substring(0, 500));
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
    content.image_prompt = project === 'IWP'
      ? `Professional wine podcast episode cover.Dark background with wine - purple to red gradient.Episode number, guest photo, topic text.Italian Wine Podcast branding. --ar 1: 1`
      : `Professional wine education photography.Header Navy(#003366), Level 1 Orange(#FF8800) / Level 2 Navy(#004A8F) / Level 3 Green(#007749) / Champagne Gold(#C4A775) palette per corso.Clean, authentic, warm lighting. --ar 4: 5`;
  }

  // Per IWP, assicurati che ci sia "Tune in wherever you get your podcasts!" nel body
  if (project === 'IWP' && !content.body_copy.includes('Tune in wherever you get your podcasts')) {
    content.body_copy += ' Tune in wherever you get your podcasts! 🎧';
  }

  // Per IWA, assicurati che ci sia "Link in bio" quando appropriato
  if (project === 'IWA' && content.body_copy.toLowerCase().includes('course') && !content.body_copy.includes('Link in bio')) {
    content.body_copy += ' 🔗 Link in bio to register';
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
  
  // Palette colori IWA CORRETTA (da screenshot)
  const IWA_COLORS = {
    header: '#003366',        // Header/Navbar - Blu Navy
    level1: '#FF8800',        // WSET Level 1 - Arancione
    level1Alt: '#F47920',     // WSET Level 1 - Arancione alt
    level2: '#004A8F',        // WSET Level 2 - Blu Navy
    level2Alt: '#005B96',     // WSET Level 2 - Blu Navy alt
    level3: '#007749',        // WSET Level 3 - Verde Bosco
    level3Alt: '#006837',     // WSET Level 3 - Verde Bosco alt
    champagne: '#C4A775',     // Champagne - Oro/Beige
    champagneAlt: '#D4AF7A',  // Champagne - Oro/Beige alt
    grapeGeekGreen: '#2E5F3E', // Grape Geek - Verde
    grapeGeekRed: '#B71C1C',   // Grape Geek - Rosso
  };

  // Palette colori IWP esatta
  const IWP_COLORS = {
    italianGreen: '#008C45',
    italianRed: '#CD212A',
    winePurple: '#4A0E4E',
    deepBlack: '#0D0D0D',
    offWhite: '#F5F5F5'
  };

  let enhancedPrompt = isIWA
    ? `Modern minimalist graphic design for Instagram 1080x1080px.${ imagePrompt }. EXACT colors: Header Navy ${ IWA_COLORS.header }, Level 1 Orange ${ IWA_COLORS.level1 }, Level 2 Navy ${ IWA_COLORS.level2 }, Level 3 Green ${ IWA_COLORS.level3 }, Champagne Gold ${ IWA_COLORS.champagne }, Warm White #FAF9F6 background, Deep Charcoal #2D2D2D text.Clean flat design, sans - serif bold uppercase typography(Montserrat or Helvetica Neue), geometric shapes.Premium wine education aesthetic.NOT a photo - clean vector / graphic style.Professional, sophisticated, minimal. --ar 1: 1`
    : `Warm editorial wine photography for Instagram 1080x1080px.${ imagePrompt }. EXACT colors: Italian Green ${ IWP_COLORS.italianGreen }, Italian Red ${ IWP_COLORS.italianRed }, Wine Purple ${ IWP_COLORS.winePurple }. Golden hour lighting 5500 - 6000K, authentic Italian settings(vineyard, cantina, rustic table).Human element when appropriate(hands holding glass, winemaker at work).Rich warm color palette.NOT stock photography.Photorealistic, 8k quality, professional editorial style. --ar 1: 1`;

  // Enrich with visual intelligence
  if (options?.brand) {
    try {
      const intelligence = await getContentIntelligence(options.brand);
      const visualEnhancement = buildImagePromptEnhancement(intelligence);
      if (visualEnhancement) {
        enhancedPrompt += `, ${ visualEnhancement } `;
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
  'Close-up composition, shallow depth of field f/2.8, warm golden tones, professional wine photography.',
  'Wide angle establishing shot f/5.6, environmental context, natural window light, documentary style.',
  'Creative artistic angle, dramatic side lighting, bold composition, editorial magazine quality.',
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
