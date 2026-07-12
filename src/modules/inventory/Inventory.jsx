import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';
import { formatCOP } from '../../utils/currency';

export default function Inventory() {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, addStock, removeStock } = useInventoryStore();

  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState(null);
  const [ingForm, setIngForm] = useState({ name: '', unit: 'uds', minStock: 0, costPerUnit: 0 });

  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjType, setAdjType] = useState('in'); // 'in' | 'out'
  const [adjForm, setAdjForm] = useState({ ingredientId: '', quantity: 1, reason: '' });

  // --- Ingrediente CRUD ---
  const openIngModal = (ing = null) => {
    if (ing) {
      setEditingIng(ing.id);
      setIngForm({ name: ing.name, unit: ing.unit, minStock: ing.minStock, costPerUnit: ing.costPerUnit || 0 });
    } else {
      setEditingIng(null);
      setIngForm({ name: '', unit: 'uds', minStock: 10, costPerUnit: 0 });
    }
    setIsIngModalOpen(true);
  };

  const saveIng = () => {
    if (!ingForm.name) return;
    if (editingIng) {
      updateIngredient(editingIng, { ...ingForm, minStock: Number(ingForm.minStock), costPerUnit: Number(ingForm.costPerUnit) });
    } else {
      addIngredient({ ...ingForm, stock: 0, minStock: Number(ingForm.minStock), costPerUnit: Number(ingForm.costPerUnit) });
    }
    setIsIngModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este insumo?')) {
      deleteIngredient(id);
    }
  };

  // --- Ajuste de Stock ---
  const openAdjModal = (type, ingId = '') => {
    setAdjType(type);
    setAdjForm({ ingredientId: ingId, quantity: 1, reason: type === 'in' ? 'Compra de insumos' : 'Merma / Ajuste' });
    setIsAdjModalOpen(true);
  };

  const saveAdj = () => {
    if (!adjForm.ingredientId || adjForm.quantity <= 0) return;
    if (adjType === 'in') {
      addStock(adjForm.ingredientId, Number(adjForm.quantity), adjForm.reason);
    } else {
      removeStock(adjForm.ingredientId, Number(adjForm.quantity), adjForm.reason);
    }
    setIsAdjModalOpen(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">Control de insumos, entradas y mermas</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => openAdjModal('out')}>
            <ArrowDownCircle size={16} /> Salida
          </button>
          <button className="btn btn-secondary" onClick={() => openAdjModal('in')}>
            <ArrowUpCircle size={16} /> Entrada
          </button>
          <button className="btn btn-primary" onClick={() => openIngModal()}>
            <Plus size={16} /> Crear Insumo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Unidad</th>
                <th>Costo Unitario</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const isLow = ing.stock <= ing.minStock;
                return (
                  <tr key={ing.id} className={isLow ? 'bg-red-900/10' : ''}>
                    <td className="font-bold flex items-center gap-2">
                      {isLow && <AlertTriangle size={14} className="text-danger" />}
                      {ing.name}
                    </td>
                    <td>{ing.unit}</td>
                    <td>{formatCOP(ing.costPerUnit || 0)}</td>
                    <td className="font-bold">
                      <span className={isLow ? 'text-danger' : 'text-success'}>
                        {ing.stock.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-muted">{ing.minStock}</td>
                    <td className="text-right flex justify-end gap-2">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openAdjModal('in', ing.id)} title="Agregar Stock">
                        <ArrowUpCircle size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openAdjModal('out', ing.id)} title="Restar Stock">
                        <ArrowDownCircle size={14} />
                      </button>
                      <div className="w-px h-4 bg-border mx-1 self-center"></div>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openIngModal(ing)} title="Editar Insumo">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(ing.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ingredients.length === 0 && <div className="text-center py-8 text-muted">No hay insumos creados.</div>}
        </div>
      </div>

      {/* --- MODAL INSUMO --- */}
      {isIngModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingIng ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Nombre del Insumo</label>
                <input 
                  className="form-input w-full" 
                  value={ingForm.name} 
                  onChange={e => setIngForm({...ingForm, name: e.target.value})} 
                  placeholder="Ej: Carne de Res, Pan"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Unidad</label>
                  <select className="form-select w-full" value={ingForm.unit} onChange={e => setIngForm({...ingForm, unit: e.target.value})}>
                    <option value="uds">Unidades (uds)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="L">Litros (L)</option>
                    <option value="ml">Mililitros (ml)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Stock Mínimo (Alerta)</label>
                  <input type="number" className="form-input w-full" value={ingForm.minStock} onChange={e => setIngForm({...ingForm, minStock: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Costo por Unidad (COP)</label>
                <input type="number" className="form-input w-full" value={ingForm.costPerUnit} onChange={e => setIngForm({...ingForm, costPerUnit: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsIngModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveIng} disabled={!ingForm.name}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL AJUSTE --- */}
      {isAdjModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">{adjType === 'in' ? 'Entrada de Mercancía' : 'Salida / Merma'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Insumo</label>
                <select className="form-select w-full" value={adjForm.ingredientId} onChange={e => setAdjForm({...adjForm, ingredientId: e.target.value})}>
                  <option value="" disabled>Selecciona un insumo...</option>
                  {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Cantidad a {adjType === 'in' ? 'sumar' : 'restar'}</label>
                <input type="number" step="0.1" className="form-input w-full" value={adjForm.quantity} onChange={e => setAdjForm({...adjForm, quantity: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Motivo / Razón</label>
                <input className="form-input w-full" value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsAdjModalOpen(false)}>Cancelar</button>
              <button className={`btn ${adjType === 'in' ? 'btn-secondary' : 'btn-danger'}`} onClick={saveAdj} disabled={!adjForm.ingredientId || adjForm.quantity <= 0}>
                Confirmar {adjType === 'in' ? 'Entrada' : 'Salida'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
