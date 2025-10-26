import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProductsAdvanced, buildImageUrl, type Product, type Style } from '../services/products'

function titleCaseWords(s: string) {
  return s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(w => w ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : w).join(' ')
}

export default function Store() {
  const { storeSlug = '' } = useParams()
  const [style, setStyle] = useState<Style>('Casual')
  const [items, setItems] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [useBrandFilter, setUseBrandFilter] = useState<boolean | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const storeName = useMemo(() => titleCaseWords(decodeURIComponent(storeSlug)), [storeSlug])

  // Optional, curated hero if we know this store
  const hero = useMemo<Product | null>(() => {
    const slug = storeSlug.toLowerCase()
    if (slug === 'id-mensware') {
      return {
        id: 'hero-idmensware-selvage',
        title: 'Selvage Long Sleeve Stretch',
        price: 98.0,
        image: '/featured/selvage-long-sleeve.jpg',
        category: 'long sleeve',
        location: 'Brooklyn, NY',
        brands: ['ID Mensware'],
        color: 'Burgundy',
      } as Product
    }
    return null
  }, [storeSlug])

  // Initial load or when style/store changes
  useEffect(() => {
    let ignore = false
    setItems([])
    setPage(0)
    setHasMore(true)
    setUseBrandFilter(null)
    setLoading(true)
    fetchProductsAdvanced({ style, page: 0, pageSize: 12 }).then(res => {
      if (ignore) return
      const filtered = res.items.filter(i => i.brands.some(b => b.toLowerCase() === storeName.toLowerCase()))
      if (filtered.length >= 1) {
        setItems(filtered)
        setUseBrandFilter(true)
      } else {
        setItems(res.items)
        setUseBrandFilter(false)
      }
      setHasMore(res.hasMore)
      setPage(1)
    }).finally(() => setLoading(false))
    return () => { ignore = true }
  }, [style, storeName])

  // Infinite loader
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        setLoading(true)
        fetchProductsAdvanced({ style, page, pageSize: 12 }).then(res => {
          const next = useBrandFilter ? res.items.filter(i => i.brands.some(b => b.toLowerCase() === storeName.toLowerCase())) : res.items
          setItems(prev => [...prev, ...next])
          setHasMore(res.hasMore)
          setPage(p => p + 1)
        }).finally(() => setLoading(false))
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [style, storeName, page, hasMore, loading, useBrandFilter])

  return (
    <section className="shop-page">
      <div className="shop-hero">
        <h1 className="shop-title">{storeName}</h1>
        <div className="shop-tabs">
          {(['Streetwear','Casual','Luxury'] as Style[]).map(s => (
            <button
              key={s}
              className={`shop-tab ${style === s ? 'active' : ''}`}
              onClick={() => setStyle(s)}
            >{s}</button>
          ))}
          <Link to="/shop" className="filter-pill" aria-label="Back to Shop">Back</Link>
        </div>
      </div>

      {hero && (
        <div className="product-grid large-cards">
          <article key={hero.id} className="product-card big">
            <div className="big-img-wrap">
              <img
                src={hero.image}
                alt={hero.title}
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
                    const parts = [hero.color.toLowerCase(), ...(catMap[hero.category]||[]), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((hero.id + '|' + hero.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
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
                    const parts = [hero.color.toLowerCase(), ...(tagMap[hero.category]||['clothes']), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((hero.id + '|' + hero.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    el.src = buildImageUrl('loremflickr', query, sig, w, h)
                    return
                  }
                  if (attempt === '2') {
                    el.dataset.fallbackAttempt = '3'
                    const bg1 = '#f5efe2'
                    const bg2 = '#efe6d3'
                    const shirt = '#6b1f2a'
                    const label = `${hero.color} ${hero.category}`
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
              <h3 className="city">{hero.location}</h3>
              <div className="brands">{hero.brands.join(', ')}</div>
              <div className="brands">{hero.color} {hero.category}</div>
            </div>
          </article>
        </div>
      )}

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
                  const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1' | '2' | '3'
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
                      'accessories': ['handbag','bag','accessories'],
                    }
                    const parts = [p.color.toLowerCase(), ...(catMap[p.category]||[]), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((p.id + '|' + p.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    el.src = buildImageUrl('unsplash', query, sig, w, h)
                    return
                  }
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
                  if (attempt === '2') {
                    el.dataset.fallbackAttempt = '3'
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
              <h3 className="city">{p.location}</h3>
              <div className="brands">{p.brands.join(', ')}</div>
              <div className="brands">{p.color} {p.category}</div>
            </div>
          </article>
        ))}
      </div>

      {loading && <p className="status">Loading…</p>}
      <div ref={sentinelRef} aria-hidden="true" />
      {!hasMore && <p className="status">You have reached the end.</p>}
    </section>
  )
}
