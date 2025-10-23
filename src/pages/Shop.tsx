import { useEffect, useRef, useState } from 'react'
import { fetchProductsAdvanced, REGION_GROUPS, nearestLocation, buildImageUrl, type Product, type Style, type LocationOption } from '../services/products'

export default function Shop() {
  const [locationMode, setLocationMode] = useState<'All' | 'NearMe' | 'Pick'>('All')
  const [selectedLocations, setSelectedLocations] = useState<(LocationOption)[]>([])
  const [style, setStyle] = useState<Style>('Casual')
  const [items, setItems] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Featured hard-coded example using the user's provided image and metadata.
  const featured: Product = {
    id: 'featured-selvage',
    title: 'Selvage Long Sleeve Stretch',
    price: 98.0,
    // Place the image at: public/featured/selvage-long-sleeve.jpg
    image: '/featured/selvage-long-sleeve.jpg',
    category: 'long sleeve',
    location: 'Brooklyn, NY',
    brands: ['ID Mensware'],
    color: 'Burgundy',
  }

  // Optional: pull the first uploaded "pants" image from Profile to feature on Shop
  const [userUploadUrl, setUserUploadUrl] = useState<string | null>(null)
  const baseApi: string | undefined = (import.meta as any).env?.VITE_PRODUCTS_API_URL

  useEffect(() => {
    let ignore = false
    async function load() {
      // Try backend media listing first if configured
      if (baseApi) {
        try {
          const url = new URL('/media', baseApi)
          url.searchParams.set('category', 'pants')
          url.searchParams.set('tab', 'posts')
          const r = await fetch(url.toString())
          if (!ignore && r.ok) {
            const j = await r.json()
            const first = Array.isArray(j.items) && j.items.length ? j.items[0].url : null
            if (first) { setUserUploadUrl(first); return }
          }
        } catch { /* fall through to local */ }
      }
      // Fallback to localStorage-based uploads if backend not available
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('uploads.pants.posts') : null
        const arr = raw ? JSON.parse(raw) : []
        if (!ignore && Array.isArray(arr) && arr.length) setUserUploadUrl(typeof arr[0] === 'string' ? arr[0] : null)
      } catch { /* ignore */ }
    }
    load()
    return () => { ignore = true }
  }, [baseApi])

  function toggleLoc(l: LocationOption) {
    setSelectedLocations(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
  }

  function toggleRegion(region: keyof typeof REGION_GROUPS) {
    const group = REGION_GROUPS[region]
    setSelectedLocations(prev => {
      const hasAll = group.every(l => prev.includes(l))
      if (hasAll) {
        return prev.filter(l => !group.includes(l))
      }
      const set = new Set([...prev, ...group])
      return Array.from(set)
    })
  }

  // Load first page and when category changes
  useEffect(() => {
    let ignore = false
    setItems([])
    setPage(0)
    setHasMore(true)
    setLoading(true)
  const locations = (locationMode === 'Pick' || locationMode === 'NearMe') ? selectedLocations : undefined
    fetchProductsAdvanced({ style, page: 0, pageSize: 10, locations }).then(res => {
      if (ignore) return
      setItems(res.items)
      setHasMore(res.hasMore)
      setPage(1)
    }).finally(() => setLoading(false))
    return () => { ignore = true }
  }, [style, locationMode, selectedLocations])

  // Infinite loader
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        setLoading(true)
  const locations = (locationMode === 'Pick' || locationMode === 'NearMe') ? selectedLocations : undefined
        fetchProductsAdvanced({ style, page, pageSize: 10, locations }).then(res => {
          setItems(prev => [...prev, ...res.items])
          setHasMore(res.hasMore)
          setPage(p => p + 1)
        }).finally(() => setLoading(false))
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [style, locationMode, selectedLocations, page, hasMore, loading])

  return (
    <section className="shop-page">
      <div className="shop-hero">
        <h1 className="shop-title">WORLD BOUTIQUE</h1>
        <div className="shop-tabs">
          {(['Streetwear','Casual','Luxury'] as Style[]).map(s => (
            <button
              key={s}
              className={`shop-tab ${style === s ? 'active' : ''}`}
              onClick={() => setStyle(s)}
            >{s}</button>
          ))}
          <button className="filter-pill">Filter</button>
        </div>
      </div>

      <div className="shop-subfilter">
        <label>Location</label>
        <div className="loc-controls">
          <button className={`loc-pill ${locationMode==='All'?'active':''}`} onClick={() => { setLocationMode('All'); setSelectedLocations([]) }}>All</button>
          <button className={`loc-pill ${locationMode==='NearMe'?'active':''}`} onClick={async () => {
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 })
              })
              const nearest = nearestLocation(pos.coords.latitude, pos.coords.longitude)
              setSelectedLocations([nearest])
              setLocationMode('NearMe')
            } catch (e) {
              console.warn('Geolocation failed', e)
              // fallback: choose a default region based on locale
              setSelectedLocations(REGION_GROUPS['North America'].slice(0,3))
              setLocationMode('Pick')
            }
          }}>Near me</button>
          <button className={`loc-pill ${locationMode==='Pick'?'active':''}`} onClick={() => setLocationMode('Pick')}>Pick</button>
        </div>
        {locationMode === 'Pick' && (
          <div className="loc-picker">
            <div className="group">
              <strong>Europe</strong> <button className="chip" onClick={() => toggleRegion('Europe')}>All</button>
              <div className="chips">
                {REGION_GROUPS['Europe'].map(l => (
                  <button key={l} className={`chip ${selectedLocations.includes(l)?'selected':''}`} onClick={() => toggleLoc(l)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="group">
              <strong>North America</strong> <button className="chip" onClick={() => toggleRegion('North America')}>All</button>
              <div className="chips">
                {REGION_GROUPS['North America'].map(l => (
                  <button key={l} className={`chip ${selectedLocations.includes(l)?'selected':''}`} onClick={() => toggleLoc(l)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="group">
              <strong>Asia-Pacific</strong> <button className="chip" onClick={() => toggleRegion('Asia-Pacific')}>All</button>
              <div className="chips">
                {REGION_GROUPS['Asia-Pacific'].map(l => (
                  <button key={l} className={`chip ${selectedLocations.includes(l)?'selected':''}`} onClick={() => toggleLoc(l)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="product-grid large-cards">
        {/* Featured card shown first */}
        <article key={featured.id} className="product-card big">
          <div className="big-img-wrap">
            <img
              src={featured.image}
              alt={featured.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement
                const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1' | '2' | '3'
                if (attempt === '0') {
                  el.dataset.fallbackAttempt = '1'
                  const w = 800, h = 1000
                  const people = ['person','model','portrait','street','fashion','wearing']
                  const catMap: Record<string, string[]> = {
                    'long sleeve': ['long sleeve','shirt','blouse'],
                  }
                  const parts = [featured.color.toLowerCase(), ...(catMap[featured.category]||[]), ...people]
                  const query = parts.map(encodeURIComponent).join(',')
                  const sig = Math.abs((featured.id + '|' + featured.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                  el.src = buildImageUrl('unsplash', query, sig, w, h)
                  return
                }
                if (attempt === '1') {
                  el.dataset.fallbackAttempt = '2'
                  const w = 800, h = 1000
                  const people = ['person','model','portrait','street','fashion','wearing']
                  const tagMap: Record<string, string[]> = {
                    'long sleeve': ['shirt','blouse','clothes'],
                  }
                  const parts = [featured.color.toLowerCase(), ...(tagMap[featured.category]||['clothes']), ...people]
                  const query = parts.map(encodeURIComponent).join(',')
                  const sig = Math.abs((featured.id + '|' + featured.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                  el.src = buildImageUrl('loremflickr', query, sig, w, h)
                  return
                }
                if (attempt === '2') {
                  el.dataset.fallbackAttempt = '3'
                  const bg1 = '#f5efe2'
                  const bg2 = '#efe6d3'
                  const shirt = '#6b1f2a'
                  const label = `${featured.color} ${featured.category}`
                  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${bg1}'/>
      <stop offset='100%' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='800' height='1000' fill='url(#bg)'/>
  <circle cx='400' cy='360' r='70' fill='#cfc7b6'/>
  <path d='M260 450 Q400 380 540 450 L560 660 Q400 740 240 660 Z' fill='${shirt}' opacity='0.9'/>
  <text x='400' y='820' font-family='Poppins, Arial, sans-serif' font-size='28' fill='#2b2b2b' text-anchor='middle'>${label}</text>
</svg>`
                  el.onerror = null
                  el.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                  return
                }
                el.onerror = null
              }}
            />
          </div>
          <div className="big-info">
            <h3 className="city">{featured.location}</h3>
            <div className="brands">{featured.brands.join(', ')}</div>
            <div className="brands">{featured.color} {featured.category}</div>
          </div>
        </article>
        {/* User-uploaded pants image from Profile, if available */}
        {userUploadUrl && (
          <article key="featured-user-pants" className="product-card big">
            <div className="big-img-wrap">
              <img
                src={userUploadUrl}
                alt="User uploaded pants"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1' | '2' | '3'
                  if (attempt === '0') {
                    el.dataset.fallbackAttempt = '1'
                    const w = 800, h = 1000
                    const parts = ['charcoal grey','pants','trousers','clothes','person','model','fashion']
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = 4321
                    el.src = buildImageUrl('unsplash', query, sig, w, h)
                    return
                  }
                  if (attempt === '1') {
                    el.dataset.fallbackAttempt = '2'
                    const w = 800, h = 1000
                    const parts = ['charcoal','pants','trousers','clothes','person','model','fashion']
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = 4321
                    el.src = buildImageUrl('loremflickr', query, sig, w, h)
                    return
                  }
                  if (attempt === '2') {
                    el.dataset.fallbackAttempt = '3'
                    const bg1 = '#f5efe2'
                    const bg2 = '#efe6d3'
                    const garment = '#3a3a3a'
                    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${bg1}'/>
      <stop offset='100%' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='800' height='1000' fill='url(#bg)'/>
  <!-- simple pants silhouette -->
  <path d='M270 360 L360 360 L380 760 L320 760 Z' fill='${garment}'/>
  <path d='M440 360 L530 360 L480 760 L420 760 Z' fill='${garment}'/>
  <text x='400' y='860' font-family='Poppins, Arial, sans-serif' font-size='28' fill='#2b2b2b' text-anchor='middle'>Charcoal pants</text>
</svg>`
                    el.onerror = null
                    el.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                    return
                  }
                  el.onerror = null
                }}
              />
            </div>
            <div className="big-info">
              <h3 className="city">From your profile</h3>
              <div className="brands">Upload</div>
              <div className="brands">Charcoal pants</div>
            </div>
          </article>
        )}
        {items.map(p => (
          <article key={p.id} className="product-card big">
            <div className="big-img-wrap">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1' | '2' | '3'

                  // 1) Try Unsplash people editorial photo
                  if (attempt === '0') {
                    el.dataset.fallbackAttempt = '1'
                    const w = 800, h = 1000
                    const people = ['person','model','portrait','street','fashion','wearing']
                    const catMap: Record<string, string[]> = {
                      'short sleeve': ['t-shirt','tee','short sleeve'],
                      'long sleeve': ['long sleeve','shirt','blouse'],
                      'jackets': ['jacket','outerwear','coat'],
                      'jeans': ['jeans','denim'],
                      'pants': ['pants','trousers'],
                      'sweaters': ['sweater','knitwear'],
                      'hoodies': ['hoodie','sweatshirt'],
                      'dresses': ['dress'],
                      'skirts': ['skirt'],
                      'accessories': ['handbag','bag'],
                    }
                    const parts = [p.color.toLowerCase(), ...(catMap[p.category]||[]), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((p.id + '|' + p.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    el.src = buildImageUrl('unsplash', query, sig, w, h)
                    return
                  }

                  // 2) Try loremflickr via proxy
                  if (attempt === '1') {
                    el.dataset.fallbackAttempt = '2'
                    const w = 800, h = 1000
                    const people = ['person','model','portrait','street','fashion','wearing']
                    const tagMap: Record<string, string[]> = {
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
                    const parts = [p.color.toLowerCase(), ...(tagMap[p.category]||['clothes']), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((p.id + '|' + p.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    el.src = buildImageUrl('loremflickr', query, sig, w, h)
                    return
                  }

                  // 2) Inline SVG silhouette fallback (never fails)
                  if (attempt === '2') {
                    el.dataset.fallbackAttempt = '3'
                    // Simplified person silhouette
                    const bg1 = '#f5efe2'
                    const bg2 = '#efe6d3'
                    const shirt = '#2b2b2b'
                    const label = `${p.color} ${p.category}`
                    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${bg1}'/>
      <stop offset='100%' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='800' height='1000' fill='url(#bg)'/>
  <!-- head -->
  <circle cx='400' cy='360' r='70' fill='#cfc7b6'/>
  <!-- torso as jacket/shirt shape -->
  <path d='M260 450 Q400 380 540 450 L560 660 Q400 740 240 660 Z' fill='${shirt}' opacity='0.9'/>
  <text x='400' y='820' font-family='Poppins, Arial, sans-serif' font-size='28' fill='#2b2b2b' text-anchor='middle'>${label}</text>
</svg>`
                    el.onerror = null
                    el.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                    return
                  }

                  // 3) Final guard: disable further errors
                  el.onerror = null
                }}
              />
            </div>
            <div className="big-info">
              <h3 className="city">{p.location}</h3>
              <div className="brands">{p.brands.join(', ')}</div>
              <div className="brands">{p.color} {p.category}</div>
            </div>
          </article>
        ))}
      </div>

      {/* pagination dots */}
      <div className="pager-dots" aria-hidden>
        <span className="dot active" />
        <span className="dot" />
        <span className="dot" />
      </div>

      {loading && <p className="status">Loading…</p>}
      <div ref={sentinelRef} aria-hidden="true" />
      {!hasMore && <p className="status">You have reached the end.</p>}
    </section>
  )
}
