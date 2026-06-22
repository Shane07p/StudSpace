import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import API from './api';
import App from './app.jsx';

// Theme init — must run before first paint to avoid flash
const stored = localStorage.getItem('ss-theme');
if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

// OAuth token injected via redirect URL fragment (kept out of server logs / Referer);
// query-param fallback covers redirects issued before this change.
const hashParams = new URLSearchParams(window.location.hash.slice(1));
const oauthToken = hashParams.get('token') || new URLSearchParams(window.location.search).get('token');
if (oauthToken) {
  API.setToken(oauthToken);
  window.history.replaceState({}, document.title, window.location.pathname);
}

if (!API.isAuthenticated()) {
  window.location.href = 'signin.html';
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}
