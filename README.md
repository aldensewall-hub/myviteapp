# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Movie & Show Finder Prototype

An initial search bar has been added (`SearchBar` component) along with a mock search service (`searchMedia`) that filters an in-memory list of sample movies and shows.

### Where to look
- Component: `src/components/SearchBar.tsx`
- Mock service: `src/services/search.ts`
- Integration: `src/App.tsx`

### How it works
1. Typing in the search input debounces requests (400ms) before triggering `onSearch`.
2. Pressing Enter forces an immediate search (if min length reached).
3. Results are rendered in a simple list showing title, type, and year.

### Next steps (suggested roadmap)
- Replace mock service with a real API (e.g., OMDb or TMDB).
- Introduce environment variable handling for API keys (`.env` + `import.meta.env`).
- Add pagination / infinite scroll when using real API.
- Implement a rating system (user auth + persistence) and local optimistic updates.
- Add unit tests for the search service and component behavior.
- Improve accessibility (aria-live region for results, keyboard navigation of list).
- Add loading skeletons instead of plain text status.

## Real API Integration

Both OMDb and TMDB provider modules are supported. The search service will:
1. Detect which API keys are present.
2. Query each provider in parallel.
3. Normalize and merge results.
4. Deduplicate by id (provider-prefixed for uniqueness).
5. Cache the merged list per lowercase query for 60 seconds.
6. Fallback to mock dataset if no keys configured.

### Environment Variables
Create a `.env` file in the project root (same level as `package.json`):
```
VITE_OMDB_API_KEY=your_omdb_key
VITE_TMDB_API_KEY=your_tmdb_key
```

Restart the dev server after adding new env vars.

### Provider Notes
- OMDb: Free tier requires short queries; may paginate beyond first page (not yet implemented).
- TMDB: Multi-search mixes movies & TV; we filter only `movie` & `tv` media types.
- Posters: TMDB uses `https://image.tmdb.org/t/p/w342`; OMDb may return `N/A` which we ignore.

### Caching Strategy
Simple in-memory Map keyed by the normalized query string with a 60s TTL. This resets on reload (good enough for dev/prototype). Replace with more robust caching or SWR/react-query later.

### Extending Further
- Add a detail fetch (e.g., clicking a result loads full metadata in a side panel).
- Integrate a rating component connected to local storage or backend.
- Add pagination controls when provider returns more results than one page.
- Introduced skeleton loading states (`ResultSkeleton`) for initial searches and subtle updating indicator for subsequent queries.

### Using a real API (preview)
Create a `.env` file:
```
VITE_OMDB_API_KEY=yourkeyhere
```
Then access via `import.meta.env.VITE_OMDB_API_KEY` in a new real fetch function.


## Shopping app (World Boutique)

A new shopping experience is included with an infinite product feed, style tabs, and robust placeholder images.

Highlights:
- Fixed top header with brand and routes (Profile, Shop, Settings)
- Shop page with Streetwear/Casual/Luxury tabs
- Location-centric filtering with three modes: All, Near me (geolocation), and Pick (multi-select by city or region groups)
- Infinite scroll with IntersectionObserver
- Server-side filtering via a small Express backend (optional)

Run the backend for server-side filtering:
1. Copy `.env.example` to `.env` and ensure `VITE_PRODUCTS_API_URL` points to the backend (default `http://localhost:5178`).
2. In one terminal: `npm run server`
3. In another terminal: `npm run dev`

Environment variables:
- `VITE_PRODUCTS_API_URL`: When set, the frontend will call `/products` on this server for paging + filtering
- `VITE_IMAGE_SOURCE`: `unsplash` (default) or `picsum` placeholders

Notes:
- If geolocation is denied or unavailable, the app falls back to a reasonable default region.
- When the backend is not running, the app generates data locally and filters client-side.

