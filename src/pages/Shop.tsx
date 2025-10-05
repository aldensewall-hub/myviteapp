import { useEffect, useRef, useState } from 'react'
import { fetchProductsAdvanced, REGION_GROUPS, nearestLocation, type Product, type Style, type LocationOption } from '../services/products'

export default function Shop() {
  const [locationMode, setLocationMode] = useState<'All' | 'NearMe' | 'Pick'>('All')
  const [selectedLocations, setSelectedLocations] = useState<(LocationOption)[]>([])
  const [style, setStyle] = useState<Style>('Casual')
  const [items, setItems] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

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
                  el.onerror = null
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
                  const tags = [p.color.toLowerCase(), ...(tagMap[p.category]||['clothes'])].map(encodeURIComponent).join(',')
                  const lock = encodeURIComponent(`${p.category}-${p.id}`)
                  el.src = `https://loremflickr.com/800/1000/${tags}?lock=${lock}`
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
