import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './routes/Login'
import Home from './routes/Home'
import QuickEstimate from './routes/QuickEstimate'
import Pipeline from './routes/Pipeline'
import Dashboard from './routes/Dashboard'
import EstimateDetail from './routes/EstimateDetail'
import UpdateEstimate from './routes/UpdateEstimate'

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession)
  const initTheme = useThemeStore((s) => s.init)

  useEffect(() => {
    initTheme()
    checkSession()
  }, [checkSession, initTheme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/quick-estimate" element={<QuickEstimate />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/estimates/:id" element={<EstimateDetail />} />
          <Route path="/update-estimate/:id" element={<UpdateEstimate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
