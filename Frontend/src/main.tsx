import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import API from './api';
import App from './app';

// Theme init — must run before first paint to avoid flash
const stored = localStorage.getItem('ss-theme');
if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}
const accent = localStorage.getItem('ss-accent');
if (accent) document.documentElement.style.setProperty('--accent', accent);

// OAuth token injected via redirect query param
const urlParams = new URLSearchParams(window.location.search);
const oauthToken = urlParams.get('token');
if (oauthToken) {
  API.setToken(oauthToken);
  window.history.replaceState({}, document.title, window.location.pathname);
}

if (!API.isAuthenticated()) {
  window.location.href = 'signin.html';
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}
