import { NavLink, Route, Routes } from 'react-router-dom'
import Analyze from './pages/Analyze'
import Architecture from './pages/Architecture'
import Model from './pages/Model'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          Fake News Detection<span>V2 · LR</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Analyze
          </NavLink>
          <NavLink to="/model">Model</NavLink>
          <NavLink to="/architecture">Architecture</NavLink>
        </nav>
        <ThemeToggle />
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Analyze />} />
          <Route path="/model" element={<Model />} />
          <Route path="/architecture" element={<Architecture />} />
        </Routes>
      </main>
    </div>
  )
}
