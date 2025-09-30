import type { MediaItem } from '../search';

// TMDB multi-search endpoint docs: https://developer.themoviedb.org/reference/search-multi
// Note: TMDB requires an Authorization header with a bearer token (v4) OR api_key query param (v3). We'll use api_key param.

interface TmdbMultiResult {
  id: number;
  name?: string;          // for TV
  title?: string;         // for movies
  media_type: 'movie' | 'tv' | string;
  first_air_date?: string;
  release_date?: string;
  poster_path?: string | null;
}

interface TmdbMultiResponse {
  results: TmdbMultiResult[];
}

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w342';

export async function searchTmdb(query: string, fetcher = fetch): Promise<MediaItem[]> {
  const key = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
  if (!key) return [];
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(key)}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
  try {
    const res = await fetcher(url);
    if (!res.ok) return [];
    const data = (await res.json()) as TmdbMultiResponse;
    if (!data.results) return [];
    return data.results
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .map(r => ({
        id: `tmdb-${r.media_type}-${r.id}`,
        title: r.media_type === 'movie' ? (r.title ?? 'Untitled') : (r.name ?? 'Untitled'),
        year: (r.media_type === 'movie' ? r.release_date : r.first_air_date)?.slice(0, 4) || '—',
        type: r.media_type === 'tv' ? 'show' : 'movie',
        poster: r.poster_path ? `${TMDB_IMG_BASE}${r.poster_path}` : undefined,
        provider: 'tmdb'
      })) as MediaItem[];
  } catch {
    return [];
  }
}
