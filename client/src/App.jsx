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
    {/* Main app container */}
    <div className='bg-gray-900 h-full w-full min-h-screen min-w-screen'>
      {/* Toast notification system */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#000',
            color: '#fff',
          },
        }}
      />
      {/* Router for navigation between pages */}
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
