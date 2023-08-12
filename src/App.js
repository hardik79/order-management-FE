import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link, Outlet, Navigate } from 'react-router-dom';
import OrderForm from './components/OrderForm';
import Login from './components/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  const localStorageToken = localStorage.getItem('token');
  const [authToken, setAuthToken] = useState(localStorageToken);
  useEffect(()=>{
    if(localStorageToken){

      setAuthToken(localStorageToken);
    }
  },[localStorageToken]);
  const handleLogin = (token) => {
    setIsLoggedIn(true);
    setAuthToken(token);
  };
  // useEffect({
  //   if(authToken){
  //     setIsLoggedIn(true);
  //   }
  // },[authToken]);
  const handleLogout = () => {
    setAuthToken(null);
    setIsLoggedIn(false);
    setToken(null);
  };

  return (
    <Router>
      <div className="App">
        <nav>
          {/* <ul>
            {isLoggedIn ? (
              <li>
                <Link to="/orderform">OrderForm</Link>
              </li>
            ) : null}
          </ul> */}
        </nav>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          {authToken != '' && authToken != null ? (
            <Route path="/orderform" element={<OrderForm onLogout={handleLogout} authToken={authToken}  />} />
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;