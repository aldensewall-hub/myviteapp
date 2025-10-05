import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchProducts, getCategories, type Category, type Product } from '../services/products'

export default function Shop() {
  const categories = useMemo(() => getCategories(), [])
  const [category, setCategory] = useState<Category>('short sleeve')
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
    fetchProducts({ category, page: 0, pageSize: 20 }).then(res => {
      if (ignore) return
      setItems(res.items)
      setHasMore(res.hasMore)
      setPage(1)
    }).finally(() => setLoading(false))
    return () => { ignore = true }
  }, [category])

  // Infinite loader
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        setLoading(true)
        fetchProducts({ category, page, pageSize: 20 }).then(res => {
          setItems(prev => [...prev, ...res.items])
          setHasMore(res.hasMore)
          setPage(p => p + 1)
        }).finally(() => setLoading(false))
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [category, page, hasMore, loading])

  return (
    <section>
      <div className="shop-filter">
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={e => setCategory(e.target.value as Category)}>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="product-grid">
        {items.map(p => (
          <article key={p.id} className="product-card">
            <div className="img-wrap">
              <img src={p.image} alt={p.title} loading="lazy" />
            </div>
            <div className="info">
              <h3 title={p.title}>{p.title}</h3>
              <div className="price">${p.price.toFixed(2)}</div>
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
