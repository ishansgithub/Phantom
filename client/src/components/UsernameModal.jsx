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
    <div 
      className="fixed inset-0 retro-texture z-50 font-sans" 
      style={{ 
        backgroundColor: 'rgba(26,26,26,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}
    >
      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-sm px-4 text-center retro-card p-8 retro-texture"
      >
        <h2 className="retro-title mb-8" style={{ color: 'var(--retro-tan)', fontSize: '2rem' }}>What should we call you?</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter a username..."
          className="retro-input w-full px-4 py-4 mb-6 text-center rounded-full transition-all"
          style={{ fontSize: '1.2rem' }}
          autoFocus
        />
        <button
          type="submit"
          disabled={!username.trim()}
          className="retro-button w-full px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: !username.trim() ? '#654321' : 'var(--retro-tan)', color: 'var(--retro-black)', borderColor: 'var(--retro-dark-brown)' }}
        >
          Join Chat Room
        </button>
      </form>
    </div>
  );
};

export default UsernameModal;