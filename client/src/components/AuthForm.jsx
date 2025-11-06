import React, { useState } from 'react';
import axios from 'axios';

const AuthForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const apiUrl = import.meta.env.VITE_BACKEND_URL+"/api/users/register" || "http://localhost:4000/api/users/register";

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
    <div className="retro-card w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <h2 className="text-3xl font-bold text-center text-amber-200 mb-8 retro-text">REGISTER</h2>
        {/* Username input field container */}
        <div className="mb-6">
          <label className="block text-amber-200 text-sm mb-3 tracking-wide" htmlFor="username">
            USERNAME
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="retro-input w-full px-4 py-3 text-amber-100 placeholder-amber-200/50"
            placeholder="ENTER USERNAME..."
            required
          />
        </div>
        {/* Password input field container */}
        <div className="mb-8">
          <label className="block text-amber-200 text-sm mb-3 tracking-wide" htmlFor="password">
            PASSWORD
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="retro-input w-full px-4 py-3 text-amber-100 placeholder-amber-200/50"
            placeholder="ENTER PASSWORD..."
            required
          />
        </div>
        <button
          type="submit"
          className="retro-btn-primary w-full py-3 text-sm tracking-wider"
        >
          REGISTER
        </button>
        {/* Success/error message display */}
        {message && (
          <p className={`mt-6 text-center text-sm font-mono ${isSuccess ? 'text-amber-300' : 'text-amber-400'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AuthForm;