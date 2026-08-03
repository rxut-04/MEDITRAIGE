import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './lib/AuthProvider'
import { LocaleProvider } from './lib/LocaleProvider'
import { BrandProvider } from './lib/BrandProvider'
import Landing from './pages/Landing'
import Triage from './pages/Triage'
import Science from './pages/Science'
import Clinic from './pages/Clinic'
import OrgLayout from './pages/OrgLayout'

function Page({ children, initial, animate, exit }) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={{ duration: 0.45 }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Page initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Landing />
            </Page>
          }
        />
        <Route
          path="/triage"
          element={
            <Page
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <BrandProvider>
                <Triage />
              </BrandProvider>
            </Page>
          }
        />
        <Route
          path="/science"
          element={
            <Page
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <Science />
            </Page>
          }
        />
        <Route
          path="/clinic"
          element={
            <Page initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BrandProvider>
                <Clinic />
              </BrandProvider>
            </Page>
          }
        />
        <Route path="/o/:slug" element={<OrgLayout />}>
          <Route
            path="triage"
            element={
              <Page
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Triage />
              </Page>
            }
          />
          <Route
            path="clinic"
            element={
              <Page initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Clinic />
              </Page>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="meditriage-theme"
    >
      <LocaleProvider>
        <AuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  )
}
