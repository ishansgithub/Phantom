import React from 'react';
import { FiMic, FiMicOff, FiPhoneOff } from 'react-icons/fi';

const UserCallCard = ({ username, isMuted }) => (
  <div className="relative w-full h-full retro-card rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-300 retro-texture">
    <div className="w-32 h-32 rounded-full flex items-center justify-center mb-4 retro-texture" style={{ backgroundColor: 'var(--retro-dark)', border: '4px solid var(--retro-red-brown)' }}>
      <span className="text-6xl retro-title" style={{ color: 'var(--retro-tan)' }}>
        {username ? username.charAt(0).toUpperCase() : '?'}
      </span>
    </div>
    <div className="absolute bottom-4 left-4 retro-card px-3 py-1 rounded-full retro-texture">
      <p className="retro-text font-semibold" style={{ color: 'var(--retro-tan)' }}>{username}</p>
    </div>
    {isMuted && (
      <div className="absolute top-4 right-4 retro-button p-2 rounded-full" style={{ backgroundColor: '#a0522d' }}>
        <FiMicOff className="w-5 h-5" style={{ color: 'var(--retro-tan)' }} />
      </div>
    )}
  </div>
);

const CallUI = ({ isVisible = true, localUsername, remoteUsername, isMuted, onToggleMute, onEndCall }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 retro-texture flex flex-col p-4 md:p-8 z-40 font-sans items-center justify-center" style={{ backgroundColor: 'rgba(26,26,26,0.95)' }}>
      <div className="w-full max-w-4xl retro-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between retro-texture">
        <UserCallCard username={remoteUsername} />
        <UserCallCard username={`${localUsername} (You)`} isMuted={isMuted} />

        <div className="flex flex-col items-center gap-3 md:ml-4">
          <div className="text-sm retro-text" style={{ color: 'var(--retro-tan)' }}>In call</div>
          <div className="flex space-x-4 p-3 retro-card rounded-full retro-texture">
            <button
              onClick={onToggleMute}
              className={`retro-button w-14 h-14 flex items-center justify-center rounded-full transition-colors duration-200 ${isMuted ? '' : ''}`}
              style={{ backgroundColor: isMuted ? '#a0522d' : 'var(--retro-red-brown)' }}
            >
              {isMuted ? <FiMicOff className="w-6 h-6" style={{ color: 'var(--retro-tan)' }} /> : <FiMic className="w-6 h-6" style={{ color: 'var(--retro-tan)' }} />}
            </button>

            <button 
              onClick={onEndCall}
              className="retro-button w-16 h-14 flex items-center justify-center rounded-full transition-colors duration-200"
              style={{ backgroundColor: '#a0522d' }}
            >
              <FiPhoneOff className="w-6 h-6" style={{ color: 'var(--retro-tan)' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallUI;