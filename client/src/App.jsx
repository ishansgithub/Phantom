import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Chat from './pages/ChatRoom'
import Home from './pages/HomePage'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import { Toaster } from 'react-hot-toast'

function App() {

  return (
    <>
    <div className='h-full w-full min-h-screen overflow-x-hidden retro-texture' style={{ backgroundColor: 'var(--retro-black)', maxWidth: '100vw' }}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--retro-dark)',
            color: 'var(--retro-tan)',
            border: '2px solid var(--retro-red-brown)',
            boxShadow: '4px 4px 0px var(--retro-dark-brown)',
            fontFamily: "'Bebas Neue', 'Orbitron', 'VT323', sans-serif",
            letterSpacing: '0.06em',
            fontSize: '1rem',
          },
        }}
      />
      <BrowserRouter>   
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
    </>
  )
}

export default App
