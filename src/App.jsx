import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Game from './pages/Game.jsx'
import './App.css'

export default function App() {
  return (
    <>
      <header className="app-nav">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/game">Game</NavLink>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </main>
    </>
  )
}
