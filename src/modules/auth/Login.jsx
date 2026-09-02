import { useState } from 'react';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const { users, login, addUser, login: directLogin } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const isSetupMode = users.length === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    if (isSetupMode) {
      if (!name) {
        setError('El nombre completo es requerido.');
        return;
      }
      
      // Register new admin
      const newAdmin = {
        name,
        username,
        password,
        role: 'superadmin',
        isActive: true,
      };
      addUser(newAdmin);
      
      // Attempt login immediately
      const result = directLogin(username, password);
      if (!result.success) {
        setError(result.error);
      }
      return;
    }

    // Normal login
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
            {isSetupMode ? <UserPlus size={32} /> : <Lock size={32} />}
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isSetupMode ? 'Bienvenido a Paladar Grill' : 'Paladar Grill POS'}
          </h1>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            {isSetupMode 
              ? 'Parece que es la primera vez que usas el sistema. Crea tu cuenta de Administrador Principal para comenzar.'
              : 'Inicia sesión en tu cuenta para continuar.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {error && (
            <div className="p-3 bg-danger/10 border border-danger text-danger text-sm rounded-lg font-bold text-center">
              {error}
            </div>
          )}

          {isSetupMode && (
            <div>
              <label className="block text-sm font-bold mb-1">Nombre Completo *</label>
              <input
                type="text"
                className="form-input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Rodrigo Sotelo"
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-1">Usuario (Login) *</label>
            <input
              type="text"
              className="form-input w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
              autoComplete="username"
              autoFocus={!isSetupMode}
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-bold mb-1">Contraseña *</label>
            <input
              type="password"
              className="form-input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isSetupMode ? "new-password" : "current-password"}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full h-12 text-lg font-bold mt-2"
            disabled={!username || !password || (isSetupMode && !name)}
          >
            {isSetupMode ? (
              <><UserPlus size={18} className="mr-2" /> Crear Administrador</>
            ) : (
              <><LogIn size={18} className="mr-2" /> Entrar al Sistema</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
