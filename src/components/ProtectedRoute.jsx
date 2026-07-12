import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { canAccessRoute } from '../utils/permissions';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { activeUser } = useAuthStore();
  const location = useLocation();

  if (!activeUser) {
    // Si no está logueado, se maneja a nivel de App (mostrando el Login general)
    // Pero por si acaso, redirigimos a la raíz
    return <Navigate to="/" replace />;
  }

  const hasAccess = canAccessRoute(activeUser.role, location.pathname);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert size={64} className="text-danger mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
        <p className="text-muted max-w-md">
          Tu rol actual (<strong>{activeUser.role}</strong>) no tiene permisos para acceder a esta sección.
        </p>
        <button 
          className="btn btn-primary mt-6"
          onClick={() => window.history.back()}
        >
          Regresar
        </button>
      </div>
    );
  }

  return children;
}
