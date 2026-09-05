import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Key } from 'lucide-react';
import { useStaffStore } from '../../store/staffStore';

export default function Staff() {
  const { staff, loading, fetchStaff, addStaff, updateStaff, deleteStaff } = useStaffStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({ nombre: '', rol: 'Mesero', pin_code: '', is_active: true });
  
  // Agregamos un estado de error local para validaciones
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openModal = (emp = null) => {
    setError('');
    if (emp) {
      setEditingStaff(emp.id);
      setForm({ nombre: emp.nombre, rol: emp.rol, pin_code: emp.pin_code || '', is_active: emp.is_active });
    } else {
      setEditingStaff(null);
      setForm({ nombre: '', rol: 'Mesero', pin_code: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.nombre) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!form.pin_code || form.pin_code.length < 4) {
      setError('El PIN debe tener al menos 4 caracteres.');
      return;
    }

    let result;
    if (editingStaff) {
      result = await updateStaff(editingStaff, form);
    } else {
      result = await addStaff(form);
    }

    if (result.success) {
      setIsModalOpen(false);
    } else {
      setError(result.error || 'Ocurrió un error al guardar.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este empleado del registro de Supabase?')) {
      const result = await deleteStaff(id);
      if (!result.success) {
        alert('Error: ' + result.error);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal / Usuarios</h1>
          <p className="page-subtitle">Gestiona tu equipo de trabajo y sus accesos al sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} disabled={loading}>
          <Plus size={16} /> Nuevo Empleado
        </button>
      </div>

      {loading && <div className="text-center py-4">Cargando datos de Supabase...</div>}

      {!loading && (
        <div className="grid-3">
          {staff.map((emp) => (
            <div key={emp.id} className="card p-4 border-light flex flex-col gap-2 opacity-100 transition-opacity" style={{ opacity: emp.is_active ? 1 : 0.6 }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-secondary/10 text-secondary rounded-full">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{emp.nombre}</h3>
                    <span className="text-sm text-muted">{emp.rol}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openModal(emp)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(emp.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-muted flex items-center gap-1">
                <Key size={14} /> PIN: {emp.pin_code ? '****' : 'No asignado'}
              </div>

              {!emp.is_active && (
                <div className="mt-1 text-xs text-danger font-bold">
                  Usuario Inactivo
                </div>
              )}
            </div>
          ))}
          {staff.length === 0 && (
            <div className="col-span-3 text-center py-8 text-muted">No hay empleados registrados en la base de datos.</div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingStaff ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              {error && (
                <div className="p-2 bg-danger/10 text-danger text-sm rounded border border-danger">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold mb-1">Nombre Completo</label>
                <input className="form-input w-full" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Rol / Cargo</label>
                  <select className="form-select w-full" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                    <option value="Administrador">Administrador</option>
                    <option value="Cajero">Cajero</option>
                    <option value="Mesero">Mesero</option>
                    <option value="Cocinero">Cocinero</option>
                    <option value="Domiciliario">Domiciliario</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">PIN de Acceso</label>
                  <input type="password" placeholder="Mínimo 4 dígitos" className="form-input w-full" value={form.pin_code} onChange={e => setForm({...form, pin_code: e.target.value})} />
                </div>
              </div>
              
              <div className="mt-2 flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                <label htmlFor="isActive" className="text-sm font-bold cursor-pointer">Usuario Activo (Puede iniciar sesión)</label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading || !form.nombre || !form.pin_code}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
