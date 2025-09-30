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

### Using a real API (preview)
Create a `.env` file:
```
VITE_OMDB_API_KEY=yourkeyhere
```
Then access via `import.meta.env.VITE_OMDB_API_KEY` in a new real fetch function.

