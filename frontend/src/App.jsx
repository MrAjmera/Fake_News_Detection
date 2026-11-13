import { useEffect, useRef } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import ConsentModal from './components/ConsentModal'
import ThemeToggle from './components/ThemeToggle'
import { useConsent } from './lib/consent'
import Analyze from './pages/Analyze'
import Architecture from './pages/Architecture'
import Landing from './pages/Landing'
import Model from './pages/Model'

// On route change: reset scroll and move focus to <main> so keyboard and
// screen-reader users land at the top of the new page, not on a stale link.
function useRouteFocus(mainRef) {
  const { pathname } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (first.current) {
      first.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname, mainRef])
}

export default function App() {
  const mainRef = useRef(null)
  useRouteFocus(mainRef)
  const { clearData } = useConsent()

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <Link to="/" className="brand">
          Fake News Detection<span>V2 · LR</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/analyze">Analyze</NavLink>
          <NavLink to="/model">Model</NavLink>
          <NavLink to="/architecture">Architecture</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        <ThemeToggle />
      </header>

      <main id="main" className="page" tabIndex={-1} ref={mainRef}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/model" element={<Model />} />
          <Route path="/architecture" element={<Architecture />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>
          Academic project · PBL-1 (CSE2170) · Manipal University Jaipur. Not a
          fact-checker.
        </p>
        <nav aria-label="Footer">
          <Link to="/terms">Terms &amp; Privacy</Link>
          <Link to="/about">About</Link>
          <button type="button" className="link-btn footer-btn" onClick={clearData}>
            Clear my data
          </button>
        </nav>
      </footer>

      <ConsentModal />
    </div>
  )
}
