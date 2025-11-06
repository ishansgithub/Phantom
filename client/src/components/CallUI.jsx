import React from 'react';
import { FiMic, FiMicOff, FiPhoneOff } from 'react-icons/fi';

const UserCallCard = ({ username, isMuted }) => (
  <div className="relative w-full h-full bg-black/40 border-2 border-amber-300/30 rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-300 retro-glass">
    {/* Avatar circle with user's initial */}
    <div className="w-32 h-32 bg-amber-300/10 border-2 border-amber-300/40 rounded-full flex items-center justify-center mb-4 ring-4 ring-amber-300/20">
      <span className="text-6xl font-bold text-amber-200 retro-text">
        {username ? username.charAt(0).toUpperCase() : '?'}
      </span>
    </div>
    {/* Username label at bottom of card */}
    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm border border-amber-300/30 px-3 py-1 rounded-full">
      <p className="text-amber-200 font-semibold font-mono text-sm">{username}</p>
    </div>
    {/* Muted indicator badge */}
    {isMuted && (
      <div className="absolute top-4 right-4 bg-amber-600/80 border border-amber-400 p-2 rounded-full text-amber-100">
        <FiMicOff className="w-5 h-5" />
      </div>
    )}
  </div>
);

const CallUI = ({ isVisible = true, localUsername, remoteUsername, isMuted, onToggleMute, onEndCall }) => {
  if (!isVisible) return null;

  return (
    <div className="retro-landing fixed inset-0 flex flex-col p-4 md:p-8 z-40 items-center justify-center">
      {/* CRT Scanlines Effect */}
      <div className="scanlines fixed inset-0 pointer-events-none"></div>
      
      {/* Retro Grid Background */}
      <div className="retro-grid fixed inset-0 opacity-20"></div>
      
      {/* Animated Background Gradient */}
      <div className="retro-bg fixed inset-0"></div>

      {/* Main call container with user cards and controls */}
      <div className="relative z-10 w-full max-w-4xl retro-card p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <UserCallCard username={remoteUsername} />
        <UserCallCard username={`${localUsername} (You)`} isMuted={isMuted} />

        {/* Call controls section */}
        <div className="flex flex-col items-center gap-3 md:ml-4">
          <div className="text-sm text-amber-200 font-mono">IN CALL</div>
          {/* Call action buttons container */}
          <div className="flex space-x-4 p-3 bg-black/60 border-2 border-amber-300/30 backdrop-blur-sm rounded-full retro-glass">
            {/* Mute/unmute button */}
            <button
              onClick={onToggleMute}
              className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors duration-200 ${isMuted ? 'bg-amber-600/80 hover:bg-amber-700/80 border-2 border-amber-400 text-amber-100' : 'bg-amber-500/80 hover:bg-amber-600/80 border-2 border-amber-300 text-amber-50'}`}
            >
              {isMuted ? <FiMicOff className="w-6 h-6" /> : <FiMic className="w-6 h-6" />}
            </button>

            {/* End call button */}
            <button 
              onClick={onEndCall}
              className="bg-amber-800/80 hover:bg-amber-900/80 border-2 border-amber-600 text-amber-100 w-16 h-14 flex items-center justify-center rounded-full transition-colors duration-200"
            >
              <FiPhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallUI;