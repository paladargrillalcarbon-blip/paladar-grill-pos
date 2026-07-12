import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign } from 'lucide-react';
import { usePosStore } from '../../store/posStore';

export default function Promotions() {
  const { promotions, addPromotion, updatePromotion, deletePromotion } = usePosStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [form, setForm] = useState({ 
    name: '', description: '', type: 'percentage', value: 0, isActive: true 
  });

  const openModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo.id);
      setForm({ 
        name: promo.name, description: promo.description, 
        type: promo.type, value: promo.value, isActive: promo.isActive 
      });
    } else {
      setEditingPromo(null);
      setForm({ name: '', description: '', type: 'percentage', value: 0, isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || form.value <= 0) return;
    if (editingPromo) {
      updatePromotion(editingPromo, { ...form, value: Number(form.value) });
    } else {
      addPromotion({ ...form, value: Number(form.value) });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar esta promoción?')) {
      deletePromotion(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Promociones y Descuentos</h1>
          <p className="page-subtitle">Gestiona ofertas y descuentos sin alterar tus precios base</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Crear Promoción
        </button>
      </div>

      <div className="grid-3">
        {promotions.map((promo) => (
          <div key={promo.id} className="card p-4 border-light flex flex-col gap-2 relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${promo.type === 'percentage' ? 'bg-blue-900/20 text-blue-400' : 'bg-green-900/20 text-green-400'}`}>
                  {promo.type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{promo.name}</h3>
                  <span className="text-sm text-muted">{promo.description}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openModal(promo)}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(promo.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
              <span className="font-bold text-xl text-accent">
                {promo.type === 'percentage' ? `${promo.value}% DCTO` : `-$${promo.value}`}
              </span>
              <span className={`badge ${promo.isActive ? 'badge-success' : 'badge-danger'}`}>
                {promo.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <div className="col-span-3 text-center py-8 text-muted">No hay promociones.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Nombre</label>
                <input 
                  className="form-input w-full" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="Ej: Viernes de Hamburguesas"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Descripción Breve</label>
                <input 
                  className="form-input w-full" 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Tipo de Descuento</label>
                  <select className="form-select w-full" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed_amount">Valor Fijo ($)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Valor del Descuento</label>
                  <input 
                    type="number" 
                    className="form-input w-full" 
                    value={form.value === 0 ? '' : form.value} 
                    onChange={e => setForm({...form, value: e.target.value})} 
                    placeholder="Ej: 20 o 5000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  checked={form.isActive} 
                  onChange={e => setForm({...form, isActive: e.target.checked})}
                  id="promoActiveCheck"
                />
                <label htmlFor="promoActiveCheck" className="text-sm font-bold">Promoción Activa</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name || form.value <= 0}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
