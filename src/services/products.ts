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
  color: string; // Display color label (e.g., "White")
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

// Display label and search query token for colors
const COLORS: { label: string; query: string; hex: string }[] = [
  { label: 'White', query: 'white', hex: '#ffffff' },
  { label: 'Black', query: 'black', hex: '#1f1f1f' },
  { label: 'Navy', query: 'navy blue', hex: '#1e2a5a' },
  { label: 'Burgundy', query: 'burgundy red', hex: '#6b1f2a' },
  { label: 'Olive', query: 'olive green', hex: '#556b2f' },
  { label: 'Sand', query: 'beige sand', hex: '#d4c5a2' },
  { label: 'Stone', query: 'stone grey', hex: '#8c8c8c' },
  { label: 'Ivory', query: 'ivory', hex: '#fffff0' },
  { label: 'Charcoal', query: 'charcoal grey', hex: '#3a3a3a' },
]

function colorLabelToEntry(label: string | undefined) {
  if (!label) return COLORS[0]
  const low = label.toLowerCase()
  return COLORS.find(c => c.label.toLowerCase() === low) || COLORS[0]
}

function titleCaseCategory(cat: Category) {
  return cat.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

function imageFor(style: Style, category: Category, colorQuery: string, id: string) {
  // Prefer Unsplash Source with style/category keywords for fashion-like imagery.
  // Fallback to picsum if needed. For production, ensure proper licensing/attribution.
  const source = (import.meta as any).env?.VITE_IMAGE_SOURCE ?? 'svg'
  const mode = (import.meta as any).env?.VITE_IMAGE_MODE ?? 'apparel' // 'apparel' | 'people'

  const styleKeywords: Record<Style, string[]> = {
    Streetwear: ['streetwear','urban','model','runway'],
    Casual: ['casual','everyday fashion','model','outdoor'],
    Luxury: ['luxury fashion','couture','editorial','runway']
  }
  const categoryKeywords: Record<Category, string[]> = {
    'short sleeve': ['t-shirt','tee','short sleeve shirt'],
    'long sleeve': ['long sleeve shirt','blouse'],
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

  if (source === 'svg') {
    // Simple shirt-like silhouette in the requested color
    const entry = COLORS.find(c => c.query === colorQuery) || COLORS[0]
    const shirt = entry.hex
    const bg1 = '#f5efe2'
    const bg2 = '#efe6d3'
    const label = `${entry.label} ${titleCaseCategory(category)}`
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${bg1}'/>
      <stop offset='100%' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='800' height='1000' fill='url(#bg)'/>
  <g>
    <!-- sleeves -->
    <rect x='180' y='320' width='150' height='180' rx='20' fill='${shirt}' />
    <rect x='470' y='320' width='150' height='180' rx='20' fill='${shirt}' />
    <!-- body -->
    <rect x='275' y='340' width='250' height='380' rx='28' fill='${shirt}' />
    <!-- neck opening -->
    <circle cx='400' cy='340' r='26' fill='${bg1}' stroke='rgba(0,0,0,0.08)' />
  </g>
  <text x='400' y='770' font-family='Poppins, Arial, sans-serif' font-size='28' fill='#2b2b2b' text-anchor='middle'>${label}</text>
</svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  if (source === 'unsplash') {
    // Apparel (generic clothing product shots) vs People (models wearing it)
    const base = mode === 'apparel'
      ? ['clothing','apparel','garment','product','studio','flat lay','on hanger','isolated']
      : ['fashion','person','model','wearing','portrait']
    const queryParts = [
      colorQuery,
      ...categoryKeywords[category],
      ...styleKeywords[style],
      ...base,
    ]
    const query = queryParts.map(encodeURIComponent).join(',')
    const url = `https://source.unsplash.com/${w}x${h}/?${query}&sig=${sig}`
    // Return Unsplash Source; UI will fall back on error.
    return url
  }

  // Primary: loremflickr with clothing tags to keep images relevant
  if (source === 'loremflickr') {
    const tagMap: Record<Category, string[]> = {
      'short sleeve': ['tshirt','shirt','clothes'],
      'long sleeve': ['shirt','blouse','clothes'],
      'jackets': ['jacket','coat','outerwear'],
      'jeans': ['jeans','denim','clothes'],
      'pants': ['pants','trousers','clothes'],
      'sweaters': ['sweater','knitwear','clothes'],
      'hoodies': ['hoodie','sweatshirt','clothes'],
      'dresses': ['dress','clothes'],
      'skirts': ['skirt','clothes'],
      'accessories': ['bag','handbag','accessories'],
    }
    const tags = [colorQuery, ...tagMap[category]].map(encodeURIComponent).join(',')
    return `https://loremflickr.com/${w}/${h}/${tags}?lock=${sig}`
  }

  // Last-resort generic placeholder
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
    const color = randomFrom(rand, COLORS)
    const title = `${color.label} ${titleCaseCategory(category)}`
    const location = randomFrom(rand, cities)
    const brands = uniqueBrands(rand, pool, 3)
    return {
      id,
      title,
      price: priceFor(rand, category),
      image: imageFor(style, category, color.query, id),
      category,
      location,
      brands,
      color: color.label,
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
    const res = await fetchFromApi(opts)
    // If we're using local SVG images, override the image field to ensure consistency
    const source = (import.meta as any).env?.VITE_IMAGE_SOURCE ?? 'svg'
    if (source === 'svg') {
      res.items = res.items.map(i => {
        const entry = colorLabelToEntry((i as any).color)
        return { ...i, image: imageFor(opts.style, i.category, entry.query, i.id) }
      })
    }
    return res
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
