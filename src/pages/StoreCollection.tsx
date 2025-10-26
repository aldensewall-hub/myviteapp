import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProductsAdvanced, type Product } from '../services/products'

type CollectionMeta = {
  title: string
  description?: string
  // Optional filters to simulate themed curation
  categories?: Array<'jackets' | 'sweaters' | 'hoodies' | 'jeans' | 'pants' | 'long sleeve' | 'short sleeve' | 'accessories' | 'dresses' | 'skirts'>
  styleHint?: 'Streetwear' | 'Casual' | 'Luxury'
}

function titleCaseWords(s: string) {
  return s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(w => w ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : w).join(' ')
}

function getCollectionsFor(storeSlug: string): Record<string, CollectionMeta> {
  const slug = (storeSlug || '').toLowerCase()
  if (slug === 'id-mensware') {
    return {
      'fall-edit': { title: 'Fall Edit', categories: ['jackets','sweaters','long sleeve'], styleHint: 'Casual' },
      'streetwear-drops': { title: 'Streetwear Drops', categories: ['hoodies','pants','jeans'], styleHint: 'Streetwear' },
      'handwoven-line': { title: 'Handwoven Line', categories: ['long sleeve','accessories'], styleHint: 'Luxury' },
    }
  }
  // Defaults for other stores
  return {
    'fall-edit': { title: 'Fall Edit', categories: ['jackets','sweaters','long sleeve'], styleHint: 'Casual' },
    'streetwear-drops': { title: 'Streetwear Drops', categories: ['hoodies','pants','jeans'], styleHint: 'Streetwear' },
  }
}

export default function StoreCollection() {
  const { storeSlug = '', collectionSlug = '' } = useParams()
  const storeName = useMemo(() => titleCaseWords(decodeURIComponent(storeSlug)), [storeSlug])
  const collections = useMemo(() => getCollectionsFor(storeSlug), [storeSlug])
  const meta = collections[collectionSlug]

  const [items, setItems] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let ignore = false
    setItems([]); setPage(0); setHasMore(true); setLoading(true)
    const style = meta?.styleHint || 'Casual'
    fetchProductsAdvanced({ style, page: 0, pageSize: 12 }).then(res => {
      if (ignore) return
      // Filter by brand first (store name), then by optional categories
      let filtered = res.items.filter(i => i.brands.some(b => b.toLowerCase() === storeName.toLowerCase()))
      if (!filtered.length) filtered = res.items
      if (meta?.categories?.length) {
        const set = new Set(meta.categories)
        filtered = filtered.filter(i => set.has(i.category))
      }
      setItems(filtered)
      setHasMore(res.hasMore)
      setPage(1)
    }).finally(() => setLoading(false))
    return () => { ignore = true }
  }, [collectionSlug, storeName, meta])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        setLoading(true)
        const style = meta?.styleHint || 'Casual'
        fetchProductsAdvanced({ style, page, pageSize: 12 }).then(res => {
          let next = res.items.filter(i => i.brands.some(b => b.toLowerCase() === storeName.toLowerCase()))
          if (!next.length) next = res.items
          if (meta?.categories?.length) {
            const set = new Set(meta.categories)
            next = next.filter(i => set.has(i.category))
          }
          setItems(prev => [...prev, ...next])
          setHasMore(res.hasMore)
          setPage(p => p + 1)
        }).finally(() => setLoading(false))
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [meta, page, hasMore, loading, storeName])

  return (
    <section className="shop-page">
      <div className="shop-hero">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 className="shop-title" style={{ margin: 0 }}>{meta?.title || titleCaseWords(collectionSlug)}</h1>
          <span style={{ color: '#6b6b6b' }}>by {storeName}</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <Link to={`/stores/${encodeURIComponent(storeSlug)}`} className="filter-pill">Back to Store</Link>
        </div>
      </div>

      <div className="product-grid large-cards">
        {items.map(p => (
          <article key={p.id} className="product-card big">
            <div className="big-img-wrap">
              <img src={p.image} alt={p.title} loading="lazy" />
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
