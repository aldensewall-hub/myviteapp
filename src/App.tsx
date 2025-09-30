import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SearchBar from './components/SearchBar'
import { searchMedia, type MediaItem } from './services/search'

function App() {
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')

  async function handleSearch(query: string) {
    try {
      setError(null)
      setLoading(true)
      setLastQuery(query)
      const res = await searchMedia(query)
      setResults(res.items)
    } catch (e) {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logos">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Movie & Show Finder</h1>
        <SearchBar onSearch={handleSearch} />
      </header>
      <main>
        {loading && <p className="status">Searching...</p>}
        {error && <p className="status error">{error}</p>}
        {!loading && !error && lastQuery && results.length === 0 && (
          <p className="status">No results for "{lastQuery}"</p>
        )}
        <ul className="results-list">
          {results.map(r => (
            <li key={r.id} className="result-item">
              <div className="result-title">{r.title}</div>
              <div className="result-meta">{r.type.toUpperCase()} • {r.year}</div>
            </li>
          ))}
        </ul>
      </main>
      <footer className="app-footer read-the-docs">
        Prototype search (mock data). Will integrate real API next.
      </footer>
    </div>
  )
}

export default App
