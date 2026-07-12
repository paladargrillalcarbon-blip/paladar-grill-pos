import { useState } from 'react';
import { Plus, Edit2, Trash2, Users, DollarSign } from 'lucide-react';
import { useStaffStore } from '../../store/staffStore';
import { formatCOP } from '../../utils/currency';

export default function Staff() {
  const { staff, addStaff, updateStaff, deleteStaff, recordPayment } = useStaffStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({ name: '', role: 'Mesero', salary: 0, phone: '', isActive: true });

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({ staffId: '', amount: 0, type: 'Quincena', note: '' });

  const openModal = (emp = null) => {
    if (emp) {
      setEditingStaff(emp.id);
      setForm({ name: emp.name, role: emp.role, salary: emp.salary, phone: emp.phone, isActive: emp.isActive });
    } else {
      setEditingStaff(null);
      setForm({ name: '', role: 'Mesero', salary: 1160000, phone: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || form.salary < 0) return;
    if (editingStaff) {
      updateStaff(editingStaff, { ...form, salary: Number(form.salary) });
    } else {
      addStaff({ ...form, salary: Number(form.salary) });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar este empleado del registro?')) {
      deleteStaff(id);
    }
  };

  const openPayModal = (emp) => {
    setPayForm({ staffId: emp.id, amount: emp.salary, type: 'Salario Mensual', note: '' });
    setIsPayModalOpen(true);
  };

  const handlePay = () => {
    if (!payForm.staffId || payForm.amount <= 0) return;
    recordPayment(payForm.staffId, Number(payForm.amount), payForm.type, payForm.note);
    setIsPayModalOpen(false);
    alert('Pago registrado correctamente. Esto se reflejará en los egresos (Finanzas).');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal y Nómina</h1>
          <p className="page-subtitle">Gestiona tu equipo de trabajo y registra sus pagos</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Nuevo Empleado
        </button>
      </div>

      <div className="grid-3">
        {staff.map((emp) => (
          <div key={emp.id} className="card p-4 border-light flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 text-secondary rounded-full">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{emp.name}</h3>
                  <span className="text-sm text-muted">{emp.role}</span>
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
            
            <div className="mt-2 text-sm text-muted">
              📞 {emp.phone || 'Sin teléfono'}
            </div>

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
              <span className="font-bold text-accent">{formatCOP(emp.salary)} / mes</span>
              <button className="btn btn-secondary btn-sm" onClick={() => openPayModal(emp)}>
                <DollarSign size={14} /> Pagar
              </button>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <div className="col-span-3 text-center py-8 text-muted">No hay empleados registrados.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingStaff ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Nombre Completo</label>
                <input className="form-input w-full" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Cargo</label>
                  <select className="form-select w-full" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="Administrador">Administrador</option>
                    <option value="Cajero">Cajero</option>
                    <option value="Mesero">Mesero</option>
                    <option value="Cocinero">Cocinero</option>
                    <option value="Domiciliario">Domiciliario</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Teléfono</label>
                  <input className="form-input w-full" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Salario Base (Mensual COP)</label>
                <input type="number" className="form-input w-full" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name || form.salary < 0}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {isPayModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Registrar Pago a Empleado</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Tipo de Pago</label>
                <select className="form-select w-full" value={payForm.type} onChange={e => setPayForm({...payForm, type: e.target.value})}>
                  <option value="Salario Mensual">Salario Mensual</option>
                  <option value="Quincena">Quincena</option>
                  <option value="Bono / Propina Extra">Bono / Propina Extra</option>
                  <option value="Liquidación">Liquidación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Monto a Pagar (COP)</label>
                <input type="number" className="form-input w-full" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Nota (Opcional)</label>
                <input className="form-input w-full" value={payForm.note} onChange={e => setPayForm({...payForm, note: e.target.value})} placeholder="Ej: Quincena del 1 al 15" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsPayModalOpen(false)}>Cancelar</button>
              <button className="btn btn-secondary" onClick={handlePay} disabled={payForm.amount <= 0}>Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
