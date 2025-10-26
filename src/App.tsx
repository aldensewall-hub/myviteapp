import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Shop from './pages/Shop'
import Store from './pages/Store'
import StoreCollection from './pages/StoreCollection'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Home from './pages/Home'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Home (login) */}
          <Route index element={<Home />} />

          {/* Public */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/stores/:storeSlug" element={<Store />} />
          <Route path="/stores/:storeSlug/collections/:collectionSlug" element={<StoreCollection />} />

          {/* Protected */}
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            element={(
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            )}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
