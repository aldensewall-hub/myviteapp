// Mock search service. Replace later with real API (e.g., OMDb, TMDB).
// Provides a simple in-memory fuzzy-like filter.

export interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'show';
  year: string;
  poster?: string;
  rating?: number; // placeholder for future rating integration
}

const MOCK_DATA: MediaItem[] = [
  { id: '1', title: 'The Matrix', type: 'movie', year: '1999' },
  { id: '2', title: 'The Matrix Reloaded', type: 'movie', year: '2003' },
  { id: '3', title: 'The Matrix Revolutions', type: 'movie', year: '2003' },
  { id: '4', title: 'Breaking Bad', type: 'show', year: '2008' },
  { id: '5', title: 'Better Call Saul', type: 'show', year: '2015' },
  { id: '6', title: 'The Lord of the Rings: The Fellowship of the Ring', type: 'movie', year: '2001' },
  { id: '7', title: 'The Lord of the Rings: The Two Towers', type: 'movie', year: '2002' },
  { id: '8', title: 'The Lord of the Rings: The Return of the King', type: 'movie', year: '2003' },
  { id: '9', title: 'Game of Thrones', type: 'show', year: '2011' },
  { id: '10', title: 'Avatar: The Last Airbender', type: 'show', year: '2005' },
];

export interface SearchResult {
  items: MediaItem[];
  total: number;
  query: string;
}

export async function searchMedia(query: string): Promise<SearchResult> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { items: [], total: 0, query };
  }
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 300));
  const results = MOCK_DATA.filter((item) => item.title.toLowerCase().includes(q));
  return { items: results, total: results.length, query };
}
