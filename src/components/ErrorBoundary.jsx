import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 16,
          padding: 32,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            Ocurrió un error al cargar esta sección
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
            Esto puede ser causado por una extensión del navegador (como Google Translate).
            Intenta desactivar las traducciones automáticas y recargar.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
          >
            🔄 Intentar de nuevo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
