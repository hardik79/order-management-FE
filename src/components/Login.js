import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api'; // Update the path accordingly
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const authToken = await login(username, password);
      localStorage.setItem('token', authToken);
      setError('');
      onLogin(authToken); 
      navigate('/orderform');
    } catch (error) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div class="login-container">
    <h2>Login</h2>
    {error && <p className="error">{error}</p>}
    <form id="login-form" onSubmit={handleLogin}>
      <div class="form-group">
        <label for="username">Username:</label>
        <input type="text" id="username" placeholder="Enter your username" value={username} onChange={handleEmailChange} />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" placeholder="Enter your password" value={password} onChange={handlePasswordChange} />
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
  );
};

export default Login;