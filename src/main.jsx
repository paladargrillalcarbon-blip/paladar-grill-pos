import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

window.addEventListener('error', (event) => {
  rootElement.innerHTML = `
    <div style="padding: 20px; background: red; color: white; min-height: 100vh;">
      <h2>Critical Error</h2>
      <pre>${event.error?.stack || event.message}</pre>
    </div>
  `;
});

window.addEventListener('unhandledrejection', (event) => {
  rootElement.innerHTML = `
    <div style="padding: 20px; background: red; color: white; min-height: 100vh;">
      <h2>Unhandled Promise Rejection</h2>
      <pre>${event.reason?.stack || event.reason}</pre>
    </div>
  `;
});

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
