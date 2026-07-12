import { useState } from 'react';
import { Plus, Trash2, Edit2, Shield, UserCog, User, Key } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../utils/permissions';

export default function Settings() {
  const { users, addUser, updateUser, deleteUser, activeUser } = useAuthStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'mesero'
  });

  const openModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setForm({
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role
      });
    } else {
      setEditingId(null);
      setForm({ name: '', username: '', password: '', role: 'mesero' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.username || !form.password) return;
    
    if (editingId) {
      updateUser(editingId, form);
    } else {
      // Verificar si el usuario ya existe
      if (users.some(u => u.username === form.username)) {
        alert('Este nombre de usuario ya está en uso.');
        return;
      }
      addUser(form);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (id === activeUser.id) {
      alert('No puedes eliminar tu propio usuario mientras estás conectado.');
      return;
    }
    if (window.confirm('¿Estás seguro de eliminar este usuario del sistema?')) {
      deleteUser(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración y Usuarios</h1>
          <p className="page-subtitle">Gestiona quién tiene acceso al sistema y sus permisos</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <UserCog size={20} className="text-accent" />
          <h2 className="font-bold text-lg">Usuarios del Sistema</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Usuario (Login)</th>
                <th>Rol / Permisos</th>
                <th>Contraseña</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="font-bold flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-light flex items-center justify-center text-muted">
                      {ROLES[user.role]?.icon || '👤'}
                    </span>
                    {user.name}
                    {user.id === activeUser?.id && (
                      <span className="badge badge-success ml-2">Tú</span>
                    )}
                  </td>
                  <td className="font-mono text-sm">{user.username}</td>
                  <td>
                    <span 
                      className="badge font-bold" 
                      style={{ 
                        backgroundColor: `${ROLES[user.role]?.color}20`, 
                        color: ROLES[user.role]?.color 
                      }}
                    >
                      {ROLES[user.role]?.label}
                    </span>
                  </td>
                  <td className="text-muted text-sm font-mono tracking-widest">••••••</td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button 
                        className="btn btn-light btn-sm btn-icon"
                        onClick={() => openModal(user)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === activeUser?.id}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Usuario */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title flex items-center gap-2">
                <Shield size={20} className="text-accent" />
                {editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h2>
            </div>
            <div className="modal-body flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-bold mb-1">Nombre Completo del Empleado *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-muted" />
                  <input
                    type="text"
                    className="form-input w-full pl-10"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Nombre de Usuario *</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="Ej. jperez"
                  />
                  <div className="text-xs text-muted mt-1">Sin espacios (ej. admin, caja1)</div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Contraseña *</label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3 top-3 text-muted" />
                    <input
                      type="text"
                      className="form-input w-full pl-10"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Contraseña"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Asignar Rol (Nivel de Acceso) *</label>
                <div className="flex flex-col gap-2">
                  {Object.entries(ROLES).map(([roleId, roleData]) => (
                    <button
                      key={roleId}
                      type="button"
                      onClick={() => setForm({ ...form, role: roleId })}
                      className={`card p-3 text-left transition flex gap-3 items-center ${form.role === roleId ? 'border-accent' : 'border-light hover:border-border'}`}
                      style={{ border: `2px solid ${form.role === roleId ? roleData.color : 'var(--border)'}` }}
                    >
                      <div className="text-2xl">{roleData.icon}</div>
                      <div>
                        <div className="font-bold text-sm" style={{ color: form.role === roleId ? roleData.color : 'inherit' }}>
                          {roleData.label}
                        </div>
                        <div className="text-xs text-muted mt-0.5">{roleData.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={!form.name || !form.username || !form.password}
              >
                {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
