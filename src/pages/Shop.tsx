import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchProductsByStyle, getLocations, type Product, type Style, type LocationOption } from '../services/products'

export default function Shop() {
  const locations = useMemo(() => getLocations(), [])
  const [location, setLocation] = useState<LocationOption | 'All'>('All')
  const [style, setStyle] = useState<Style>('Casual')
  const [items, setItems] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Load first page and when category changes
  useEffect(() => {
    let ignore = false
    setItems([])
    setPage(0)
    setHasMore(true)
    setLoading(true)
  fetchProductsByStyle({ style, page: 0, pageSize: 10 }).then(res => {
      if (ignore) return
      const filtered = location === 'All' ? res.items : res.items.filter(it => it.location === location)
      setItems(filtered)
      setHasMore(res.hasMore)
      setPage(1)
    }).finally(() => setLoading(false))
    return () => { ignore = true }
  }, [style, location])

  // Infinite loader
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        setLoading(true)
  fetchProductsByStyle({ style, page, pageSize: 10 }).then(res => {
          const filtered = location === 'All' ? res.items : res.items.filter(it => it.location === location)
          setItems(prev => [...prev, ...filtered])
          setHasMore(res.hasMore)
          setPage(p => p + 1)
        }).finally(() => setLoading(false))
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [style, location, page, hasMore, loading])

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
        <label htmlFor="location">Location</label>
        <select id="location" value={location} onChange={e => setLocation(e.target.value as LocationOption | 'All')}>
          <option value="All">All</option>
          {locations.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
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
                  el.src = `https://picsum.photos/seed/${encodeURIComponent(p.category + '-' + p.id)}/800/1000`
                }}
              />
            </div>
            <div className="big-info">
              <h3 className="city">{p.location}</h3>
              <div className="brands">{p.brands.join(', ')}</div>
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
