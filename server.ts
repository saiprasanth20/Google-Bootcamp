import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractJsonPayload<T>(rawText: string, fallback: T): T {
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const startObj = candidate.indexOf('{');
    const startArr = candidate.indexOf('[');
    const start =
      startObj === -1
        ? startArr
        : startArr === -1
          ? startObj
          : Math.min(startObj, startArr);
    if (start !== -1) {
      const endObj = candidate.lastIndexOf('}');
      const endArr = candidate.lastIndexOf(']');
      const end = Math.max(endObj, endArr);
      if (end > start) {
        try {
          return JSON.parse(candidate.slice(start, end + 1)) as T;
        } catch {
          return fallback;
        }
      }
    }
    return fallback;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/config', (_req, res) => {
    const googleMapsApiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      '';
    res.json({ googleMapsApiKey });
  });

  app.post('/api/events/discover', async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    if (!query) {
      res.status(400).json({ error: 'Please enter an event name, topic, or city to search.' });
      return;
    }

    try {
      const ai = getGenAIClient();
      const prompt = `Search the web for real, verified tech events, hackathons, conferences, or developer meetups matching: "${query}".
Return up to 4 real events as a valid JSON object with this exact structure (no extra commentary outside JSON):
{
  "events": [
    {
      "title": "Official Event Title",
      "category": "Hackathon" | "Conference" | "Meetup" | "Workshop",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "venueName": "Official Venue or District Name",
      "city": "City Name",
      "country": "Country Name",
      "lat": 12.9716,
      "lng": 77.5946,
      "description": "Concise 2-3 sentence summary of what the event covers, who attends, and key tracks.",
      "sourceUrl": "https://official-event-url.example",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }
  ]
}
Ensure lat and lng are accurate decimal coordinates for the city/venue, and dates use YYYY-MM-DD format.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text ?? '{}';
      const parsed = extractJsonPayload<{ events?: unknown[] }>(text, { events: [] });
      const rawEvents = Array.isArray(parsed.events) ? parsed.events : [];

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = groundingChunks
        .map((chunk: { web?: { uri?: string; title?: string } }) => chunk.web)
        .filter((w): w is { uri: string; title: string } => Boolean(w?.uri))
        .map((w) => ({
          uri: w.uri,
          title: w.title || w.uri,
        }));

      const normalizedEvents = rawEvents.map((item: unknown, idx: number) => {
        const e = (item ?? {}) as Record<string, unknown>;
        const cat = String(e.category ?? 'Conference');
        const validCategory = ['Hackathon', 'Conference', 'Meetup', 'Workshop'].includes(cat)
          ? cat
          : 'Conference';
        const lat = Number(e.lat);
        const lng = Number(e.lng);
        return {
          tempId: `discovered-${Date.now()}-${idx}`,
          title: String(e.title || `${query} Event`),
          category: validCategory,
          startDate: String(e.startDate || '2026-12-05'),
          endDate: String(e.endDate || e.startDate || '2026-12-06'),
          venueName: String(e.venueName || 'Main Convention Center'),
          city: String(e.city || 'San Francisco'),
          country: String(e.country || 'USA'),
          lat: Number.isFinite(lat) ? lat : 37.7749,
          lng: Number.isFinite(lng) ? lng : -122.4194,
          description: String(
            e.description || 'Community and engineering event discovered via live search.'
          ),
          sourceUrl: String(e.sourceUrl || sources[0]?.uri || 'https://eventsphere.community'),
          tags: Array.isArray(e.tags)
            ? e.tags.map((t) => String(t)).slice(0, 5)
            : ['Tech', 'Community'],
        };
      });

      res.json({
        events: normalizedEvents,
        sources,
        rawSummary: normalizedEvents.length === 0 ? text : undefined,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to search for events with Gemini.';
      console.error('Event discovery error:', err);
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/events/synthesize', async (req, res) => {
    const event = req.body?.event;
    const recaps = Array.isArray(req.body?.recaps) ? req.body.recaps : [];

    if (!event?.title) {
      res.status(400).json({ error: 'Event details are required for synthesis.' });
      return;
    }

    try {
      const ai = getGenAIClient();
      const recapText =
        recaps.length > 0
          ? recaps
              .map(
                (r: {
                  authorName?: string;
                  authorRole?: string;
                  processReview?: string;
                  keyLearnings?: string[];
                }) =>
                  `Attendee ${r.authorName} (${r.authorRole}):\nProcess & Vibe: ${r.processReview}\nKey Learnings: ${(r.keyLearnings || []).join('; ')}`
              )
              .join('\n\n')
          : 'No attendee recaps submitted yet. Rely on verified public event coverage and web search context.';

      const prompt = `Synthesize what people learned and how "${event.title}" (${event.city}, ${event.country}, ${event.startDate}) went.
Combine these community attendee recap posts with live Google Search context about the event or topic:

${recapText}

Return a clean JSON object with this exact schema:
{
  "headline": "Short editorial takeaway headline",
  "summary": "2-3 sentence synthesis of how the event went, the engineering atmosphere, and overarching themes.",
  "highlights": ["Concrete insight 1", "Concrete insight 2", "Concrete insight 3"],
  "topTakeaways": ["Actionable builder takeaway 1", "Actionable builder takeaway 2", "Actionable builder takeaway 3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text ?? '{}';
      const parsed = extractJsonPayload<{
        headline?: string;
        summary?: string;
        highlights?: string[];
        topTakeaways?: string[];
      }>(text, {});

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = groundingChunks
        .map((chunk: { web?: { uri?: string; title?: string } }) => chunk.web)
        .filter((w): w is { uri: string; title: string } => Boolean(w?.uri))
        .map((w) => ({
          uri: w.uri,
          title: w.title || w.uri,
        }));

      res.json({
        headline:
          parsed.headline || `Community Takeaways from ${String(event.title)}`,
        summary:
          parsed.summary ||
          text.slice(0, 500) ||
          'Attendees highlighted strong technical depth and high-signal peer networking.',
        highlights: Array.isArray(parsed.highlights)
          ? parsed.highlights.slice(0, 4)
          : [],
        topTakeaways: Array.isArray(parsed.topTakeaways)
          ? parsed.topTakeaways.slice(0, 4)
          : [],
        sources,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to synthesize event takeaways.';
      console.error('Event synthesis error:', err);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EventSphere server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
