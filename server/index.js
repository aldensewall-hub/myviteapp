import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())

// Simple in-memory generator mirroring frontend logic
const LOCATIONS = ['Paris, France','New York, NY','Milan, Italy','London, UK','Tokyo, Japan','Los Angeles, CA','Copenhagen, DK','Seoul, South Korea','Barcelona, Spain','Sydney, Australia']

function seededRandom(seed) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => { h^=h<<13;h>>>=0;h^=h>>>17;h>>>=0;h^=h<<5;h>>>=0; return (h>>>0)/0xffffffff }
}

const categoryPrice = {
  'short sleeve': [15, 40], 'long sleeve': [20, 55], 'jackets': [60, 200], 'jeans': [35, 120], 'pants': [30, 100], 'sweaters': [30, 120], 'hoodies': [35, 120], 'dresses': [40, 180], 'skirts': [25, 100], 'accessories': [10, 80],
}

app.get('/health', (_req, res) => res.json({ ok: true }))

// Image proxy to improve reliability against client-side blockers
app.get('/image', async (req, res) => {
  try {
    const provider = (req.query.provider || 'loremflickr').toString()
    const tags = (req.query.tags || '').toString()
    const sig = (req.query.sig || '1').toString()
    const w = Number(req.query.w || 800)
    const h = Number(req.query.h || 1000)
    let url
    if (provider === 'unsplash') {
      url = `https://source.unsplash.com/${w}x${h}/?${tags}&sig=${sig}`
    } else {
      url = `https://loremflickr.com/${w}/${h}/${tags}?lock=${sig}`
    }
    const r = await fetch(url, { redirect: 'follow' })
    if (!r.ok) { res.status(502).json({ error: 'upstream image fetch failed' }); return }
    const ct = r.headers.get('content-type') || 'image/jpeg'
    res.set('Content-Type', ct)
    res.set('Cache-Control', 'public, max-age=86400')
    const ab = await r.arrayBuffer()
    res.send(Buffer.from(ab))
  } catch (e) {
    res.status(500).json({ error: 'image proxy error' })
  }
})

app.get('/products', (req, res) => {
  const style = req.query.style || 'Casual'
  const page = Number(req.query.page || 0)
  const pageSize = Number(req.query.pageSize || 10)
  const category = req.query.category || 'short sleeve'
  const locationsParam = (req.query.locations || '').toString()
  const locFilter = locationsParam ? new Set(locationsParam.split(',')) : null

  const rand = seededRandom(`${style}-${category}-page-${page}`)
  const colors = [
    { label: 'White', query: 'white' },
    { label: 'Black', query: 'black' },
    { label: 'Navy', query: 'navy blue' },
    { label: 'Burgundy', query: 'burgundy red' },
    { label: 'Olive', query: 'olive green' },
    { label: 'Sand', query: 'beige sand' },
    { label: 'Stone', query: 'stone grey' },
    { label: 'Ivory', query: 'ivory' },
    { label: 'Charcoal', query: 'charcoal grey' },
  ]
  const brandsByStyle = {
    Streetwear: ['Supreme','Stüssy','Kith','Carhartt','Nike','Adidas','Palace'],
    Casual: ['Aritzia','Mango','Everlane','Uniqlo','COS','Zara','H&M'],
    Luxury: ['Fendi','Gucci','Prada','Loewe','Celine','Dior','Saint Laurent']
  }
  const pool = brandsByStyle[style] || brandsByStyle.Casual

  const [min,max] = categoryPrice[category] || [20, 100]

  const pick = (arr) => arr[Math.floor(rand()*arr.length)]
  const uniqueBrands = (n) => {
    const s = new Set();
    while (s.size<n) s.add(pick(pool));
    return Array.from(s);
  }

  let items = Array.from({length: pageSize}).map((_, i) => {
    const id = `${category}-${page}-${i}`
    const color = pick(colors)
    const title = `${color.label} ${category.split(' ').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' ')}`
    const location = pick(LOCATIONS)
    const price = Math.round((min + rand()*(max-min))*100)/100
    const lock = (i+page*pageSize)%10000
    const tagMap = {
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
  const people = ['person','model','portrait','street','fashion','wearing']
  const tags = [color.query, ...(tagMap[category]||['clothes']), ...people].map(encodeURIComponent).join(',')
  const image = `https://loremflickr.com/800/1000/${tags}?lock=${lock}`
    return { id, title, price, image, category, location, brands: uniqueBrands(3), color: color.label }
  })
  if (locFilter) items = items.filter(i => locFilter.has(i.location))

  const total = 500; const start = page*pageSize; const hasMore = start + items.length < total
  res.json({ items, hasMore })
})

const PORT = process.env.PORT || 5178
app.listen(PORT, () => console.log(`Products server on http://localhost:${PORT}`))
