import { useState } from 'react';
import { Plus, Edit2, Trash2, Truck, ShoppingCart } from 'lucide-react';
import { useSuppliersStore } from '../../store/suppliersStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { formatCOP } from '../../utils/currency';

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, purchaseOrders, addPurchaseOrder } = useSuppliersStore();
  const { ingredients, addStock } = useInventoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', categories: '', deliveryDays: '' });

  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poForm, setPoForm] = useState({ supplierId: '', ingredientId: '', quantity: 1, totalAmount: 0, notes: '' });

  const openModal = (sup = null) => {
    if (sup) {
      setEditingId(sup.id);
      setForm({ name: sup.name, contact: sup.contact, phone: sup.phone, categories: sup.categories, deliveryDays: sup.deliveryDays });
    } else {
      setEditingId(null);
      setForm({ name: '', contact: '', phone: '', categories: '', deliveryDays: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingId) {
      updateSupplier(editingId, form);
    } else {
      addSupplier(form);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar este proveedor?')) {
      deleteSupplier(id);
    }
  };

  const openPOModal = (sup = null) => {
    setPoForm({ supplierId: sup ? sup.id : '', ingredientId: '', quantity: 1, totalAmount: 0, notes: '' });
    setIsPOModalOpen(true);
  };

  const handlePO = () => {
    if (!poForm.supplierId || poForm.totalAmount <= 0) return;
    addPurchaseOrder({ ...poForm, quantity: Number(poForm.quantity), totalAmount: Number(poForm.totalAmount) });
    // Auto-entry to inventory if ingredient is selected
    if (poForm.ingredientId && poForm.quantity > 0) {
      const sup = suppliers.find(s => s.id === poForm.supplierId);
      addStock(poForm.ingredientId, Number(poForm.quantity), `Compra a ${sup?.name || 'Proveedor'}`);
    }
    setIsPOModalOpen(false);
    alert('Orden de compra registrada y stock actualizado en inventario.');
  };

  const recentPOs = purchaseOrders.slice(0, 10);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores y Compras</h1>
          <p className="page-subtitle">Directorio de proveedores y registro de órdenes de compra</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => openPOModal()}>
            <ShoppingCart size={16} /> Nueva Compra
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={16} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Proveedores */}
      <div className="grid-3 mb-6">
        {suppliers.map((sup) => (
          <div key={sup.id} className="card p-4 border-light flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 text-accent rounded-full">
                  <Truck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{sup.name}</h3>
                  <span className="text-sm text-muted">{sup.contact}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openModal(sup)}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(sup.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="text-sm text-muted flex flex-col gap-1 mt-1">
              <span>📞 {sup.phone || '—'}</span>
              <span>📦 {sup.categories || '—'}</span>
              <span>🗓️ Entregas: {sup.deliveryDays || '—'}</span>
            </div>
            <button className="btn btn-ghost btn-sm mt-2" onClick={() => openPOModal(sup)}>
              <ShoppingCart size={14} /> Registrar compra
            </button>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-3 text-center py-8 text-muted">No hay proveedores registrados.</div>
        )}
      </div>

      {/* Historial de Órdenes */}
      {recentPOs.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg">Historial de Compras Recientes</h2>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Insumo</th>
                  <th>Cantidad</th>
                  <th>Notas</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentPOs.map((po) => {
                  const sup = suppliers.find(s => s.id === po.supplierId);
                  const ing = ingredients.find(i => i.id === po.ingredientId);
                  return (
                    <tr key={po.id}>
                      <td className="text-muted">{new Date(po.date).toLocaleDateString('es-CO')}</td>
                      <td className="font-bold">{sup?.name || '—'}</td>
                      <td>{ing?.name || '—'}</td>
                      <td>{po.quantity > 0 ? po.quantity : '—'}</td>
                      <td className="text-muted">{po.notes || '—'}</td>
                      <td className="text-right text-accent font-bold">{formatCOP(po.totalAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Proveedor */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Nombre de la Empresa / Persona</label>
                <input className="form-input w-full" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Distribuidora Carnes Premium" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Nombre del Contacto</label>
                  <input className="form-input w-full" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Teléfono</label>
                  <input className="form-input w-full" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Categorías que provee</label>
                <input className="form-input w-full" value={form.categories} onChange={e => setForm({...form, categories: e.target.value})} placeholder="Ej: Carnes, Verduras" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Días de Entrega</label>
                <input className="form-input w-full" value={form.deliveryDays} onChange={e => setForm({...form, deliveryDays: e.target.value})} placeholder="Ej: Lunes, Miércoles" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Orden de Compra */}
      {isPOModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">Registrar Orden de Compra</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Proveedor</label>
                <select className="form-select w-full" value={poForm.supplierId} onChange={e => setPoForm({...poForm, supplierId: e.target.value})}>
                  <option value="" disabled>Selecciona un proveedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Insumo recibido (Actualiza inventario)</label>
                <select className="form-select w-full" value={poForm.ingredientId} onChange={e => setPoForm({...poForm, ingredientId: e.target.value})}>
                  <option value="">— Sin insumo específico —</option>
                  {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </select>
              </div>
              {poForm.ingredientId && (
                <div>
                  <label className="block text-sm font-bold mb-1">Cantidad</label>
                  <input type="number" step="0.1" className="form-input w-full" value={poForm.quantity} onChange={e => setPoForm({...poForm, quantity: e.target.value})} />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold mb-1">Total Pagado (COP)</label>
                <input type="number" className="form-input w-full" value={poForm.totalAmount || ''} onChange={e => setPoForm({...poForm, totalAmount: e.target.value})} placeholder="Ej: 150000" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Notas</label>
                <input className="form-input w-full" value={poForm.notes} onChange={e => setPoForm({...poForm, notes: e.target.value})} placeholder="Ej: Factura #1234" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsPOModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handlePO} disabled={!poForm.supplierId || poForm.totalAmount <= 0}>Registrar Compra</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
