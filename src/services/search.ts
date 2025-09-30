// Mock search service. Replace later with real API (e.g., OMDb, TMDB).
// Provides a simple in-memory fuzzy-like filter.

export interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'show';
  year: string;
  poster?: string;
  rating?: number; // placeholder for future rating integration
  provider?: 'omdb' | 'tmdb' | 'mock';
}

const MOCK_DATA: MediaItem[] = [
  { id: '1', title: 'The Matrix', type: 'movie', year: '1999', provider: 'mock' },
  { id: '2', title: 'The Matrix Reloaded', type: 'movie', year: '2003', provider: 'mock' },
  { id: '3', title: 'The Matrix Revolutions', type: 'movie', year: '2003', provider: 'mock' },
  { id: '4', title: 'Breaking Bad', type: 'show', year: '2008', provider: 'mock' },
  { id: '5', title: 'Better Call Saul', type: 'show', year: '2015', provider: 'mock' },
  { id: '6', title: 'The Lord of the Rings: The Fellowship of the Ring', type: 'movie', year: '2001', provider: 'mock' },
  { id: '7', title: 'The Lord of the Rings: The Two Towers', type: 'movie', year: '2002', provider: 'mock' },
  { id: '8', title: 'The Lord of the Rings: The Return of the King', type: 'movie', year: '2003', provider: 'mock' },
  { id: '9', title: 'Game of Thrones', type: 'show', year: '2011', provider: 'mock' },
  { id: '10', title: 'Avatar: The Last Airbender', type: 'show', year: '2005', provider: 'mock' },
];

export interface SearchResult {
  items: MediaItem[];
  total: number;
  query: string;
}

// Dynamic imports to avoid errors if env keys not present at build time
type ProviderSearchFn = (query: string) => Promise<MediaItem[]>;

interface CacheEntry { items: MediaItem[]; ts: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minute

async function loadProviders(): Promise<ProviderSearchFn[]> {
  const fns: ProviderSearchFn[] = [];
  // OMDb
  if (import.meta.env.VITE_OMDB_API_KEY) {
    const { searchOmdb } = await import('./providers/omdb');
    fns.push(searchOmdb as ProviderSearchFn);
  }
  // TMDB
  if (import.meta.env.VITE_TMDB_API_KEY) {
    const { searchTmdb } = await import('./providers/tmdb');
    fns.push(searchTmdb as ProviderSearchFn);
  }
  return fns;
}

export async function searchMedia(query: string): Promise<SearchResult> {
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();
  if (!q) return { items: [], total: 0, query };

  const now = Date.now();
  const cached = cache.get(q);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return { items: cached.items, total: cached.items.length, query };
  }

  const providers = await loadProviders();
  let items: MediaItem[] = [];

  if (providers.length === 0) {
    // Fallback to mock local filtering
    await new Promise((r) => setTimeout(r, 150));
    items = MOCK_DATA.filter(i => i.title.toLowerCase().includes(q));
  } else {
    const results = await Promise.allSettled(providers.map(fn => fn(trimmed)));
    for (const r of results) {
      if (r.status === 'fulfilled') {
        items.push(...r.value);
      }
    }
    // Deduplicate by id (providers prefix their ids distinctly)
    const seen = new Set<string>();
    items = items.filter(i => (seen.has(i.id) ? false : (seen.add(i.id), true)));
  }

  cache.set(q, { items, ts: now });
  return { items, total: items.length, query };
}
