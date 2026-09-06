import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Parche de protección contra extensiones de navegador y traductores automáticos (Google Translate)
// Previene el fallo NotFoundError: Failed to execute 'removeChild' on 'Node'
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console) {
        console.warn('Prevented removeChild crash from external DOM mutation:', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.warn('Prevented insertBefore crash from external DOM mutation:', referenceNode, this);
      }
      return this.appendChild(newNode);
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

// Manejadores globales seguros
window.addEventListener('error', (event) => {
  // Ignorar errores provocados por extensiones al manipular el DOM
  if (event?.message?.includes('removeChild') || event?.message?.includes('insertBefore')) {
    event.preventDefault();
    return;
  }
  console.error('Error global capturado:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no controlada:', event.reason);
});

const rootElement = document.getElementById('root');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
