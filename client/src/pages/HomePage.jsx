import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';
import { FiLock } from 'react-icons/fi';
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
    <div className="relative min-h-screen w-full font-sans retro-texture overflow-x-hidden" style={{ backgroundColor: 'var(--retro-black)', maxWidth: '100vw' }}>
      <div
        className="flex flex-col items-center justify-start text-white min-h-screen w-full retro-texture overflow-x-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(26,26,26,0.95), rgba(45,27,14,0.98))",
          backgroundPosition: 'center',
          maxWidth: '100vw'
        }}
      >
        {/* Hero Section */}
        <div className="w-full max-w-4xl px-4 pt-12 md:pt-16 pb-8">
          <div className="text-center mb-12">
            <div className="flex flex-col items-center mb-8">
              <img 
                src="/logo.png" 
                alt="Phantom Logo" 
                className="mb-6 w-auto h-auto"
              />
            </div>
            <h1 className="retro-title text-4xl md:text-5xl mb-4" style={{ color: 'var(--retro-tan)' }}>
              Anonymous • Secure • Instant
            </h1>
            <p className="retro-text mb-6" style={{ color: 'var(--retro-beige)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
              Disappear into the shadows. Have private conversations that vanish without a trace.
            </p>
            <p className="retro-text-xs mb-12" style={{ color: 'var(--retro-beige)', opacity: 0.8, maxWidth: '500px', margin: '0 auto 3rem' }}>
              End-to-end encrypted chats that are never stored on our servers
            </p>
          </div>

          {/* Main CTA */}
          <div className="w-full max-w-md mx-auto mb-12">
            <button
              onClick={startNewChat}
              className="retro-button w-full px-6 py-4 flex items-center justify-center text-lg"
              style={{ 
                backgroundColor: 'var(--retro-tan)', 
                color: 'var(--retro-black)', 
                borderColor: 'var(--retro-dark-brown)',
                fontSize: '1.25rem',
                padding: '1rem 2rem'
              }}
            >
              <FiLock className="w-6 h-6 mr-3" />
              Create Private Chat Room
            </button>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="retro-card p-6 retro-texture text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="retro-text-sm font-semibold mb-2" style={{ color: 'var(--retro-tan)' }}>End-to-End Encrypted</h3>
              <p className="retro-text-xs" style={{ color: 'var(--retro-beige)' }}>
                Your messages are encrypted before they leave your device
              </p>
            </div>
            <div className="retro-card p-6 retro-texture text-center">
              <div className="text-3xl mb-3">👻</div>
              <h3 className="retro-text-sm font-semibold mb-2" style={{ color: 'var(--retro-tan)' }}>Anonymous</h3>
              <p className="retro-text-xs" style={{ color: 'var(--retro-beige)' }}>
                No accounts, no sign-ups, no tracking. Just pure privacy
              </p>
            </div>
            <div className="retro-card p-6 retro-texture text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="retro-text-sm font-semibold mb-2" style={{ color: 'var(--retro-tan)' }}>Instant</h3>
              <p className="retro-text-xs" style={{ color: 'var(--retro-beige)' }}>
                Start chatting in seconds. No waiting, no hassle
              </p>
            </div>
          </div>

          {/* Join Code Section - Commented Out */}
          {/* TODO: Re-enable join by code feature later */}
          {/* <div className="w-full max-w-md mx-auto mb-8">
            <form onSubmit={joinChat} className="flex flex-col items-center">
              <p className="retro-text mb-4" style={{ color: 'var(--retro-tan)' }}>Join private chat</p>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter chat code or link to join..."
                className="retro-input w-full px-4 py-3 mb-6 text-center rounded-full transition-all"
              />
              <p className="retro-text mb-6" style={{ color: 'var(--retro-beige)' }}>or</p>
            </form>
          </div> */}
      
          {/* Active Rooms Section */}
          {rooms.length > 0 && (
            <div className="w-full max-w-2xl mx-auto mb-12">
              <div className="retro-card rounded-xl p-6 retro-texture">
                <h3 className="retro-text-sm mb-4 font-semibold text-center" style={{ color: 'var(--retro-tan)' }}>
                  Active Chat Rooms
                </h3>
                <div className="space-y-3">
                  {rooms.map((r) => (
                    <div key={r.id} className="flex items-center justify-between retro-card p-4 retro-texture">
                      <div>
                        <div className="retro-text-sm font-medium mb-1" style={{ color: 'var(--retro-tan)' }}>
                          {r.name || r.id}
                        </div>
                        <div className="retro-text-xs flex items-center gap-2" style={{ color: 'var(--retro-beige)' }}>
                          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--retro-red-brown)' }}></span>
                          {(r.users || 0)} user{(r.users || 0) !== 1 ? 's' : ''} online
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/chat/${r.id}`)} 
                          className="retro-button px-4 py-2 rounded-full"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto w-full py-6 px-4 text-center">
          <p className="retro-text-xs" style={{ color: 'var(--retro-beige)', opacity: 0.7 }}>
            Messages are end-to-end encrypted and never stored on our servers
          </p>
          <p className="retro-text-xs mt-2" style={{ color: 'var(--retro-beige)', opacity: 0.5 }}>
            © {new Date().getFullYear()} Phantom • Privacy First
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;