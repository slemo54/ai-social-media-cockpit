import { AbacusTextResponse, AbacusImageResponse, Templates } from '@/types';
import { apiClient } from './api-client';

const ABACUS_API_KEY = process.env.ABACUS_API_KEY;
const ABACUS_BASE_URL = 'https://routellm.abacus.ai/v1';

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

// Brand Voice Italian Wine Academy - Stile educativo professionale
const SYSTEM_PROMPT_IWA = `Sei un Senior Educator di Italian Wine Academy, provider autorizzato WSET.

STILE DI COMUNICAZIONE:
- Professionale ma mai noioso: "il professore che vorresti avere"
- Fatti precisi ma spiegati semplicemente
- Contenuto educativo concreto e applicabile
- Tono: esperto, accogliente, ispiratore
- Focus su formazione WSET, carriere, competenze professionali
- Partnership: Bologna Business School, AIS Veneto, Vinitaly
- Lingua inglese appropriata per contesto internazionale

REGOLE:
- ✅ Hook chiaro e informativo
- ✅ Valore educativo immediato
- ✅ Fatti verificabili e concreti
- ✅ Chiusura con invito all'apprendimento o azione
- ✅ Tono autorevole ma accessibile
- Puoi usare "Cin Cin!" se appropriato al contesto conviviale

RISPONDI SOLO IN QUESTO FORMATO JSON:
{
  "title": "Titolo chiaro e professionale (max 100 char)",
  "body_copy": "Testo educativo, fatti concreti, actionable insights, chiusura con call to action",
  "hashtags": ["#ItalianWineAcademy", "#WSET", "#WineEducation", "#altro1", "#altro2"],
  "image_prompt": "Descrizione visiva professionale in inglese, stile wine education"
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

// Template IWA - Stile educativo professionale
const TEMPLATES_IWA: Templates = {
  'wine-basics': {
    name: '📚 Wine Basics',
    prompt: 'Fondamentali del vino italiano. Stile: WSET Level 1-2, chiaro, professionale, base solida',
  },
  'grape-deep-dive': {
    name: '🍇 Grape Deep Dive',
    prompt: 'Analisi approfondita vitigno italiano: storia, genetica, territorio, caratteristiche sensoriali',
  },
  'region-focus': {
    name: '🗺️ Region Focus',
    prompt: 'Focus territoriale: clima, terroir, vitigni principali, denominazioni. Approccio WSET sistematico',
  },
  'wine-and-food': {
    name: '🍽️ Wine & Food',
    prompt: 'Abbinamento enogastronomico: tecniche, principi, esempi pratici della tradizione italiana',
  },
  'study-tips': {
    name: '💡 Study Tips',
    prompt: 'Consigli per studiare vino: preparazione esami WSET, tecniche memorizzazione, risorse utili',
  },
  'wine-career': {
    name: '💼 Wine Career',
    prompt: 'Percorsi professionali nel vino: export, sommellerie, educazione, marketing. Career advancement',
  },
  'sustainability': {
    name: '🌱 Sustainability',
    prompt: 'Sostenibilità in viticoltura: pratiche, certificazioni, futuro del vino italiano green',
  },
  'masterclass': {
    name: '🎓 Masterclass',
    prompt: 'Contenuto avanzato livello WSET 3-4. Stile: approfondito, autorevole, per professionisti',
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
  project: 'IWP' | 'IWA' = 'IWP'
): Promise<AbacusTextResponse | null> {
  if (!ABACUS_API_KEY) {
    throw new Error('ABACUS_API_KEY not configured');
  }

  const systemPrompt = project === 'IWP' ? SYSTEM_PROMPT_IWP : SYSTEM_PROMPT_IWA;
  const projectName = project === 'IWP' ? 'Italian Wine Podcast' : 'Italian Wine Academy';

  console.log(`[Abacus] Generating for ${projectName}: ${topic.substring(0, 50)}`);

  const response = await apiClient.requestWithRetry(async () => {
    const res = await apiClient.fetchWithTimeout(`${ABACUS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUS_API_KEY}`,
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
    return apiClient.checkResponse(res);
  }, {
    retries: 3,
    timeout: 30000,
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

export async function generateImage(imagePrompt: string): Promise<AbacusImageResponse | null> {
  if (!ABACUS_API_KEY) {
    throw new Error('ABACUS_API_KEY not configured');
  }

  const enhancedPrompt = `Professional wine photography, Italian wine culture, ${imagePrompt}, elegant composition, warm lighting, authentic atmosphere, photorealistic, 8k quality`;

  console.log('[Abacus] Generating image...');

  const response = await apiClient.requestWithRetry(async () => {
    const res = await apiClient.fetchWithTimeout(`${ABACUS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        messages: [{ role: 'user', content: enhancedPrompt }],
        modalities: ['image'],
        image_config: { num_images: 1, aspect_ratio: '1:1' },
      }),
      timeout: 90000, // 90 secondi per generazione immagine
    });
    return apiClient.checkResponse(res);
  }, {
    retries: 2,
    timeout: 90000,
    retryDelay: 2000,
    backoffMultiplier: 2,
  });

  const data = await response.json();
  
  let imageUrl: string | undefined;
  let imageBase64: string | undefined;

  if (data.choices?.[0]?.message) {
    const message = data.choices[0].message;
    
    if (message.images?.[0]) {
      if (message.images[0].image_url) {
        imageUrl = message.images[0].image_url.url;
      } else if (message.images[0].b64_json) {
        imageBase64 = message.images[0].b64_json;
      }
    }
    
    if (!imageUrl && !imageBase64 && message.content?.startsWith('data:image')) {
      imageBase64 = message.content.split(',')[1];
    }
  }

  if (!imageUrl && !imageBase64) {
    throw new Error('No image data received from API');
  }

  return { image_url: imageUrl || '', image_base64: imageBase64 };
}
