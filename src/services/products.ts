export type Category = 'short sleeve' | 'long sleeve' | 'jackets' | 'jeans' | 'pants' | 'sweaters' | 'hoodies' | 'dresses' | 'skirts' | 'accessories';
export type Style = 'Streetwear' | 'Casual' | 'Luxury'

export interface Product {
  id: string;
  title: string;
  price: number; // USD
  image: string; // placeholder image url
  category: Category;
  location: string;
  brands: string[];
}

const CATEGORIES: Category[] = [
  'short sleeve',
  'long sleeve',
  'jackets',
  'jeans',
  'pants',
  'sweaters',
  'hoodies',
  'dresses',
  'skirts',
  'accessories',
]

const LOCATIONS = ['Paris, France','New York, NY','Milan, Italy','London, UK','Tokyo, Japan','Los Angeles, CA','Copenhagen, DK','Seoul, South Korea','Barcelona, Spain','Sydney, Australia'] as const
export type LocationOption = typeof LOCATIONS[number]

// Coordinates and regions for each location
const LOCATION_META: Record<LocationOption, { lat: number; lon: number; region: 'Europe' | 'North America' | 'Asia-Pacific' }> = {
  'Paris, France': { lat: 48.8566, lon: 2.3522, region: 'Europe' },
  'New York, NY': { lat: 40.7128, lon: -74.0060, region: 'North America' },
  'Milan, Italy': { lat: 45.4642, lon: 9.1900, region: 'Europe' },
  'London, UK': { lat: 51.5074, lon: -0.1278, region: 'Europe' },
  'Tokyo, Japan': { lat: 35.6762, lon: 139.6503, region: 'Asia-Pacific' },
  'Los Angeles, CA': { lat: 34.0522, lon: -118.2437, region: 'North America' },
  'Copenhagen, DK': { lat: 55.6761, lon: 12.5683, region: 'Europe' },
  'Seoul, South Korea': { lat: 37.5665, lon: 126.9780, region: 'Asia-Pacific' },
  'Barcelona, Spain': { lat: 41.3874, lon: 2.1686, region: 'Europe' },
  'Sydney, Australia': { lat: -33.8688, lon: 151.2093, region: 'Asia-Pacific' },
}

export const REGION_GROUPS: Record<'Europe' | 'North America' | 'Asia-Pacific', LocationOption[]> = {
  'Europe': (Object.keys(LOCATION_META) as LocationOption[]).filter(l => LOCATION_META[l].region === 'Europe'),
  'North America': (Object.keys(LOCATION_META) as LocationOption[]).filter(l => LOCATION_META[l].region === 'North America'),
  'Asia-Pacific': (Object.keys(LOCATION_META) as LocationOption[]).filter(l => LOCATION_META[l].region === 'Asia-Pacific'),
}

// Simple deterministic pseudo-random generator so pagination stays consistent per category
function seededRandom(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h >>>= 0;
    h ^= h >>> 17; h >>>= 0;
    h ^= h << 5; h >>>= 0;
    return (h >>> 0) / 0xffffffff;
  };
}

function randomFrom<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function uniqueBrands(rand: () => number, pool: string[], count: number) {
  const chosen = new Set<string>()
  while (chosen.size < count) {
    chosen.add(randomFrom(rand, pool))
  }
  return Array.from(chosen)
}

function priceFor(rand: () => number, category: Category) {
  const base: Record<Category, [number, number]> = {
    'short sleeve': [15, 40],
    'long sleeve': [20, 55],
    'jackets': [60, 200],
    'jeans': [35, 120],
    'pants': [30, 100],
    'sweaters': [30, 120],
    'hoodies': [35, 120],
    'dresses': [40, 180],
    'skirts': [25, 100],
    'accessories': [10, 80],
  }
  const [min,max] = base[category]
  const raw = min + rand() * (max - min)
  return Math.round(raw * 100) / 100
}

function imageFor(style: Style, category: Category, id: string) {
  // Prefer Unsplash Source with style/category keywords for fashion-like imagery.
  // Fallback to picsum if needed. For production, ensure proper licensing/attribution.
  const source = (import.meta as any).env?.VITE_IMAGE_SOURCE ?? 'unsplash'

  const styleKeywords: Record<Style, string[]> = {
    Streetwear: ['streetwear','urban','model','runway'],
    Casual: ['casual','everyday fashion','model','outdoor'],
    Luxury: ['luxury fashion','couture','editorial','runway']
  }
  const categoryKeywords: Record<Category, string[]> = {
    'short sleeve': ['t-shirt','tee','short sleeve'],
    'long sleeve': ['long sleeve','shirt','blouse'],
    'jackets': ['jacket','outerwear','coat'],
    'jeans': ['jeans','denim'],
    'pants': ['pants','trousers'],
    'sweaters': ['sweater','knitwear'],
    'hoodies': ['hoodie','sweatshirt'],
    'dresses': ['dress','evening dress'],
    'skirts': ['skirt'],
    'accessories': ['handbag','bag','accessories']
  }

  // 4:5 vertical portrait for editorial look
  const w = 800, h = 1000

  // Deterministic signature per id
  const sig = (() => {
    let h = 2166136261 >>> 0; // FNV-1a
    const seed = style + '|' + category + '|' + id
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return (h >>> 0) % 10000
  })()

  if (source === 'unsplash') {
    const queryParts = [...styleKeywords[style], ...categoryKeywords[category], 'fashion', 'model', 'portrait']
    const query = queryParts.map(encodeURIComponent).join(',')
    const url = `https://source.unsplash.com/${w}x${h}/?${query}&sig=${sig}`
    // Return Unsplash Source; UI will fall back on error.
    return url
  }

  // Fallback picsum (not fashion-specific but safe placeholder)
  return `https://picsum.photos/seed/${encodeURIComponent(style + '-' + category + '-' + id)}/${w}/${h}`
}

export async function fetchProductsByStyle(opts: { style: Style; category?: Category; page: number; pageSize: number }): Promise<{ items: Product[]; hasMore: boolean }>{
  const { style, category = 'short sleeve', page, pageSize } = opts
  const rand = seededRandom(`${style}-${category}-page-${page}`)

  const cities = [...LOCATIONS]
  const brandPool: Record<Style, string[]> = {
    Streetwear: ['Supreme','Stüssy','Kith','Carhartt','Nike','Adidas','Palace'],
    Casual: ['Aritzia','Mango','Everlane','Uniqlo','COS','Zara','H&M'],
    Luxury: ['Fendi','Gucci','Prada','Loewe','Celine','Dior','Saint Laurent']
  }
  const pool = brandPool[style]

  const items: Product[] = Array.from({ length: pageSize }).map((_, i) => {
    const id = `${category}-${page}-${i}`
    const titleAdjs = ['Classic', 'Premium', 'Vintage', 'Modern', 'Essential', 'Relaxed', 'Slim', 'Comfy', 'Athletic']
    const colors = ['Charcoal', 'Ivory', 'Olive', 'Navy', 'Burgundy', 'Sand', 'Stone', 'Black', 'White']
    const title = `${randomFrom(rand, titleAdjs)} ${category} in ${randomFrom(rand, colors)}`
    const location = randomFrom(rand, cities)
    const brands = uniqueBrands(rand, pool, 3)
    return {
      id,
      title,
      price: priceFor(rand, category),
      image: imageFor(style, category, id),
      category,
      location,
      brands,
    }
  })

  // Simulate a large but finite dataset per category
  const total = 500
  const start = page * pageSize
  const hasMore = start + items.length < total

  // Simulate network delay
  await new Promise(r => setTimeout(r, 300))

  return { items, hasMore }
}

export async function fetchProducts(opts: { category?: Category; page: number; pageSize: number }): Promise<{ items: Product[]; hasMore: boolean }>{
  // Back-compat: default to Casual style
  return fetchProductsByStyle({ style: 'Casual', ...opts })
}

export function getLocations(): LocationOption[] { return [...LOCATIONS] }

// Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export function nearestLocation(lat: number, lon: number): LocationOption {
  let best: { name: LocationOption; d: number } | null = null
  for (const name of LOCATIONS) {
    const m = LOCATION_META[name]
    const d = haversine(lat, lon, m.lat, m.lon)
    if (!best || d < best.d) best = { name, d }
  }
  return (best?.name ?? 'Paris, France')
}

// Backend integration: call API if configured
async function fetchFromApi(params: { style: Style; page: number; pageSize: number; locations?: string[]; category?: Category }): Promise<{ items: Product[]; hasMore: boolean }> {
  const base = (import.meta as any).env?.VITE_PRODUCTS_API_URL as string | undefined
  if (!base) throw new Error('No API URL configured')
  const url = new URL('/products', base)
  url.searchParams.set('style', params.style)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('pageSize', String(params.pageSize))
  if (params.locations && params.locations.length) url.searchParams.set('locations', params.locations.join(','))
  if (params.category) url.searchParams.set('category', params.category)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

export async function fetchProductsAdvanced(opts: { style: Style; page: number; pageSize: number; locations?: string[]; category?: Category }): Promise<{ items: Product[]; hasMore: boolean }>{
  const base = (import.meta as any).env?.VITE_PRODUCTS_API_URL as string | undefined
  if (base) {
    return fetchFromApi(opts)
  }
  // Local generation with optional location filtering
  const res = await fetchProductsByStyle({ style: opts.style, category: opts.category, page: opts.page, pageSize: opts.pageSize })
  if (opts.locations && opts.locations.length) {
    const set = new Set(opts.locations)
    res.items = res.items.filter(i => set.has(i.location))
  }
  return res
}

export function getCategories(): Category[] {
  return CATEGORIES
}
