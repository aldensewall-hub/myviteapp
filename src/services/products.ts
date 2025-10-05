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

function imageFor(category: Category, id: string) {
  // Use picsum.photos placeholder, seeded by id so it stays stable per product
  const size = 400
  return `https://picsum.photos/seed/${encodeURIComponent(category + '-' + id)}/${size}/${size}`
}

export async function fetchProductsByStyle(opts: { style: Style; category?: Category; page: number; pageSize: number }): Promise<{ items: Product[]; hasMore: boolean }>{
  const { style, category = 'short sleeve', page, pageSize } = opts
  const rand = seededRandom(`${style}-${category}-page-${page}`)

  const cities = ['Paris, France','New York, NY','Milan, Italy','London, UK','Tokyo, Japan','Los Angeles, CA','Copenhagen, DK']
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
      image: imageFor(category, id),
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

export function getCategories(): Category[] {
  return CATEGORIES
}
