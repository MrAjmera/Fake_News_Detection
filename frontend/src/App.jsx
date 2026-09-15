import { NavLink, Route, Routes } from 'react-router-dom'
import Analyze from './pages/Analyze'
import Model from './pages/Model'

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
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Analyze />} />
          <Route path="/model" element={<Model />} />
        </Routes>
      </main>
    </div>
  )
}
