import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';
import { FiLock, FiUsers } from 'react-icons/fi';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const HomePage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const startNewChat = () => {
    const newRoomId = uuidV4();
    navigate(`/chat/${newRoomId}`);
  };

  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    let mounted = true;
    const socket = io.connect(SOCKET_SERVER_URL);

    socket.emit('get_rooms');
    socket.on('rooms_list', (data) => {
      if (!mounted) return;
      setRooms(Array.isArray(data) ? data : []);
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  const joinChat = (e) => {
    e.preventDefault();
    if (roomId) {
      navigate(`/chat/${roomId}`);
    }
  };

  return (
    <div className="retro-landing relative min-h-screen w-full overflow-hidden">
      {/* CRT Scanlines Effect */}
      <div className="scanlines fixed inset-0 pointer-events-none z-50"></div>
      
      {/* Retro Grid Background */}
      <div className="retro-grid fixed inset-0 opacity-20"></div>
      
      {/* Animated Background Gradient */}
      <div className="retro-bg fixed inset-0"></div>

      {/* Floating Navbar */}
      <nav className="floating-navbar fixed top-4 z-40 w-[95%] max-w-6xl">
        <div className="retro-glass backdrop-blur-md bg-black/40 border-2 border-amber-300/50 rounded-lg px-6 py-3 shadow-[0_0_20px_rgba(217,119,6,0.3)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="retro-logo flex items-center gap-2">
                <img src="/phantom-logo.png" alt="Phantom" className="w-8 h-8" />
                <span className="text-amber-200 font-bold text-xl tracking-wider retro-text">
                  PHANTOM
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={startNewChat}
                className="retro-btn-primary px-4 py-2 text-sm flex items-center gap-2"
              >
                <FiLock className="w-4 h-4" />
                START CHAT
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="retro-title-wrapper mb-6">
            <div className="mb-6 flex justify-center">
              <img src="/phantom-logo-hero.png" alt="Phantom Logo" className="w-32 h-32 md:w-40 md:h-40" />
            </div>

            <div className="retro-subtitle text-xl md:text-2xl text-amber-200 tracking-wider">
              REAL-TIME ANONYMOUS CHAT AND CALLING
            </div>
          </div>
          <p className="text-amber-100 text-lg mb-2">
            ANONYMOUS • SECURE • DISAPPEARING
          </p>
          <p className="text-amber-200/70 text-sm opacity-80">
            END-TO-END ENCRYPTED MESSAGES
          </p>
        </div>

        {/* Main Card */}
        <div className="retro-card w-full max-w-md mb-8">
          {/* Join Form */}
          <form onSubmit={joinChat} className="mb-6">
            <label className="block text-amber-200 text-sm mb-3 tracking-wide">
              JOIN PRIVATE CHAT
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="ENTER CHAT CODE..."
              className="retro-input w-full px-4 py-3 mb-4 text-center text-amber-100 placeholder-amber-200/50"
            />
            <button
              type="submit"
              className="retro-btn-primary w-full py-3 text-sm tracking-wider"
            >
              CONNECT
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
            <span className="text-amber-200 text-xs">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          </div>

          {/* Start New Chat Button */}
          <button
            onClick={startNewChat}
            className="retro-btn-primary w-full py-3 text-sm tracking-wider flex items-center justify-center gap-2 mb-6"
          >
            <FiLock className="w-4 h-4" />
            CREATE NEW CHAT ROOM
          </button>

          {/* Available Rooms */}
          <div className="retro-rooms-container">
            <h3 className="text-amber-200 text-sm mb-4 tracking-wide flex items-center gap-2">
              <FiUsers className="w-4 h-4" />
              AVAILABLE ROOMS
            </h3>
            {rooms.length === 0 ? (
              <div className="text-amber-200/50 text-xs text-center py-4">
                NO ROOMS AVAILABLE
              </div>
            ) : (
              <div className="space-y-2">
                {rooms.map((r) => (
                  <div key={r.id} className="retro-room-item">
                    <div className="flex-1">
                      <div className="text-amber-100 text-sm font-bold">{r.name || r.id}</div>
                      <div className="text-amber-200/60 text-xs">{r.users || 0} USERS ONLINE</div>
                    </div>
                    <button 
                      onClick={() => navigate(`/chat/${r.id}`)}
                      className="retro-btn-secondary px-4 py-2 text-xs"
                    >
                      JOIN
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="retro-footer text-center mt-8">
          <p className="text-amber-200/60 text-xs tracking-wider">
            MESSAGES ARE END-TO-END ENCRYPTED AND NEVER STORED
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-amber-300 text-xs">SYSTEM OPERATIONAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;