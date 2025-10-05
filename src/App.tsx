import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Shop from './pages/Shop'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/shop" replace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
