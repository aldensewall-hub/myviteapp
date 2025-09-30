import type { MediaItem } from '../search';

// OMDb API docs: http://www.omdbapi.com/?s=batman&apikey=KEY
// We only implement a minimal search fetch; pagination & detail lookups can be added later.

export interface OmdbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | string;
  Poster: string;
}

export interface OmdbSearchResponse {
  Search?: OmdbSearchItem[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

export async function searchOmdb(query: string, fetcher = fetch): Promise<MediaItem[]> {
  const key = import.meta.env.VITE_OMDB_API_KEY as string | undefined;
  if (!key) return [];
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&s=${encodeURIComponent(query)}`;
  try {
    const res = await fetcher(url);
    if (!res.ok) return [];
    const data = (await res.json()) as OmdbSearchResponse;
    if (data.Response === 'False' || !data.Search) return [];
    return data.Search.map(item => ({
      id: item.imdbID,
      title: item.Title,
      year: item.Year,
      type: item.Type === 'series' ? 'show' : 'movie',
      poster: item.Poster && item.Poster !== 'N/A' ? item.Poster : undefined,
      provider: 'omdb'
    } as MediaItem & { provider: string }));
  } catch {
    return [];
  }
}
