import { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const { users, login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    const result = login(username, password);
    if (!result.success) {
      setError(result.error);
      setPassword(''); // Clear password on error
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="card p-8 w-full max-w-sm shadow-xl border-accent">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 text-accent mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Paladar Grill POS</h1>
          <p className="text-muted mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {error && (
            <div className="p-3 bg-danger/10 border border-danger text-danger text-sm rounded-lg font-bold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-1">Usuario</label>
            <input
              type="text"
              className="form-input w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-bold mb-1">Contraseña</label>
            <input
              type="password"
              className="form-input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full h-12 text-lg font-bold mt-2"
            disabled={!username || !password}
          >
            <LogIn size={18} className="mr-2" /> Entrar al Sistema
          </button>
        </form>

        {/* Development hints */}
        <div className="mt-8 pt-4 border-t border-border text-xs text-muted text-center">
          <p className="font-bold mb-2">Cuentas de prueba (DEV):</p>
          <div className="flex flex-col gap-2">
            {users.map(u => (
              <div key={u.id}>
                User: <span className="font-bold">{u.username}</span> | Pass: <span className="font-bold">{u.password}</span> <br/>
                <span className="opacity-70">({u.role})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
