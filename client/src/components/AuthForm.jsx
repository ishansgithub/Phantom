import React, { useState } from 'react';
import axios from 'axios';

const AuthForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const apiUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000") + "/api/users/register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    try {
      const response = await axios.post(apiUrl, {
        username,
        password,
      });
      setMessage(response.data.message);
      setIsSuccess(true);
      setUsername('');
      setPassword('');
    } catch (error) {
      setIsSuccess(false);
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('uhoh, ran into an issue');
      }
    }
  };

  return (
    <div className="retro-card p-8 w-full max-w-md retro-texture">
      <form onSubmit={handleSubmit}>
        <h2 className="retro-title text-2xl text-center mb-6" style={{ color: 'var(--retro-tan)' }}>Register</h2>
        <div className="mb-4">
          <label className="block retro-text text-sm font-bold mb-2" htmlFor="username" style={{ color: 'var(--retro-tan)' }}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="retro-input w-full py-2 px-3 leading-tight"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block retro-text text-sm font-bold mb-2" htmlFor="password" style={{ color: 'var(--retro-tan)' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="retro-input w-full py-2 px-3 mb-3 leading-tight"
            required
          />
        </div>
        <button
          type="submit"
          className="retro-button w-full py-2 px-4"
        >
          Register
        </button>
        {message && (
          <p className={`mt-4 text-center text-sm retro-text ${isSuccess ? '' : ''}`} style={{ color: isSuccess ? 'var(--retro-beige)' : '#a0522d' }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AuthForm;