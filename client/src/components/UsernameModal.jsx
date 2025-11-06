import React, { useState } from 'react';

const UsernameModal = ({ onSubmit }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <div className="retro-landing fixed inset-0 z-50 flex items-center justify-center">
      {/* CRT Scanlines Effect */}
      <div className="scanlines fixed inset-0 pointer-events-none"></div>
      
      {/* Retro Grid Background */}
      <div className="retro-grid fixed inset-0 opacity-20"></div>
      
      {/* Animated Background Gradient */}
      <div className="retro-bg fixed inset-0"></div>

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="retro-card">
          <form onSubmit={handleSubmit} className="text-center">
            <h2 className="text-amber-200 text-2xl md:text-3xl font-bold mb-8 retro-text">
              WHAT SHOULD WE CALL YOU?
            </h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ENTER USERNAME..."
              className="retro-input w-full px-4 py-3 mb-6 text-center text-amber-100 placeholder-amber-200/50 text-lg"
              autoFocus
            />
            {/* Submit button to join chat */}
            <button
              type="submit"
              disabled={!username.trim()}
              className="retro-btn-primary w-full py-3 text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              JOIN CHAT ROOM
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UsernameModal;